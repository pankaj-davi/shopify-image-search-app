import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;
    const shop = formData.get("shop") as string || request.headers.get("shopDomainURL") || "";
    const cropData = formData.get("cropData") as string;
    const analyze = formData.get("analyze") as string;
    const search = formData.get("search") as string;

    console.log("🚀 Visual Search API Request:", {
      hasImage: !!image,
      shop,
      cropData: cropData ? JSON.parse(cropData) : null,
      analyze,
      search,
      imageSize: image?.size,
      imageType: image?.type
    });

    if (!image) {
      return json({ 
        success: false, 
        error: "Missing image parameter" 
      }, { status: 400 });
    }

    // Validate file type
    if (!image.type.startsWith("image/")) {
      return json({ 
        success: false, 
        error: "Invalid file type. Please upload an image." 
      }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (image.size > 5 * 1024 * 1024) {
      return json({ 
        success: false, 
        error: "File too large. Please upload an image under 5MB." 
      }, { status: 400 });
    }

    // Handle different request types
    if (analyze === "true") {
      // Image analysis request (immediate or cropped)
      const products = await analyzeImageForProducts(image, cropData);
      
      console.log("✅ Analysis complete:", {
        productsFound: products.length,
        cropData: cropData ? JSON.parse(cropData) : null
      });

      return json({
        success: true,
        products,
        detectedItems: products,
        shop,
        analysis: true,
        cropData: cropData ? JSON.parse(cropData) : null
      });
    } else if (search === "true") {
      // Product search request
      const searchQuery = await analyzeImage(image);
      
      return json({
        success: true,
        searchQuery,
        shop,
        search: true
      });
    } else {
      // Legacy support
      const searchQuery = await analyzeImage(image);

      return json({
        success: true,
        searchQuery,
        shop
      });
    }

  } catch (error) {
    console.error("Visual search error:", error);
    return json({ 
      success: false, 
      error: "Failed to process image" 
    }, { status: 500 });
  }
}

// Placeholder function - implement your image analysis logic
async function analyzeImage(image: File): Promise<string> {
  // Convert image to base64 for processing (when needed for ML APIs)
  // const buffer = await image.arrayBuffer();
  // const base64 = Buffer.from(buffer).toString('base64');
  
  // TODO: Replace with actual image analysis
  // Example implementations:
  
  // 1. Google Vision API
  // const vision = new ImageAnnotatorClient();
  // const [result] = await vision.labelDetection({
  //   image: { content: base64 }
  // });
  // const labels = result.labelAnnotations?.map(label => label.description) || [];
  // return labels.slice(0, 3).join(' ');
  
  // 2. OpenAI Vision API
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4-vision-preview",
  //   messages: [{
  //     role: "user",
  //     content: [
  //       { type: "text", text: "Describe this product in 2-3 keywords for searching an e-commerce store:" },
  //       { type: "image_url", image_url: { url: `data:${image.type};base64,${base64}` }}
  //     ]
  //   }]
  // });
  // return response.choices[0]?.message?.content || "product";
  
  // 3. Custom logic based on filename or mock analysis
  const filename = image.name.toLowerCase();
  
  if (filename.includes('shirt') || filename.includes('tshirt')) {
    return 'shirt clothing apparel';
  } else if (filename.includes('shoe') || filename.includes('sneaker')) {
    return 'shoes footwear sneakers';
  } else if (filename.includes('bag') || filename.includes('purse')) {
    return 'bag handbag accessories';
  } else if (filename.includes('watch')) {
    return 'watch timepiece accessories';
  } else if (filename.includes('phone') || filename.includes('mobile')) {
    return 'phone mobile electronics';
  } else {
    // Generic fallback - in real implementation, use ML
    return 'product item';
  }
}

// New function for analyzing images and returning mock product data
async function analyzeImageForProducts(image: File, cropDataString?: string): Promise<any[]> {
  const filename = image.name.toLowerCase();
  let cropInfo = "";
  
  if (cropDataString) {
    try {
      const cropData = JSON.parse(cropDataString);
      cropInfo = ` (cropped: ${Math.round(cropData.width * 100)}% x ${Math.round(cropData.height * 100)}%)`;
    } catch (e) {
      console.log("Could not parse crop data:", e);
    }
  }
  
  // Mock product detection based on filename and generate fake products
  // In a real implementation, this would use ML/AI to detect actual products
  const mockProducts = [];
  
  if (filename.includes('shirt') || filename.includes('tshirt') || filename.includes('clothing')) {
    mockProducts.push(
      {
        id: 'prod_001',
        title: `Stylish Cotton T-Shirt${cropInfo}`,
        image: 'https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_.jpg',
        price: '$24.99',
        productId: 'tshirt_001'
      },
      {
        id: 'prod_002', 
        title: `Premium Basic Tee${cropInfo}`,
        image: 'https://fakestoreapi.com/img/71YXzeOuslL._AC_UY879_.jpg',
        price: '$19.99',
        productId: 'tshirt_002'
      },
      {
        id: 'prod_003',
        title: `Casual Cotton Shirt${cropInfo}`,
        image: 'https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg',
        price: '$29.99',
        productId: 'shirt_003'
      }
    );
  } else if (filename.includes('shoe') || filename.includes('sneaker') || filename.includes('footwear')) {
    mockProducts.push(
      {
        id: 'prod_101',
        title: `Sports Sneakers${cropInfo}`,
        image: 'https://fakestoreapi.com/img/51Y5NI-I5jL._AC_UX679_.jpg',
        price: '$89.99',
        productId: 'shoes_001'
      },
      {
        id: 'prod_102',
        title: `Running Shoes${cropInfo}`,
        image: 'https://fakestoreapi.com/img/81XH0e8fefL._AC_UY879_.jpg',
        price: '$79.99',
        productId: 'shoes_002'
      }
    );
  } else if (filename.includes('bag') || filename.includes('purse') || filename.includes('backpack')) {
    mockProducts.push(
      {
        id: 'prod_201',
        title: `Leather Handbag${cropInfo}`,
        image: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg',
        price: '$59.99',
        productId: 'bag_001'
      },
      {
        id: 'prod_202',
        title: `Travel Backpack${cropInfo}`,
        image: 'https://fakestoreapi.com/img/61U7T1koQqL._AC_SX679_.jpg',
        price: '$45.99',
        productId: 'bag_002'
      }
    );
  } else {
    // Generic products for any other image
    mockProducts.push(
      {
        id: 'prod_301',
        title: `Detected Product${cropInfo}`,
        image: 'https://fakestoreapi.com/img/61IBBVJvSDL._AC_SY879_.jpg',
        price: '$39.99',
        productId: 'generic_001'
      },
      {
        id: 'prod_302',
        title: `Similar Item${cropInfo}`,
        image: 'https://fakestoreapi.com/img/71YAIFU48IL._AC_UL640_QL65_ML3_.jpg',
        price: '$49.99',
        productId: 'generic_002'
      },
      {
        id: 'prod_303',
        title: `Related Product${cropInfo}`,
        image: 'https://fakestoreapi.com/img/51eg55uWmdL._AC_UX679_.jpg',
        price: '$34.99',
        productId: 'generic_003'
      },
      {
        id: 'prod_304',
        title: `Recommended Item${cropInfo}`,
        image: 'https://fakestoreapi.com/img/61pHAEJ4NML._AC_UX679_.jpg',
        price: '$54.99',
        productId: 'generic_004'
      }
    );
  }
  
  return mockProducts;
}
