import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { useState, useEffect } from "react";
import { appDatabase } from "../services/app.database.service";
import { 
  Page, 
  Card, 
  BlockStack, 
  Text, 
  Button, 
  InlineStack,
  Box,
  Banner,
  RangeSlider,
  SkeletonBodyText,
  SkeletonDisplayText,
  Tabs
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { POLARIS_THEME_PRESETS } from "../utils/theme-presets";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  // Load current theme configuration from database
  let currentThemeConfig = {};
  try {
    const shopData = await appDatabase.getStore(session.shop);
    if (shopData && shopData.themeConfig) {
      currentThemeConfig = shopData.themeConfig;
    }
  } catch (error) {
    console.error("Failed to load current theme config:", error);
  }

  // Get the actual app URL from the request or environment
  const url = new URL(request.url);
  const appUrl = process.env.SHOPIFY_APP_URL || `${url.protocol}//${url.host}`;
  
  return json({
    shop: session.shop,
    appUrl,
    currentThemeConfig
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;
  
  if (actionType === "updateLiveScript") {
    // Handle live script update action
    const themeConfig = JSON.parse(formData.get("themeConfig") as string);
    const iconPosition = formData.get("iconPosition") as string || 'right';
    const iconOffset = parseInt(formData.get("iconOffset") as string) || 8;
    const iconSize = parseFloat(formData.get("iconSize") as string) || 1.0;
    
    // Get the actual app URL from the request
    const url = new URL(request.url);
    const requestAppUrl = `${url.protocol}//${url.host}`;
    const envAppUrl = process.env.SHOPIFY_APP_URL;
    const finalAppUrl = envAppUrl || requestAppUrl;
    
    console.log("[Preview Update Script] URL debugging:", {
      envAppUrl,
      requestAppUrl,
      finalAppUrl,
      themeConfig,
      iconPosition,
      iconOffset,
      iconSize,
      shop: session.shop
    });
    
    try {
      // Combine theme configuration with positioning settings
      const fullThemeConfig = {
        ...themeConfig,
        iconPosition,
        iconOffset,
        iconSizeMultiplier: iconSize
      };
      
      // Save the configuration to database first
      const { appDatabase } = await import("../services/app.database.service");
      await appDatabase.updateStore(session.shop, { themeConfig: fullThemeConfig });
      console.log("[Preview Update Script] Theme config saved to database");
      
      // Wait a moment to ensure database transaction is complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reinject the script with new configuration
      const { ScriptInjectionService } = await import("../services/script-injection.service");
      console.log("[Preview Update Script] Starting script reinjection...");
      const scriptResult = await ScriptInjectionService.injectVisualSearchScript(admin, session.shop, finalAppUrl);
      console.log("[Preview Update Script] Script injection result:", scriptResult);
      
      if (!scriptResult.success) {
        throw new Error(scriptResult.error || "Failed to update script");
      }
      
      return json({ 
        success: true, 
        message: `🚀 Live script updated successfully! Your visual search is now using the current preview settings on your storefront. Changes should appear within a few moments. (App URL: ${finalAppUrl})`,
        themeConfig: fullThemeConfig,
        scriptStatus: scriptResult
      });
    } catch (error) {
      console.error("Failed to update live script:", error);
      return json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update live script"
      });
    }
  }
  
  // Handle regular save action (default case or "saveConfiguration")
  const themeConfig = JSON.parse(formData.get("themeConfig") as string);
  const iconPosition = formData.get("iconPosition") as string || 'right';
  const iconOffset = parseInt(formData.get("iconOffset") as string) || 8;
  const iconSize = parseFloat(formData.get("iconSize") as string) || 1.0;
  
  // Get the actual app URL from the request
  const url = new URL(request.url);
  const requestAppUrl = `${url.protocol}//${url.host}`;
  const envAppUrl = process.env.SHOPIFY_APP_URL;
  const finalAppUrl = envAppUrl || requestAppUrl;
  
  console.log("[Preview Save] Received configuration:", {
    themeConfig,
    iconPosition,
    iconOffset,
    iconSize,
    shop: session.shop,
    finalAppUrl
  });
  
  try {
    // Combine theme configuration with positioning settings
    const fullThemeConfig = {
      ...themeConfig,
      iconPosition,
      iconOffset,
      iconSizeMultiplier: iconSize
    };
    
    console.log("[Preview Save] Full theme config to save:", fullThemeConfig);
    
    // Save the complete theme configuration to the database
    const { appDatabase } = await import("../services/app.database.service");
    await appDatabase.updateStore(session.shop, { themeConfig: fullThemeConfig });
    console.log("[Preview Save] Theme config saved to database");
    
    // Wait a moment to ensure database transaction is complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify the save by reading it back
    const verifyStore = await appDatabase.getStore(session.shop);
    console.log("[Preview Save] Verification - stored config:", verifyStore?.themeConfig);
    
    // Reinject the script with new configuration
    const { ScriptInjectionService } = await import("../services/script-injection.service");
    console.log("[Preview Save] Starting script reinjection...");
    const scriptResult = await ScriptInjectionService.injectVisualSearchScript(admin, session.shop, finalAppUrl);
    console.log("[Preview Save] Script injection result:", scriptResult);
    
    if (!scriptResult.success) {
      throw new Error(scriptResult.error || "Failed to update script");
    }
    
    return json({ 
      success: true, 
      message: "✅ Theme configuration saved and applied! Your new visual search settings are now live on your storefront. Changes may take a few moments to appear.",
      themeConfig: fullThemeConfig,
      scriptStatus: scriptResult
    });
  } catch (error) {
    console.error("Failed to save theme config and update script:", error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to save configuration"
    });
  }
}

