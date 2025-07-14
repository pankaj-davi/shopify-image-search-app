# Fix Permission Error for Visual Search

## Problem
Your app is getting the error: `Access denied for scriptTags field`

This happens because your Shopify app doesn't have the required permissions to manage Script Tags.

## Solution

### Step 1: Update App Permissions ✅ (Already Done)
The `shopify.app.toml` file has been updated to include the required scope:
```toml
scopes = "write_products,write_script_tags"
```

### Step 2: Reinstall the App
Since you've changed the app permissions, you need to reinstall it:

1. **Stop the current dev server** (Press `q` in the terminal)

2. **Restart the app with updated permissions**:
   ```bash
   npm run dev
   ```

3. **When prompted, allow the app to access Script Tags**
   - You'll see a permission request screen
   - Click "Install" to grant the new permissions

### Step 3: Verify the Fix
1. Go to the Visual Search settings page: `/app/visual-search`
2. The permission error should be gone
3. You should be able to inject/remove scripts successfully

### Alternative: Manual App Reinstall
If the automatic permission update doesn't work:

1. Go to your Shopify admin: `https://your-store.myshopify.com/admin/settings/apps`
2. Find your app and click "Uninstall"
3. Run `npm run dev` again to reinstall with new permissions

## Why This Happened
- Script Tags API requires `write_script_tags` permission
- Your app initially only had `write_products` permission
- Shopify restricts access to sensitive APIs for security

## What's Next
Once permissions are fixed, your visual search integration will:
- ✅ Automatically inject the visual search script into all stores
- ✅ Work across all Shopify themes without configuration
- ✅ Allow customers to upload images and search for similar products
