// Debug script to check modal configuration in database
const { appDatabase } = require('./app/services/app.database.service');

async function checkModalConfig() {
  try {
    console.log('🔍 Checking modal configuration in database...');
    
    // You'll need to replace 'YOUR_SHOP_DOMAIN' with your actual shop domain
    const shopDomain = process.argv[2] || 'your-shop-domain.myshopify.com';
    
    console.log(`📋 Checking configuration for shop: ${shopDomain}`);
    
    const storeData = await appDatabase.getStore(shopDomain);
    
    if (!storeData) {
      console.log('❌ No store data found in database');
      return;
    }
    
    console.log('✅ Store data found:');
    console.log('📊 Full store data:', JSON.stringify(storeData, null, 2));
    
    if (storeData.themeConfig) {
      console.log('🎨 Theme config exists:');
      console.log('📝 Theme config:', JSON.stringify(storeData.themeConfig, null, 2));
      
      if (storeData.themeConfig.modal) {
        console.log('🖼️ Modal config found:');
        console.log('⚙️ Modal config:', JSON.stringify(storeData.themeConfig.modal, null, 2));
      } else {
        console.log('❌ No modal config found in themeConfig');
      }
    } else {
      console.log('❌ No themeConfig found in store data');
    }
    
    // Test saving a modal config
    console.log('\n🧪 Testing modal config save...');
    const testModalConfig = {
      widthMode: 'fullwidth',
      widthPercentage: 95,
      widthMaxPixels: 1600,
      heightMode: 'fullheight',
      heightPercentage: 90,
      heightMaxPixels: 800,
      mobileFullscreen: true,
      verticalPosition: 'center',
      horizontalPosition: 'center'
    };
    
    const testThemeConfig = {
      ...storeData.themeConfig,
      modal: testModalConfig,
      testTimestamp: new Date().toISOString()
    };
    
    await appDatabase.updateStore(shopDomain, { themeConfig: testThemeConfig });
    console.log('💾 Test save completed');
    
    // Verify the save
    const verifyData = await appDatabase.getStore(shopDomain);
    console.log('🔍 Verification result:');
    console.log('✅ Saved themeConfig:', JSON.stringify(verifyData?.themeConfig, null, 2));
    
  } catch (error) {
    console.error('❌ Error checking modal config:', error);
  }
}

// Run the check
checkModalConfig().then(() => {
  console.log('🏁 Debug check completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
