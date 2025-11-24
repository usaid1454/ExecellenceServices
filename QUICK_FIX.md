# Quick Fix for 301 Error on Amplify

## The Problem

Your API endpoint `/api/send-email` doesn't exist on Amplify static hosting because:
- Amplify only serves static files (HTML, CSS, JS)
- Your Express server (`server.js`) doesn't run on Amplify static hosting
- When Amplify can't find the route, it redirects with a 301, adding a trailing slash
- The browser follows the redirect but changes POST to GET, causing a 404

## Fastest Solution: Deploy Express Server to Railway (5 minutes)

### Step 1: Deploy to Railway

1. Go to https://railway.app and sign up/login (free)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Node.js
5. Add environment variables:
   - `EMAIL_API_KEY` (or `SENDGRID_API_KEY` or `BREVO_API_KEY`)
   - `FROM_EMAIL`
   - `FROM_NAME`
   - `PORT` (Railway sets this automatically, but you can use `3000`)
6. Railway will deploy and give you a URL like: `https://your-app.railway.app`

### Step 2: Update Your Frontend Config

Update `config/config.js`:

```javascript
backend: {
    // Replace with your Railway URL
    apiUrl: 'https://your-app.railway.app/api/send-email'
}
```

### Step 3: Update Railway to Serve Static Files (Optional)

If you want Railway to also serve your frontend, update `server.js` to handle the root route:

```javascript
// Add this before app.listen()
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
```

### Step 4: Redeploy to Amplify

1. Commit and push the updated `config/config.js`
2. Amplify will auto-deploy
3. Your app will now call the Railway API

## Alternative: Use Render.com

1. Go to https://render.com and sign up
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Settings:
   - **Name**: your-app-name
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add environment variables (same as Railway)
6. Deploy and get your URL
7. Update `config/config.js` with the Render URL

## Test Your Fix

After updating the config and redeploying:

1. Open your Amplify app
2. Open browser DevTools → Network tab
3. Try sending an email
4. You should see a successful POST to your Railway/Render URL
5. No more 301 errors!

## Why This Works

- Railway/Render runs your Express server 24/7
- Your frontend on Amplify calls the external API
- No more 301 redirects because the API actually exists
- POST requests work correctly

## Cost

- **Railway**: Free tier includes $5/month credit (plenty for this app)
- **Render**: Free tier available (may sleep after inactivity)
- **Amplify**: Free tier for static hosting

Total cost: **$0** for small projects!

