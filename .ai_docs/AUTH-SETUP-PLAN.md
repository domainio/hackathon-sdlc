# 🔐 Auth0 + Gmail + LastPass + Cloudflare Setup Plan

## 📋 Project Overview
**Goal**: Automated OAuth2 credential management pipeline for N8N workflows  
**Domain**: ${DOMAIN_NAME} (from docker-compose.yml: `N8N_EDITOR_BASE_URL=https://n8n.${DOMAIN_NAME}`)  
**Integration**: Auth0 → Gmail API → LastPass → N8N → Cloudflare verification

## 🎯 Master Plan Architecture

### 1. Directory Structure
```bash
scripts/auth-setup/
├── config/
│   ├── auth0-app-template.json     # Auth0 application config
│   ├── gmail-oauth-config.json    # Gmail OAuth settings
│   ├── cloudflare-zones.json      # Domain verification config
│   └── lastpass-structure.json    # Credential storage format
├── 01-prerequisites.sh             # Environment validation
├── 02-cloudflare-domain.sh        # Domain verification first
├── 03-auth0-setup.sh              # Auth0 application creation
├── 04-gmail-oauth.sh              # Gmail API setup
├── 05-lastpass-store.sh           # Secure credential storage
├── 06-n8n-integration.sh          # N8N credential import
├── auth-master.sh                 # Orchestration script
├── utils/
│   ├── logging.sh                 # Centralized logging
│   ├── validation.sh              # Input validation
│   └── cleanup.sh                 # Error cleanup
└── README-AUTH-SETUP.md           # Complete setup guide
```

## 🌐 Domain Integration Plan

### Cloudflare Domain: ${DOMAIN_NAME}
**Detected from N8N config**: `https://n8n.${DOMAIN_NAME}`

#### Required Cloudflare Setup
1. **Domain verification** - Confirm ownership of ${DOMAIN_NAME}
2. **DNS records validation** - Ensure n8n.${DOMAIN_NAME} points correctly
3. **SSL certificate status** - Verify HTTPS availability
4. **Webhook URL validation** - Test N8N webhook accessibility

#### OAuth2 Callback URLs
```
Auth0 Callbacks:
- https://n8n.${DOMAIN_NAME}/rest/oauth2-credential/callback
- https://n8n.${DOMAIN_NAME}/oauth/callback

Gmail OAuth Callbacks:
- https://n8n.${DOMAIN_NAME}/rest/oauth2-credential/callback
- http://localhost:5678/rest/oauth2-credential/callback (fallback)
```

## 🔧 Implementation Phases

### Phase 1: Environment Preparation
```bash
# Prerequisites validation
- Cloudflare API token
- Auth0 Management API access
- Google Cloud Console access
- LastPass CLI authentication
- Domain ${DOMAIN_NAME} ownership
```

### Phase 2: Domain Verification (First Priority)
```bash
# scripts/auth-setup/02-cloudflare-domain.sh
- Verify ${DOMAIN_NAME} ownership
- Check n8n.${DOMAIN_NAME} DNS record
- Validate SSL certificate
- Test webhook URL accessibility
- Create additional DNS records if needed
```

### Phase 3: Auth0 Application Setup
```bash
# scripts/auth-setup/03-auth0-setup.sh
- Create N8N OAuth application
- Configure callback URLs for ${DOMAIN_NAME}
- Set scopes and permissions
- Generate client credentials
- Test Auth0 configuration
```

### Phase 4: Gmail API Configuration
```bash
# scripts/auth-setup/04-gmail-oauth.sh
- Create/configure Google Cloud project
- Enable Gmail API
- Setup OAuth consent screen
- Configure authorized domains (${DOMAIN_NAME})
- Generate OAuth2 credentials
- Download and format credentials
```

### Phase 5: LastPass Secure Storage
```bash
# scripts/auth-setup/05-lastpass-store.sh
- Create structured secure notes
- Store Auth0 credentials
- Store Gmail OAuth credentials
- Store Cloudflare API tokens
- Generate .env file updates
- Format N8N credential JSON
```

### Phase 6: N8N Integration
```bash
# scripts/auth-setup/06-n8n-integration.sh
- Import credentials to N8N
- Test OAuth2 flows
- Validate Gmail connection
- Create test workflows
- Verify webhook functionality
```

## 📊 Configuration Templates

