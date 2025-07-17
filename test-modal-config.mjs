#!/usr/bin/env node

// Test script to verify modal configuration is being saved and served correctly
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function testModalConfig() {
  try {
    console.log("🧪 Testing Modal Configuration Save/Load...\n");
    
    // Import the database service
    const { appDatabase } = await import('./app/services/app.database.service.js');
    
    const testShop = "pixel-dress-store.myshopify.com";
    
    // Test configuration with modal settings
    const testConfig = {
      name: "Test Theme",
      iconColor: "#ff0000",
      iconColorHover: "#cc0000", 
      iconBackgroundHover: "rgba(255, 0, 0, 0.1)",
      primaryColor: "#0080ff",
      primaryColorDark: "#0066cc",
      iconPosition: "left",
      iconOffset: 12,
      iconSizeMultiplier: 1.2,
      modal: {
        widthMode: "medium",
        widthPercentage: 80,
        widthMaxPixels: 1200,
        heightMode: "large", 
        heightPercentage: 85,
        heightMaxPixels: 900,
        mobileFullscreen: false,
        verticalPosition: "top",
        horizontalPosition: "center"
      }
    };
    
    console.log("💾 Saving test configuration to database...");
    console.log("Config to save:", JSON.stringify(testConfig, null, 2));
    
    // Save the test configuration
    await appDatabase.updateStore(testShop, { themeConfig: testConfig });
    console.log("✅ Configuration saved successfully!\n");
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("📖 Reading configuration back from database...");
    const savedData = await appDatabase.getStore(testShop);
    
    if (savedData && savedData.themeConfig) {
      console.log("✅ Configuration retrieved from database:");
      console.log(JSON.stringify(savedData.themeConfig, null, 2));
      
      // Check if modal config is preserved
      if (savedData.themeConfig.modal) {
        console.log("\n🎉 Modal configuration is properly saved:");
        console.log("Modal config:", JSON.stringify(savedData.themeConfig.modal, null, 2));
      } else {
        console.log("\n❌ Modal configuration is missing from saved data!");
      }
    } else {
      console.log("❌ No configuration found in database!");
    }
    
    console.log("\n🔗 Test complete! Check your browser network tab when loading the script URL:");
    console.log("Script URL: https://your-app-domain.com/visual-search-unified.js?shop=" + encodeURIComponent(testShop));
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testModalConfig();
