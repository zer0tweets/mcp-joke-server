# Auth0 Configuration for ChatGPT MCP Integration

## 🎯 Overview

ChatGPT supports **Dynamic Client Registration (DCR)**, which means:
- ✅ ChatGPT auto-registers itself with your Auth0
- ✅ No need to manually create applications
- ✅ Supports Authorization Code + PKCE flow automatically
- ✅ Your server just needs to validate JWT tokens

---

## 📋 Step-by-Step Auth0 Configuration

### Step 1: Create the API

1. Go to **Auth0 Dashboard** → **Applications** → **APIs**
2. Click **Create API**
3. Configure:
   - **Name:** `MCP Joke API`
   - **Identifier (Audience):** `https://mcp-joke-api`
   - **Signing Algorithm:** `RS256`
4. Click **Create**

---

### Step 2: Enable Dynamic Client Registration (DCR)

1. In your API (`MCP Joke API`), go to **Settings** tab
2. Scroll down to **Dynamic Client Registration**
3. ✅ **Enable** it
4. Note the **Registration Endpoint** (you won't need to use it, ChatGPT will)
5. Click **Save Changes**

---

### Step 3: Enable RBAC and Permissions

1. Stay in **Settings** tab
2. Find **RBAC Settings**:
   - ✅ **Enable RBAC**
   - ✅ **Add Permissions in the Access Token**
3. Click **Save Changes**

4. Go to **Permissions** tab
5. Add permission:
   - **Permission (Scope):** `read:jokes`
   - **Description:** `Read programming jokes`
6. Click **Add**

---

### Step 4: Configure Login Method

You need at least one way for users to login when ChatGPT redirects them:

#### Option A: Username-Password Database (Easiest)

1. Go to **Authentication** → **Database**
2. Select **Username-Password-Authentication** (default)
3. Go to **Applications** tab
4. Enable for **All Applications** or specific ones
5. Create a test user:
   - Go to **User Management** → **Users**
   - Click **Create User**
   - Email: `test@example.com`
   - Password: (choose a secure password)
   - Connection: `Username-Password-Authentication`
   - Click **Create**

#### Option B: Social Login (Google, GitHub, etc.)

1. Go to **Authentication** → **Social**
2. Enable your preferred provider (e.g., Google)
3. Follow the setup wizard
4. Enable it for **All Applications**

---

### Step 5: Configure Application Settings (Optional - for manual testing)

If you want to test manually (without ChatGPT), create an app:

1. Go to **Applications** → **Applications** → **Create Application**
2. Name: `Test Client`
3. Type: **Single Page Application**
4. Click **Create**
5. Go to **Settings**:
   - Add **Allowed Callback URLs:** `http://localhost:3000/callback`
   - Add **Allowed Web Origins:** `http://localhost:3000`
   - Add **Allowed Logout URLs:** `http://localhost:3000`
6. Go to **Advanced Settings** → **Grant Types**:
   - ✅ **Authorization Code**
   - ✅ **Refresh Token**
7. Click **Save Changes**

---

### Step 6: Configure for ChatGPT

1. In **Applications**, edit your API or create a new application
2. Add **Allowed Callback URLs:**
   ```
   https://chat.openai.com/aip/g-*/oauth/callback
   ```
   (Use wildcard `*` or specific GPT ID once you know it)

3. Add **Allowed Web Origins:**
   ```
   https://chat.openai.com
   https://*.openai.com
   ```

4. Click **Save Changes**

---

## 🔑 Configuration Values for Vercel

After completing the above, you'll need these values for Vercel environment variables:

| Variable | Where to Find | Example |
|----------|---------------|---------|
| `AUTH0_DOMAIN` | **Settings** → **Domain** | `dev-abc123.us.auth0.com` |
| `AUTH0_AUDIENCE` | **API** → **Identifier** | `https://mcp-joke-api` |

---

## ✅ Verification Checklist

Before deploying, verify:

- [ ] API created with RS256 signing
- [ ] Dynamic Client Registration enabled
- [ ] RBAC enabled with permissions in token
- [ ] At least one login connection enabled
- [ ] `read:jokes` permission created
- [ ] Test user created (if using database auth)
- [ ] Callback URLs include ChatGPT domains
- [ ] Environment variables noted for Vercel

---

## 🧪 Testing the Configuration

### Test 1: Check JWKS endpoint (should be public)

```bash
curl https://YOUR_AUTH0_DOMAIN/.well-known/jwks.json
```

Should return RSA public keys.

### Test 2: Check OpenID configuration

```bash
curl https://YOUR_AUTH0_DOMAIN/.well-known/openid-configuration
```

Should show all OAuth endpoints including:
- `authorization_endpoint`
- `token_endpoint`
- `registration_endpoint` (for DCR)

### Test 3: Get a token (client credentials - for testing only)

```bash
curl --request POST \
  --url https://YOUR_AUTH0_DOMAIN/oauth/token \
  --header 'content-type: application/json' \
  --data '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "audience": "https://mcp-joke-api",
    "grant_type": "client_credentials"
  }'
```

Should return an access token.

---

## 🚀 How ChatGPT Will Use This

1. **User tries to use your GPT tool** for the first time
2. **ChatGPT makes request** to your API without token
3. **Your API returns 401** with `WWW-Authenticate` header
4. **ChatGPT parses header**, discovers Auth0 endpoints
5. **ChatGPT uses DCR** to auto-register as a client
6. **ChatGPT redirects user** to Auth0 login page
7. **User logs in and consents**
8. **Auth0 redirects back** to ChatGPT with auth code
9. **ChatGPT exchanges code** for access token (with PKCE)
10. **ChatGPT retries API request** with Bearer token
11. **Your API validates token** and returns joke
12. **ChatGPT caches token** for future requests

---

## 🔒 Security Notes

- ✅ **RS256** ensures tokens can't be forged
- ✅ **PKCE** protects against authorization code interception
- ✅ **DCR** prevents client secret leakage
- ✅ **Audience** ensures tokens are for YOUR API only
- ✅ **Short token expiry** limits damage if token is stolen

---

## 📚 References

- [Auth0 Dynamic Client Registration](https://auth0.com/docs/get-started/applications/dynamic-client-registration)
- [OAuth 2.0 for Browser-Based Apps (PKCE)](https://datatracker.ietf.org/doc/html/rfc7636)
- [RFC 9728: OAuth 2.0 Authorization Server Metadata](https://www.rfc-editor.org/rfc/rfc9728.html)
- [OpenAI MCP OAuth Documentation](https://modelcontextprotocol.io/)

---

## ❓ Troubleshooting

### "Invalid audience" error
- Verify `AUTH0_AUDIENCE` in Vercel matches API Identifier exactly
- Check token claims: decode at [jwt.io](https://jwt.io)

### "Dynamic registration failed"
- Ensure DCR is enabled in API settings
- Check Auth0 logs for registration attempts

### "User cannot login"
- Ensure at least one connection is enabled
- Check connection is enabled for "All Applications"
- Verify test user exists

### "Callback URL mismatch"
- Add wildcard: `https://chat.openai.com/aip/g-*/oauth/callback`
- Or get exact GPT ID from ChatGPT after creating GPT

---

**Next Step:** Deploy to Vercel with these environment variables! 🚀
