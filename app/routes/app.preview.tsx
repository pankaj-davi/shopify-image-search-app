import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useActionData, Form } from '@remix-run/react';
import { authenticate } from '../shopify.server';
import { useState, useEffect } from 'react';
import { appDatabase } from '../services/app.database.service';
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
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import { POLARIS_THEME_PRESETS } from '../utils/theme-presets';

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
    console.error('Failed to load current theme config:', error);
  }

  // Get the actual app URL from the request or environment
  const url = new URL(request.url);
  const appUrl = process.env.SHOPIFY_APP_URL || `${url.protocol}//${url.host}`;

  return json({
    shop: session.shop,
    appUrl,
    currentThemeConfig,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get('actionType') as string;

  if (actionType === 'updateLiveScript') {
    // Handle live script update action
    const themeConfig = JSON.parse(formData.get('themeConfig') as string);
    const iconPosition = (formData.get('iconPosition') as string) || 'right';
    const iconOffset = parseInt(formData.get('iconOffset') as string) || 8;
    const iconSize = parseFloat(formData.get('iconSize') as string) || 1.0;

    // Get the actual app URL from the request
    const url = new URL(request.url);
    const requestAppUrl = `${url.protocol}//${url.host}`;
    const envAppUrl = process.env.SHOPIFY_APP_URL;
    const finalAppUrl = envAppUrl || requestAppUrl;

    console.log('[Preview Update Script] URL debugging:', {
      envAppUrl,
      requestAppUrl,
      finalAppUrl,
      themeConfig,
      iconPosition,
      iconOffset,
      iconSize,
      shop: session.shop,
    });

    try {
      // Combine theme configuration with positioning settings
      const fullThemeConfig = {
        ...themeConfig,
        iconPosition,
        iconOffset,
        iconSizeMultiplier: iconSize,
      };

      // Save the configuration to database first
      const { appDatabase } = await import('../services/app.database.service');
      await appDatabase.updateStore(session.shop, {
        themeConfig: fullThemeConfig,
      });
      console.log('[Preview Update Script] Theme config saved to database');

      // Wait a moment to ensure database transaction is complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reinject the script with new configuration
      const { ScriptInjectionService } = await import(
        '../services/script-injection.service'
      );
      console.log('[Preview Update Script] Starting script reinjection...');
      const scriptResult =
        await ScriptInjectionService.injectVisualSearchScript(
          admin,
          session.shop,
          finalAppUrl
        );
      console.log(
        '[Preview Update Script] Script injection result:',
        scriptResult
      );

      if (!scriptResult.success) {
        throw new Error(scriptResult.error || 'Failed to update script');
      }

      return json({
        success: true,
        message: `🚀 Live script updated successfully! Your visual search is now using the current preview settings on your storefront. Changes should appear within a few moments. (App URL: ${finalAppUrl})`,
        themeConfig: fullThemeConfig,
        scriptStatus: scriptResult,
      });
    } catch (error) {
      console.error('Failed to update live script:', error);
      return json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update live script',
      });
    }
  }

  // Handle regular save action (default case or "saveConfiguration")
  const themeConfig = JSON.parse(formData.get('themeConfig') as string);
  const iconPosition = (formData.get('iconPosition') as string) || 'right';
  const iconOffset = parseInt(formData.get('iconOffset') as string) || 8;
  const iconSize = parseFloat(formData.get('iconSize') as string) || 1.0;

  // Get the actual app URL from the request
  const url = new URL(request.url);
  const requestAppUrl = `${url.protocol}//${url.host}`;
  const envAppUrl = process.env.SHOPIFY_APP_URL;
  const finalAppUrl = envAppUrl || requestAppUrl;

  console.log('[Preview Save] Received configuration:', {
    themeConfig,
    iconPosition,
    iconOffset,
    iconSize,
    shop: session.shop,
    finalAppUrl,
  });

  try {
    // Combine theme configuration with positioning settings
    const fullThemeConfig = {
      ...themeConfig,
      iconPosition,
      iconOffset,
      iconSizeMultiplier: iconSize,
    };

    console.log('[Preview Save] Full theme config to save:', fullThemeConfig);

    // Save the complete theme configuration to the database
    const { appDatabase } = await import('../services/app.database.service');
    await appDatabase.updateStore(session.shop, {
      themeConfig: fullThemeConfig,
    });
    console.log('[Preview Save] Theme config saved to database');

    // Wait a moment to ensure database transaction is complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify the save by reading it back
    const verifyStore = await appDatabase.getStore(session.shop);
    console.log(
      '[Preview Save] Verification - stored config:',
      verifyStore?.themeConfig
    );

    // Reinject the script with new configuration
    const { ScriptInjectionService } = await import(
      '../services/script-injection.service'
    );
    console.log('[Preview Save] Starting script reinjection...');
    const scriptResult = await ScriptInjectionService.injectVisualSearchScript(
      admin,
      session.shop,
      finalAppUrl
    );
    console.log('[Preview Save] Script injection result:', scriptResult);

    if (!scriptResult.success) {
      throw new Error(scriptResult.error || 'Failed to update script');
    }

    return json({
      success: true,
      message:
        '✅ Theme configuration saved and applied! Your new visual search settings are now live on your storefront. Changes may take a few moments to appear.',
      themeConfig: fullThemeConfig,
      scriptStatus: scriptResult,
    });
  } catch (error) {
    console.error('Failed to save theme config and update script:', error);
    return json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to save configuration',
    });
  }
}

