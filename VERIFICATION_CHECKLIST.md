# 🔍 Visual Search Verification Checklist

## Quick Verification Steps

### 1. **Install and Setup** ✅
- [ ] App installs without errors on test store
- [ ] Environment variables are configured (`SHOPIFY_APP_URL`)
- [ ] All routes are accessible (no 404 errors)

### 2. **Script Injection Verification** 🔧
- [ ] Visit: `/app/verify-integration` in your app
- [ ] Confirm "Visual Search Status" shows "ACTIVE"
- [ ] Check script details are populated correctly
- [ ] Script URL is accessible and returns JavaScript

### 3. **Frontend Testing** 🖥️
- [ ] Visit your test store's storefront
- [ ] Look for search bars (header, navigation, etc.)
- [ ] Camera icons appear inside/next to search inputs
- [ ] Icons are positioned correctly (not overlapping text)
- [ ] Icons are responsive on mobile devices

### 4. **Functionality Testing** ⚡
- [ ] Click camera icon opens file picker
- [ ] Upload an image (try different formats: JPG, PNG)
- [ ] Loading state appears during upload
- [ ] Search terms are generated and filled into search bar
- [ ] Search is triggered automatically
- [ ] Results page loads with relevant products

### 5. **Cross-Theme Testing** 🎨
Test on multiple themes to ensure universal compatibility:
- [ ] Dawn theme (Shopify 2.0)
- [ ] Debut theme (Shopify 1.0)
- [ ] At least one third-party theme
- [ ] Custom theme (if available)

### 6. **Browser Testing** 🌐
- [ ] Chrome (Desktop & Mobile)
- [ ] Safari (Desktop & iOS)
- [ ] Firefox (Desktop & Mobile)
- [ ] Edge (Desktop)

### 7. **Error Handling** ⚠️
- [ ] Invalid file types show error message
- [ ] Large files (>5MB) show error message
- [ ] Network errors are handled gracefully
- [ ] No JavaScript console errors

### 8. **Management Interface** 📊
- [ ] `/app/visual-search` shows correct status
- [ ] Manual activate/deactivate works
- [ ] `/app/testing-tools` loads without errors
- [ ] All test links work properly

### 9. **API Testing** 🔌
Use the testing tools to verify:
- [ ] Script endpoint returns valid JavaScript
- [ ] API endpoint accepts image uploads
- [ ] Configuration is properly set

### 10. **Cleanup Testing** 🧹
- [ ] Uninstall app from test store
- [ ] Verify script tags are removed
- [ ] No orphaned scripts remain in store

## Quick Commands for Verification

### Check Script Status
```bash
# Visit this URL in your app
/app/verify-integration
```

### Test Script Accessibility
```bash
# This should return JavaScript code
curl https://your-app-domain.com/visual-search-script.js
```

### Test API Endpoint
```bash
# This should return JSON response
curl -X POST https://your-app-domain.com/api/visual-search \
  -F "image=@test-image.jpg" \
  -F "shop=test-shop.myshopify.com"
```

### Browser Console Checks
```javascript
// Check if visual search is loaded
console.log(window.injectVisualSearchIcon ? 'Loaded' : 'Not loaded');

// Find search inputs
document.querySelectorAll('input[type="search"], input[name*="search"]').length;

// Find visual search icons
document.querySelectorAll('.visual-search-icon').length;
```

## Common Issues and Solutions

### ❌ Camera Icon Not Appearing
**Possible Causes:**
- Script not injected properly
- Theme uses custom search selectors
- JavaScript errors preventing execution

**Solutions:**
1. Check `/app/verify-integration` for script status
2. Use browser dev tools to check for errors
3. Try the testing bookmarklet manually

### ❌ Script Not Loading
**Possible Causes:**
- Incorrect `SHOPIFY_APP_URL` environment variable
- CORS issues
- SSL certificate problems

**Solutions:**
1. Verify app URL in environment settings
2. Check script accessibility via direct URL
3. Ensure SSL is properly configured

### ❌ Image Upload Failing
**Possible Causes:**
- API endpoint not responding
- File size/type restrictions
- Network connectivity issues

**Solutions:**
1. Test API endpoint directly
2. Check file size and format
3. Monitor network tab in browser dev tools

### ❌ Search Not Triggering
**Possible Causes:**
- Form submission handling varies by theme
- Search button selectors not found
- AJAX search implementation differences

**Solutions:**
1. Check theme's search form structure
2. Test manual form submission
3. Adjust search trigger logic if needed

## Production Deployment Checklist

### Before Going Live:
- [ ] All tests pass on development store
- [ ] Environment variables are set for production
- [ ] SSL certificate is valid and working
- [ ] Image analysis service is configured and working
- [ ] Error monitoring is set up
- [ ] Performance monitoring is configured

### After Going Live:
- [ ] Monitor app installation success rate
- [ ] Track visual search usage analytics
- [ ] Monitor for JavaScript errors
- [ ] Check customer feedback and support requests
- [ ] Verify performance impact on store speed

## Support and Troubleshooting

### Log Locations:
- **App logs:** Check your hosting platform (Heroku, Vercel, etc.)
- **Browser console:** F12 → Console tab
- **Network requests:** F12 → Network tab
- **Shopify admin:** Settings → Notifications → Webhooks

### Key Metrics to Monitor:
- Script injection success rate
- Image upload success rate
- Search conversion rate
- Error frequency
- Page load impact

### Emergency Actions:
If issues arise in production:
1. Use `/app/visual-search` to disable feature quickly
2. Check error logs for patterns
3. Roll back to previous version if necessary
4. Contact affected merchants with status updates

---

## ✅ Final Verification Confirmation

Once all checklist items are complete:

**I confirm that:**
- [ ] Visual search works on multiple themes ✅
- [ ] Icons appear automatically without merchant setup ✅
- [ ] Image uploads and search work correctly ✅
- [ ] Error handling is robust ✅
- [ ] Cleanup works properly on uninstall ✅
- [ ] App is ready for production deployment ✅

**Verified by:** ________________  
**Date:** ________________  
**Test Store:** ________________
