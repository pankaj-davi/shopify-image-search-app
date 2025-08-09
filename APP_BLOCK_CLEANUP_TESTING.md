# 🧪 App Block Cleanup Testing Guide

## Overview
This guide helps you test the complete app block lifecycle: adding through theme editor, verifying functionality, and testing automatic cleanup when removed.

## ✅ Testing Checklist

### Phase 1: App Block Addition & Verification

#### Step 1: Add App Block Through Theme Editor
1. **Access Theme Editor**:
   - Go to Online Store → Themes
   - Click "Customize" on your active theme
   - Navigate to where you want to add visual search (e.g., header, product page)

2. **Add Visual Search App Block**:
   - Click the "+" button to add a new block
   - Look for "Apps" section in the sidebar
   - Find "Visual Search Input Icon" and click to add it
   - The block should appear in your selected location

3. **Configure Settings**:
   - Adjust icon colors to match your theme
   - Set icon size and position preferences
   - Save and publish your changes

#### Step 2: Verify App Block Loads on Storefront
1. **Visit Your Store**:
   - Open your store in a new tab/window
   - Navigate to the page where you added the app block
   - **Expected Result**: You should see the visual search icon

2. **Check Browser Console**:
   - Open browser developer tools (F12)
   - Look for these console messages:
   ```
   [Visual Search] Unified script loaded at [timestamp]
   [Visual Search] Browser environment detected, initializing...
   [Visual Search] Static Configuration loaded: PankajTest
   [Visual Search] ✅ App blocks detected, proceeding with full initialization
   [Visual Search] 🧹 Starting cleanup monitoring system...
   [Visual Search] 🔍 App block presence check: { totalFound: 1, cleanupAttempts: 0 }
   [Visual Search] ✅ Initialization complete
   ```

3. **Test Functionality**:
   - Click the visual search icon
   - **Expected Result**: Visual search drawer should open
   - Try uploading an image
   - **Expected Result**: Drawer should process the image

#### Step 3: Verify Database Configuration
1. **Check App Admin Console**:
   - Go to your app's admin interface
   - Navigate to the preview/configuration page
   - **Expected Result**: Settings should be saved and verified

2. **Look for Console Messages**:
   ```
   [Preview Update Script] Theme config saved to database
   [Database] Configuration verification for: your-shop.myshopify.com
   [Database] ✅ Configuration saved successfully
   [Preview Update Script] ✅ Configuration saved and verified
   ```

### Phase 2: App Block Removal & Cleanup Testing

#### Step 4: Remove App Block from Theme Editor
1. **Return to Theme Editor**:
   - Go back to Online Store → Themes → Customize
   - Find the Visual Search app block you added
   - Click on the block and select "Remove" or use the trash icon
   - Save and publish your changes

#### Step 5: Verify Automatic Cleanup
1. **Check Storefront Immediately**:
   - Refresh your store page
   - **Expected Result**: Visual search icon should be gone

2. **Monitor Browser Console**:
   - Keep developer tools open
   - Watch for cleanup messages (may take 30-90 seconds):
   ```
   [Visual Search] 🔍 App block presence check: { totalFound: 0, cleanupAttempts: 1 }
   [Visual Search] ⚠️ No app blocks found, attempt: 1
   [Visual Search] ⚠️ No app blocks found, attempt: 2
   [Visual Search] ⚠️ No app blocks found, attempt: 3
   [Visual Search] 🧹 Performing cleanup - app block removed
   [Visual Search] ✅ Global styles removed
   [Visual Search] 📡 Cleanup notification sent to app
   [Visual Search] ✅ Cleanup completed successfully
   [Visual Search] 🛑 Monitoring stopped
   ```

3. **Verify Complete Resource Cleanup**:
   - Check that no visual search elements remain in the DOM
   - Verify that global styles are removed
   - Confirm that JavaScript intervals are cleared

#### Step 6: Verify Backend Notification
1. **Check App Server Logs**:
   - Look for cleanup notification in your app console:
   ```
   🧹 Cleanup notification received: {
     shop: "your-shop.myshopify.com",
     action: "app_block_removed",
     timestamp: "2025-08-06T...",
     url: "https://your-shop.myshopify.com/..."
   }
   📊 Cleanup event logged
   ```

### Phase 3: Edge Case Testing

#### Step 7: Test Theme Updates
1. **Update Theme**:
   - Make any change to your theme (add a section, change colors, etc.)
   - Save and publish
   - **Expected Result**: If app blocks are still present, no cleanup should occur

2. **Check Webhook**:
   - Look for theme update webhook logs:
   ```
   🎨 Theme update webhook received from your-shop.myshopify.com
   📝 Recording theme update event for analytics
   📊 Theme update event logged
   ```

#### Step 8: Test Multiple App Blocks
1. **Add Multiple Blocks**:
   - Add visual search blocks to different sections
   - Verify all blocks work correctly

2. **Remove Some Blocks**:
   - Remove only some blocks, leave others
   - **Expected Result**: Cleanup should NOT occur (some blocks still present)

3. **Remove All Blocks**:
   - Remove all remaining blocks
   - **Expected Result**: Cleanup should occur after all blocks are removed

## 🔍 Troubleshooting

### App Block Not Appearing
- **Check**: Theme 2.0 compatibility
- **Check**: App block properly added in theme editor
- **Check**: JavaScript is enabled in browser
- **Check**: No JavaScript errors in console

### Cleanup Not Working
- **Check**: Console for error messages
- **Check**: 30-90 second delay for cleanup detection
- **Check**: All app blocks are actually removed
- **Check**: Page was refreshed after removal

### Database Verification Failing
- **Check**: Database connection is working
- **Check**: Store exists in database
- **Check**: Theme configuration is properly structured

## 📊 Expected Performance

### Cleanup Detection Time
- **Immediate**: DOM mutation detection (if supported)
- **Regular**: 30 seconds maximum for interval-based detection
- **Navigation**: 1-2 seconds after page changes

### Resource Impact
- **Monitoring**: Minimal CPU/memory usage
- **Cleanup**: Complete resource deallocation
- **Network**: Single cleanup notification request

## ✅ Success Criteria

### App Block Addition
- [ ] App block appears in theme editor
- [ ] Icon displays on storefront
- [ ] Functionality works (drawer opens, image upload)
- [ ] Configuration saved to database
- [ ] Console shows successful initialization

### App Block Removal
- [ ] Icon disappears from storefront
- [ ] Console shows cleanup messages
- [ ] All visual search elements removed from DOM
- [ ] Global styles removed
- [ ] JavaScript resources cleaned up
- [ ] Backend receives cleanup notification
- [ ] No JavaScript errors or memory leaks

### Database Operations
- [ ] Configuration saves successfully
- [ ] Verification confirms data integrity
- [ ] Events are logged for analytics

## 🎯 Next Steps

After successful testing:
1. **Document any issues** found during testing
2. **Optimize cleanup timing** if needed
3. **Add additional monitoring** for edge cases
4. **Consider user feedback** for improvements

This testing ensures merchants can confidently add and remove visual search functionality without any residual effects on their store performance.
