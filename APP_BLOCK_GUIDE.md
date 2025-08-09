# App Block Integration Guide

## Overview
This guide explains how to set up Visual Search as an app block for Shopify Theme 2.0 stores, giving merchants full control over placement and styling through the theme editor.

## What Are App Blocks?
App blocks are a Theme 2.0 feature that allows merchants to add app functionality directly through the Shopify theme editor, providing:
- **Native integration** with the theme customization experience
- **Precise placement control** - merchants choose exactly where to add functionality
- **Theme-specific styling** - customizable colors, positioning, and appearance
- **Better performance** - native theme integration
- **Enhanced user experience** - seamless integration with existing theme workflow

## Installation Method

### App Block Integration
🎯 **Professional Integration** - Merchants add visual search through the theme editor
- Theme 2.0 stores only
- Merchant chooses placement
- Customizable styling options
- Native Shopify experience

## How Merchants Add App Blocks

### Step 1: Access Theme Editor
1. Go to **Online Store → Themes**
2. Click **"Customize"** on the active theme
3. Look for your app in the **"Apps"** section

### Step 2: Add Visual Search Block
1. Click the **"+"** button to add a new section or block
2. Navigate to **"Apps"** in the sidebar
3. Find **"Visual Search"** and click to add it
4. The block will appear in the selected location

### Step 3: Configure Settings
Once added, merchants can customize:
- **Icon Colors**: Change camera icon appearance
- **Primary Colors**: Adjust brand colors for buttons and highlights
- **Icon Position**: Choose left or right side placement
- **Distance from Edge**: Fine-tune icon positioning
- **Icon Size**: Adjust icon size relative to search bars

### Step 4: Save and Preview
1. Click **"Save"** to apply changes
2. Preview the storefront to see visual search in action
3. Icons will automatically appear in all search bars

## Technical Implementation

### App Block File Structure
```
blocks/
└── visual-search.liquid
```

### Schema Configuration
The app block includes these customizable settings:
- Color customization (icon colors, primary colors)
- Positioning options (left/right, offset distance)
- Size controls (icon size multiplier)
- Informational content and instructions

### Script Loading
The block automatically loads your unified visual search script with shop-specific configuration:
```liquid
<script src="{{ app.url }}/visual-search-unified.js?shop={{ shop.permanent_domain }}&t={{ 'now' | date: '%s' }}" async></script>
```

## Benefits for Merchants

### Design Control
- **Custom Colors**: Match brand colors exactly
- **Precise Placement**: Position visual search where it works best
- **Theme Integration**: Native Shopify admin experience
- **Real-time Preview**: See changes instantly in the theme editor

### Performance Benefits
- **Faster Loading**: No script injection delay
- **Better SEO**: Cleaner HTML structure
- **Reduced Conflicts**: No DOM manipulation needed
- **Theme Compatibility**: Works seamlessly with Theme 2.0

### User Experience
- **Familiar Interface**: Uses standard Shopify theme editor
- **Easy Management**: Enable/disable through theme settings
- **Consistent Styling**: Inherits theme design patterns
- **Mobile Responsive**: Automatically adapts to all screen sizes

## Merchant Instructions

### For All Shopify Stores (Theme 2.0 Compatible)
1. **Install the app** from the Shopify App Store
2. **Go to theme editor**: Online Store → Themes → Customize
3. **Add the block**: Click "+" → Apps → Visual Search
4. **Customize appearance**: Adjust colors, positioning, and size
5. **Save and test**: Visual search functionality will be available

## Support and Troubleshooting

### Common Questions

**Q: Will this work with my theme?**
A: Yes! The app block works with all Theme 2.0 stores, which includes virtually all modern Shopify themes.

**Q: What if I change themes?**
A: You'll need to re-add the app block in your new theme's editor through the theme customizer.

**Q: Can I customize the appearance?**
A: Yes! The app block includes extensive customization options for colors, positioning, and sizing.

### Getting Help
If you need assistance:
1. Check the theme editor for the Visual Search block in the Apps section
2. Review the customization options in the block settings
3. Contact support if visual search doesn't appear in search bars
4. Ensure you're using a Theme 2.0 store for app block functionality

## Migration Guide

### From Automatic Injection to App Block
1. **Keep automatic injection active** initially
2. **Add the app block** through theme editor
3. **Test functionality** on your storefront
4. **Disable automatic injection** if desired (optional)

### From App Block to Automatic Injection
1. **Enable automatic injection** in app settings
2. **Remove the app block** from theme editor if desired
3. **Visual search will continue working** automatically

Both methods can coexist, but app blocks provide enhanced control for Theme 2.0 stores.
