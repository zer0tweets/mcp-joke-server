#!/bin/bash
# Helper script to get a test token from Auth0
# You'll need to create a Machine-to-Machine application in Auth0

# Set these from your Auth0 M2M application
CLIENT_ID="${AUTH0_CLIENT_ID}"
CLIENT_SECRET="${AUTH0_CLIENT_SECRET}"
AUTH0_DOMAIN="dev-6dbxpm08ehelft8j.us.auth0.com"
AUDIENCE="https://mcp-joke-server.vercel.app"

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
  echo "Error: Please set AUTH0_CLIENT_ID and AUTH0_CLIENT_SECRET environment variables"
  echo ""
  echo "To get these:"
  echo "1. Go to Auth0 Dashboard → Applications → Create Application"
  echo "2. Choose 'Machine to Machine Applications'"
  echo "3. Authorize it for the API: https://mcp-joke-server.vercel.app"
  echo "4. Copy the Client ID and Client Secret"
  echo ""
  echo "Then run:"
  echo "export AUTH0_CLIENT_ID=your_client_id"
  echo "export AUTH0_CLIENT_SECRET=your_client_secret"
  echo "./get-test-token.sh"
  exit 1
fi

echo "Getting token from Auth0..."
TOKEN_RESPONSE=$(curl -s --request POST \
  --url "https://${AUTH0_DOMAIN}/oauth/token" \
  --header 'content-type: application/json' \
  --data "{
    \"client_id\":\"${CLIENT_ID}\",
    \"client_secret\":\"${CLIENT_SECRET}\",
    \"audience\":\"${AUDIENCE}\",
    \"grant_type\":\"client_credentials\"
  }")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Error getting token:"
  echo $TOKEN_RESPONSE | python3 -m json.tool
  exit 1
fi

echo "✓ Token obtained successfully!"
echo ""
echo "Access Token:"
echo "$ACCESS_TOKEN"
echo ""
echo "To use in requests:"
echo "export MCP_TOKEN='$ACCESS_TOKEN'"
