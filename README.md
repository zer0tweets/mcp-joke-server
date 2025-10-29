# MCP Joke Server with Auth0 + Vercel

A simple Model Context Protocol (MCP) server that returns random programming jokes, secured with Auth0 OAuth 2.0, and designed to work with ChatGPT.

## 📋 Prerequisites

- Node.js 18+ installed
- Vercel account (free): https://vercel.com
- Auth0 account (free): https://auth0.com
- ChatGPT Plus or ChatGPT Team (for Custom GPTs/Actions)

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd mcp-joke-server
npm install
```

### Step 2: Set Up Auth0 (10 minutes)

1. **Sign up for Auth0** at https://auth0.com (free tier)

2. **Create an API**:
   - Go to **Applications** → **APIs**
   - Click **Create API**
   - Name: `MCP Joke API`
   - Identifier: `https://mcp-joke-api` (this is your **Audience**)
   - Signing Algorithm: `RS256`
   - Click **Create**

3. **Create an Application**:
   - Go to **Applications** → **Applications**
   - Click **Create Application**
   - Name: `ChatGPT MCP Client`
   - Type: **Machine to Machine Applications**
   - Select your API (`MCP Joke API`)
   - Click **Authorize**

4. **Configure Application**:
   - Go to your application **Settings**
   - Note down:
     - **Domain** (e.g., `your-tenant.auth0.com`)
     - **Client ID**
     - **Client Secret**
   - Add **Allowed Callback URLs**: `https://chat.openai.com/aip/{YOUR_GPT_ID}/oauth/callback`
     - (You'll get the exact URL from ChatGPT later)
   - Add **Allowed Web Origins**: `https://chat.openai.com`
   - Click **Save Changes**

5. **Enable Authorization Code Flow**:
   - In **Application Settings**, scroll to **Advanced Settings**
   - Click **Grant Types** tab
   - Ensure **Authorization Code** is checked
   - Click **Save Changes**

---

### Step 3: Deploy to Vercel (5 minutes)

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? (select your account)
- Link to existing project? **N**
- What's your project's name? `mcp-joke-server`
- In which directory is your code located? `./`
- Want to override the settings? **N**

4. **Note your deployment URL** (e.g., `https://mcp-joke-server.vercel.app`)

---

### Step 4: Configure Environment Variables in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (`mcp-joke-server`)
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

| Variable | Value | Example |
|----------|-------|---------|
| `AUTH0_DOMAIN` | Your Auth0 domain | `your-tenant.auth0.com` |
| `AUTH0_AUDIENCE` | Your API identifier | `https://mcp-joke-api` |

5. Click **Save**
6. **Redeploy** to apply changes:
```bash
vercel --prod
```

---

### Step 5: Configure ChatGPT (15 minutes)

#### Option A: Create a Custom GPT

1. Go to https://chat.openai.com/
2. Click your profile → **My GPTs** → **Create a GPT**
3. Click **Configure** tab
4. Under **Actions**, click **Create new action**

#### Option B: Add Action to Existing GPT

1. Open your GPT
2. Click **Edit GPT**
3. Go to **Configure** tab
4. Under **Actions**, click **Create new action**

#### Configure the Action

1. **Import OpenAPI Schema**:
   - Copy the contents of `openapi.json`
   - Update `YOUR_VERCEL_URL` with your actual Vercel URL
   - Update `YOUR_AUTH0_DOMAIN` with your Auth0 domain
   - Paste into the schema editor

2. **Configure Authentication**:
   - Authentication Type: **OAuth**
   - Click **Add authentication**
   - Client ID: (from Auth0)
   - Client Secret: (from Auth0)
   - Authorization URL: `https://YOUR_AUTH0_DOMAIN.auth0.com/authorize`
   - Token URL: `https://YOUR_AUTH0_DOMAIN.auth0.com/oauth/token`
   - Scope: (leave empty or use `openid profile email`)
   - Token Exchange Method: **Default (POST request)**

3. **Save the Action**

4. **Update Auth0 Callback URL**:
   - After saving, ChatGPT will show the callback URL
   - Copy it (looks like: `https://chat.openai.com/aip/g-XXXXX/oauth/callback`)
   - Go back to Auth0 → Your Application → **Settings**
   - Add this URL to **Allowed Callback URLs**
   - Click **Save**

---

## 🧪 Testing

### Test in ChatGPT

1. Open your GPT
2. Type: **"Tell me a programming joke"**
3. On first use, you'll be redirected to Auth0 to authorize
4. After authorization, ChatGPT will call your API and return a joke!

### Test with cURL (optional)

1. Get an access token from Auth0:
```bash
curl --request POST \
  --url https://YOUR_AUTH0_DOMAIN.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{
    "client_id":"YOUR_CLIENT_ID",
    "client_secret":"YOUR_CLIENT_SECRET",
    "audience":"https://mcp-joke-api",
    "grant_type":"client_credentials"
  }'
```

2. Use the token to call your API:
```bash
curl -X POST https://your-app.vercel.app/mcp/call-tool \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_random_joke"}'
```

---

## 📁 Project Structure

```
mcp-joke-server/
├── api/
│   └── mcp/
│       └── call-tool.js      # Main API endpoint with Auth0 verification
├── jokes.txt                  # Database of jokes
├── openapi.json              # OpenAPI spec for ChatGPT
├── package.json              # Dependencies
├── vercel.json               # Vercel configuration
└── README.md                 # This file
```

---

## 🔧 How It Works

1. **User asks ChatGPT** for a joke
2. **ChatGPT checks** if it has a valid OAuth token
3. If not, **ChatGPT redirects** user to Auth0 for authorization
4. **User authorizes** the application in Auth0
5. **Auth0 returns** authorization code to ChatGPT
6. **ChatGPT exchanges** code for access token
7. **ChatGPT calls** your Vercel endpoint with Bearer token
8. **Your API verifies** the JWT token with Auth0
9. **Your API returns** a random joke
10. **ChatGPT displays** the joke to the user

---

## 🎯 Next Steps

Once this is working, you can:

1. **Add more tools**:
   - Copy `api/mcp/call-tool.js` logic
   - Add new tool handlers
   - Update `openapi.json` with new operations

2. **Connect to ClickHouse**:
   - Add database query tools
   - Implement bot detection
   - Add wallet analysis

3. **Enhance security**:
   - Add rate limiting
   - Implement user-specific scopes
   - Add audit logging

---

## 🐛 Troubleshooting

### "Invalid token" error

- Check that `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` are set correctly in Vercel
- Verify the token is being sent in the `Authorization: Bearer TOKEN` header
- Ensure your Auth0 API is using RS256 signing algorithm

### "Callback URL mismatch" error

- Ensure the callback URL in Auth0 matches exactly what ChatGPT provides
- Check for trailing slashes
- Wait a few minutes for Auth0 changes to propagate

### "Tool not found" error

- Verify the request body includes `{"tool": "get_random_joke"}`
- Check Vercel logs: `vercel logs`

---

## 📚 Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [OpenAI Actions Documentation](https://platform.openai.com/docs/actions)
- [MCP Protocol](https://modelcontextprotocol.io/)

---

## 📝 License

MIT
