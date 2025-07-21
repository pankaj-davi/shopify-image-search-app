# Visual Search Input Selector Discovery Guide

This guide helps you find the correct CSS selectors for search input fields in your Shopify theme.

## Quick Discovery Method

1. **Open your store's search page** in a web browser
2. **Open browser developer tools** (Press F12 or right-click → Inspect)
3. **Open browser console** (Console tab in developer tools)
4. **Run this command**: `window.discoverSearchInputs()`
5. **Copy the selector** you want to use from the results

## Common Selectors by Popular Themes

### Dawn Theme (Shopify's Default)
```css
.predictive-search__input
.header__search-input
input[name="q"]
```

### Brooklyn Theme
```css
.search-bar input
#search-input
.search-bar__input
```

### Debut Theme
```css
.search-bar__input
input[name="q"]
.site-header__search-input
```

### Supply Theme
```css
.site-header__search-input
.search__input
```

### Narrative Theme
```css
.search__input
.search-bar input
```

### Minimal Theme
```css
.search-bar input
.header-search-input
```

### Venture Theme
```css
.search-bar input
.site-header__search-input
```

## Manual Discovery Steps

If the automatic discovery doesn't work, follow these steps:

1. **Go to your store** and find the search input field
2. **Right-click on the search input** and select "Inspect Element"
3. **Look for these attributes** in the highlighted HTML:
   - `id="..."` → Use `#id-name`
   - `class="..."` → Use `.class-name`
   - `name="..."` → Use `[name="name-value"]`

## Example Selectors

### By ID
```css
#search-input
#SearchInput
#header-search
```

### By Class
```css
.search-input
.search-bar__input
.predictive-search__input
.header__search-input
.site-header__search-input
```

### By Attribute
```css
input[name="q"]
input[type="search"]
input[placeholder*="Search"]
```

### Combination Selectors
```css
.header .search-input
form.search input
.search-container input[type="text"]
```

## Testing Your Selector

1. **Open browser console** on your store page
2. **Run**: `document.querySelector('YOUR_SELECTOR_HERE')`
3. **If it returns the input element**, the selector is correct
4. **If it returns null**, try a different selector

## Common Issues

### Multiple Results
If your selector matches multiple elements:
- Be more specific: `.header .search-input` instead of just `.search-input`
- Use an ID if available: `#search-input`

### No Results
If your selector doesn't match anything:
- Check spelling and case sensitivity
- Remove unnecessary spaces
- Try a broader selector first, then narrow down

## Advanced Techniques

### Find all search inputs
```javascript
document.querySelectorAll('input[type="search"], input[name*="search"], input[placeholder*="search" i]')
```

### Find input by placeholder text
```css
input[placeholder*="Search"]
input[placeholder*="search" i]  /* case insensitive */
```

### Find input within specific containers
```css
.header input[type="text"]
.search-form input
nav input
```

## Support

If you're still having trouble finding the right selector:

1. Use the automatic discovery function: `window.discoverSearchInputs()`
2. Check your theme's documentation
3. Contact your theme developer
4. Look in your theme's search template files

Remember: The selector should uniquely identify the search input field where you want the visual search icon to appear.
