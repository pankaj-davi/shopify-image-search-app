# Visual Search App Blocks - Setup Guide

This Shopify app provides two ways to add visual search functionality to your theme:

## Option 1: Global Visual Search (Recommended for most stores)

**App Block:** "Visual Search"

This automatically detects and adds visual search icons to all search input fields on your store.

### How to use:
1. Go to your theme editor
2. Add the "Visual Search" app block to any section
3. Configure the settings in the theme editor
4. The visual search icon will automatically appear in all search fields

### Settings available:
- **Icon Appearance**: Colors, style, size
- **Icon Position**: Left/right side, offset distance
- **Button Colors**: Primary and hover colors
- **Advanced Settings**: Animations, file size limits
- **Search Field Targeting**: Choose which fields to target

## Option 2: Precise Input Control (Advanced users)

**App Block:** "Visual Search Input Icon"

This allows you to place a visual search icon exactly where you want it, with precise control over positioning and styling.

### How to use:
1. Identify the input field you want to target (you'll need its CSS selector)
2. Go to theme editor and add the "Visual Search Input Icon" block
3. Place the block near or inside the container of your search input
4. Configure the target input selector and positioning
5. Customize the appearance and behavior

### Key settings:
- **Target Input Selector**: CSS selector for the specific input field
- **Icon Style**: Choose from camera, search, image, or custom icons
- **Position & Layout**: Precise positioning controls
- **Background & Border**: Custom styling options
- **Interaction**: Click, hover, or focus triggers
- **Tooltip**: Optional hover tooltips

## CSS Selectors Examples

Here are common CSS selectors for popular Shopify themes:

### Dawn Theme:
- Main search: `input[name="q"]`
- Header search: `.header__search input`
- Predictive search: `.predictive-search__input`

### Debut Theme:
- Header search: `.search-bar__input`
- Page search: `#Search`

### Brooklyn Theme:
- Header search: `.site-header__search-input`
- Search page: `.search__input`

### Custom selectors:
- By ID: `#my-search-input`
- By class: `.my-search-class`
- By attribute: `[name="search"]`
- By type: `input[type="search"]`

## Configuration Tips

### For Global Setup (Option 1):
1. Use "Automatic - All search fields" for most stores
2. Use "Specific selectors only" if you want to exclude certain search fields
3. Use "Manual placement" if you're also using Option 2

### For Precise Control (Option 2):
1. Use browser developer tools to find the exact CSS selector
2. Test the selector in browser console: `document.querySelector('your-selector')`
3. Place the block close to the input field's container
4. Use "absolute" positioning for most cases
5. Adjust z-index if the icon appears behind other elements

## Responsive Design

Both blocks automatically adjust for mobile devices:
- Icons become slightly smaller on mobile
- Touch targets are optimized for mobile interaction
- Positioning adjusts for different screen sizes

## Accessibility Features

Both blocks include accessibility support:
- High contrast mode compatibility
- Reduced motion support for users with motion sensitivity
- Proper focus management for keyboard navigation
- Screen reader friendly markup

## Troubleshooting

### Icon not appearing:
1. Check the CSS selector is correct
2. Verify the input field exists on the page
3. Check z-index settings
4. Ensure the block is enabled and saved

### Icon positioning issues:
1. Try different positioning methods (absolute/relative)
2. Adjust the offset values
3. Check if parent container has position styling
4. Test responsive behavior on different screen sizes

### Performance considerations:
1. Use Global setup (Option 1) for better performance
2. Avoid multiple Input Icon blocks targeting the same field
3. Consider disabling animations on slow devices
4. Set appropriate file size limits for uploads

## Best Practices

1. **Start with Global setup** - Most stores should use Option 1 initially
2. **Test thoroughly** - Check on different devices and browsers
3. **Optimize for mobile** - Ensure touch targets are large enough
4. **Consider your theme** - Some themes may need specific selectors
5. **Monitor performance** - Watch for any impact on page load times

## Support

If you need help with CSS selectors or configuration, you can:
1. Use browser developer tools to inspect your search fields
2. Test selectors in the browser console
3. Contact support with your theme name and specific requirements
