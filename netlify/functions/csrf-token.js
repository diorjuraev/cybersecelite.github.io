/**
 * CSRF Token Generator
 * Generates and sets a secure CSRF token cookie, returning the token value
 * for the client to include in subsequent requests
 */

/**
 * Generate a cryptographically secure random token
 */
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export default async (req, context) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'GET'
      }
    });
  }

  const token = generateToken();

  // Set cookie with security flags
  const cookieOptions = [
    `csrf-token=${token}`,
    'Path=/',
    'SameSite=Strict',
    'Secure',
    'HttpOnly',
    'Max-Age=3600' // 1 hour expiration
  ].join('; ');

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieOptions,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff'
    }
  });
};

export const config = {
  path: '/api/csrf-token'
};