export default function PreviewPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
  const [currentTheme, setCurrentTheme] = useState(POLARIS_THEME_PRESETS.pinterest);
  const [customTheme, setCustomTheme] = useState(POLARIS_THEME_PRESETS.pinterest);
  const [iconPosition, setIconPosition] = useState<'left' | 'right'>('right');
  const [iconOffset, setIconOffset] = useState(8);
  const [iconSize, setIconSize] = useState(1.0);
  const [showColorPickers, setShowColorPickers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyingLive, setIsApplyingLive] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  // Initialize state with loaded theme configuration
  useEffect(() => {
    setIsLoading(true);
    
    if (data.currentThemeConfig && Object.keys(data.currentThemeConfig).length > 0) {
      const config = data.currentThemeConfig as any;
      
      // Update positioning values if they exist in the saved config
      if (config.iconPosition) {
        setIconPosition(config.iconPosition);
      }
      if (config.iconOffset !== undefined) {
        setIconOffset(config.iconOffset);
      }
      if (config.iconSizeMultiplier !== undefined) {
        setIconSize(config.iconSizeMultiplier);
      }
      
      // Update theme values if they exist
      const savedTheme = {
        name: "Saved Theme",
        iconColor: config.iconColor || POLARIS_THEME_PRESETS.pinterest.iconColor,
        iconColorHover: config.iconColorHover || POLARIS_THEME_PRESETS.pinterest.iconColorHover,
        iconBackgroundHover: config.iconBackgroundHover || POLARIS_THEME_PRESETS.pinterest.iconBackgroundHover,
        primaryColor: config.primaryColor || POLARIS_THEME_PRESETS.pinterest.primaryColor,
        primaryColorDark: config.primaryColorDark || POLARIS_THEME_PRESETS.pinterest.primaryColorDark
      };
      
      setCurrentTheme(savedTheme);
      setCustomTheme(savedTheme);
      
      console.log("[Preview] Loaded theme config from database:", config);
    }
    
    // Simulate loading time for better UX
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(loadingTimeout);
  }, [data.currentThemeConfig]);

  // Reset loading states when action completes
  useEffect(() => {
    if (actionData) {
      setIsSaving(false);
      setIsApplyingLive(false);
    }
  }, [actionData]);

  const resetPositioning = () => {
    setIconPosition('right');
    setIconOffset(8);
    setIconSize(1.0);
    console.log("[Preview] Reset positioning to defaults");
  };

  const handleCustomColorChange = (colorType: 'iconColor' | 'iconColorHover' | 'primaryColor', newColor: string) => {
    const updatedTheme = {
      ...customTheme,
      [colorType]: newColor,
      name: "Custom Theme"
    };
    setCustomTheme(updatedTheme);
    setCurrentTheme(updatedTheme);
  };

  const generateScriptConfig = (): string => {
    return `<!-- Add this to your theme.liquid file before closing </body> tag -->
<script>
  window.VISUAL_SEARCH_CONFIG = {
    appUrl: '${data.appUrl}',
    shopDomain: '${data.shop}',
    theme: {
      iconColor: '${currentTheme.iconColor}',
      iconColorHover: '${currentTheme.iconColorHover}',
      iconBackgroundHover: '${currentTheme.iconBackgroundHover || 'rgba(95, 99, 104, 0.08)'}',
      primaryColor: '${currentTheme.primaryColor}',
      primaryColorDark: '${currentTheme.primaryColorDark || currentTheme.primaryColor}',
      iconSizeMultiplier: ${iconSize},
      iconPosition: '${iconPosition}',
      iconOffset: ${iconOffset}
    }
  };
</script>

<!-- Load the visual search script -->
<script src="${data.appUrl}/visual-search-unified.js?shop={{ shop.permanent_domain }}&t={{ 'now' | date: '%s' }}" async></script>`;
  };

  const generateAppBlockConfig = (): string => {
    return `{%- comment -%}
  Visual Search App Block for Shopify Theme 2.0
  Save this as: blocks/visual-search.liquid in your theme
{%- endcomment -%}

<div class="visual-search-app-block" {{ block.shopify_attributes }}>
  <script>
    window.VISUAL_SEARCH_CONFIG = {
      appUrl: '${data.appUrl}',
      shopDomain: '{{ shop.permanent_domain }}',
      theme: {
        iconColor: '${currentTheme.iconColor}',
        iconColorHover: '${currentTheme.iconColorHover}',
        iconBackgroundHover: '${currentTheme.iconBackgroundHover || 'rgba(95, 99, 104, 0.08)'}',
        primaryColor: '${currentTheme.primaryColor}',
        primaryColorDark: '${currentTheme.primaryColorDark || currentTheme.primaryColor}',
        iconSizeMultiplier: ${iconSize},
        iconPosition: '${iconPosition}',
        iconOffset: ${iconOffset}
      }
    };
    
    // Load the visual search script
    if (!document.querySelector('script[src*="visual-search-unified"]')) {
      var script = document.createElement('script');
      script.src = '${data.appUrl}/visual-search-unified.js?shop={{ shop.permanent_domain }}&t=' + Date.now();
      script.async = true;
      document.head.appendChild(script);
    }
  </script>
</div>

{% schema %}
{
  "name": "Visual Search",
  "target": "section",
  "settings": [
    {
      "type": "header",
      "content": "Visual Search Configuration"
    },
    {
      "type": "paragraph",
      "content": "This block enables visual search functionality. Place it near search inputs for best results."
    },
    {
      "type": "checkbox",
      "id": "enable_visual_search",
      "label": "Enable Visual Search",
      "default": true
    }
  ]
}
{% endschema %}`;
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-fade-in {
          animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .theme-studio-content {
          transition: opacity 0.3s ease;
        }
        
        .loading-skeleton {
          background: linear-gradient(90deg, var(--p-color-bg-surface-secondary) 25%, var(--p-color-bg-surface-tertiary) 50%, var(--p-color-bg-surface-secondary) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      
      <Page>
        <TitleBar title="🎨 Visual Search Theme Studio" />
        
        <div className={isLoading ? "" : "loading-fade-in"}>
          <BlockStack gap="600">
        {/* Action Result Banner */}
        {actionData && (
          <Banner
            tone={actionData.success ? "success" : "critical"}
            title={actionData.success ? "🎉 Success!" : "⚠️ Error"}
          >
            <Text as="p" variant="bodyMd">
              {(actionData as any).message || (actionData as any).error}
            </Text>
          </Banner>
        )}

        {/* Loading State Banner */}
        {(isSaving || isApplyingLive) && !actionData && (
          <Banner tone="info" title="⏳ Processing your request...">
            <BlockStack gap="200">
              <Text as="p" variant="bodyMd">
                {isSaving && "💾 Saving your theme configuration and updating the database..."}
                {isApplyingLive && "🚀 Applying changes live to your storefront. This may take a few moments..."}
              </Text>
              <InlineStack gap="200" align="start">
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid var(--p-color-border)",
                  borderTop: "2px solid var(--p-color-text)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }} />
                <Text as="p" variant="bodySm" tone="subdued">
                  Please don't close this page until the process completes.
                </Text>
              </InlineStack>
            </BlockStack>
          </Banner>
        )}

        {/* Page Header */}
        <Card>
          <Box padding="500">
            <BlockStack gap="300">
              {isLoading ? (
                <BlockStack gap="300">
                  <SkeletonDisplayText size="large" />
                  <SkeletonBodyText lines={2} />
                  <InlineStack gap="200">
                    <div style={{ width: "100px", height: "24px", backgroundColor: "var(--p-color-bg-surface-secondary)", borderRadius: "var(--p-border-radius-100)" }} />
                    <div style={{ width: "120px", height: "24px", backgroundColor: "var(--p-color-bg-surface-secondary)", borderRadius: "var(--p-border-radius-100)" }} />
                    <div style={{ width: "90px", height: "24px", backgroundColor: "var(--p-color-bg-surface-secondary)", borderRadius: "var(--p-border-radius-100)" }} />
                    <div style={{ width: "140px", height: "24px", backgroundColor: "var(--p-color-bg-surface-secondary)", borderRadius: "var(--p-border-radius-100)" }} />
                  </InlineStack>
                </BlockStack>
              ) : (
                <>
                  <Text as="h1" variant="headingXl">Visual Search Theme Studio</Text>
                  <Text as="p" variant="bodyLg" tone="subdued">
                    Customize your visual search appearance with real-time preview and professional styling tools. 
                    Design the perfect integration for your Shopify store.
                  </Text>
                  <InlineStack gap="200">
                    <Text as="span" variant="bodyMd">🎯 Live Preview</Text>
                    <Text as="span" variant="bodyMd">🎨 Custom Colors</Text>
                    <Text as="span" variant="bodyMd">📐 Positioning</Text>
                    <Text as="span" variant="bodyMd">🚀 Instant Deployment</Text>
                  </InlineStack>
                </>
              )}
            </BlockStack>
          </Box>
        </Card>

        <InlineStack gap="600" align="start" wrap={false}>
          {/* Live Preview Section */}
          <Box width="50%" minWidth="400px">
            <Card padding="600">
              <BlockStack gap="500">
                {isLoading ? (
                  <BlockStack gap="400">
                    <SkeletonDisplayText size="medium" />
                    <SkeletonBodyText lines={2} />
                    
                    {/* Desktop Preview Skeleton */}
                    <Card background="bg-surface-secondary">
                      <Box padding="500">
                        <BlockStack gap="300">
                          <SkeletonDisplayText size="small" />
                          <SkeletonBodyText lines={1} />
                          <Box 
                            padding="400" 
                            background="bg-surface" 
                            borderRadius="300"
                            borderWidth="025"
                            borderColor="border"
                          >
                            <div style={{ 
                              height: "48px", 
                              backgroundColor: "var(--p-color-bg-surface-secondary)", 
                              borderRadius: "var(--p-border-radius-400)",
                              position: "relative"
                            }}>
                              <div style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: "24px",
                                height: "24px",
                                backgroundColor: "var(--p-color-bg-surface-tertiary)",
                                borderRadius: "var(--p-border-radius-100)"
                              }} />
                            </div>
                          </Box>
                        </BlockStack>
                      </Box>
                    </Card>
                    
                    {/* Mobile Preview Skeleton */}
                    <Card background="bg-surface-secondary">
                      <Box padding="500">
                        <BlockStack gap="300">
                          <SkeletonDisplayText size="small" />
                          <SkeletonBodyText lines={1} />
                          <Box 
                            padding="400" 
                            background="bg-surface" 
                            borderRadius="300"
                            borderWidth="025"
                            borderColor="border"
                            maxWidth="320px"
                          >
                            <div style={{ 
                              height: "40px", 
                              backgroundColor: "var(--p-color-bg-surface-secondary)", 
                              borderRadius: "var(--p-border-radius-400)",
                              position: "relative"
                            }}>
                              <div style={{
                                position: "absolute",
                                right: "8px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: "20px",
                                height: "20px",
                                backgroundColor: "var(--p-color-bg-surface-tertiary)",
                                borderRadius: "var(--p-border-radius-100)"
                              }} />
                            </div>
                          </Box>
                        </BlockStack>
                      </Box>
                    </Card>
                    
                    {/* Configuration Summary Skeleton */}
                    <Card>
                      <Box padding="500">
                        <BlockStack gap="400">
                          <SkeletonDisplayText size="small" />
                          <SkeletonBodyText lines={1} />
                          
                          {[1,2,3].map(i => (
                            <InlineStack key={i} gap="400" align="space-between">
                              <SkeletonBodyText lines={1} />
                              <InlineStack gap="200">
                                <div style={{ width: "32px", height: "20px", backgroundColor: "var(--p-color-bg-surface-secondary)", borderRadius: "var(--p-border-radius-100)" }} />
                                <SkeletonBodyText lines={1} />
                              </InlineStack>
                            </InlineStack>
                          ))}
                          
                          <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                            <SkeletonBodyText lines={2} />
                          </Box>
                        </BlockStack>
                      </Box>
                    </Card>
                  </BlockStack>
                ) : (
                  <>
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingLg">Live Preview</Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        See how your visual search icon will appear in search bars
                      </Text>
                    </BlockStack>
                
                {/* Desktop Search Bar Demo */}
                <Card background="bg-surface-secondary">
                  <Box padding="500">
                    <BlockStack gap="300">
                      <BlockStack gap="100">
                        <Text as="h3" variant="headingMd">Desktop Search Bar</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          How the visual search icon appears on desktop devices
                        </Text>
                      </BlockStack>
                      <Box 
                        padding="400" 
                        background="bg-surface" 
                        borderRadius="300"
                        borderWidth="025"
                        borderColor="border"
                      >
                        <Box position="relative">
                          <input 
                            type="search" 
                            placeholder="Search products..." 
                            style={{
                              width: "100%",
                              padding: iconPosition === 'left' 
                                ? `12px 16px 12px ${50 + iconOffset}px`
                                : `12px ${50 + iconOffset}px 12px 16px`,
                              border: "var(--p-border-width-025) solid var(--p-color-border)",
                              borderRadius: "var(--p-border-radius-400)",
                              fontSize: "16px",
                              outline: "none",
                              boxSizing: "border-box",
                              backgroundColor: "var(--p-color-bg-surface)"
                            }}
                          />
                          <div 
                            style={{
                              position: "absolute",
                              top: "50%",
                              [iconPosition]: `${iconOffset + 4}px`,
                              [iconPosition === 'left' ? 'right' : 'left']: 'auto',
                              transform: "translateY(-50%)",
                              width: `${24 * iconSize}px`,
                              height: `${24 * iconSize}px`,
                              cursor: "pointer",
                              opacity: "0.7",
                              color: currentTheme.iconColor,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "var(--p-border-radius-050)",
                              transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = "1";
                              e.currentTarget.style.backgroundColor = currentTheme.iconBackgroundHover;
                              e.currentTarget.style.borderRadius = "50%";
                              e.currentTarget.style.color = currentTheme.iconColorHover;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = "0.7";
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.borderRadius = "var(--p-border-radius-050)";
                              e.currentTarget.style.color = currentTheme.iconColor;
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={`${20 * iconSize}`} height={`${20 * iconSize}`}>
                              <path d="M9 2l.75 3h4.5L15 2z" fill="currentColor" opacity="0.8"/>
                              <rect x="2" y="6" width="20" height="12" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.8"/>
                              <rect x="3" y="7" width="18" height="10" rx="1" ry="1" fill="currentColor" opacity="0.1"/>
                              <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8"/>
                              <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3"/>
                              <circle cx="17" cy="9" r="0.8" fill="currentColor"/>
                            </svg>
                          </div>
                        </Box>
                      </Box>
                    </BlockStack>
                  </Box>
                </Card>

                {/* Mobile Search Demo */}
                <Card background="bg-surface-secondary">
                  <Box padding="500">
                    <BlockStack gap="300">
                      <BlockStack gap="100">
                        <Text as="h3" variant="headingMd">Mobile Search Bar</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          How the visual search icon appears on mobile devices
                        </Text>
                      </BlockStack>
                      <Box 
                        padding="400" 
                        background="bg-surface" 
                        borderRadius="300"
                        borderWidth="025"
                        borderColor="border"
                        maxWidth="320px"
                      >
                        <Box position="relative">
                          <input 
                            type="search" 
                            placeholder="Search..." 
                            style={{
                              width: "100%",
                              padding: iconPosition === 'left' 
                                ? `10px 12px 10px ${40 + iconOffset}px`
                                : `10px ${40 + iconOffset}px 10px 12px`,
                              border: "var(--p-border-width-025) solid var(--p-color-border)",
                              borderRadius: "var(--p-border-radius-400)",
                              fontSize: "14px",
                              outline: "none",
                              boxSizing: "border-box",
                              backgroundColor: "var(--p-color-bg-surface)"
                            }}
                          />
                          <div 
                            style={{
                              position: "absolute",
                              top: "50%",
                              [iconPosition]: `${iconOffset}px`,
                              transform: "translateY(-50%)",
                              width: `${20 * iconSize}px`,
                              height: `${20 * iconSize}px`,
                              cursor: "pointer",
                              opacity: "0.7",
                              color: currentTheme.iconColor,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={`${16 * iconSize}`} height={`${16 * iconSize}`}>
                              <path d="M9 2l.75 3h4.5L15 2z" fill="currentColor" opacity="0.8"/>
                              <rect x="2" y="6" width="20" height="12" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.8"/>
                              <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8"/>
                              <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3"/>
                              <circle cx="17" cy="9" r="0.8" fill="currentColor"/>
                            </svg>
                          </div>
                        </Box>
                      </Box>
                    </BlockStack>
                  </Box>
                </Card>

                {/* Theme Configuration Summary */}
                <Card>
                  <Box padding="500">
                    <BlockStack gap="400">
                      <BlockStack gap="100">
                        <Text as="h3" variant="headingMd">Current Configuration</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Active theme settings and positioning
                        </Text>
                      </BlockStack>
                      
                      <BlockStack gap="300">
                        <InlineStack gap="400" align="space-between" wrap={false}>
                          <Text as="p" variant="bodyMd" fontWeight="medium">
                            Icon Color
                          </Text>
                          <InlineStack gap="200" align="center">
                            <Box
                              background="bg-surface"
                              borderRadius="200"
                              borderWidth="025"
                              borderColor="border"
                              padding="100"
                            >
                              <div
                                style={{
                                  backgroundColor: currentTheme.iconColor,
                                  borderRadius: "var(--p-border-radius-100)",
                                  width: "32px",
                                  height: "20px",
                                  minWidth: "32px",
                                  minHeight: "20px"
                                }}
                              />
                            </Box>
                            <Text as="span" variant="bodyMd" tone="subdued">
                              <span style={{ fontFamily: "monospace" }}>{currentTheme.iconColor}</span>
                            </Text>
                          </InlineStack>
                        </InlineStack>
                        
                        <InlineStack gap="400" align="space-between" wrap={false}>
                          <Text as="p" variant="bodyMd" fontWeight="medium">
                            Hover Color
                          </Text>
                          <InlineStack gap="200" align="center">
                            <Box
                              background="bg-surface"
                              borderRadius="200"
                              borderWidth="025"
                              borderColor="border"
                              padding="100"
                            >
                              <div
                                style={{
                                  backgroundColor: currentTheme.iconColorHover,
                                  borderRadius: "var(--p-border-radius-100)",
                                  width: "32px",
                                  height: "20px",
                                  minWidth: "32px",
                                  minHeight: "20px"
                                }}
                              />
                            </Box>
                            <Text as="span" variant="bodyMd" tone="subdued">
                              <span style={{ fontFamily: "monospace" }}>{currentTheme.iconColorHover}</span>
                            </Text>
                          </InlineStack>
                        </InlineStack>
                        
                        <InlineStack gap="400" align="space-between" wrap={false}>
                          <Text as="p" variant="bodyMd" fontWeight="medium">
                            Brand Color
                          </Text>
                          <InlineStack gap="200" align="center">
                            <Box
                              background="bg-surface"
                              borderRadius="200"
                              borderWidth="025"
                              borderColor="border"
                              padding="100"
                            >
                              <div
                                style={{
                                  backgroundColor: currentTheme.primaryColor,
                                  borderRadius: "var(--p-border-radius-100)",
                                  width: "32px",
                                  height: "20px",
                                  minWidth: "32px",
                                  minHeight: "20px"
                                }}
                              />
                            </Box>
                            <Text as="span" variant="bodyMd" tone="subdued">
                              <span style={{ fontFamily: "monospace" }}>{currentTheme.primaryColor}</span>
                            </Text>
                          </InlineStack>
                        </InlineStack>
                        
                        <Box 
                          background="bg-surface-secondary" 
                          padding="400" 
                          borderRadius="200"
                        >
                          <BlockStack gap="200">
                            <InlineStack gap="400" align="space-between">
                              <Text as="p" variant="bodyMd" fontWeight="medium">
                                Position
                              </Text>
                              <Text as="p" variant="bodyMd" tone="subdued">
                                {iconPosition} side, {iconOffset}px offset
                              </Text>
                            </InlineStack>
                            <InlineStack gap="400" align="space-between">
                              <Text as="p" variant="bodyMd" fontWeight="medium">
                                Icon Size
                              </Text>
                              <Text as="p" variant="bodyMd" tone="subdued">
                                {(iconSize * 100).toFixed(0)}% scale
                              </Text>
                            </InlineStack>
                          </BlockStack>
                        </Box>
                      </BlockStack>
                    </BlockStack>
                  </Box>
                </Card>
                  </>
                )}
              </BlockStack>
            </Card>
          </Box>
          
          {/* Theme Customization Section */}
          <Box width="50%" minWidth="400px">
            <Card padding="600">
              <BlockStack gap="500">
                {isLoading ? (
                  <BlockStack gap="400">
                    <SkeletonDisplayText size="medium" />
                    <SkeletonBodyText lines={2} />
                    
                    {/* Preset Themes Skeleton */}
                    <Card background="bg-surface-secondary">
                      <Box padding="400">
                        <BlockStack gap="300">
                          <SkeletonDisplayText size="small" />
                          <SkeletonBodyText lines={1} />
                          <InlineStack gap="200">
                            {[1,2,3,4].map(i => (
                              <Box key={i} minWidth="80px" minHeight="36px" background="bg-surface" borderRadius="200">
                                <SkeletonBodyText lines={1} />
                              </Box>
                            ))}
                          </InlineStack>
                        </BlockStack>
                      </Box>
                    </Card>
                    
                    {/* Custom Colors Skeleton */}
                    <Card background="bg-surface-secondary">
                      <Box padding="400">
                        <BlockStack gap="400">
                          <SkeletonDisplayText size="small" />
                          <SkeletonBodyText lines={1} />
                          
                          {[1,2,3].map(i => (
                            <Card key={i}>
                              <Box padding="400">
                                <BlockStack gap="300">
                                  <SkeletonDisplayText size="small" />
                                  <InlineStack gap="300">
                                    <div style={{ width: "40px", height: "40px", backgroundColor: "var(--p-color-bg-surface)", borderRadius: "var(--p-border-radius-200)" }} />
                                    <div style={{ width: "80px", height: "40px", backgroundColor: "var(--p-color-bg-surface)", borderRadius: "var(--p-border-radius-200)" }} />
                                    <BlockStack gap="100">
                                      <SkeletonBodyText lines={1} />
                                      <SkeletonBodyText lines={1} />
                                    </BlockStack>
                                  </InlineStack>
                                </BlockStack>
                              </Box>
                            </Card>
                          ))}
                        </BlockStack>
                      </Box>
                    </Card>
                    
                    {/* Position & Size Skeleton */}
                    <Card background="bg-surface-secondary">
                      <Box padding="400">
                        <BlockStack gap="400">
                          <SkeletonDisplayText size="small" />
                          <SkeletonBodyText lines={1} />
                          
                          {[1,2,3,4].map(i => (
                            <Card key={i}>
                              <Box padding="400">
                                <SkeletonBodyText lines={2} />
                              </Box>
                            </Card>
                          ))}
                        </BlockStack>
                      </Box>
                    </Card>
                    
                    {/* Action Buttons Skeleton */}
                    <Card>
                      <Box padding="500">
                        <BlockStack gap="400">
                          <SkeletonDisplayText size="small" />
                          <SkeletonBodyText lines={1} />
                          
                          <BlockStack gap="300">
                            <Box minHeight="48px" background="bg-surface" borderRadius="200">
                              <SkeletonBodyText lines={1} />
                            </Box>
                            <Box minHeight="48px" background="bg-surface" borderRadius="200">
                              <SkeletonBodyText lines={1} />
                            </Box>
                          </BlockStack>
                        </BlockStack>
                      </Box>
                    </Card>
                  </BlockStack>
                ) : (
                  <>
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingLg">Theme Customization</Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Customize colors, positioning, and sizing to match your brand
                      </Text>
                    </BlockStack>
                
                {/* Custom Colors Section */}
                <Card background="bg-surface-secondary">
                  <Box padding="400">
                    <BlockStack gap="400">
                      <BlockStack gap="100">
                        <Text as="h3" variant="headingMd">Custom Colors</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Fine-tune colors to perfectly match your store's branding
                        </Text>
                      </BlockStack>
                      
                      <BlockStack gap="400">
                        <Card>
                          <Box padding="400">
                            <BlockStack gap="300">
                              <Text as="h4" variant="headingSm">Icon Color</Text>
                              <InlineStack gap="300" align="start" wrap={false}>
                                <Box
                                  borderRadius="200"
                                  borderWidth="025"
                                  borderColor="border"
                                  padding="100"
                                  background="bg-surface"
                                >
                                  <div
                                    style={{
                                      backgroundColor: customTheme.iconColor,
                                      borderRadius: "var(--p-border-radius-100)",
                                      width: "40px",
                                      height: "40px",
                                      cursor: "pointer"
                                    }}
                                    onClick={() => setShowColorPickers(!showColorPickers)}
                                  />
                                </Box>
                                <input
                                  type="color"
                                  value={customTheme.iconColor}
                                  onChange={(e) => handleCustomColorChange('iconColor', e.target.value)}
                                  style={{
                                    border: "var(--p-border-width-025) solid var(--p-color-border)",
                                    borderRadius: "var(--p-border-radius-200)",
                                    padding: "var(--p-space-200)",
                                    backgroundColor: "var(--p-color-bg-surface)",
                                    cursor: "pointer",
                                    width: "80px",
                                    height: "40px"
                                  }}
                                />
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodyMd" fontWeight="medium">
                                    Hex Value
                                  </Text>
                                  <Text as="p" variant="bodyMd" tone="subdued">
                                    <span style={{ fontFamily: "monospace" }}>{customTheme.iconColor}</span>
                                  </Text>
                                </BlockStack>
                              </InlineStack>
                            </BlockStack>
                          </Box>
                        </Card>

                        <Card>
                          <Box padding="400">
                            <BlockStack gap="300">
                              <Text as="h4" variant="headingSm">Hover Color</Text>
                              <InlineStack gap="300" align="start" wrap={false}>
                                <Box
                                  borderRadius="200"
                                  borderWidth="025"
                                  borderColor="border"
                                  padding="100"
                                  background="bg-surface"
                                >
                                  <div
                                    style={{
                                      backgroundColor: customTheme.iconColorHover,
                                      borderRadius: "var(--p-border-radius-100)",
                                      width: "40px",
                                      height: "40px",
                                      cursor: "pointer"
                                    }}
                                  />
                                </Box>
                                <input
                                  type="color"
                                  value={customTheme.iconColorHover}
                                  onChange={(e) => handleCustomColorChange('iconColorHover', e.target.value)}
                                  style={{
                                    border: "var(--p-border-width-025) solid var(--p-color-border)",
                                    borderRadius: "var(--p-border-radius-200)",
                                    padding: "var(--p-space-200)",
                                    backgroundColor: "var(--p-color-bg-surface)",
                                    cursor: "pointer",
                                    width: "80px",
                                    height: "40px"
                                  }}
                                />
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodyMd" fontWeight="medium">
                                    Hex Value
                                  </Text>
                                  <Text as="p" variant="bodyMd" tone="subdued">
                                    <span style={{ fontFamily: "monospace" }}>{customTheme.iconColorHover}</span>
                                  </Text>
                                </BlockStack>
                              </InlineStack>
                            </BlockStack>
                          </Box>
                        </Card>

                        <Card>
                          <Box padding="400">
                            <BlockStack gap="300">
                              <Text as="h4" variant="headingSm">Brand Color</Text>
                              <InlineStack gap="300" align="start" wrap={false}>
                                <Box
                                  borderRadius="200"
                                  borderWidth="025"
                                  borderColor="border"
                                  padding="100"
                                  background="bg-surface"
                                >
                                  <div
                                    style={{
                                      backgroundColor: customTheme.primaryColor,
                                      borderRadius: "var(--p-border-radius-100)",
                                      width: "40px",
                                      height: "40px",
                                      cursor: "pointer"
                                    }}
                                  />
                                </Box>
                                <input
                                  type="color"
                                  value={customTheme.primaryColor}
                                  onChange={(e) => handleCustomColorChange('primaryColor', e.target.value)}
                                  style={{
                                    border: "var(--p-border-width-025) solid var(--p-color-border)",
                                    borderRadius: "var(--p-border-radius-200)",
                                    padding: "var(--p-space-200)",
                                    backgroundColor: "var(--p-color-bg-surface)",
                                    cursor: "pointer",
                                    width: "80px",
                                    height: "40px"
                                  }}
                                />
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodyMd" fontWeight="medium">
                                    Hex Value
                                  </Text>
                                  <Text as="p" variant="bodyMd" tone="subdued">
                                    <span style={{ fontFamily: "monospace" }}>{customTheme.primaryColor}</span>
                                  </Text>
                                </BlockStack>
                              </InlineStack>
                            </BlockStack>
                          </Box>
                        </Card>
                      </BlockStack>
                    </BlockStack>
                  </Box>
                </Card>

                {/* Position & Size Controls */}
                <Card background="bg-surface-secondary">
                  <Box padding="400">
                    <BlockStack gap="400">
                      <BlockStack gap="100">
                        <Text as="h3" variant="headingMd">Position & Size</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Control where the visual search icon appears and how large it displays
                        </Text>
                      </BlockStack>
                      
                      <BlockStack gap="400">
                        <Card>
                          <Box padding="400">
                            <BlockStack gap="300">
                              <Text as="h4" variant="headingSm">Icon Position</Text>
                              <InlineStack gap="300">
                                <Button
                                  onClick={() => setIconPosition('left')}
                                  variant={iconPosition === 'left' ? "primary" : "secondary"}
                                  size="large"
                                >
                                  📍 Left Side
                                </Button>
                                <Button
                                  onClick={() => setIconPosition('right')}
                                  variant={iconPosition === 'right' ? "primary" : "secondary"}
                                  size="large"
                                >
                                  📍 Right Side
                                </Button>
                              </InlineStack>
                            </BlockStack>
                          </Box>
                        </Card>

                        <Card>
                          <Box padding="400">
                            <BlockStack gap="300">
                              <BlockStack gap="100">
                                <Text as="h4" variant="headingSm">Edge Distance</Text>
                                <Text as="p" variant="bodyMd" tone="subdued">
                                  How far from the search bar edge: {iconOffset}px
                                </Text>
                              </BlockStack>
                              <RangeSlider
                                label=""
                                value={iconOffset}
                                min={4}
                                max={20}
                                onChange={(value) => setIconOffset(Array.isArray(value) ? value[0] : value)}
                              />
                            </BlockStack>
                          </Box>
                        </Card>

                        <Card>
                          <Box padding="400">
                            <BlockStack gap="300">
                              <BlockStack gap="100">
                                <Text as="h4" variant="headingSm">Icon Size</Text>
                                <Text as="p" variant="bodyMd" tone="subdued">
                                  Scale multiplier: {(iconSize * 100).toFixed(0)}%
                                </Text>
                              </BlockStack>
                              <RangeSlider
                                label=""
                                value={iconSize}
                                min={0.8}
                                max={1.4}
                                step={0.1}
                                onChange={(value) => setIconSize(Array.isArray(value) ? value[0] : value)}
                              />
                            </BlockStack>
                          </Box>
                        </Card>

                        <Card>
                          <Box padding="400">
                            <InlineStack gap="200" align="center">
                              <Button
                                onClick={resetPositioning}
                                variant="tertiary"
                                tone="critical"
                                size="large"
                              >
                                🔄 Reset to Defaults
                              </Button>
                              <Text as="p" variant="bodyMd" tone="subdued">
                                Restore original positioning settings
                              </Text>
                            </InlineStack>
                          </Box>
                        </Card>
                      </BlockStack>
                    </BlockStack>
                  </Box>
                </Card>

                {/* Action Buttons */}
                <Card>
                  <Box padding="500">
                    <BlockStack gap="400">
                      <BlockStack gap="100">
                        <Text as="h3" variant="headingMd">Apply Changes</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Save your customizations and deploy them to your storefront
                        </Text>
                      </BlockStack>
                      
                      <BlockStack gap="300">
                        <Form method="post" onSubmit={() => setIsSaving(true)}>
                          <input type="hidden" name="actionType" value="saveConfiguration" />
                          <input type="hidden" name="themeConfig" value={JSON.stringify(customTheme)} />
                          <input type="hidden" name="iconPosition" value={iconPosition} />
                          <input type="hidden" name="iconOffset" value={iconOffset} />
                          <input type="hidden" name="iconSize" value={iconSize} />
                          <Button
                            submit
                            variant="primary"
                            size="large"
                            fullWidth
                            loading={isSaving}
                          >
                            {isSaving ? "Saving Configuration..." : "💾 Save Theme Configuration"}
                          </Button>
                        </Form>
                        
                        <Form method="post" onSubmit={() => setIsApplyingLive(true)}>
                          <input type="hidden" name="actionType" value="updateLiveScript" />
                          <input type="hidden" name="themeConfig" value={JSON.stringify(customTheme)} />
                          <input type="hidden" name="iconPosition" value={iconPosition} />
                          <input type="hidden" name="iconOffset" value={iconOffset} />
                          <input type="hidden" name="iconSize" value={iconSize} />
                          <Button
                            submit
                            variant="secondary"
                            size="large"
                            fullWidth
                            tone="success"
                            loading={isApplyingLive}
                          >
                            {isApplyingLive ? "Applying Changes..." : "🚀 Apply Settings Live Now"}
                          </Button>
                        </Form>
                        
                        <Box 
                          background="bg-surface-secondary" 
                          padding="300" 
                          borderRadius="200"
                        >
                          <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                            💡 <Text as="span" fontWeight="medium">"Save"</Text> stores settings for future use • <Text as="span" fontWeight="medium">"Apply Live"</Text> immediately updates your storefront
                          </Text>
                        </Box>
                      </BlockStack>
                    </BlockStack>
                  </Box>
                </Card>
                  </>
                )}
              </BlockStack>
            </Card>
          </Box>
        </InlineStack>

        {/* Implementation Guide with Tabs */}
        <Card padding="600">
          <BlockStack gap="500">
            {isLoading ? (
              <BlockStack gap="300">
                <SkeletonDisplayText size="medium" />
                <SkeletonBodyText lines={2} />
                <InlineStack gap="400">
                  <Box width="50%">
                    <Card background="bg-surface-secondary">
                      <Box padding="400">
                        <SkeletonBodyText lines={5} />
                      </Box>
                    </Card>
                  </Box>
                  <Box width="50%">
                    <Card background="bg-surface-secondary">
                      <Box padding="400">
                        <SkeletonBodyText lines={5} />
                      </Box>
                    </Card>
                  </Box>
                </InlineStack>
              </BlockStack>
            ) : (
              <>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingLg">Installation Guide</Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Choose your preferred integration method for visual search
                  </Text>
                </BlockStack>

                <Tabs
                  tabs={[
                    {
                      id: 'automatic',
                      content: '🚀 Easy Setup',
                      accessibilityLabel: 'Easy setup tab',
                    },
                    {
                      id: 'manual',
                      content: '�️ Advanced Options',
                      accessibilityLabel: 'Advanced options tab',
                    },
                  ]}
                  selected={selectedTab}
                  onSelect={setSelectedTab}
                >
                  {selectedTab === 0 && (
                    <Box paddingBlockStart="500">
                      <BlockStack gap="500">
                        {/* Easy Setup - Main Option */}
                        <Card background="bg-surface-success">
                          <Box padding="500">
                            <BlockStack gap="400">
                              <InlineStack gap="300" align="start">
                                <Text as="span" variant="headingXl">🚀</Text>
                                <BlockStack gap="100">
                                  <Text as="h3" variant="headingXl">One-Click Setup</Text>
                                  <Text as="p" variant="bodyLg" fontWeight="medium" tone="success">
                                    ✅ Recommended • Works with any theme
                                  </Text>
                                </BlockStack>
                              </InlineStack>
                              
                              <Text as="p" variant="bodyLg">
                                Your custom design will automatically appear on your store. 
                                No technical skills required!
                              </Text>
                              
                              <InlineStack gap="400" wrap>
                                <InlineStack gap="200" align="center">
                                  <Text as="span" variant="headingMd">⚡</Text>
                                  <Text as="p" variant="bodyMd" fontWeight="medium">
                                    Works instantly
                                  </Text>
                                </InlineStack>
                                <InlineStack gap="200" align="center">
                                  <Text as="span" variant="headingMd">🔄</Text>
                                  <Text as="p" variant="bodyMd" fontWeight="medium">
                                    Updates automatically
                                  </Text>
                                </InlineStack>
                                <InlineStack gap="200" align="center">
                                  <Text as="span" variant="headingMd">🛡️</Text>
                                  <Text as="p" variant="bodyMd" fontWeight="medium">
                                    Safe & secure
                                  </Text>
                                </InlineStack>
                              </InlineStack>
                            </BlockStack>
                          </Box>
                        </Card>

                        {/* Simple 2-Step Process */}
                        <Card>
                          <Box padding="500">
                            <BlockStack gap="500">
                              <Text as="h4" variant="headingLg">How it works:</Text>
                              
                              <BlockStack gap="400">
                                {/* Step 1 */}
                                <InlineStack gap="400" align="start">
                                  <Box
                                    background="bg-fill-brand"
                                    borderRadius="full"
                                    minWidth="48px"
                                    minHeight="48px"
                                    padding="300"
                                  >
                                    <Text as="span" variant="headingMd" fontWeight="bold" tone="text-inverse" alignment="center">
                                      1
                                    </Text>
                                  </Box>
                                  <BlockStack gap="200">
                                    <Text as="p" variant="headingMd" fontWeight="semibold">
                                      Save your design
                                    </Text>
                                    <Text as="p" variant="bodyLg" tone="subdued">
                                      Click the "💾 Save Theme Configuration" button above to store your custom colors and settings.
                                    </Text>
                                  </BlockStack>
                                </InlineStack>

                                {/* Step 2 */}
                                <InlineStack gap="400" align="start">
                                  <Box
                                    background="bg-fill-brand"
                                    borderRadius="full"
                                    minWidth="48px"
                                    minHeight="48px"
                                    padding="300"
                                  >
                                    <Text as="span" variant="headingMd" fontWeight="bold" tone="text-inverse" alignment="center">
                                      2
                                    </Text>
                                  </Box>
                                  <BlockStack gap="200">
                                    <Text as="p" variant="headingMd" fontWeight="semibold">
                                      Activate on your store
                                    </Text>
                                    <Text as="p" variant="bodyLg" tone="subdued">
                                      Click "� Apply Settings Live Now" to make visual search appear on your storefront with your custom design.
                                    </Text>
                                  </BlockStack>
                                </InlineStack>
                              </BlockStack>

                              <Box background="bg-surface-secondary" padding="400" borderRadius="300">
                                <InlineStack gap="300" align="center">
                                  <Text as="span" variant="headingMd">💡</Text>
                                  <Text as="p" variant="bodyMd">
                                    <Text as="span" fontWeight="semibold">That's it!</Text> Visual search will automatically appear in your search bars. 
                                    No code editing or theme modifications needed.
                                  </Text>
                                </InlineStack>
                              </Box>
                            </BlockStack>
                          </Box>
                        </Card>

                        {/* FAQ Section */}
                        <Card>
                          <Box padding="500">
                            <BlockStack gap="400">
                              <Text as="h4" variant="headingMd">❓ Common Questions</Text>
                              
                              <BlockStack gap="300">
                                <BlockStack gap="200">
                                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                                    Will this work with my theme?
                                  </Text>
                                  <Text as="p" variant="bodyMd" tone="subdued">
                                    Yes! Our automatic setup works with all Shopify themes, including custom themes.
                                  </Text>
                                </BlockStack>

                                <BlockStack gap="200">
                                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                                    Can I change the design later?
                                  </Text>
                                  <Text as="p" variant="bodyMd" tone="subdued">
                                    Absolutely! Just come back to this page, adjust your settings, and apply them again.
                                  </Text>
                                </BlockStack>

                                <BlockStack gap="200">
                                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                                    What if I need help?
                                  </Text>
                                  <Text as="p" variant="bodyMd" tone="subdued">
                                    Our support team is here to help! Contact us if you have any questions.
                                  </Text>
                                </BlockStack>
                              </BlockStack>
                            </BlockStack>
                          </Box>
                        </Card>
                      </BlockStack>
                    </Box>
                  )}

                  {selectedTab === 1 && (
                    <Box paddingBlockStart="500">
                      <BlockStack gap="500">
                        {/* Advanced Options Header */}
                        <Card background="bg-surface-secondary">
                          <Box padding="500">
                            <BlockStack gap="300">
                              <InlineStack gap="300" align="start">
                                <Text as="span" variant="headingLg">�️</Text>
                                <BlockStack gap="100">
                                  <Text as="h3" variant="headingLg">Advanced Integration</Text>
                                  <Text as="p" variant="bodyMd" fontWeight="medium">
                                    For developers and technical users
                                  </Text>
                                </BlockStack>
                              </InlineStack>
                              
                              <Text as="p" variant="bodyLg">
                                Need more control? These options are for stores with custom requirements or developer teams.
                              </Text>
                            </BlockStack>
                          </Box>
                        </Card>

                        {/* App Block Option */}
                        <Card>
                          <Box padding="500">
                            <BlockStack gap="400">
                              <InlineStack gap="300" align="start">
                                <Text as="span" variant="headingLg">🎯</Text>
                                <BlockStack gap="100">
                                  <Text as="h4" variant="headingLg">Theme Editor Integration</Text>
                                  <Text as="p" variant="bodyMd" fontWeight="medium" tone="success">
                                    Recommended for Theme 2.0 stores
                                  </Text>
                                </BlockStack>
                              </InlineStack>
                              
                              <Text as="p" variant="bodyLg">
                                Add visual search as a block in your theme editor for precise placement control.
                              </Text>
                              
                              <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                                <BlockStack gap="300">
                                  <Text as="h5" variant="headingMd">Simple steps:</Text>
                                  <BlockStack gap="200">
                                    <Text as="p" variant="bodyMd">
                                      1. Go to <Text as="span" fontWeight="semibold">Online Store → Themes</Text>
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                      2. Click <Text as="span" fontWeight="semibold">"Customize"</Text> on your active theme
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                      3. Look for <Text as="span" fontWeight="semibold">"Visual Search"</Text> in the apps section
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                      4. Drag it near your search bar and save
                                    </Text>
                                  </BlockStack>
                                </BlockStack>
                              </Box>
                            </BlockStack>
                          </Box>
                        </Card>

                        {/* Custom Code Option */}
                        <Card>
                          <Box padding="500">
                            <BlockStack gap="400">
                              <InlineStack gap="300" align="start">
                                <Text as="span" variant="headingLg">💻</Text>
                                <BlockStack gap="100">
                                  <Text as="h4" variant="headingLg">Custom Code Integration</Text>
                                  <Text as="p" variant="bodyMd" fontWeight="medium">
                                    Copy and paste code for maximum control
                                  </Text>
                                </BlockStack>
                              </InlineStack>
                              
                              <Text as="p" variant="bodyLg">
                                Add our script directly to your theme for complete customization and control.
                              </Text>
                              
                              <BlockStack gap="400">
                                <BlockStack gap="300">
                                  <Text as="h5" variant="headingMd">Option 1: Theme.liquid Integration</Text>
                                  <Text as="p" variant="bodyMd" tone="subdued">
                                    Add this code to your <Text as="span" fontWeight="semibold">theme.liquid</Text> file before the closing <code>&lt;/body&gt;</code> tag:
                                  </Text>
                                  <Box 
                                    background="bg-surface-secondary" 
                                    padding="400" 
                                    borderRadius="200"
                                    borderWidth="025"
                                    borderColor="border"
                                  >
                                    <pre style={{ 
                                      fontSize: "11px", 
                                      fontFamily: "monospace", 
                                      overflow: "auto", 
                                      margin: 0, 
                                      lineHeight: "1.4",
                                      maxHeight: "300px",
                                      whiteSpace: "pre-wrap"
                                    }}>
                                      {generateScriptConfig()}
                                    </pre>
                                  </Box>
                                  <Button 
                                    variant="secondary" 
                                    onClick={() => {
                                      const code = generateScriptConfig();
                                      navigator.clipboard.writeText(code).then(() => {
                                        // You could add a toast notification here
                                        console.log('Code copied to clipboard');
                                      });
                                    }}
                                  >
                                    📋 Copy Theme Code
                                  </Button>
                                </BlockStack>

                                <BlockStack gap="300">
                                  <Text as="h5" variant="headingMd">Option 2: App Block for Theme 2.0</Text>
                                  <Text as="p" variant="bodyMd" tone="subdued">
                                    Create a custom app block file <Text as="span" fontWeight="semibold">blocks/visual-search.liquid</Text>:
                                  </Text>
                                  <Box 
                                    background="bg-surface-secondary" 
                                    padding="400" 
                                    borderRadius="200"
                                    borderWidth="025"
                                    borderColor="border"
                                  >
                                    <div style={{ maxHeight: "300px", overflow: "auto" }}>
                                      <pre style={{ 
                                        fontSize: "10px", 
                                        fontFamily: "monospace", 
                                        margin: 0, 
                                        lineHeight: "1.3",
                                        whiteSpace: "pre-wrap"
                                      }}>
                                        {generateAppBlockConfig()}
                                      </pre>
                                    </div>
                                  </Box>
                                  <Button 
                                    variant="secondary" 
                                    onClick={() => {
                                      const code = generateAppBlockConfig();
                                      navigator.clipboard.writeText(code).then(() => {
                                        // You could add a toast notification here
                                        console.log('App block code copied to clipboard');
                                      });
                                    }}
                                  >
                                    📋 Copy App Block Code
                                  </Button>
                                </BlockStack>
                              </BlockStack>
                              
                              <Box background="bg-surface-info" padding="400" borderRadius="200">
                                <BlockStack gap="200">
                                  <Text as="h5" variant="headingSm">What you get:</Text>
                                  <BlockStack gap="100">
                                    <Text as="p" variant="bodyMd">
                                      • Complete styling control with your custom theme settings
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                      • Custom colors, positioning, and sizing applied automatically
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                      • Works with the same unified script as automatic setup
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                      • No additional configuration needed - just copy and paste
                                    </Text>
                                  </BlockStack>
                                </BlockStack>
                              </Box>
                            </BlockStack>
                          </Box>
                        </Card>

                        {/* Support Card */}
                        <Card background="bg-surface-warning">
                          <Box padding="500">
                            <BlockStack gap="300">
                              <InlineStack gap="300" align="start">
                                <Text as="span" variant="headingLg">�</Text>
                                <Text as="h4" variant="headingMd">Need Help with Advanced Setup?</Text>
                              </InlineStack>
                              
                              <Text as="p" variant="bodyLg">
                                Our developer team can help you with custom integrations, theme modifications, 
                                and advanced configurations.
                              </Text>
                              
                              <InlineStack gap="300">
                                <Button variant="primary" size="large">
                                  💬 Contact Developer Support
                                </Button>
                                <Button variant="secondary" size="large">
                                  📖 View Documentation
                                </Button>
                              </InlineStack>
                            </BlockStack>
                          </Box>
                        </Card>
                      </BlockStack>
                    </Box>
                  )}
                </Tabs>
              </>
            )}
          </BlockStack>
        </Card>
          </BlockStack>
        </div>
      </Page>
    </>
  );
}
