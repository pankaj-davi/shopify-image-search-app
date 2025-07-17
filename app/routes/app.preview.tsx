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
  RangeSlider
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
    const modalConfig = formData.get("modalConfig") ? JSON.parse(formData.get("modalConfig") as string) : {};
    
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
      modalConfig,
      shop: session.shop
    });
    
    try {
      // Combine theme configuration with positioning and modal settings
      const fullThemeConfig = {
        ...themeConfig,
        iconPosition,
        iconOffset,
        iconSizeMultiplier: iconSize,
        modal: modalConfig
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
  const modalConfig = formData.get("modalConfig") ? JSON.parse(formData.get("modalConfig") as string) : {};
  
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
    modalConfig,
    shop: session.shop,
    finalAppUrl
  });
  
  console.log("[Preview Save] Modal config details:", {
    modalConfigRaw: formData.get("modalConfig"),
    modalConfigParsed: modalConfig,
    modalConfigType: typeof modalConfig,
    modalConfigKeys: Object.keys(modalConfig || {})
  });
  
  try {
    // Combine theme configuration with positioning and modal settings
    const fullThemeConfig = {
      ...themeConfig,
      iconPosition,
      iconOffset,
      iconSizeMultiplier: iconSize,
      modal: modalConfig
    };
    
    console.log("[Preview Save] Full theme config to save:", fullThemeConfig);
    console.log("[Preview Save] Modal config in full theme:", fullThemeConfig.modal);
    
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
  
  // Modal configuration state
  const [modalConfig, setModalConfig] = useState({
    widthMode: 'fullwidth' as 'small' | 'medium' | 'large' | 'fullwidth' | 'fullscreen' | 'custom',
    widthPercentage: 95,
    widthMaxPixels: 1600,
    heightMode: 'fullheight' as 'small' | 'medium' | 'large' | 'fullheight' | 'fullscreen' | 'custom',
    heightPercentage: 90,
    heightMaxPixels: 800,
    mobileFullscreen: true,
    verticalPosition: 'center' as 'top' | 'center' | 'bottom',
    horizontalPosition: 'center' as 'left' | 'center' | 'right'
  });

  // Initialize state with loaded theme configuration
  useEffect(() => {
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
      
      // Update modal configuration values if they exist
      if (config.modal) {
        setModalConfig(prevConfig => ({
          ...prevConfig,
          ...config.modal
        }));
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
  }, [data.currentThemeConfig]);

  const resetPositioning = () => {
    setIconPosition('right');
    setIconOffset(8);
    setIconSize(1.0);
    setModalConfig({
      widthMode: 'fullwidth',
      widthPercentage: 95,
      widthMaxPixels: 1600,
      heightMode: 'fullheight',
      heightPercentage: 90,
      heightMaxPixels: 800,
      mobileFullscreen: true,
      verticalPosition: 'center',
      horizontalPosition: 'center'
    });
    console.log("[Preview] Reset positioning and modal configuration to defaults");
  };

  const handlePresetChange = (preset: keyof typeof POLARIS_THEME_PRESETS) => {
    const theme = POLARIS_THEME_PRESETS[preset];
    setCurrentTheme(theme);
    setCustomTheme(theme);
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

  const generateScriptConfig = () => {
    return `
<!-- Add this to your theme.liquid file to customize visual search -->
<script>
  window.VISUAL_SEARCH_CONFIG = {
    appUrl: '${data.appUrl}',
    shopDomain: '${data.shop}',
    theme: {
      iconColor: '${currentTheme.iconColor}',
      iconColorHover: '${currentTheme.iconColorHover}',
      iconBackgroundHover: '${currentTheme.iconBackgroundHover}',
      primaryColor: '${currentTheme.primaryColor}',
      primaryColorDark: '${currentTheme.primaryColorDark}',
      iconSizeMultiplier: ${iconSize},
      iconPosition: '${iconPosition}',
      iconOffset: ${iconOffset}
    },
    modal: {
      widthMode: '${modalConfig.widthMode}',
      widthPercentage: ${modalConfig.widthPercentage},
      widthMaxPixels: ${modalConfig.widthMaxPixels},
      heightMode: '${modalConfig.heightMode}',
      heightPercentage: ${modalConfig.heightPercentage},
      heightMaxPixels: ${modalConfig.heightMaxPixels},
      mobileFullscreen: ${modalConfig.mobileFullscreen},
      verticalPosition: '${modalConfig.verticalPosition}',
      horizontalPosition: '${modalConfig.horizontalPosition}'
    }
  };
</script>`;
  };

  return (
    <Page>
      <TitleBar title="Visual Search Preview & Customization" />
      
      <BlockStack gap="500">
        {/* Action Result Banner */}
        {actionData && (
          <Banner
            tone={actionData.success ? "success" : "critical"}
            title={actionData.success ? "Configuration Saved!" : "Error"}
          >
            {(actionData as any).message || (actionData as any).error}
          </Banner>
        )}

        <InlineStack gap="500" align="start" wrap={false}>
          {/* Live Preview Section */}
          <Box width="50%" minWidth="400px">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Live Preview</Text>
                
                {/* Desktop Search Bar Demo */}
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">Desktop Search Bar</Text>
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
                </BlockStack>

                {/* Mobile Search Demo */}
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">Mobile Search Bar</Text>
                  <Box position="relative" maxWidth="300px">
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
                </BlockStack>

                {/* Preview Info */}
                <Card background="bg-surface-secondary">
                  <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">
                      Theme Preview
                    </Text>
                    <BlockStack gap="200">
                      <InlineStack gap="200" align="space-between">
                        <Text as="p" variant="bodyMd">
                          <Text as="span" fontWeight="semibold">Icon Color:</Text>
                        </Text>
                        <InlineStack gap="100" align="center">
                          <div
                            style={{
                              backgroundColor: currentTheme.iconColor,
                              border: "var(--p-border-width-025) solid var(--p-color-border)",
                              borderRadius: "var(--p-border-radius-050)",
                              width: "40px",
                              height: "20px",
                              minWidth: "40px",
                              minHeight: "20px"
                            }}
                          />
                          <Text as="span" variant="bodySm" tone="subdued">
                            {currentTheme.iconColor}
                          </Text>
                        </InlineStack>
                      </InlineStack>
                      
                      <InlineStack gap="200" align="space-between">
                        <Text as="p" variant="bodyMd">
                          <Text as="span" fontWeight="semibold">Hover Color:</Text>
                        </Text>
                        <InlineStack gap="100" align="center">
                          <div
                            style={{
                              backgroundColor: currentTheme.iconColorHover,
                              border: "var(--p-border-width-025) solid var(--p-color-border)",
                              borderRadius: "var(--p-border-radius-050)",
                              width: "40px",
                              height: "20px",
                              minWidth: "40px",
                              minHeight: "20px"
                            }}
                          />
                          <Text as="span" variant="bodySm" tone="subdued">
                            {currentTheme.iconColorHover}
                          </Text>
                        </InlineStack>
                      </InlineStack>
                      
                      <InlineStack gap="200" align="space-between">
                        <Text as="p" variant="bodyMd">
                          <Text as="span" fontWeight="semibold">Brand Color:</Text>
                        </Text>
                        <InlineStack gap="100" align="center">
                          <div
                            style={{
                              backgroundColor: currentTheme.primaryColor,
                              border: "var(--p-border-width-025) solid var(--p-color-border)",
                              borderRadius: "var(--p-border-radius-050)",
                              width: "40px",
                              height: "20px",
                              minWidth: "40px",
                              minHeight: "20px"
                            }}
                          />
                          <Text as="span" variant="bodySm" tone="subdued">
                            {currentTheme.primaryColor}
                          </Text>
                        </InlineStack>
                      </InlineStack>
                      
                      <Text as="p" variant="bodyMd">
                        <Text as="span" fontWeight="semibold">Position:</Text> {iconPosition} side, {iconOffset}px from edge
                      </Text>
                      <Text as="p" variant="bodyMd">
                        <Text as="span" fontWeight="semibold">Size:</Text> {(iconSize * 100).toFixed(0)}% of normal
                      </Text>
                      <Text as="p" variant="bodyMd">
                        <Text as="span" fontWeight="semibold">Modal Size:</Text> {
                          modalConfig.widthMode === 'fullwidth' 
                            ? `${modalConfig.widthPercentage}% width` 
                            : modalConfig.widthMode
                        } × {
                          modalConfig.heightMode === 'fullheight' 
                            ? `${modalConfig.heightPercentage}% height` 
                            : modalConfig.heightMode
                        }
                      </Text>
                    </BlockStack>
                  </BlockStack>
                </Card>

                {/* Modal Preview */}
                <Card>
                  <BlockStack gap="300">
                    <Text as="h4" variant="headingSm">Modal Layout Preview - Live Demo</Text>
                    
                    {/* Real-time Configuration Display */}
                    <Card background="bg-surface-secondary">
                      <BlockStack gap="200">
                        <Text as="h5" variant="headingXs">Current Modal Configuration</Text>
                        <InlineStack gap="400" wrap>
                          <Text as="p" variant="bodySm">
                            <strong>Width:</strong> {
                              modalConfig.widthMode === 'small' ? '400px' :
                              modalConfig.widthMode === 'medium' ? '800px' :
                              modalConfig.widthMode === 'large' ? '1200px' :
                              modalConfig.widthMode === 'fullwidth' ? `${modalConfig.widthPercentage}% viewport` :
                              modalConfig.widthMode === 'fullscreen' ? '100% coverage' :
                              modalConfig.widthMode
                            }
                          </Text>
                          <Text as="p" variant="bodySm">
                            <strong>Height:</strong> {
                              modalConfig.heightMode === 'small' ? '400px' :
                              modalConfig.heightMode === 'medium' ? '600px' :
                              modalConfig.heightMode === 'large' ? '800px' :
                              modalConfig.heightMode === 'fullheight' ? `${modalConfig.heightPercentage}% viewport` :
                              modalConfig.heightMode === 'fullscreen' ? '100% coverage' :
                              modalConfig.heightMode
                            }
                          </Text>
                          <Text as="p" variant="bodySm">
                            <strong>Position:</strong> {modalConfig.verticalPosition}
                          </Text>
                          <Text as="p" variant="bodySm">
                            <strong>Mobile:</strong> {modalConfig.mobileFullscreen ? 'Fullscreen' : 'Responsive'}
                          </Text>
                        </InlineStack>
                      </BlockStack>
                    </Card>

                    {/* Interactive Modal Preview */}
                    <BlockStack gap="300">
                      <InlineStack gap="200" align="center">
                        <Text as="p" variant="bodyMd" tone="subdued">Desktop View (1920×1080)</Text>
                        <Button
                          onClick={() => {
                            // Simulate modal opening
                            const previewModal = document.getElementById('desktop-modal-preview');
                            if (previewModal) {
                              previewModal.style.display = previewModal.style.display === 'none' ? 'flex' : 'none';
                            }
                          }}
                          variant="tertiary"
                          size="micro"
                        >
                          Toggle Preview
                        </Button>
                      </InlineStack>
                      
                      <div
                        id="desktop-modal-preview"
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "400px",
                          backgroundColor: "#f8f9fa",
                          border: "2px solid var(--p-color-border)",
                          borderRadius: "8px",
                          overflow: "hidden",
                          display: "none"
                        }}
                      >
                        {/* Simulated desktop viewport */}
                        <div
                          style={{
                            position: "absolute",
                            top: "0",
                            left: "0",
                            right: "0",
                            bottom: "0",
                            backgroundColor: "rgba(0, 0, 0, 0.4)",
                            display: "flex",
                            alignItems: modalConfig.verticalPosition === 'top' ? 'flex-start' : 
                                       modalConfig.verticalPosition === 'bottom' ? 'flex-end' : 'center',
                            justifyContent: modalConfig.horizontalPosition === 'left' ? 'flex-start' :
                                           modalConfig.horizontalPosition === 'right' ? 'flex-end' : 'center',
                            padding: "20px",
                            transition: "all 0.3s ease"
                          }}
                        >
                          {/* Dynamic modal */}
                          <div
                            style={{
                              backgroundColor: "white",
                              borderRadius: "12px",
                              border: "2px solid var(--p-color-border)",
                              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                              width: (() => {
                                if (modalConfig.widthMode === 'small') return '140px';
                                if (modalConfig.widthMode === 'medium') return '240px';
                                if (modalConfig.widthMode === 'large') return '280px';
                                if (modalConfig.widthMode === 'fullwidth') return `${Math.min(modalConfig.widthPercentage * 3.0, 300)}px`;
                                if (modalConfig.widthMode === 'fullscreen') return '320px'; // Max preview width for 100% coverage
                                return '260px';
                              })(),
                              height: (() => {
                                if (modalConfig.heightMode === 'small') return '100px';
                                if (modalConfig.heightMode === 'medium') return '160px';
                                if (modalConfig.heightMode === 'large') return '200px';
                                if (modalConfig.heightMode === 'fullheight') return `${Math.min(modalConfig.heightPercentage * 2.8, 280)}px`;
                                if (modalConfig.heightMode === 'fullscreen') return '300px'; // Max preview height for 100% coverage
                                return '180px';
                              })(),
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              color: "var(--p-color-text-subdued)",
                              textAlign: "center",
                              padding: "16px",
                              transition: "all 0.3s ease",
                              transform: modalConfig.verticalPosition === 'top' ? 'translateY(10px)' :
                                        modalConfig.verticalPosition === 'bottom' ? 'translateY(-10px)' : 'none'
                            }}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginBottom: "8px", opacity: 0.6 }}>
                              <path d="M9 2l.75 3h4.5L15 2z"/>
                              <rect x="2" y="6" width="20" height="12" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                              <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                            <strong style={{ marginBottom: "4px" }}>Visual Search Modal</strong>
                            <div style={{ fontSize: "10px", opacity: 0.7 }}>
                              {modalConfig.widthMode} × {modalConfig.heightMode}<br/>
                              Position: {modalConfig.verticalPosition}
                            </div>
                          </div>
                        </div>
                      </div>
                    </BlockStack>

                    {/* Mobile Modal Preview */}
                    <BlockStack gap="300">
                      <InlineStack gap="200" align="center">
                        <Text as="p" variant="bodyMd" tone="subdued">Mobile View (375×812)</Text>
                        <Button
                          onClick={() => {
                            const previewModal = document.getElementById('mobile-modal-preview');
                            if (previewModal) {
                              previewModal.style.display = previewModal.style.display === 'none' ? 'flex' : 'none';
                            }
                          }}
                          variant="tertiary"
                          size="micro"
                        >
                          Toggle Preview
                        </Button>
                      </InlineStack>
                      
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <div
                          id="mobile-modal-preview"
                          style={{
                            position: "relative",
                            width: "200px",
                            height: "350px",
                            backgroundColor: "#f8f9fa",
                            border: "2px solid var(--p-color-border)",
                            borderRadius: "20px",
                            overflow: "hidden",
                            display: "none"
                          }}
                        >
                          {/* Simulated mobile viewport */}
                          <div
                            style={{
                              position: "absolute",
                              top: "0",
                              left: "0",
                              right: "0",
                              bottom: "0",
                              backgroundColor: "rgba(0, 0, 0, 0.4)",
                              display: "flex",
                              alignItems: modalConfig.mobileFullscreen ? 'flex-end' : 'center',
                              justifyContent: "center",
                              padding: modalConfig.mobileFullscreen ? "0" : "16px",
                              transition: "all 0.3s ease"
                            }}
                          >
                            {/* Dynamic mobile modal */}
                            <div
                              style={{
                                backgroundColor: "white",
                                borderRadius: modalConfig.mobileFullscreen ? "16px 16px 0 0" : "12px",
                                border: modalConfig.mobileFullscreen ? "none" : "2px solid var(--p-color-border)",
                                boxShadow: modalConfig.mobileFullscreen ? "0 -4px 20px rgba(0, 0, 0, 0.1)" : "0 4px 20px rgba(0, 0, 0, 0.15)",
                                width: modalConfig.mobileFullscreen ? "100%" : "160px",
                                height: modalConfig.mobileFullscreen ? "250px" : "180px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "10px",
                                color: "var(--p-color-text-subdued)",
                                textAlign: "center",
                                padding: "12px",
                                transition: "all 0.3s ease"
                              }}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginBottom: "6px", opacity: 0.6 }}>
                                <path d="M9 2l.75 3h4.5L15 2z"/>
                                <rect x="2" y="6" width="20" height="12" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                                <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                              </svg>
                              <strong style={{ marginBottom: "4px" }}>Mobile Modal</strong>
                              <div style={{ fontSize: "8px", opacity: 0.7 }}>
                                {modalConfig.mobileFullscreen ? 'Fullscreen Mode' : 'Responsive Mode'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </BlockStack>

                    {/* Size Calculator */}
                    <Card background="bg-surface-secondary">
                      <BlockStack gap="200">
                        <Text as="h5" variant="headingXs">📐 Calculated Dimensions</Text>
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm">
                            <strong>Desktop (1920×1080):</strong> {
                              modalConfig.widthMode === 'small' ? '400px' :
                              modalConfig.widthMode === 'medium' ? '800px' :
                              modalConfig.widthMode === 'large' ? '1200px' :
                              modalConfig.widthMode === 'fullwidth' ? `${Math.round(1920 * modalConfig.widthPercentage / 100)}px` :
                              modalConfig.widthMode === 'fullscreen' ? '1920px (100%)' : '1824px'
                            } × {
                              modalConfig.heightMode === 'small' ? '400px' :
                              modalConfig.heightMode === 'medium' ? '600px' :
                              modalConfig.heightMode === 'large' ? '800px' :
                              modalConfig.heightMode === 'fullheight' ? `${Math.round(1080 * modalConfig.heightPercentage / 100)}px` :
                              modalConfig.heightMode === 'fullscreen' ? '1080px (100%)' : '972px'
                            }
                          </Text>
                          <Text as="p" variant="bodySm">
                            <strong>Tablet (768×1024):</strong> {
                              modalConfig.widthMode === 'small' ? '400px' :
                              modalConfig.widthMode === 'medium' ? '691px (90% max)' :
                              modalConfig.widthMode === 'large' ? '691px (90% max)' :
                              modalConfig.widthMode === 'fullwidth' ? `${Math.round(768 * modalConfig.widthPercentage / 100)}px` :
                              modalConfig.widthMode === 'fullscreen' ? '768px (100%)' : '691px'
                            } × {
                              modalConfig.heightMode === 'small' ? '400px' :
                              modalConfig.heightMode === 'medium' ? '600px' :
                              modalConfig.heightMode === 'large' ? '800px' :
                              modalConfig.heightMode === 'fullheight' ? `${Math.round(1024 * modalConfig.heightPercentage / 100)}px` :
                              modalConfig.heightMode === 'fullscreen' ? '1024px (100%)' : '922px'
                            }
                          </Text>
                          <Text as="p" variant="bodySm">
                            <strong>Mobile (375×812):</strong> {
                              modalConfig.mobileFullscreen ? '375px (100%)' : 'Responsive'
                            } × {
                              modalConfig.mobileFullscreen ? '~406px (50%)' : 'Auto'
                            }
                          </Text>
                        </BlockStack>
                      </BlockStack>
                    </Card>
                  </BlockStack>
                </Card>

                {/* Live Store Preview */}
                <Card>
                  <BlockStack gap="300">
                    <Text as="h4" variant="headingSm">Test on Your Live Store</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Preview how your modal will look on your actual store before applying the configuration.
                    </Text>
                    
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">Your Store URL:</Text>
                      <InlineStack gap="200" align="center">
                        <div style={{ 
                          flex: 1,
                          padding: "8px 12px",
                          backgroundColor: "var(--p-color-bg-surface-secondary)",
                          borderRadius: "var(--p-border-radius-200)",
                          border: "var(--p-border-width-025) solid var(--p-color-border)",
                          fontSize: "14px",
                          fontFamily: "monospace"
                        }}>
                          https://{data.shop}
                        </div>
                        <Button 
                          onClick={() => {
                            const storeUrl = `https://${data.shop}`;
                            window.open(storeUrl, '_blank', 'width=1200,height=800');
                          }}
                          variant="secondary"
                        >
                          Open Store
                        </Button>
                      </InlineStack>
                    </BlockStack>

                    <Card background="bg-surface-caution">
                      <BlockStack gap="200">
                        <Text as="h5" variant="headingXs">
                          🔍 How to Test Modal Layout
                        </Text>
                        <Text as="p" variant="bodyMd">
                          1. Open your store in a new tab using the button above<br/>
                          2. Look for the visual search icon in search bars<br/>
                          3. Click the icon to open the visual search modal<br/>
                          4. Check how the modal size and position looks on your store<br/>
                          5. Test on both desktop and mobile devices<br/>
                          6. Come back here to adjust settings if needed
                        </Text>
                      </BlockStack>
                    </Card>

                    <Text as="p" variant="bodyMd" tone="subdued">
                      <strong>Note:</strong> Changes made here will only take effect after you save the configuration using the button below.
                    </Text>

                    {/* Test Modal Button */}
                    <InlineStack gap="200">
                      <Button
                        onClick={() => {
                          // Create a realistic modal preview overlay
                          const overlay = document.createElement('div');
                          overlay.id = 'modal-test-overlay';
                          overlay.style.cssText = `
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100vw;
                            height: 100vh;
                            background: rgba(0, 0, 0, 0.6);
                            z-index: 10000;
                            display: flex;
                            align-items: ${modalConfig.verticalPosition === 'top' ? 'flex-start' : 
                                         modalConfig.verticalPosition === 'bottom' ? 'flex-end' : 'center'};
                            justify-content: ${modalConfig.horizontalPosition === 'left' ? 'flex-start' :
                                             modalConfig.horizontalPosition === 'right' ? 'flex-end' : 'center'};
                            padding: 20px;
                          `;

                          // Calculate modal dimensions
                          const isMobile = window.innerWidth < 768;
                          let modalWidth, modalHeight;
                          
                          if (isMobile && modalConfig.mobileFullscreen) {
                            modalWidth = '100%';
                            modalHeight = '60vh';
                          } else {
                            if (modalConfig.widthMode === 'small') modalWidth = '400px';
                            else if (modalConfig.widthMode === 'medium') modalWidth = '800px';
                            else if (modalConfig.widthMode === 'large') modalWidth = '1200px';
                            else modalWidth = `${modalConfig.widthPercentage}vw`;

                            if (modalConfig.heightMode === 'small') modalHeight = '400px';
                            else if (modalConfig.heightMode === 'medium') modalHeight = '600px';
                            else if (modalConfig.heightMode === 'large') modalHeight = '800px';
                            else modalHeight = `${modalConfig.heightPercentage}vh`;
                          }

                          const modal = document.createElement('div');
                          modal.style.cssText = `
                            background: white;
                            border-radius: ${isMobile && modalConfig.mobileFullscreen ? '20px 20px 0 0' : '20px'};
                            width: ${modalWidth};
                            height: ${modalHeight};
                            max-width: 95vw;
                            max-height: 95vh;
                            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            text-align: center;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            ${isMobile && modalConfig.mobileFullscreen ? 'position: fixed; bottom: 0; left: 0; right: 0;' : ''}
                          `;

                          // Create modal content
                          const icon = document.createElement('svg');
                          icon.setAttribute('width', '48');
                          icon.setAttribute('height', '48');
                          icon.setAttribute('viewBox', '0 0 24 24');
                          icon.setAttribute('fill', 'currentColor');
                          icon.style.cssText = 'margin-bottom: 16px; color: #666;';
                          icon.innerHTML = '<path d="M9 2l.75 3h4.5L15 2z"/><rect x="2" y="6" width="20" height="12" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/>';
                          
                          const title = document.createElement('h2');
                          title.textContent = 'Visual Search Modal';
                          title.style.cssText = 'margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #333;';
                          
                          const description = document.createElement('p');
                          description.innerHTML = `Size: ${modalWidth} × ${modalHeight}<br/>Position: ${modalConfig.verticalPosition}<br/>Mobile: ${modalConfig.mobileFullscreen ? 'Fullscreen' : 'Responsive'}`;
                          description.style.cssText = 'margin: 0 0 16px 0; color: #666; font-size: 16px;';
                          
                          const closeButton = document.createElement('button');
                          closeButton.textContent = 'Close Preview';
                          closeButton.style.cssText = `
                            background: ${currentTheme.primaryColor}; 
                            color: white; 
                            border: none; 
                            padding: 12px 24px; 
                            border-radius: 8px; 
                            font-size: 16px; 
                            cursor: pointer;
                            font-weight: 500;
                          `;
                          closeButton.onclick = () => overlay.remove();

                          modal.appendChild(icon);
                          modal.appendChild(title);
                          modal.appendChild(description);
                          modal.appendChild(closeButton);
                          overlay.appendChild(modal);
                          document.body.appendChild(overlay);

                          // Close on overlay click
                          overlay.onclick = (e) => {
                            if (e.target === overlay) overlay.remove();
                          };
                        }}
                        variant="secondary"
                        size="large"
                      >
                        🔍 Test Full-Screen Modal Preview
                      </Button>
                      
                      <Text as="p" variant="bodySm" tone="subdued">
                        Click to see how your modal will actually look on this screen
                      </Text>
                    </InlineStack>
                  </BlockStack>
                </Card>
              </BlockStack>
            </Card>
          </Box>
          
          {/* Customization Section */}
          <Box width="50%" minWidth="400px">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Theme Customization</Text>
                
                {/* Preset Themes */}
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">Quick Presets</Text>
                  <InlineStack gap="200" wrap>
                    {Object.entries(POLARIS_THEME_PRESETS).map(([key, preset]) => (
                      <Button
                        key={key}
                        onClick={() => handlePresetChange(key as keyof typeof POLARIS_THEME_PRESETS)}
                        variant={currentTheme.name === preset.name ? "primary" : "secondary"}
                        size="medium"
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </InlineStack>
                </BlockStack>

                {/* Custom Colors */}
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">Custom Colors</Text>
                  
                  <BlockStack gap="200">
                    <Text as="h4" variant="headingXs">Icon Color</Text>
                    <InlineStack gap="200" align="center">
                      <div
                        style={{
                          backgroundColor: customTheme.iconColor,
                          border: "var(--p-border-width-025) solid var(--p-color-border)",
                          borderRadius: "var(--p-border-radius-100)",
                          width: "30px",
                          height: "30px",
                          cursor: "pointer"
                        }}
                        onClick={() => setShowColorPickers(!showColorPickers)}
                      />
                      <input
                        type="color"
                        value={customTheme.iconColor}
                        onChange={(e) => handleCustomColorChange('iconColor', e.target.value)}
                        style={{
                          border: "var(--p-border-width-025) solid var(--p-color-border)",
                          borderRadius: "var(--p-border-radius-100)",
                          padding: "var(--p-space-100)",
                          backgroundColor: "var(--p-color-bg-surface)",
                          cursor: "pointer"
                        }}
                      />
                      <Text as="span" variant="bodySm" tone="subdued">
                        {customTheme.iconColor}
                      </Text>
                    </InlineStack>
                  </BlockStack>

                  <BlockStack gap="200">
                    <Text as="h4" variant="headingXs">Hover Color</Text>
                    <InlineStack gap="200" align="center">
                      <div
                        style={{
                          backgroundColor: customTheme.iconColorHover,
                          border: "var(--p-border-width-025) solid var(--p-color-border)",
                          borderRadius: "var(--p-border-radius-100)",
                          width: "30px",
                          height: "30px",
                          cursor: "pointer"
                        }}
                      />
                      <input
                        type="color"
                        value={customTheme.iconColorHover}
                        onChange={(e) => handleCustomColorChange('iconColorHover', e.target.value)}
                        style={{
                          border: "var(--p-border-width-025) solid var(--p-color-border)",
                          borderRadius: "var(--p-border-radius-100)",
                          padding: "var(--p-space-100)",
                          backgroundColor: "var(--p-color-bg-surface)",
                          cursor: "pointer"
                        }}
                      />
                      <Text as="span" variant="bodySm" tone="subdued">
                        {customTheme.iconColorHover}
                      </Text>
                    </InlineStack>
                  </BlockStack>

                  <BlockStack gap="200">
                    <Text as="h4" variant="headingXs">Brand Color</Text>
                    <InlineStack gap="200" align="center">
                      <div
                        style={{
                          backgroundColor: customTheme.primaryColor,
                          border: "var(--p-border-width-025) solid var(--p-color-border)",
                          borderRadius: "var(--p-border-radius-100)",
                          width: "30px",
                          height: "30px",
                          cursor: "pointer"
                        }}
                      />
                      <input
                        type="color"
                        value={customTheme.primaryColor}
                        onChange={(e) => handleCustomColorChange('primaryColor', e.target.value)}
                        style={{
                          border: "var(--p-border-width-025) solid var(--p-color-border)",
                          borderRadius: "var(--p-border-radius-100)",
                          padding: "var(--p-space-100)",
                          backgroundColor: "var(--p-color-bg-surface)",
                          cursor: "pointer"
                        }}
                      />
                      <Text as="span" variant="bodySm" tone="subdued">
                        {customTheme.primaryColor}
                      </Text>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>

                {/* Position & Size Controls */}
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">Position & Size</Text>
                  
                  <InlineStack gap="200">
                    <Button
                      onClick={() => setIconPosition('left')}
                      variant={iconPosition === 'left' ? "primary" : "secondary"}
                      size="medium"
                    >
                      Left Side
                    </Button>
                    <Button
                      onClick={() => setIconPosition('right')}
                      variant={iconPosition === 'right' ? "primary" : "secondary"}
                      size="medium"
                    >
                      Right Side
                    </Button>
                  </InlineStack>

                  <div>
                    <Text as="p" variant="bodyMd">Icon Distance from Edge: {iconOffset}px</Text>
                    <RangeSlider
                      label=""
                      value={iconOffset}
                      min={4}
                      max={20}
                      onChange={(value) => setIconOffset(Array.isArray(value) ? value[0] : value)}
                    />
                  </div>

                  <div>
                    <Text as="p" variant="bodyMd">Icon Size: {(iconSize * 100).toFixed(0)}%</Text>
                    <RangeSlider
                      label=""
                      value={iconSize}
                      min={0.8}
                      max={1.4}
                      step={0.1}
                      onChange={(value) => setIconSize(Array.isArray(value) ? value[0] : value)}
                    />
                  </div>

                  <Button
                    onClick={resetPositioning}
                    variant="tertiary"
                    tone="critical"
                  >
                    🔄 Reset Positioning to Defaults
                  </Button>
                </BlockStack>

                {/* Modal Layout Configuration */}
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">Visual Search Modal Layout</Text>
                  
                  {/* Width Configuration */}
                  <BlockStack gap="200">
                    <Text as="h4" variant="headingXs">Modal Width</Text>
                    <InlineStack gap="200" wrap>
                      <Button
                        onClick={() => {
                          setModalConfig({...modalConfig, widthMode: 'small'});
                          // Update preview immediately
                          setTimeout(() => {
                            const preview = document.getElementById('desktop-modal-preview');
                            if (preview) {
                              const modal = preview.querySelector('div > div > div') as HTMLElement;
                              if (modal) {
                                modal.style.width = '120px';
                                modal.style.transition = 'all 0.3s ease';
                              }
                            }
                          }, 50);
                        }}
                        variant={modalConfig.widthMode === 'small' ? "primary" : "secondary"}
                        size="medium"
                      >
                        Small (400px)
                      </Button>
                      <Button
                        onClick={() => {
                          setModalConfig({...modalConfig, widthMode: 'medium'});
                          setTimeout(() => {
                            const preview = document.getElementById('desktop-modal-preview');
                            if (preview) {
                              const modal = preview.querySelector('div > div > div') as HTMLElement;
                              if (modal) {
                                modal.style.width = '200px';
                                modal.style.transition = 'all 0.3s ease';
                              }
                            }
                          }, 50);
                        }}
                        variant={modalConfig.widthMode === 'medium' ? "primary" : "secondary"}
                        size="medium"
                      >
                        Medium (800px)
                      </Button>
                      <Button
                        onClick={() => {
                          setModalConfig({...modalConfig, widthMode: 'large'});
                          setTimeout(() => {
                            const preview = document.getElementById('desktop-modal-preview');
                            if (preview) {
                              const modal = preview.querySelector('div > div > div') as HTMLElement;
                              if (modal) {
                                modal.style.width = '240px';
                                modal.style.transition = 'all 0.3s ease';
                              }
                            }
                          }, 50);
                        }}
                        variant={modalConfig.widthMode === 'large' ? "primary" : "secondary"}
                        size="medium"
                      >
                        Large (1200px)
                      </Button>
                      <Button
                        onClick={() => {
                          setModalConfig({...modalConfig, widthMode: 'fullwidth'});
                          setTimeout(() => {
                            const preview = document.getElementById('desktop-modal-preview');
                            if (preview) {
                              const modal = preview.querySelector('div > div > div') as HTMLElement;
                              if (modal) {
                                modal.style.width = `${Math.min(modalConfig.widthPercentage * 2.8, 280)}px`;
                                modal.style.transition = 'all 0.3s ease';
                              }
                            }
                          }, 50);
                        }}
                        variant={modalConfig.widthMode === 'fullwidth' ? "primary" : "secondary"}
                        size="medium"
                      >
                        Full Width (95%)
                      </Button>
                      <Button
                        onClick={() => {
                          setModalConfig({...modalConfig, widthMode: 'fullscreen'});
                          setTimeout(() => {
                            const preview = document.getElementById('desktop-modal-preview');
                            if (preview) {
                              const modal = preview.querySelector('div > div > div') as HTMLElement;
                              if (modal) {
                                modal.style.width = '300px'; // Max preview width
                                modal.style.transition = 'all 0.3s ease';
                              }
                            }
                          }, 50);
                        }}
                        variant={modalConfig.widthMode === 'fullscreen' ? "primary" : "secondary"}
                        size="medium"
                      >
                        100% Coverage
                      </Button>
                    </InlineStack>
                    
                    {modalConfig.widthMode === 'fullwidth' && (
                      <div>
                        <Text as="p" variant="bodyMd">
                          Width: {modalConfig.widthPercentage}% of viewport 
                          <Text as="span" tone="subdued"> 
                            (≈{Math.round(1920 * modalConfig.widthPercentage / 100)}px on 1920px screen)
                          </Text>
                        </Text>
                        <RangeSlider
                          label=""
                          value={modalConfig.widthPercentage}
                          min={50}
                          max={100}
                          step={5}
                          onChange={(value) => {
                            const newValue = Array.isArray(value) ? value[0] : value;
                            setModalConfig({
                              ...modalConfig, 
                              widthPercentage: newValue
                            });
                            
                            // Update preview immediately
                            const preview = document.getElementById('desktop-modal-preview');
                            if (preview) {
                              const modal = preview.querySelector('div > div > div') as HTMLElement;
                              if (modal) {
                                modal.style.width = `${Math.min(newValue * 2.8, 280)}px`;
                              }
                            }
                          }}
                        />
                      </div>
                    )}
                  </BlockStack>

                  {/* Height Configuration */}
                  <BlockStack gap="200">
                    <Text as="h4" variant="headingXs">Modal Height</Text>
                    <InlineStack gap="200" wrap>
                      <Button
                        onClick={() => {
                          setModalConfig({...modalConfig, heightMode: 'small'});
                          setTimeout(() => {
                            const preview = document.getElementById('desktop-modal-preview');
                            if (preview) {
                              const modal = preview.querySelector('div > div > div') as HTMLElement;
                              if (modal) {
                                modal.style.height = '100px';
                                modal.style.transition = 'all 0.3s ease';
                              }
                            }
                          }, 50);
                        }}
                        variant={modalConfig.heightMode === 'small' ? "primary" : "secondary"}
                        size="medium"
                      >
                        Small (400px)
                      </Button>
                      <Button
                        onClick={() => {
                          setModalConfig({...modalConfig, heightMode: 'medium'});
                          setTimeout(() => {
                            const preview = document.getElementById('desktop-modal-preview');
                            if (preview) {
                              const modal = preview.querySelector('div > div > div') as HTMLElement;
                              if (modal) {
                                modal.style.height = '140px';
                                modal.style.transition = 'all 0.3s ease';
                              }
                            }
                          }, 50);
                        }}
                        variant={modalConfig.heightMode === 'medium' ? "primary" : "secondary"}
                        size="medium"
                      >
                        Medium (600px)
                      </Button>
                      <Button
                        onClick={() => {
                          setModalConfig({...modalConfig, heightMode: 'large'});
                          setTimeout(() => {
                            const preview = document.getElementById('desktop-modal-preview');
                            if (preview) {
                              const modal = preview.querySelector('div > div > div') as HTMLElement;
                              if (modal) {
                                modal.style.height = '180px';
                                modal.style.transition = 'all 0.3s ease';
                              }
                            }
                          }, 50);
                        }}
                        variant={modalConfig.heightMode === 'large' ? "primary" : "secondary"}
                        size="medium"
                      >
                        Large (800px)
                      </Button>
                      <Button
                        onClick={() => {
                          setModalConfig({...modalConfig, heightMode: 'fullheight'});
                          setTimeout(() => {
                            const preview = document.getElementById('desktop-modal-preview');
                            if (preview) {
                              const modal = preview.querySelector('div > div > div') as HTMLElement;
                              if (modal) {
                                modal.style.height = `${Math.min(modalConfig.heightPercentage * 2.4, 240)}px`;
                                modal.style.transition = 'all 0.3s ease';
                              }
                            }
                          }, 50);
                        }}
                        variant={modalConfig.heightMode === 'fullheight' ? "primary" : "secondary"}
                        size="medium"
                      >
                        Full Height (90%)
                      </Button>
                      <Button
                        onClick={() => {
                          setModalConfig({...modalConfig, heightMode: 'fullscreen'});
                          setTimeout(() => {
                            const preview = document.getElementById('desktop-modal-preview');
                            if (preview) {
                              const modal = preview.querySelector('div > div > div') as HTMLElement;
                              if (modal) {
                                modal.style.height = '260px'; // Max preview height
                                modal.style.transition = 'all 0.3s ease';
                              }
                            }
                          }, 50);
                        }}
                        variant={modalConfig.heightMode === 'fullscreen' ? "primary" : "secondary"}
                        size="medium"
                      >
                        100% Coverage
                      </Button>
                    </InlineStack>
                    
                    {modalConfig.heightMode === 'fullheight' && (
                      <div>
                        <Text as="p" variant="bodyMd">
                          Height: {modalConfig.heightPercentage}% of viewport
                          <Text as="span" tone="subdued">
                            (≈{Math.round(1080 * modalConfig.heightPercentage / 100)}px on 1080px screen)
                          </Text>
                        </Text>
                        <RangeSlider
                          label=""
                          value={modalConfig.heightPercentage}
                          min={50}
                          max={95}
                          step={5}
                          onChange={(value) => {
                            const newValue = Array.isArray(value) ? value[0] : value;
                            setModalConfig({
                              ...modalConfig, 
                              heightPercentage: newValue
                            });
                            
                            // Update preview immediately
                            const preview = document.getElementById('desktop-modal-preview');
                            if (preview) {
                              const modal = preview.querySelector('div > div > div') as HTMLElement;
                              if (modal) {
                                modal.style.height = `${Math.min(newValue * 2.4, 240)}px`;
                              }
                            }
                          }}
                        />
                      </div>
                    )}
                  </BlockStack>

                  {/* Mobile Behavior */}
                  <BlockStack gap="200">
                    <Text as="h4" variant="headingXs">Mobile Behavior</Text>
                    <InlineStack gap="200">
                      <Button
                        onClick={() => {
                          setModalConfig({...modalConfig, mobileFullscreen: true});
                          setTimeout(() => {
                            const preview = document.getElementById('mobile-modal-preview');
                            if (preview) {
                              const overlay = preview.querySelector('div') as HTMLElement;
                              const modal = preview.querySelector('div > div') as HTMLElement;
                              if (overlay && modal) {
                                overlay.style.alignItems = 'flex-end';
                                overlay.style.padding = '0';
                                modal.style.width = '100%';
                                modal.style.height = '250px';
                                modal.style.borderRadius = '16px 16px 0 0';
                                modal.style.border = 'none';
                                modal.style.boxShadow = '0 -4px 20px rgba(0, 0, 0, 0.1)';
                                modal.style.transition = 'all 0.3s ease';
                              }
                            }
                          }, 50);
                        }}
                        variant={modalConfig.mobileFullscreen ? "primary" : "secondary"}
                        size="medium"
                      >
                        Mobile Fullscreen
                      </Button>
                      <Button
                        onClick={() => {
                          setModalConfig({...modalConfig, mobileFullscreen: false});
                          setTimeout(() => {
                            const preview = document.getElementById('mobile-modal-preview');
                            if (preview) {
                              const overlay = preview.querySelector('div') as HTMLElement;
                              const modal = preview.querySelector('div > div') as HTMLElement;
                              if (overlay && modal) {
                                overlay.style.alignItems = 'center';
                                overlay.style.padding = '16px';
                                modal.style.width = '120px';
                                modal.style.height = '140px';
                                modal.style.borderRadius = '12px';
                                modal.style.border = '2px solid var(--p-color-border)';
                                modal.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
                                modal.style.transition = 'all 0.3s ease';
                              }
                            }
                          }, 50);
                        }}
                        variant={!modalConfig.mobileFullscreen ? "primary" : "secondary"}
                        size="medium"
                      >
                        Responsive Size
                      </Button>
                    </InlineStack>
                  </BlockStack>

                  {/* Modal Position */}
                  <BlockStack gap="200">
                    <Text as="h4" variant="headingXs">Modal Position</Text>
                    <InlineStack gap="200" wrap>
                      <Button
                        onClick={() => {
                          setModalConfig({...modalConfig, verticalPosition: 'top'});
                          setTimeout(() => {
                            const preview = document.getElementById('desktop-modal-preview');
                            if (preview) {
                              const overlay = preview.querySelector('div') as HTMLElement;
                              if (overlay) {
                                overlay.style.alignItems = 'flex-start';
                                overlay.style.transition = 'all 0.3s ease';
                              }
                            }
                          }, 50);
                        }}
                        variant={modalConfig.verticalPosition === 'top' ? "primary" : "secondary"}
                        size="medium"
                      >
                        Top
                      </Button>
                      <Button
                        onClick={() => {
                          setModalConfig({...modalConfig, verticalPosition: 'center'});
                          setTimeout(() => {
                            const preview = document.getElementById('desktop-modal-preview');
                            if (preview) {
                              const overlay = preview.querySelector('div') as HTMLElement;
                              if (overlay) {
                                overlay.style.alignItems = 'center';
                                overlay.style.transition = 'all 0.3s ease';
                              }
                            }
                          }, 50);
                        }}
                        variant={modalConfig.verticalPosition === 'center' ? "primary" : "secondary"}
                        size="medium"
                      >
                        Center
                      </Button>
                      <Button
                        onClick={() => {
                          setModalConfig({...modalConfig, verticalPosition: 'bottom'});
                          setTimeout(() => {
                            const preview = document.getElementById('desktop-modal-preview');
                            if (preview) {
                              const overlay = preview.querySelector('div') as HTMLElement;
                              if (overlay) {
                                overlay.style.alignItems = 'flex-end';
                                overlay.style.transition = 'all 0.3s ease';
                              }
                            }
                          }, 50);
                        }}
                        variant={modalConfig.verticalPosition === 'bottom' ? "primary" : "secondary"}
                        size="medium"
                      >
                        Bottom
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>

                {/* Save Configuration */}
                <Form method="post">
                  <input type="hidden" name="actionType" value="saveConfiguration" />
                  <input type="hidden" name="themeConfig" value={JSON.stringify(customTheme)} />
                  <input type="hidden" name="iconPosition" value={iconPosition} />
                  <input type="hidden" name="iconOffset" value={iconOffset} />
                  <input type="hidden" name="iconSize" value={iconSize} />
                  <input type="hidden" name="modalConfig" value={JSON.stringify(modalConfig)} />
                  <Button
                    submit
                    variant="primary"
                    size="large"
                    fullWidth
                  >
                    Save Theme & Modal Configuration
                  </Button>
                </Form>
              </BlockStack>
            </Card>
          </Box>
        </InlineStack>

        {/* Implementation Guide */}
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">How to Apply Your Custom Theme</Text>
            
            <BlockStack gap="200">
              <Text as="h4" variant="headingSm">Option 1: Automatic (Recommended)</Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Your theme settings are automatically applied when you activate visual search. No additional steps needed!
              </Text>
            </BlockStack>

            <BlockStack gap="200">
              <Text as="h4" variant="headingSm">Option 2: Manual Theme Override</Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Add this code to your theme.liquid file to override the default styling:
              </Text>
              <Box 
                background="bg-surface-secondary" 
                padding="400" 
                borderRadius="200"
                borderWidth="025"
                borderColor="border"
              >
                <pre style={{ fontSize: "12px", fontFamily: "monospace", overflow: "auto", margin: 0 }}>
                  {generateScriptConfig()}
                </pre>
              </Box>
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