export default function PreviewPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [currentTheme, setCurrentTheme] = useState(
    POLARIS_THEME_PRESETS.pinterest
  );
  const [customTheme, setCustomTheme] = useState(
    POLARIS_THEME_PRESETS.pinterest
  );
  const [iconPosition, setIconPosition] = useState<'left' | 'right'>('right');
  const [iconOffset, setIconOffset] = useState(8);
  const [iconSize, setIconSize] = useState(1.0);
  const [showColorPickers, setShowColorPickers] = useState(false);

  // Initialize state with loaded theme configuration
  useEffect(() => {
    if (
      data.currentThemeConfig &&
      Object.keys(data.currentThemeConfig).length > 0
    ) {
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
        name: 'Saved Theme',
        iconColor:
          config.iconColor || POLARIS_THEME_PRESETS.pinterest.iconColor,
        iconColorHover:
          config.iconColorHover ||
          POLARIS_THEME_PRESETS.pinterest.iconColorHover,
        iconBackgroundHover:
          config.iconBackgroundHover ||
          POLARIS_THEME_PRESETS.pinterest.iconBackgroundHover,
        primaryColor:
          config.primaryColor || POLARIS_THEME_PRESETS.pinterest.primaryColor,
        primaryColorDark:
          config.primaryColorDark ||
          POLARIS_THEME_PRESETS.pinterest.primaryColorDark,
      };

      setCurrentTheme(savedTheme);
      setCustomTheme(savedTheme);

      console.log('[Preview] Loaded theme config from database:', config);
    }
  }, [data.currentThemeConfig]);

  const resetPositioning = () => {
    setIconPosition('right');
    setIconOffset(8);
    setIconSize(1.0);
    console.log('[Preview] Reset positioning to defaults');
  };

  const handlePresetChange = (preset: keyof typeof POLARIS_THEME_PRESETS) => {
    const theme = POLARIS_THEME_PRESETS[preset];
    setCurrentTheme(theme);
    setCustomTheme(theme);
  };

  const handleCustomColorChange = (
    colorType: 'iconColor' | 'iconColorHover' | 'primaryColor',
    newColor: string
  ) => {
    const updatedTheme = {
      ...customTheme,
      [colorType]: newColor,
      name: 'Custom Theme',
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
            tone={actionData.success ? 'success' : 'critical'}
            title={actionData.success ? 'Configuration Saved!' : 'Error'}
          >
            {(actionData as any).message || (actionData as any).error}
          </Banner>
        )}

        <InlineStack gap="500" align="start" wrap={false}>
          {/* Live Preview Section */}
          <Box width="50%" minWidth="400px">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Live Preview
                </Text>

                {/* Desktop Search Bar Demo */}
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    Desktop Search Bar
                  </Text>
                  <Box position="relative">
                    <input
                      type="search"
                      placeholder="Search products..."
                      style={{
                        width: '100%',
                        padding:
                          iconPosition === 'left'
                            ? `12px 16px 12px ${50 + iconOffset}px`
                            : `12px ${50 + iconOffset}px 12px 16px`,
                        border:
                          'var(--p-border-width-025) solid var(--p-color-border)',
                        borderRadius: 'var(--p-border-radius-400)',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: 'var(--p-color-bg-surface)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        [iconPosition]: `${iconOffset + 4}px`,
                        [iconPosition === 'left' ? 'right' : 'left']: 'auto',
                        transform: 'translateY(-50%)',
                        width: `${24 * iconSize}px`,
                        height: `${24 * iconSize}px`,
                        cursor: 'pointer',
                        opacity: '0.7',
                        color: currentTheme.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 'var(--p-border-radius-050)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.backgroundColor =
                          currentTheme.iconBackgroundHover;
                        e.currentTarget.style.borderRadius = '50%';
                        e.currentTarget.style.color =
                          currentTheme.iconColorHover;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.opacity = '0.7';
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderRadius =
                          'var(--p-border-radius-050)';
                        e.currentTarget.style.color = currentTheme.iconColor;
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        width={`${20 * iconSize}`}
                        height={`${20 * iconSize}`}
                      >
                        <path
                          d="M9 2l.75 3h4.5L15 2z"
                          fill="currentColor"
                          opacity="0.8"
                        />
                        <rect
                          x="2"
                          y="6"
                          width="20"
                          height="12"
                          rx="2"
                          ry="2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <rect
                          x="3"
                          y="7"
                          width="18"
                          height="10"
                          rx="1"
                          ry="1"
                          fill="currentColor"
                          opacity="0.1"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="2"
                          fill="currentColor"
                          opacity="0.3"
                        />
                        <circle cx="17" cy="9" r="0.8" fill="currentColor" />
                      </svg>
                    </div>
                  </Box>
                </BlockStack>

                {/* Mobile Search Demo */}
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    Mobile Search Bar
                  </Text>
                  <Box position="relative" maxWidth="300px">
                    <input
                      type="search"
                      placeholder="Search..."
                      style={{
                        width: '100%',
                        padding:
                          iconPosition === 'left'
                            ? `10px 12px 10px ${40 + iconOffset}px`
                            : `10px ${40 + iconOffset}px 10px 12px`,
                        border:
                          'var(--p-border-width-025) solid var(--p-color-border)',
                        borderRadius: 'var(--p-border-radius-400)',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: 'var(--p-color-bg-surface)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        [iconPosition]: `${iconOffset}px`,
                        transform: 'translateY(-50%)',
                        width: `${20 * iconSize}px`,
                        height: `${20 * iconSize}px`,
                        cursor: 'pointer',
                        opacity: '0.7',
                        color: currentTheme.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        width={`${16 * iconSize}`}
                        height={`${16 * iconSize}`}
                      >
                        <path
                          d="M9 2l.75 3h4.5L15 2z"
                          fill="currentColor"
                          opacity="0.8"
                        />
                        <rect
                          x="2"
                          y="6"
                          width="20"
                          height="12"
                          rx="2"
                          ry="2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="2"
                          fill="currentColor"
                          opacity="0.3"
                        />
                        <circle cx="17" cy="9" r="0.8" fill="currentColor" />
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
                          <Text as="span" fontWeight="semibold">
                            Icon Color:
                          </Text>
                        </Text>
                        <InlineStack gap="100" align="center">
                          <div
                            style={{
                              backgroundColor: currentTheme.iconColor,
                              border:
                                'var(--p-border-width-025) solid var(--p-color-border)',
                              borderRadius: 'var(--p-border-radius-050)',
                              width: '40px',
                              height: '20px',
                              minWidth: '40px',
                              minHeight: '20px',
                            }}
                          />
                          <Text as="span" variant="bodySm" tone="subdued">
                            {currentTheme.iconColor}
                          </Text>
                        </InlineStack>
                      </InlineStack>

                      <InlineStack gap="200" align="space-between">
                        <Text as="p" variant="bodyMd">
                          <Text as="span" fontWeight="semibold">
                            Hover Color:
                          </Text>
                        </Text>
                        <InlineStack gap="100" align="center">
                          <div
                            style={{
                              backgroundColor: currentTheme.iconColorHover,
                              border:
                                'var(--p-border-width-025) solid var(--p-color-border)',
                              borderRadius: 'var(--p-border-radius-050)',
                              width: '40px',
                              height: '20px',
                              minWidth: '40px',
                              minHeight: '20px',
                            }}
                          />
                          <Text as="span" variant="bodySm" tone="subdued">
                            {currentTheme.iconColorHover}
                          </Text>
                        </InlineStack>
                      </InlineStack>

                      <InlineStack gap="200" align="space-between">
                        <Text as="p" variant="bodyMd">
                          <Text as="span" fontWeight="semibold">
                            Brand Color:
                          </Text>
                        </Text>
                        <InlineStack gap="100" align="center">
                          <div
                            style={{
                              backgroundColor: currentTheme.primaryColor,
                              border:
                                'var(--p-border-width-025) solid var(--p-color-border)',
                              borderRadius: 'var(--p-border-radius-050)',
                              width: '40px',
                              height: '20px',
                              minWidth: '40px',
                              minHeight: '20px',
                            }}
                          />
                          <Text as="span" variant="bodySm" tone="subdued">
                            {currentTheme.primaryColor}
                          </Text>
                        </InlineStack>
                      </InlineStack>

                      <Text as="p" variant="bodyMd">
                        <Text as="span" fontWeight="semibold">
                          Position:
                        </Text>{' '}
                        {iconPosition} side, {iconOffset}px from edge
                      </Text>
                      <Text as="p" variant="bodyMd">
                        <Text as="span" fontWeight="semibold">
                          Size:
                        </Text>{' '}
                        {(iconSize * 100).toFixed(0)}% of normal
                      </Text>
                    </BlockStack>
                  </BlockStack>
                </Card>
              </BlockStack>
            </Card>
          </Box>

          {/* Customization Section */}
          <Box width="50%" minWidth="400px">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Theme Customization
                </Text>

                {/* Preset Themes */}
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Quick Presets
                  </Text>
                  <InlineStack gap="200" wrap>
                    {Object.entries(POLARIS_THEME_PRESETS).map(
                      ([key, preset]) => (
                        <Button
                          key={key}
                          onClick={() =>
                            handlePresetChange(
                              key as keyof typeof POLARIS_THEME_PRESETS
                            )
                          }
                          variant={
                            currentTheme.name === preset.name
                              ? 'primary'
                              : 'secondary'
                          }
                          size="medium"
                        >
                          {preset.name}
                        </Button>
                      )
                    )}
                  </InlineStack>
                </BlockStack>

                {/* Custom Colors */}
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    Custom Colors
                  </Text>

                  <BlockStack gap="200">
                    <Text as="h4" variant="headingXs">
                      Icon Color
                    </Text>
                    <InlineStack gap="200" align="center">
                      <div
                        style={{
                          backgroundColor: customTheme.iconColor,
                          border:
                            'var(--p-border-width-025) solid var(--p-color-border)',
                          borderRadius: 'var(--p-border-radius-100)',
                          width: '30px',
                          height: '30px',
                          cursor: 'pointer',
                        }}
                        onClick={() => setShowColorPickers(!showColorPickers)}
                      />
                      <input
                        type="color"
                        value={customTheme.iconColor}
                        onChange={e =>
                          handleCustomColorChange('iconColor', e.target.value)
                        }
                        style={{
                          border:
                            'var(--p-border-width-025) solid var(--p-color-border)',
                          borderRadius: 'var(--p-border-radius-100)',
                          padding: 'var(--p-space-100)',
                          backgroundColor: 'var(--p-color-bg-surface)',
                          cursor: 'pointer',
                        }}
                      />
                      <Text as="span" variant="bodySm" tone="subdued">
                        {customTheme.iconColor}
                      </Text>
                    </InlineStack>
                  </BlockStack>

                  <BlockStack gap="200">
                    <Text as="h4" variant="headingXs">
                      Hover Color
                    </Text>
                    <InlineStack gap="200" align="center">
                      <div
                        style={{
                          backgroundColor: customTheme.iconColorHover,
                          border:
                            'var(--p-border-width-025) solid var(--p-color-border)',
                          borderRadius: 'var(--p-border-radius-100)',
                          width: '30px',
                          height: '30px',
                          cursor: 'pointer',
                        }}
                      />
                      <input
                        type="color"
                        value={customTheme.iconColorHover}
                        onChange={e =>
                          handleCustomColorChange(
                            'iconColorHover',
                            e.target.value
                          )
                        }
                        style={{
                          border:
                            'var(--p-border-width-025) solid var(--p-color-border)',
                          borderRadius: 'var(--p-border-radius-100)',
                          padding: 'var(--p-space-100)',
                          backgroundColor: 'var(--p-color-bg-surface)',
                          cursor: 'pointer',
                        }}
                      />
                      <Text as="span" variant="bodySm" tone="subdued">
                        {customTheme.iconColorHover}
                      </Text>
                    </InlineStack>
                  </BlockStack>

                  <BlockStack gap="200">
                    <Text as="h4" variant="headingXs">
                      Brand Color
                    </Text>
                    <InlineStack gap="200" align="center">
                      <div
                        style={{
                          backgroundColor: customTheme.primaryColor,
                          border:
                            'var(--p-border-width-025) solid var(--p-color-border)',
                          borderRadius: 'var(--p-border-radius-100)',
                          width: '30px',
                          height: '30px',
                          cursor: 'pointer',
                        }}
                      />
                      <input
                        type="color"
                        value={customTheme.primaryColor}
                        onChange={e =>
                          handleCustomColorChange(
                            'primaryColor',
                            e.target.value
                          )
                        }
                        style={{
                          border:
                            'var(--p-border-width-025) solid var(--p-color-border)',
                          borderRadius: 'var(--p-border-radius-100)',
                          padding: 'var(--p-space-100)',
                          backgroundColor: 'var(--p-color-bg-surface)',
                          cursor: 'pointer',
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
                  <Text as="h3" variant="headingSm">
                    Position & Size
                  </Text>

                  <InlineStack gap="200">
                    <Button
                      onClick={() => setIconPosition('left')}
                      variant={
                        iconPosition === 'left' ? 'primary' : 'secondary'
                      }
                      size="medium"
                    >
                      Left Side
                    </Button>
                    <Button
                      onClick={() => setIconPosition('right')}
                      variant={
                        iconPosition === 'right' ? 'primary' : 'secondary'
                      }
                      size="medium"
                    >
                      Right Side
                    </Button>
                  </InlineStack>

                  <div>
                    <Text as="p" variant="bodyMd">
                      Icon Distance from Edge: {iconOffset}px
                    </Text>
                    <RangeSlider
                      label=""
                      value={iconOffset}
                      min={4}
                      max={20}
                      onChange={value =>
                        setIconOffset(Array.isArray(value) ? value[0] : value)
                      }
                    />
                  </div>

                  <div>
                    <Text as="p" variant="bodyMd">
                      Icon Size: {(iconSize * 100).toFixed(0)}%
                    </Text>
                    <RangeSlider
                      label=""
                      value={iconSize}
                      min={0.8}
                      max={1.4}
                      step={0.1}
                      onChange={value =>
                        setIconSize(Array.isArray(value) ? value[0] : value)
                      }
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

                {/* Save Configuration */}
                <Form method="post">
                  <input
                    type="hidden"
                    name="actionType"
                    value="saveConfiguration"
                  />
                  <input
                    type="hidden"
                    name="themeConfig"
                    value={JSON.stringify(customTheme)}
                  />
                  <input
                    type="hidden"
                    name="iconPosition"
                    value={iconPosition}
                  />
                  <input type="hidden" name="iconOffset" value={iconOffset} />
                  <input type="hidden" name="iconSize" value={iconSize} />
                  <Button submit variant="primary" size="large" fullWidth>
                    Save Theme Configuration
                  </Button>
                </Form>
              </BlockStack>
            </Card>
          </Box>
        </InlineStack>

        {/* Implementation Guide */}
        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">
              How to Apply Your Custom Theme
            </Text>

            <BlockStack gap="200">
              <Text as="h4" variant="headingSm">
                Option 1: Automatic (Recommended)
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Your theme settings are automatically applied when you activate
                visual search. No additional steps needed!
              </Text>
            </BlockStack>

            <BlockStack gap="200">
              <Text as="h4" variant="headingSm">
                Option 2: Manual Theme Override
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Add this code to your theme.liquid file to override the default
                styling:
              </Text>
              <Box
                background="bg-surface-secondary"
                padding="400"
                borderRadius="200"
                borderWidth="025"
                borderColor="border"
              >
                <pre
                  style={{
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    margin: 0,
                  }}
                >
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
