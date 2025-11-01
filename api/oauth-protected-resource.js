/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728)
 * This endpoint helps clients discover the authorization server
 */
export default function handler(req, res) {
  const auth0Domain = process.env.AUTH0_DOMAIN?.trim();
  const auth0Audience = process.env.AUTH0_AUDIENCE?.trim();
  const serverUrl = `https://${req.headers.host}`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!auth0Domain || !auth0Audience) {
    return res.status(500).json({
      error: 'Server configuration error'
    });
  }

  return res.status(200).json({
    resource: serverUrl,
    authorization_servers: [
      `https://${auth0Domain}`
    ],
    bearer_methods_supported: ['header'],
    resource_documentation: 'https://github.com/zer0tweets/mcp-joke-server'
  });
}
