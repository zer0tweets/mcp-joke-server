/**
 * OAuth 2.0 Authorization Server Metadata (RFC 8414)
 * This proxies to Auth0's authorization server metadata
 * and adds MCP-specific configuration
 */
export default async function handler(req, res) {
  const auth0Domain = process.env.AUTH0_DOMAIN?.trim();

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!auth0Domain) {
    return res.status(500).json({
      error: 'Server configuration error'
    });
  }

  try {
    // Fetch Auth0's authorization server metadata
    const auth0MetadataUrl = `https://${auth0Domain}/.well-known/openid-configuration`;
    const response = await fetch(auth0MetadataUrl);

    if (!response.ok) {
      throw new Error(`Auth0 metadata fetch failed: ${response.status}`);
    }

    const auth0Metadata = await response.json();

    // Return the metadata with MCP-specific additions
    return res.status(200).json({
      issuer: auth0Metadata.issuer,
      authorization_endpoint: auth0Metadata.authorization_endpoint,
      token_endpoint: auth0Metadata.token_endpoint,
      registration_endpoint: auth0Metadata.registration_endpoint,
      jwks_uri: auth0Metadata.jwks_uri,
      response_types_supported: auth0Metadata.response_types_supported || ['code'],
      grant_types_supported: auth0Metadata.grant_types_supported || [
        'authorization_code',
        'refresh_token'
      ],
      code_challenge_methods_supported: auth0Metadata.code_challenge_methods_supported || [
        'S256'
      ],
      token_endpoint_auth_methods_supported: auth0Metadata.token_endpoint_auth_methods_supported || [
        'client_secret_post',
        'client_secret_basic',
        'none'
      ],
      scopes_supported: auth0Metadata.scopes_supported || [
        'openid',
        'profile',
        'email'
      ],
      service_documentation: 'https://github.com/zer0tweets/mcp-joke-server'
    });
  } catch (error) {
    console.error('Error fetching Auth0 metadata:', error);
    return res.status(500).json({
      error: 'Failed to fetch authorization server metadata',
      details: error.message
    });
  }
}
