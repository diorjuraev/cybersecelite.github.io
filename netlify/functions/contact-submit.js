import { neon } from '@netlify/neon';

/**
 * Netlify Function to handle contact form submissions
 * Stores submissions in Netlify DB (Neon PostgreSQL)
 */
export default async (req, context) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parse form data
    const contentType = req.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      data = Object.fromEntries(params.entries());
    } else {
      return new Response(JSON.stringify({ success: false, message: 'Unsupported content type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate required fields
    if (!data.email || !data.email.trim()) {
      return new Response(JSON.stringify({ success: false, message: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Connect to database
    const sql = neon();

    // Insert submission into database
    const result = await sql`
      INSERT INTO contact_submissions (name, email, service, timeline, environment, message)
      VALUES (
        ${data.name || null},
        ${data.email},
        ${data.service || null},
        ${data.timeline || null},
        ${data.environment || null},
        ${data.message || null}
      )
      RETURNING id, created_at
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Your message has been received. We will get back to you soon.',
      id: result[0].id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing contact form submission:', error);

    return new Response(JSON.stringify({
      success: false,
      message: 'Something went wrong. Please try again later.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: '/api/contact'
};
