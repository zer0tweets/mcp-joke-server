/**
 * MCP Server Manifest
 * This describes the MCP server capabilities and OAuth configuration
 */
export default function handler(req, res) {
  const auth0Domain = process.env.AUTH0_DOMAIN?.trim();
  const auth0Audience = process.env.AUTH0_AUDIENCE?.trim();

  const baseUrl = `https://${req.headers.host}`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  return res.status(200).json({
    name: 'joke-mcp-server',
    version: '1.0.0',
    description: 'MCP server providing random programming jokes',
    protocol_version: '2024-11-05',

    endpoints: {
      jsonrpc: `${baseUrl}/api/mcp`
    },

    oauth: {
      authorizationUrl: `https://${auth0Domain}/authorize`,
      tokenUrl: `https://${auth0Domain}/oauth/token`,
      audience: auth0Audience,
      scopes: []
    },

    capabilities: {
      tools: true
    },

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
  });
}
