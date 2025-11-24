# AWS Amplify Deployment Guide

## Fixing 301 Moved Permanently Error

The 301 error occurs because:
1. Amplify is adding a trailing slash to `/api/send-email` → `/api/send-email/`
2. The redirect changes POST to GET (browser behavior)
3. The endpoint doesn't exist, resulting in 404

**Root Cause**: Amplify static hosting doesn't run your Express server, so `/api/send-email` doesn't exist.

## Quick Fix Options

### Option 1: Deploy Express Server Separately (Easiest)

1. **Deploy your Express server** to a service like:
   - **Railway**: https://railway.app (free tier available)
   - **Render**: https://render.com (free tier available)
   - **Heroku**: https://heroku.com
   - **AWS EC2/ECS**: For more control

2. **Update `config/config.js`** to point to your deployed API:
   ```javascript
   backend: {
       apiUrl: 'https://your-api-domain.com/api/send-email'
   }
   ```

3. **Redeploy to Amplify** - the frontend will now call your external API

### Option 2: Use Amplify Serverless Functions

If you want everything on Amplify, you need to set up a Lambda function:

1. **Install Amplify CLI**:
   ```bash
   npm install -g @aws-amplify/cli
   ```

2. **Initialize Amplify** (if not already done):
   ```bash
   amplify init
   ```

3. **Add a function**:
   ```bash
   amplify add function
   ```
   - Name: `sendEmail`
   - Runtime: Node.js
   - Copy the code from `amplify/backend/function/sendEmail/src/index.js`

4. **Set environment variables**:
   ```bash
   amplify env add
   ```
   Add: `EMAIL_API_KEY`, `FROM_EMAIL`, `FROM_NAME`

5. **Deploy**:
   ```bash
   amplify push
   ```

6. **Update `amplify.yml`** to route API calls to the function (see below)

## Fixing 301 Redirect Issues

The configuration files have been updated to prevent trailing slash redirects:

### Solution 1: Check Amplify Console Settings

1. Go to your Amplify app in the AWS Console
2. Navigate to **App settings** → **Rewrites and redirects**
3. Make sure you have these rules configured:
   - **Source**: `/api/*`
   - **Target**: `/api/*`
   - **Type**: Rewrite (200)
   
   - **Source**: `/*`
   - **Target**: `/index.html`
   - **Type**: Rewrite (200)

### Solution 2: Verify _redirects File

The `_redirects` file in the root directory should contain:
```
/api/*  /api/:splat  200
/*  /index.html  200
```

### Solution 3: Environment Variables

Make sure you've set these environment variables in Amplify Console:
- `EMAIL_API_KEY` or `SENDGRID_API_KEY` or `BREVO_API_KEY`
- `FROM_EMAIL`
- `FROM_NAME`

**Steps to add environment variables:**
1. Go to Amplify Console → Your App
2. Click **App settings** → **Environment variables**
3. Add the required variables

### Solution 4: API Configuration

Since you're using Express.js, you have two options:

#### Option A: Use External API (Recommended for Quick Fix)

1. Deploy your Express server separately (e.g., on Heroku, Railway, or AWS EC2)
2. Update `config/config.js` to point to your external API:
   ```javascript
   backend: {
       apiUrl: 'https://your-api-domain.com/api/send-email'
   }
   ```

#### Option B: Use Amplify Serverless Functions

If you want to use Amplify's serverless functions, you'll need to:
1. Install Amplify CLI: `npm install -g @aws-amplify/cli`
2. Initialize Amplify: `amplify init`
3. Add a function: `amplify add function`
4. Deploy: `amplify push`

### Common Causes of 301 Errors

1. **Trailing Slash Redirects**: Amplify may redirect URLs with/without trailing slashes
2. **HTTP to HTTPS**: Normal redirect, but can cause issues if not handled
3. **Domain Configuration**: Check if your custom domain has proper SSL certificate
4. **Build Output**: Ensure `amplify.yml` is correctly configured

### Troubleshooting Steps

1. **Check Browser Console**: Look for the exact URL causing the 301
2. **Check Network Tab**: See what the redirect response headers say
3. **Test API Directly**: Try accessing `/api/health` directly
4. **Check Amplify Logs**: Go to Amplify Console → Your App → Monitoring → Logs

### Quick Test

After deploying, test these URLs:
- `https://your-domain.amplifyapp.com/` - Should load index.html
- `https://your-domain.amplifyapp.com/api/health` - Should return JSON (if API is configured)

If you're still getting 301 errors, check the Amplify Console logs for more details.

