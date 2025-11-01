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
 * MCP JSON-RPC Handler
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Support both GET and POST for MCP Streamable HTTP
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Method not allowed' },
      id: null
    });
  }

  // Handle GET request - return endpoint info
  if (req.method === 'GET') {
    return res.status(200).json({
      name: 'joke-mcp-server',
      version: '1.0.0',
      transport: 'http',
      capabilities: {
        tools: true
      }
    });
  }

  // Parse JSON-RPC request first to determine if auth is needed
  const request = req.body;

  if (!request || request.jsonrpc !== '2.0') {
    return res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid Request - not JSON-RPC 2.0' },
      id: request?.id || null
    });
  }

  // Check if this is a notification (no id field) - no response needed
  const isNotification = !('id' in request);

  // Check if method requires authentication
  const requiresAuth = ['tools/call'].includes(request.method);

  if (requiresAuth) {
    // Check environment variables
    const auth0Domain = process.env.AUTH0_DOMAIN?.trim();
    const auth0Audience = process.env.AUTH0_AUDIENCE?.trim();

    if (!auth0Domain || !auth0Audience) {
      console.error('Missing Auth0 configuration');
      return res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Server configuration error' },
        id: request.id || null
      });
    }

    // Extract and verify token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Return WWW-Authenticate header for OAuth discovery
      res.setHeader(
        'WWW-Authenticate',
        `Bearer realm="${auth0Audience}", ` +
        `authorization_uri="https://${auth0Domain}/authorize", ` +
        `token_uri="https://${auth0Domain}/oauth/token"`
      );
      return res.status(401).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Authentication required',
          data: {
            auth0_domain: auth0Domain,
            audience: auth0Audience
          }
        },
        id: request.id || null
      });
    }

    const token = authHeader.substring(7);

    // Verify the JWT token
    const payload = await verifyAuth0Token(token, auth0Domain, auth0Audience);

    if (!payload) {
      return res.status(401).json({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Invalid token' },
        id: request.id || null
      });
    }
  }

  // Handle MCP methods
  try {
    switch (request.method) {
      case 'initialize': {
        return res.status(200).json({
          jsonrpc: '2.0',
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: {
              name: 'joke-mcp-server',
              version: '1.0.0'
            },
            capabilities: {
              tools: {},
              logging: {}
            }
          },
          id: request.id
        });
      }

      case 'initialized': {
        // Client confirms initialization is complete (notification - no response)
        if (isNotification) {
          return res.status(200).end();
        }
        return res.status(200).json({
          jsonrpc: '2.0',
          result: {},
          id: request.id
        });
      }

      case 'ping': {
        // Respond to ping requests
        return res.status(200).json({
          jsonrpc: '2.0',
          result: {},
          id: request.id
        });
      }

      case 'tools/list': {
        return res.status(200).json({
          jsonrpc: '2.0',
          result: {
            tools: [
              {
                name: 'get_random_joke',
                description: 'Get a random programming joke',
                inputSchema: {
                  type: 'object',
                  properties: {},
                  required: []
                }
              }
            ]
          },
          id: request.id
        });
      }

      case 'tools/call': {
        const toolName = request.params?.name;

        if (toolName !== 'get_random_joke') {
          return res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32602,
              message: 'Invalid tool name',
              data: { available_tools: ['get_random_joke'] }
            },
            id: request.id
          });
        }

        // Get a random joke
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
          jsonrpc: '2.0',
          result: {
            content: [
              {
                type: 'text',
                text: randomJoke
              }
            ],
            isError: false
          },
          id: request.id
        });
      }

      default: {
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32601,
            message: 'Method not found',
            data: {
              available_methods: ['initialize', 'initialized', 'ping', 'tools/list', 'tools/call'],
              requested_method: request.method
            }
          },
          id: request.id
        });
      }
    }
  } catch (error) {
    console.error('Error handling MCP request:', error);
    return res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: { error: error.message }
      },
      id: request.id
    });
  }
}
