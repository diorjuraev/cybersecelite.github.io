import { neon } from '@netlify/neon';

// In-memory rate limiting store (per-function instance)
// Note: This provides basic protection but is reset on function cold starts
// For production, consider using Netlify Blobs or external rate limiting
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per hour per IP

// Maximum field lengths to prevent abuse
const MAX_FIELD_LENGTHS = {
  name: 200,
  email: 254,
  service: 200,
  timeline: 200,
  environment: 500,
  message: 5000
};

// Maximum total payload size (10KB)
const MAX_PAYLOAD_SIZE = 10 * 1024;

/**
 * Sanitize user input to prevent XSS when displaying stored data
 * Removes HTML tags and trims whitespace
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  // Remove HTML tags
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Truncate string to max length
 */
function truncateField(value, maxLength) {
  if (typeof value !== 'string') return value;
  return value.slice(0, maxLength);
}

/**
 * Get client IP from request headers
 */
function getClientIP(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('x-nf-client-connection-ip') ||
         'unknown';
}

/**
 * Check rate limit for a given IP
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  // Clean up old entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now - value.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitStore.set(ip, { windowStart: now, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - record.windowStart)) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

/**
 * Validate email format with stricter regex
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // RFC 5322 simplified pattern - more restrictive than the original
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return email.length <= MAX_FIELD_LENGTHS.email && emailRegex.test(email);
}

/**
 * Verify CSRF token from cookie matches header
 */
function verifyCsrfToken(req) {
  const cookieHeader = req.headers.get('cookie') || '';
  const csrfHeader = req.headers.get('x-csrf-token') || '';

  if (!csrfHeader) {
    return false;
  }

  // Parse CSRF token from cookies
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) acc[key] = value;
    return acc;
  }, {});

  const csrfCookie = cookies['csrf-token'];

  // Token must exist in both cookie and header, and must match
  return csrfCookie && csrfCookie === csrfHeader;
}

/**
 * Netlify Function to handle contact form submissions
 * Stores submissions in Netlify DB (Neon PostgreSQL)
 */
export default async (req, context) => {
  const clientIP = getClientIP(req);

  // Security headers for all responses
  const securityHeaders = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  };

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
      status: 405,
      headers: { ...securityHeaders, 'Allow': 'POST' }
    });
  }

  // Check rate limit
  const rateLimit = checkRateLimit(clientIP);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Too many requests. Please try again later.'
    }), {
      status: 429,
      headers: {
        ...securityHeaders,
        'Retry-After': String(rateLimit.retryAfter),
        'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
        'X-RateLimit-Remaining': '0'
      }
    });
  }

  try {
    // Check content length before parsing
    const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_PAYLOAD_SIZE) {
      return new Response(JSON.stringify({ success: false, message: 'Request too large' }), {
        status: 413,
        headers: securityHeaders
      });
    }

    // Verify CSRF token
    if (!verifyCsrfToken(req)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid request' }), {
        status: 403,
        headers: securityHeaders
      });
    }

    // Parse form data
    const contentType = req.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      const text = await req.text();
      if (text.length > MAX_PAYLOAD_SIZE) {
        return new Response(JSON.stringify({ success: false, message: 'Request too large' }), {
          status: 413,
          headers: securityHeaders
        });
      }
      data = JSON.parse(text);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      if (text.length > MAX_PAYLOAD_SIZE) {
        return new Response(JSON.stringify({ success: false, message: 'Request too large' }), {
          status: 413,
          headers: securityHeaders
        });
      }
      const params = new URLSearchParams(text);
      data = Object.fromEntries(params.entries());
    } else {
      return new Response(JSON.stringify({ success: false, message: 'Unsupported content type' }), {
        status: 400,
        headers: securityHeaders
      });
    }

    // Validate required fields
    if (!data.email || !data.email.trim()) {
      return new Response(JSON.stringify({ success: false, message: 'Email is required' }), {
        status: 400,
        headers: securityHeaders
      });
    }

    // Validate email format
    if (!isValidEmail(data.email)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid email format' }), {
        status: 400,
        headers: securityHeaders
      });
    }

    // Sanitize and truncate all input fields
    const sanitizedData = {
      name: truncateField(sanitizeInput(data.name || ''), MAX_FIELD_LENGTHS.name) || null,
      email: truncateField(sanitizeInput(data.email), MAX_FIELD_LENGTHS.email),
      service: truncateField(sanitizeInput(data.service || ''), MAX_FIELD_LENGTHS.service) || null,
      timeline: truncateField(sanitizeInput(data.timeline || ''), MAX_FIELD_LENGTHS.timeline) || null,
      environment: truncateField(sanitizeInput(data.environment || ''), MAX_FIELD_LENGTHS.environment) || null,
      message: truncateField(sanitizeInput(data.message || ''), MAX_FIELD_LENGTHS.message) || null
    };

    // Connect to database
    const sql = neon();

    // Insert submission into database
    const result = await sql`
      INSERT INTO contact_submissions (name, email, service, timeline, environment, message)
      VALUES (
        ${sanitizedData.name},
        ${sanitizedData.email},
        ${sanitizedData.service},
        ${sanitizedData.timeline},
        ${sanitizedData.environment},
        ${sanitizedData.message}
      )
      RETURNING id, created_at
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Your message has been received. We will get back to you soon.'
    }), {
      status: 200,
      headers: {
        ...securityHeaders,
        'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
        'X-RateLimit-Remaining': String(rateLimit.remaining)
      }
    });

  } catch (error) {
    console.error('Error processing contact form submission:', error);

    return new Response(JSON.stringify({
      success: false,
      message: 'Something went wrong. Please try again later.'
    }), {
      status: 500,
      headers: securityHeaders
    });
  }
};

export const config = {
  path: '/api/contact'
};
