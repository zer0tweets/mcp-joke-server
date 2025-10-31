import * as jose from 'jose';

// Lazy-init JWKS to avoid cold start crashes
let jwksCache = null;

function getJWKS(domain) {
  if (!domain) {
    throw new Error('AUTH0_DOMAIN is not set');
  }
  if (!jwksCache) {
    jwksCache = jose.createRemoteJWKSet(
      new URL(`https://${domain}/.well-known/jwks.json`)
    );
  }
  return jwksCache;
}

/**
 * Verify Auth0 JWT token
 */
async function verifyAuth0Token(token, domain, audience) {
  try {
    const { payload } = await jose.jwtVerify(token, getJWKS(domain), {
      issuer: `https://${domain}/`,
      audience: audience,
    });

    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Main handler for MCP tool calls
 */
export default async function handler(req, res) {
  // Enable CORS for ChatGPT
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check environment variables early and sanitize them
  const auth0Domain = process.env.AUTH0_DOMAIN?.trim();
  const auth0Audience = process.env.AUTH0_AUDIENCE?.trim();

  if (!auth0Domain || !auth0Audience) {
    console.error('Missing Auth0 configuration:', {
      domain: auth0Domain ? 'SET' : 'MISSING',
      audience: auth0Audience ? 'SET' : 'MISSING',
      allEnvVars: Object.keys(process.env)
    });
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Auth0 environment variables are not properly configured'
    });
  }

  // Extract and verify token
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Return 401 with WWW-Authenticate header for ChatGPT discovery
    res.setHeader(
      'WWW-Authenticate',
      `Bearer realm="${auth0Audience}", ` +
      `authorization_uri="https://${auth0Domain}/authorize", ` +
      `token_uri="https://${auth0Domain}/oauth/token"`
    );
    return res.status(401).json({
      error: 'Missing or invalid authorization header',
      message: 'Please provide a valid Bearer token'
    });
  }

  const token = authHeader.substring(7);

  // Verify the JWT token
  const payload = await verifyAuth0Token(token, auth0Domain, auth0Audience);

  if (!payload) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }

  // Token is valid, handle the tool call
  const { tool } = req.body;

  // Handle get_random_joke tool
  if (tool === 'get_random_joke') {
    const jokes = [
      "Why do programmers prefer dark mode? Because light attracts bugs!",
      "Why did the developer go broke? Because he used up all his cache!",
      "How many programmers does it take to change a light bulb? None, that's a hardware problem!",
      "Why do Java developers wear glasses? Because they don't C#!",
      "What's a programmer's favorite hangout place? The Foo Bar!",
      "Why did the programmer quit his job? Because he didn't get arrays!",
      "What do you call a programmer from Finland? Nerdic!",
      "Why do programmers always mix up Halloween and Christmas? Because Oct 31 == Dec 25!",
      "How do you comfort a JavaScript bug? You console it!",
      "Why did the database administrator leave his wife? She had one-to-many relationships!"
    ];

    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];

    return res.status(200).json({
      success: true,
      tool: 'get_random_joke',
      joke: randomJoke,
      user: payload.sub // Include user info from token
    });
  }

  // Tool not found
  return res.status(404).json({
    error: 'Tool not found',
    message: `The tool "${tool}" is not supported`,
    available_tools: ['get_random_joke']
  });
}
