# Visual Search Product API Documentation

## Overview
This API endpoint allows you to upload an image and receive detailed product information from your Shopify store based on visual similarity. The API integrates with an external visual search service and fetches comprehensive product details from Shopify's GraphQL API.

## Endpoint
`POST /api/product-handle`

## Request Format
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Body**: Form data with a file field named "file"
- **Authentication**: Requires valid Shopify app authentication

## Example Usage

### Using curl (within authenticated Shopify app context):
```bash
curl --location 'https://your-app.shopify.app/api/product-handle' \
--header 'Authorization: Bearer YOUR_SHOPIFY_SESSION_TOKEN' \
--form 'file=@"path/to/your/image.jpg"'
```

### Using JavaScript Fetch (recommended for testing):
```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('/api/product-handle', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Visual Search Results:', result);
```

### Using the Built-in Test Component:
The easiest way to test this API is through the Visual Search Test component available in your Shopify app:
1. Navigate to your app's main page
2. Look for the "🧪 Visual Search API Test" section
3. Upload an image and click "Test Visual Search API"
4. View the formatted response directly in the UI

## Response Format

### Success Response:
```json
{
  "result": true,
  "products": [
    {
      "id": "9135424045304",
      "available": true,
      "title": "Example T-Shirt",
      "handle": "example-shirt",
      "collection": [
        {
          "id": "123456789",
          "title": "T-Shirts",
          "handle": "t-shirts"
        }
      ],
      "currency": "USD",
      "images": [
        {
          "url": "https://cdn.shopify.com/s/files/1/0766/0742/2712/files/tshirts.jpg",
          "altText": "Example T-Shirt"
        }
      ],
      "metafields": [
        {
          "namespace": "custom",
          "key": "material",
          "value": "Cotton",
          "type": "single_line_text_field"
        }
      ],
      "price": "25.0",
      "variants": {
        "nodes": [
          {
            "id": "gid://shopify/ProductVariant/46602636198136",
            "title": "Small / Black",
            "price": "25.0",
            "availableForSale": true,
            "sku": "TS-SM-BLK",
            "image": {
              "url": "https://cdn.shopify.com/variant-image.jpg",
              "altText": "Small Black T-Shirt"
            }
          }
        ]
      },
      "description": "A comfortable cotton t-shirt",
      "vendor": "Example Brand",
      "productType": "T-Shirt",
      "totalInventory": 50
    }
  ]
}
```

### Empty Results Response:
```json
{
  "result": true,
  "products": []
}
```

### Error Response:
```json
{
  "result": false,
  "products": [],
  "error": "Error message describing what went wrong"
}
```

## How It Works

1. **Image Upload**: You upload an image file through the API endpoint
2. **Visual Search**: The image is forwarded to the external visual search service at `http://34.121.184.244:8000/search/{shop-domain}`
3. **Product ID Extraction**: The visual search service returns `shopifyProductId` values (typically ProductVariant GIDs like `gid://shopify/ProductVariant/46602636329208`)
4. **Shopify GraphQL Query**: The API fetches detailed product information using Shopify's GraphQL API
5. **Data Transformation**: Raw Shopify data is transformed into the standardized response format
6. **Response**: Returns formatted product data including images, variants, pricing, and metadata

## Visual Search Service Response Format

The external visual search API returns results in this format:
```json
{
  "results": [
    {
      "product_id": "uVcDmW8sewOHIkJUMAkE",
      "variant": true,
      "main_image": false,
      "sku": "SRT_COT_222",
      "shopifyProductId": "gid://shopify/ProductVariant/46602636329208",
      "Object Name": "Clothing"
    }
  ]
}
```

## Product vs ProductVariant Handling

The API intelligently handles both Product and ProductVariant GIDs:
- **ProductVariant GIDs**: Fetches the variant and its parent product information
- **Product GIDs**: Fetches the product and all its variants
- **Availability Logic**: 
  - For ProductVariants: Uses the variant's `availableForSale` status
  - For Products: Considers available if any variant is available for sale

## Error Handling

The API gracefully handles various error scenarios:
- **400 Bad Request**: Missing or invalid image file
- **500 Internal Server Error**: 
  - Visual search service unavailable
  - Shopify GraphQL API errors
  - Invalid product IDs
  - Authentication issues
  - Network timeouts

Common error messages:
- `"No image file provided"`
- `"Visual search API failed"`
- `"Failed to fetch product details from Shopify"`

## Rate Limits & Performance

- **Shopify GraphQL API**: Subject to standard Shopify API rate limits
- **Visual Search Service**: External service rate limits apply
- **Batch Processing**: API can handle multiple product variants in a single request
- **Timeout**: Requests may timeout if visual search service is slow

## Authentication

This API requires proper Shopify app authentication:
- Must be called from within an authenticated Shopify app context
- Session tokens are automatically handled by the Shopify app framework
- External API calls (curl) require valid Shopify session authentication

## Supported Image Formats

- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **WebP** (.webp)
- **GIF** (.gif)
- **Maximum file size**: 10MB (recommended: under 5MB for optimal performance)

## Development & Testing

### Built-in Test Interface
The easiest way to test the API is using the integrated test component:
1. Start your development server: `npm run dev`
2. Open your Shopify app
3. Navigate to the main app page
4. Use the "🧪 Visual Search API Test" section at the bottom

### Debug Logging
The API includes comprehensive logging for debugging:
- Visual search service responses
- Shopify GraphQL queries and responses
- Product transformation details
- Error stack traces

### Common Issues & Solutions

1. **GraphQL Field Errors**: 
   - ✅ Fixed: `availableForSale` field properly handled for Products vs ProductVariants

2. **No Results Returned**:
   - Check if products exist in your store
   - Verify visual search service is properly synced
   - Ensure uploaded image contains recognizable products

3. **Authentication Errors**:
   - Verify Shopify app authentication is working
   - Check session validity
   - Ensure proper app permissions

## API Integration Examples

### React Component Integration
```jsx
import { useState } from 'react';

function VisualSearchComponent() {
  const [results, setResults] = useState(null);
  
  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/product-handle', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Visual search failed:', error);
    }
  };
  
  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={(e) => handleImageUpload(e.target.files[0])} 
      />
      {results && (
        <div>
          <h3>Found {results.products?.length || 0} products</h3>
          {results.products?.map(product => (
            <div key={product.id}>
              <h4>{product.title}</h4>
              <p>Price: {product.currency} {product.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Changelog

### v1.0.0 - Initial Release
- ✅ Image upload and visual search integration
- ✅ Shopify GraphQL product fetching
- ✅ Product and ProductVariant support
- ✅ Comprehensive error handling
- ✅ Built-in test interface
- ✅ Fixed GraphQL field compatibility issues
