# Gmail OAuth Setup for n8n - Step-by-Step Guide

## 1. Google Cloud Console Setup

### Create Project & Enable API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Go to "APIs & Services" → "Library"
4. Search for "Gmail API" and enable it

### Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Name it (e.g., "n8n Gmail Integration")
5. Under "Authorized redirect URIs", add:
   ```
   https://n8n.yourdomain.com/rest/oauth2-credential/callback
   ```
6. Save and note down your **Client ID** and **Client Secret**

## 2. OAuth Consent Screen

1. Go to "OAuth consent screen"
2. Choose "External" (unless you have Google Workspace)
3. Fill in required fields:
   - App name: "n8n Gmail Access"
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly` (for reading)
   - `https://www.googleapis.com/auth/gmail.send` (for sending)
   - Add others as needed
5. Add your Gmail address as a test user

## 3. n8n Credential Setup

### Create Google OAuth2 Credential

1. In n8n, go to "Credentials"
2. Click "Add Credential"
3. Select "Google OAuth2 API"
4. Fill in:
   - **Credential Name**: "Gmail OAuth"
   - **Client ID**: from Google Cloud Console
   - **Client Secret**: from Google Cloud Console
   - **Scope**: `https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send`
5. Click "Connect my account"
6. Authorize with your Google account
7. Save the credential

## 4. Configure Gmail Node

1. Add Gmail node to your workflow
2. In the node settings:
   - **Credential for Gmail API**: Select your "Gmail OAuth" credential
   - Configure your desired operation (Get, Send, etc.)

## 5. Test the Setup

Create a simple test workflow:

1. Add a Manual Trigger node
2. Add Gmail node → "Get" operation → "Get Many" messages
3. Execute to test the connection

## Important Notes

- Keep your Client ID and Secret secure
- The OAuth consent screen will show a warning for unverified apps - this is normal for personal use
- The workflow will have persistent access without requiring re-authentication
- Replace `yourdomain.com` with your actual domain in the redirect URI

## Common Gmail API Scopes

- `https://www.googleapis.com/auth/gmail.readonly` - Read emails
- `https://www.googleapis.com/auth/gmail.send` - Send emails
- `https://www.googleapis.com/auth/gmail.modify` - Modify emails (mark as read, etc.)
- `https://www.googleapis.com/auth/gmail.compose` - Create drafts
