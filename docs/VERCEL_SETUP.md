# Vercel Environment Variables Setup

## Setting Admin Email for Analytics Dashboard

To access the analytics dashboard, you need to set your admin email in Vercel environment variables.

### Steps:

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com) and log in
   - Navigate to your `soulsort-ai` project

2. **Open Settings**
   - Click on your project
   - Go to **Settings** tab
   - Click on **Environment Variables** in the left sidebar

3. **Add Admin Email Variable**
   - Click **Add New** button
   - **Name**: `ADMIN_EMAILS`
   - **Value**: `husasonja@gmail.com`
   - **Environment**: Select all environments (Production, Preview, Development)
   - Click **Save**

4. **Redeploy**
   - After adding the environment variable, go to the **Deployments** tab
   - Find the latest deployment (or trigger a new one)
   - Click the **⋯** (three dots) menu
   - Select **Redeploy**
   - Or push a new commit to trigger automatic deployment

### Multiple Admin Emails

If you need multiple admin emails, separate them with commas:
```
husasonja@gmail.com,another-admin@example.com
```

### Verify Setup

1. Wait for deployment to complete
2. Visit `https://soulsortai.com/analytics`
3. You should see the analytics dashboard (may show zeros if no data yet)

### Important Notes

- Environment variables are case-sensitive
- Changes to environment variables require a redeploy to take effect
- The variable name must be exactly: `ADMIN_EMAILS`
- Make sure you're logged in with the email you set as admin

### Troubleshooting

**"Access denied" error:**
- Verify `ADMIN_EMAILS` is set correctly in Vercel
- Make sure you redeployed after adding the variable
- Check that you're logged in with the correct email
- Verify the email matches exactly (case-sensitive)

**Dashboard shows 404:**
- Wait for deployment to complete
- Check that the analytics page was built successfully
- Verify the route exists in your deployment logs




