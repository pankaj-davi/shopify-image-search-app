# Visual Search Unified Script

## 📁 Single Source of Truth

All visual search functionality has been consolidated into **one file** to make maintenance and updates easy:

```
public/visual-search-unified.js  ← MAIN FILE - Edit this for all changes
```

## 🎯 Benefits of Unified Approach

- **Single File Management**: All code, styles, and functionality in one place
- **Easy Updates**: Change colors, animations, or behavior without hunting through multiple files
- **Consistent Styling**: Pinterest-style design system built into the script
- **Configuration Control**: Centralized CONFIG object for easy customization
- **No Duplicates**: Eliminates confusion from multiple script versions
- **Smart Positioning**: Automatically avoids overlapping with existing search icons
- **Theme Customization**: Store owners can customize colors and styles
- **Multiple Icon Styles**: Google, Pinterest, Minimal, and Branded styles available

## 🔧 How to Make Changes

### 1. **Styling Changes** (Colors, Fonts, Animations)
Edit the `CONFIG.THEME` object at the top of `visual-search-unified.js`:

```javascript
const CONFIG = {
  THEME: {
    // Icon colors
    ICON_COLOR: '#5f6368',
    ICON_COLOR_HOVER: '#202124', 
    ICON_BACKGROUND_HOVER: 'rgba(95, 99, 104, 0.08)',
    
    // Brand colors
    PRIMARY_COLOR: '#E60023',
    PRIMARY_COLOR_DARK: '#BD081C',
    
    // Icon style and sizing
    ICON_STYLE: 'google', // 'google', 'minimal', 'branded'
    ICON_SIZE_MULTIPLIER: 1.0,
    ICON_POSITION: 'right',
    ICON_OFFSET: 8
  }
};
```

### 2. **UI Content Changes** (Text, Layout)
Edit the `DRAWER_TEMPLATE` constant:

```javascript
const DRAWER_TEMPLATE = `
  <!-- All HTML content for the Pinterest-style drawer -->
`;
```

### 3. **Functionality Changes** (Behavior, Logic)
Edit the main functions:
- `injectVisualSearchIcon()` - Icon injection logic with smart positioning
- `openVisualSearchDrawer()` - Drawer behavior
- `openVisualSearch()` - File upload handling

### 4. **Theme Customization** (Store Owner Level)
Store owners can customize the appearance by adding configuration to their theme:

```javascript
window.VISUAL_SEARCH_CONFIG = {
  theme: {
    iconColor: '#your-color',
    iconColorHover: '#your-hover-color',
    primaryColor: '#your-brand-color',
    iconStyle: 'google' // or 'minimal', 'branded'
  }
};
```

## 🚀 New Features

### Smart Icon Positioning
- **Overlap Prevention**: Automatically detects existing search icons and positions accordingly
- **Dynamic Padding**: Adjusts input padding to accommodate both existing and visual search icons
- **Responsive Sizing**: Icon size adapts to input field height
- **Multiple Detection Methods**: Finds existing icons using various selectors

### Theme Customization System
- **Live Preview**: See changes in real-time with the preview page
- **Multiple Presets**: Google, Pinterest, Minimal, and Brand themes
- **Custom Colors**: Full color customization for icons and branding
- **Easy Configuration**: Simple JavaScript object for theme settings

### Enhanced Icon Styles
- **Google Style**: Material Design-inspired camera icon
- **Minimal Style**: Clean, simple search + camera combination
- **Branded Style**: Custom branded icon with store colors
- **Dynamic Switching**: Icons update based on theme configuration

## 🎨 Theme Preview & Customization

Visit `/app/preview` to:
- See live preview of how icons will look on your store
- Test different color combinations and styles
- Generate configuration code for your theme
- Preview both desktop and mobile layouts

## 📱 Features

- ✅ **Pinterest-style Design**: Red gradient colors, smooth animations, modern UI
- ✅ **Smart Positioning**: Avoids overlap with existing search icons
- ✅ **Theme Customization**: Store owners can customize colors and styles
- ✅ **Multiple Icon Styles**: Google, Minimal, and Branded options
- ✅ **Mobile Responsive**: Optimized for all screen sizes
- ✅ **Universal Detection**: Works with any Shopify theme
- ✅ **Performance Optimized**: Debounced events, efficient DOM watching
- ✅ **Accessibility**: Proper ARIA labels, keyboard navigation
- ✅ **Error Handling**: Comprehensive validation and user feedback

## 🎨 Design System

The script uses a cohesive Pinterest-inspired design system:

- **Primary Color**: Configurable (default: #E60023 Pinterest Red)
- **Typography**: System fonts with proper hierarchy
- **Animations**: Smooth, purposeful micro-interactions
- **Spacing**: Consistent 8px grid system
- **Shadows**: Layered shadows for depth
- **Border Radius**: Consistent rounded corners

## 🔄 Updates Made

- **v2.1**: Added smart icon positioning to prevent overlap
- **v2.2**: Added theme customization system with live preview
- **v2.3**: Added multiple icon style options (Google, Minimal, Branded)
- **v2.4**: Enhanced responsive design and mobile optimization
- **v2.5**: Added preview page with real-time customization

## 🛠️ Testing

Test files available:
- `public/test-unified.html` - Basic functionality test
- `public/overlap-prevention-demo.html` - Smart positioning demo
- `public/icon-comparison.html` - Icon style comparison
- `/app/preview` - Live theme customization and preview

All features are tested and working across different:
- ✅ Shopify themes (Dawn, Debut, Brooklyn, etc.)
- ✅ Custom themes
- ✅ Mobile and desktop devices
- ✅ Different input field sizes and styles
- ✅ Existing search button configurations
