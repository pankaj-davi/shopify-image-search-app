import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { useState, useEffect } from "react";
import { appDatabase } from "../services/app.database.service";

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

const THEME_PRESETS = {
  google: {
    name: "Google Style",
    iconColor: "#5f6368",
    iconColorHover: "#202124",
    iconBackgroundHover: "rgba(95, 99, 104, 0.08)",
    primaryColor: "#4285f4",
    primaryColorDark: "#1a73e8"
  },
  pinterest: {
    name: "Pinterest Style", 
    iconColor: "#767676",
    iconColorHover: "#E60023",
    iconBackgroundHover: "rgba(230, 0, 35, 0.08)",
    primaryColor: "#E60023",
    primaryColorDark: "#BD081C"
  },
  minimal: {
    name: "Minimal",
    iconColor: "#999999",
    iconColorHover: "#333333", 
    iconBackgroundHover: "rgba(0, 0, 0, 0.05)",
    primaryColor: "#333333",
    primaryColorDark: "#000000"
  },
  brand: {
    name: "Your Brand",
    iconColor: "#666666",
    iconColorHover: "#000000",
    iconBackgroundHover: "rgba(0, 0, 0, 0.08)", 
    primaryColor: "#007bff",
    primaryColorDark: "#0056b3"
  }
};

export default function PreviewPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
  const [currentTheme, setCurrentTheme] = useState(THEME_PRESETS.pinterest);
  const [customTheme, setCustomTheme] = useState(THEME_PRESETS.pinterest);
  const [iconPosition, setIconPosition] = useState<'left' | 'right'>('right');
  const [iconOffset, setIconOffset] = useState(8);
  const [iconSize, setIconSize] = useState(1.0);

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
      
      // Update theme values if they exist
      const savedTheme = {
        name: "Saved Theme",
        iconColor: config.iconColor || THEME_PRESETS.pinterest.iconColor,
        iconColorHover: config.iconColorHover || THEME_PRESETS.pinterest.iconColorHover,
        iconBackgroundHover: config.iconBackgroundHover || THEME_PRESETS.pinterest.iconBackgroundHover,
        primaryColor: config.primaryColor || THEME_PRESETS.pinterest.primaryColor,
        primaryColorDark: config.primaryColorDark || THEME_PRESETS.pinterest.primaryColorDark
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
    console.log("[Preview] Reset positioning to defaults");
  };

  const handlePresetChange = (preset: keyof typeof THEME_PRESETS) => {
    const theme = THEME_PRESETS[preset];
    setCurrentTheme(theme);
    setCustomTheme(theme);
  };

  const handleCustomChange = (field: string, value: string) => {
    const updated = { ...customTheme, [field]: value };
    setCustomTheme(updated);
    setCurrentTheme(updated);
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
    }
  };
