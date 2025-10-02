# Visual Search Integration Guide

## Overview
This Shopify app provides visual search functionality through App Blocks integration. Store owners can add visual search through their theme editor with complete control over placement and styling.

## How It Works

### App Block Integration
- Store owners add visual search through their theme editor (Online Store → Themes → Customize)
- App blocks provide precise control over placement, styling, and behavior
- Works with all Theme 2.0 stores and provides native Shopify integration

## App Block Features

### 1. Theme Editor Integration
- Visual search appears as an app block in the theme customizer
- Store owners can place it exactly where they want
- Native Shopify 2.0 integration with all theme features

### 2. Visual Search Interface
- Clean, responsive search interface
- Camera icon that opens the visual search drawer
- Pinterest-style interface for image uploads and cropping

### 3. Image Processing Flow
1. Customer clicks the visual search button
2. Upload interface opens with camera/file options
3. Image is uploaded and processed by AI/ML services
4. Results are displayed with similar products
5. Customers can browse and purchase matching items

## Implementation

### App Block File Structure
The app block is automatically created in your theme extensions:

- **`extensions/theme-extension/blocks/visual-search-input-simple.liquid`** - The main app block file
- **`extensions/theme-extension/assets/visual-search-logo.svg`** - Visual search icon assets

### Theme 2.0 Integration
Store owners can add visual search through:
1. Online Store → Themes → Customize
2. Add Block → Apps → Visual Search
3. Configure colors, positioning, and styling
4. Save and publish

## Setup Instructions

### 1. Environment Variables
Add to your `.env` file:
```bash
SHOPIFY_APP_URL=https://your-app-domain.com
```

### 2. Image Analysis Integration
Configure your AI service in `app/routes/api.visual-search.tsx`:

#### Option A: Google Vision API
```javascript
import { ImageAnnotatorClient } from '@google-cloud/vision';

const vision = new ImageAnnotatorClient();
const [result] = await vision.labelDetection({
  image: { content: base64Image }
});
const labels = result.labelAnnotations?.map(label => label.description) || [];
return labels.slice(0, 3).join(' ');
```

#### Option B: OpenAI Vision API
```javascript
import OpenAI from 'openai';

const openai = new OpenAI();
const response = await openai.chat.completions.create({
  model: "gpt-4-vision-preview",
  messages: [{
    role: "user",
    content: [
      { type: "text", text: "Describe this product in 2-3 keywords for searching:" },
      { type: "image_url", image_url: { url: `data:${imageType};base64,${base64}` }}
    ]
  }]
});
return response.choices[0]?.message?.content || "product";
```

### 3. Testing
1. Install your app on a development store
2. Go to Online Store → Themes → Customize
3. Add the Visual Search app block to your theme
4. Test image upload and search functionality

## Benefits

### Professional Integration
✅ **Native Shopify Experience** - Uses official Theme 2.0 app blocks  
✅ **Complete Control** - Store owners choose placement and styling  
✅ **Theme Compatibility** - Works with all Theme 2.0 stores  
✅ **Performance** - No script injection overhead  
✅ **Future-Proof** - Built on Shopify's recommended architecture

### Enhanced User Experience
✅ **Responsive Design** - Works perfectly on mobile and desktop  
✅ **Accessibility** - Keyboard navigation and screen reader support  
✅ **Clean Interface** - Pinterest-style image search experience  
✅ **Fast Performance** - Optimized image processing and results display

## Best Practices

### 1. Performance
- App blocks are loaded natively by the theme
- Minimal JavaScript footprint
- Optimized image processing workflows

### 2. User Experience
- Clear visual feedback during image processing
- Intuitive cropping and selection interface
- Fast results display with product recommendations

### 3. Privacy & Security
- Images processed securely on your servers
- No permanent storage of customer images
- GDPR compliant by design

This comprehensive app block solution provides professional visual search integration that merchants can easily control and customize through their theme editor.