### Auth0 Application Config
```json
{
  "name": "N8N Black Owl Win",
  "description": "N8N Workflow Automation OAuth",
  "app_type": "regular_web",
  "callbacks": [
    "https://n8n.${DOMAIN_NAME}/rest/oauth2-credential/callback",
    "http://localhost:5678/rest/oauth2-credential/callback"
  ],
  "allowed_origins": [
    "https://n8n.${DOMAIN_NAME}",
    "http://localhost:5678"
  ],
  "web_origins": [
    "https://n8n.${DOMAIN_NAME}"
  ]
}
```

### Gmail OAuth Configuration
```json
{
  "web": {
    "client_id": "generated-by-google",
    "project_id": "n8n-black-owl-project",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "redirect_uris": [
      "https://n8n.${DOMAIN_NAME}/rest/oauth2-credential/callback"
    ],
    "javascript_origins": [
      "https://n8n.${DOMAIN_NAME}"
    ]
  }
}
```

### LastPass Storage Structure
```json
{
  "n8n-auth0": {
    "domain": "your-tenant.auth0.com",
    "clientId": "auth0-client-id",
    "clientSecret": "auth0-client-secret",
    "callbackUrl": "https://n8n.${DOMAIN_NAME}/rest/oauth2-credential/callback"
  },
  "n8n-gmail": {
    "clientId": "gmail-oauth-client-id",
    "clientSecret": "gmail-oauth-client-secret",
    "redirectUri": "https://n8n.${DOMAIN_NAME}/rest/oauth2-credential/callback"
  },
  "cloudflare": {
    "apiToken": "cf-api-token",
    "domain": "${DOMAIN_NAME}",
    "zoneId": "cf-zone-id"
  }
}
```

## 🔐 Security Implementation

### API Token Management
- **Cloudflare**: Zone:Read, DNS:Edit permissions only
- **Auth0**: Management API with Application management scope
- **Google**: Gmail API and OAuth2 consent management
- **LastPass**: CLI authentication with secure note access

### Validation Checkpoints
1. **Domain ownership** - Cloudflare API verification
2. **SSL certificate** - HTTPS endpoint validation
3. **OAuth flows** - Complete authentication testing
4. **Webhook accessibility** - N8N callback URL testing
5. **Credential security** - LastPass encryption verification

## 📝 Environment Variables Required

### Master Configuration
```bash
# Domain Configuration
DOMAIN_NAME=${DOMAIN_NAME}
N8N_SUBDOMAIN=n8n
N8N_BASE_URL=https://n8n.${DOMAIN_NAME}

# API Tokens
CLOUDFLARE_API_TOKEN=your-cf-token
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_MANAGEMENT_CLIENT_ID=mgmt-client-id
AUTH0_MANAGEMENT_CLIENT_SECRET=mgmt-client-secret
GOOGLE_CLOUD_PROJECT_ID=n8n-black-owl-project

# LastPass Integration
LASTPASS_USERNAME=${CONTACT_EMAIL}
LASTPASS_FOLDER=n8n-oauth-credentials
```

## 🚀 Execution Plan

### Command Structure
```bash
# Master execution
./scripts/auth-setup/auth-master.sh --domain=${DOMAIN_NAME} --interactive

# Individual components
./scripts/auth-setup/02-cloudflare-domain.sh --verify
./scripts/auth-setup/03-auth0-setup.sh --create-app
./scripts/auth-setup/04-gmail-oauth.sh --setup-project
./scripts/auth-setup/05-lastpass-store.sh --store-all
./scripts/auth-setup/06-n8n-integration.sh --import-creds
```

### Success Criteria
- ✅ Domain ${DOMAIN_NAME} verified and accessible
- ✅ SSL certificate valid for n8n.${DOMAIN_NAME}
- ✅ Auth0 application created with correct callbacks
- ✅ Gmail OAuth configured with domain authorization
- ✅ All credentials securely stored in LastPass
- ✅ N8N can authenticate with Gmail via OAuth2
- ✅ Webhooks functional on production domain

## 🔄 Rollback Strategy

### Cleanup Commands
```bash
# Remove Auth0 application
./scripts/auth-setup/utils/cleanup.sh --auth0-app

# Remove Google Cloud project
./scripts/auth-setup/utils/cleanup.sh --google-project

# Clean LastPass entries
./scripts/auth-setup/utils/cleanup.sh --lastpass-creds

# Reset N8N credentials
./scripts/auth-setup/utils/cleanup.sh --n8n-creds
```

---

**📋 Plan Status: READY FOR IMPLEMENTATION**

This plan creates a complete OAuth2 automation pipeline specifically configured for the ${DOMAIN_NAME} domain detected in your N8N configuration. Each phase is modular and includes proper error handling and security measures.