</script>`;
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4", padding: "20px", maxWidth: "1200px" }}>
      <h1 style={{ color: "#333", margin: "0 0 20px 0" }}>Visual Search Preview & Customization</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "40px" }}>
        
        {/* Live Preview Section */}
        <div style={{ 
          backgroundColor: "#f8f9fa", 
          padding: "30px", 
          borderRadius: "12px", 
          border: "1px solid #e9ecef"
        }}>
          <h2 style={{ color: "#495057", marginTop: "0", marginBottom: "20px" }}>Live Preview</h2>
          
          {/* Search Bar Demo */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "16px", marginBottom: "10px", color: "#666" }}>Desktop Search Bar</h3>
            <div style={{ position: "relative", marginBottom: "20px" }}>
              <input 
                type="search" 
                placeholder="Search products..." 
                style={{
                  width: "100%",
                  padding: iconPosition === 'left' 
                    ? `12px 16px 12px ${50 + iconOffset}px`
                    : `12px ${50 + iconOffset}px 12px 16px`,
                  border: "2px solid #e0e0e0",
                  borderRadius: "25px",
                  fontSize: "16px",
                  outline: "none",
                  boxSizing: "border-box",
                  backgroundColor: "white"
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
                  borderRadius: "3px",
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
                  e.currentTarget.style.borderRadius = "3px";
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
            </div>
          </div>

          {/* Mobile Search Demo */}
          <div>
            <h3 style={{ fontSize: "16px", marginBottom: "10px", color: "#666" }}>Mobile Search Bar</h3>
            <div style={{ position: "relative", maxWidth: "300px" }}>
              <input 
                type="search" 
                placeholder="Search..." 
                style={{
                  width: "100%",
                  padding: iconPosition === 'left' 
                    ? `10px 12px 10px ${40 + iconOffset}px`
                    : `10px ${40 + iconOffset}px 10px 12px`,
                  border: "1px solid #ccc",
                  borderRadius: "20px",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  backgroundColor: "white"
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
            </div>
          </div>

          {/* Preview Info */}
          <div style={{ 
            marginTop: "20px", 
            padding: "15px", 
            backgroundColor: "white", 
            borderRadius: "8px",
            border: "1px solid #e0e0e0"
          }}>
            <h4 style={{ margin: "0 0 10px", color: currentTheme.primaryColor }}>Theme Preview</h4>
            <div style={{ fontSize: "14px", color: "#666" }}>
              <p style={{ margin: "5px 0" }}><strong>Icon Color:</strong> {currentTheme.iconColor}</p>
              <p style={{ margin: "5px 0" }}><strong>Hover Color:</strong> {currentTheme.iconColorHover}</p>
              <p style={{ margin: "5px 0" }}><strong>Brand Color:</strong> {currentTheme.primaryColor}</p>
              <p style={{ margin: "5px 0" }}><strong>Position:</strong> {iconPosition} side, {iconOffset}px from edge</p>
              <p style={{ margin: "5px 0" }}><strong>Size:</strong> {(iconSize * 100).toFixed(0)}% of normal</p>
            </div>
          </div>
        </div>

        {/* Theme Customization Section */}
        <div style={{ 
          backgroundColor: "#ffffff", 
          padding: "30px", 
          borderRadius: "12px", 
          border: "1px solid #e9ecef"
        }}>
          <h2 style={{ color: "#495057", marginTop: "0", marginBottom: "20px" }}>Theme Customization</h2>
          
          {/* Preset Themes */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "16px", marginBottom: "15px", color: "#333" }}>Quick Presets</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handlePresetChange(key as keyof typeof THEME_PRESETS)}
                  style={{
                    padding: "10px 15px",
                    border: currentTheme.name === preset.name ? `2px solid ${preset.primaryColor}` : "1px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: currentTheme.name === preset.name ? `${preset.primaryColor}15` : "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: currentTheme.name === preset.name ? preset.primaryColor : "#333",
                    fontWeight: currentTheme.name === preset.name ? "600" : "normal"
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "16px", marginBottom: "15px", color: "#333" }}>Custom Colors</h3>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#666" }}>
                Icon Color
              </label>
              <input
                type="color"
                value={customTheme.iconColor}
                onChange={(e) => handleCustomChange('iconColor', e.target.value)}
                style={{ width: "100%", height: "40px", border: "1px solid #ddd", borderRadius: "4px" }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#666" }}>
                Icon Hover Color
              </label>
              <input
                type="color"
                value={customTheme.iconColorHover}
                onChange={(e) => handleCustomChange('iconColorHover', e.target.value)}
                style={{ width: "100%", height: "40px", border: "1px solid #ddd", borderRadius: "4px" }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#666" }}>
                Brand Color
              </label>
              <input
                type="color"
                value={customTheme.primaryColor}
                onChange={(e) => handleCustomChange('primaryColor', e.target.value)}
                style={{ width: "100%", height: "40px", border: "1px solid #ddd", borderRadius: "4px" }}
              />
            </div>
          </div>

          {/* Positioning & Size Controls */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "16px", marginBottom: "15px", color: "#333" }}>Position & Size</h3>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#666" }}>
                Icon Position
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIconPosition('left')}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: iconPosition === 'left' ? `2px solid ${currentTheme.primaryColor}` : "1px solid #ddd",
                    borderRadius: "6px",
                    backgroundColor: iconPosition === 'left' ? `${currentTheme.primaryColor}15` : "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: iconPosition === 'left' ? currentTheme.primaryColor : "#333",
                    fontWeight: iconPosition === 'left' ? "600" : "normal"
                  }}
                >
                  Left Side
                </button>
                <button
                  type="button"
                  onClick={() => setIconPosition('right')}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: iconPosition === 'right' ? `2px solid ${currentTheme.primaryColor}` : "1px solid #ddd",
                    borderRadius: "6px",
                    backgroundColor: iconPosition === 'right' ? `${currentTheme.primaryColor}15` : "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: iconPosition === 'right' ? currentTheme.primaryColor : "#333",
                    fontWeight: iconPosition === 'right' ? "600" : "normal"
                  }}
                >
                  Right Side
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#666" }}>
                Icon Distance from Edge: {iconOffset}px
              </label>
              <input
                type="range"
                min="4"
                max="20"
                value={iconOffset}
                onChange={(e) => setIconOffset(Number(e.target.value))}
                style={{ 
                  width: "100%", 
                  height: "6px",
                  borderRadius: "3px",
                  background: `linear-gradient(to right, ${currentTheme.primaryColor} 0%, ${currentTheme.primaryColor} ${((iconOffset - 4) / 16) * 100}%, #ddd ${((iconOffset - 4) / 16) * 100}%, #ddd 100%)`,
                  outline: "none",
                  appearance: "none"
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#999", marginTop: "5px" }}>
                <span>Close (4px)</span>
                <span>Far (20px)</span>
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#666" }}>
                Icon Size: {(iconSize * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.1"
                value={iconSize}
                onChange={(e) => setIconSize(Number(e.target.value))}
                style={{ 
                  width: "100%", 
                  height: "6px",
                  borderRadius: "3px",
                  background: `linear-gradient(to right, ${currentTheme.primaryColor} 0%, ${currentTheme.primaryColor} ${((iconSize - 0.8) / 0.6) * 100}%, #ddd ${((iconSize - 0.8) / 0.6) * 100}%, #ddd 100%)`,
                  outline: "none",
                  appearance: "none"
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#999", marginTop: "5px" }}>
                <span>Small (80%)</span>
                <span>Large (140%)</span>
              </div>
            </div>

            {/* Reset Positioning Button */}
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <button
                type="button"
                onClick={resetPositioning}
                style={{
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e9ecef",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  color: "#6c757d",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#e9ecef";
                  e.currentTarget.style.color = "#495057";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8f9fa";
                  e.currentTarget.style.color = "#6c757d";
                }}
              >
                🔄 Reset Positioning to Defaults
              </button>
            </div>
          </div>

          {/* Save Configuration */}
          <Form method="post">
            <input type="hidden" name="actionType" value="saveConfiguration" />
            <input type="hidden" name="themeConfig" value={JSON.stringify(customTheme)} />
            <input type="hidden" name="iconPosition" value={iconPosition} />
            <input type="hidden" name="iconOffset" value={iconOffset} />
            <input type="hidden" name="iconSize" value={iconSize} />
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px 20px",
                backgroundColor: currentTheme.primaryColor,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Save Theme Configuration
            </button>
          </Form>
        </div>
      </div>

      {/* Action Result */}
      {actionData && (
        <div style={{ 
          backgroundColor: actionData.success ? "#d4edda" : "#f8d7da",
          color: actionData.success ? "#155724" : "#721c24",
          padding: "15px",
          borderRadius: "6px",
          marginBottom: "20px",
          border: `1px solid ${actionData.success ? "#c3e6cb" : "#f5c6cb"}`
        }}>
          {actionData.success ? "✅" : "❌"} {(actionData as any).message || (actionData as any).error}
        </div>
      )}

      {/* Implementation Guide */}
      <div style={{ 
        backgroundColor: "#e7f3ff", 
        padding: "20px", 
        borderRadius: "8px", 
        border: "1px solid #b8daff"
      }}>
        <h3 style={{ color: "#004085", marginTop: "0" }}>How to Apply Your Custom Theme</h3>
        
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ color: "#004085", fontSize: "16px", marginBottom: "10px" }}>Option 1: Automatic (Recommended)</h4>
          <p style={{ color: "#004085", margin: "0 0 10px" }}>
            Your theme settings are automatically applied when you activate visual search. No additional steps needed!
          </p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ color: "#004085", fontSize: "16px", marginBottom: "10px" }}>Option 2: Manual Theme Override</h4>
          <p style={{ color: "#004085", margin: "0 0 10px" }}>
            Add this code to your theme.liquid file (before the closing &lt;/head&gt; tag):
          </p>
          <pre style={{ 
            backgroundColor: "#f8f9fa", 
            padding: "15px", 
            borderRadius: "4px",
            fontSize: "12px",
            overflow: "auto",
            border: "1px solid #dee2e6"
          }}>
            {generateScriptConfig()}
          </pre>
          
          {/* Update Live Script Button */}
          <div style={{ marginTop: "15px" }}>
            <Form method="post" style={{ display: "inline-block" }}>
              <input type="hidden" name="actionType" value="updateLiveScript" />
              <input type="hidden" name="themeConfig" value={JSON.stringify(customTheme)} />
              <input type="hidden" name="iconPosition" value={iconPosition} />
              <input type="hidden" name="iconOffset" value={iconOffset} />
              <input type="hidden" name="iconSize" value={iconSize} />
              <button
                type="submit"
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                🚀 Update Live Script with Current Settings
              </button>
            </Form>
            <p style={{ 
              color: "#666", 
              fontSize: "12px", 
              margin: "8px 0 0 0", 
              fontStyle: "italic" 
            }}>
              This will immediately apply your current preview settings to your live storefront
            </p>
          </div>
        </div>

        <div>
          <h4 style={{ color: "#004085", fontSize: "16px", marginBottom: "10px" }}>Features:</h4>
          <ul style={{ color: "#004085", paddingLeft: "20px", margin: "0" }}>
            <li>Smart positioning to avoid overlapping with existing search icons</li>
            <li>Responsive design that adapts to different input sizes</li>
            <li>Google-style hover animations and interactions</li>
            <li>Accessibility support with keyboard navigation</li>
            <li>Works with all Shopify themes automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
