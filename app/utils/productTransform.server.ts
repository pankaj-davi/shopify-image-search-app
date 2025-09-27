import type { ProductData } from "../services/database.interface";

export function transformShopifyProductToFirebase(payload: any, shopDomain: string): ProductData {
  return {
    shopifyProductId: payload.id.toString(),
    title: payload.title || '',
    handle: payload.handle || '',
    status: payload.status || 'draft',
    description: payload.body_html || '',
    vendor: payload.vendor || '',
    productType: payload.product_type || '',
    tags: Array.isArray(payload.tags) ? payload.tags : (payload.tags ? payload.tags.split(', ') : []),
    onlineStoreUrl: payload.online_store_url || null,
    totalInventory: payload.variants?.reduce((sum: number, variant: any) => sum + (variant.inventory_quantity || 0), 0) || 0,
    price: payload.variants?.[0]?.price || '0.00',
    sku: payload.variants?.[0]?.sku || '',
    priceRange: {
      minVariantPrice: {
        amount: payload.variants?.reduce((min: string, variant: any) =>
          parseFloat(variant.price || '0') < parseFloat(min) ? variant.price : min,
          payload.variants[0]?.price || '0'
        ) || '0.00',
        currencyCode: 'USD' // Default, should be from shop settings
      },
      maxVariantPrice: {
        amount: payload.variants?.reduce((max: string, variant: any) =>
          parseFloat(variant.price || '0') > parseFloat(max) ? variant.price : max,
          payload.variants[0]?.price || '0'
        ) || '0.00',
        currencyCode: 'USD'
      }
    },
    featuredMedia: payload.image ? {
      mediaContentType: 'IMAGE',
      image: {
        url: payload.image.src,
        altText: payload.image.alt || payload.title || ''
      }
    } : null,
    media: payload.images?.map((image: any) => ({
      mediaContentType: 'IMAGE',
      image: {
        url: image.src,
        altText: image.alt || payload.title || '',
        width: image.width,
        height: image.height
      }
    })) || [],
    options: payload.options?.map((option: any) => ({
      name: option.name,
      values: option.values
    })) || [],
    variants: payload.variants?.map((variant: any) => ({
      id: variant.id.toString(),
      price: variant.price,
      sku: variant.sku || '',
      title: variant.title,
      availableForSale: variant.inventory_quantity > 0,
      image: variant.image_id && payload.images ? {
        url: payload.images.find((img: any) => img.id === variant.image_id)?.src || '',
        altText: payload.title || '',
        width: payload.images.find((img: any) => img.id === variant.image_id)?.width,
        height: payload.images.find((img: any) => img.id === variant.image_id)?.height
      } : null
    })) || [],
    metafields: [], // Webhooks don't include metafields by default
    shopDomain,
    createdAt: new Date(payload.created_at),
    updatedAt: new Date(payload.updated_at)
  };
}