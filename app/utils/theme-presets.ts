// Polaris-compatible theme presets that work with light and dark modes
export const POLARIS_THEME_PRESETS = {
  google: {
    name: 'Google Style',
    // Use Polaris text colors that adapt to theme
    iconColor: 'var(--p-color-text-secondary)',
    iconColorHover: 'var(--p-color-text)',
    iconBackgroundHover: 'var(--p-color-bg-surface-hover)',
    primaryColor: 'var(--p-color-bg-fill-brand)',
    primaryColorDark: 'var(--p-color-bg-fill-brand-active)',
  },
  pinterest: {
    name: 'Pinterest Style',
    iconColor: 'var(--p-color-text-secondary)',
    iconColorHover: '#E60023', // Pinterest brand color - keeps brand identity
    iconBackgroundHover: 'var(--p-color-bg-surface-hover)',
    primaryColor: '#E60023',
    primaryColorDark: '#BD081C',
  },
  minimal: {
    name: 'Minimal',
    iconColor: 'var(--p-color-text-subdued)',
    iconColorHover: 'var(--p-color-text)',
    iconBackgroundHover: 'var(--p-color-bg-surface-hover)',
    primaryColor: 'var(--p-color-text)',
    primaryColorDark: 'var(--p-color-text-strong)',
  },
  brand: {
    name: 'Your Brand',
    iconColor: 'var(--p-color-text-secondary)',
    iconColorHover: 'var(--p-color-text)',
    iconBackgroundHover: 'var(--p-color-bg-surface-hover)',
    primaryColor: 'var(--p-color-bg-fill-brand)',
    primaryColorDark: 'var(--p-color-bg-fill-brand-active)',
  },
  // New Shopify-native preset using Polaris design tokens
  shopify: {
    name: 'Shopify Native',
    iconColor: 'var(--p-color-icon-secondary)',
    iconColorHover: 'var(--p-color-icon)',
    iconBackgroundHover: 'var(--p-color-bg-surface-hover)',
    primaryColor: 'var(--p-color-bg-fill-brand)',
    primaryColorDark: 'var(--p-color-bg-fill-brand-active)',
  },
};

// Fallback colors for when CSS variables aren't available
export const FALLBACK_COLORS = {
  light: {
    textPrimary: '#202223',
    textSecondary: '#6D7175',
    textSubdued: '#8C9196',
    bgSurface: '#FFFFFF',
    bgSurfaceHover: '#F6F6F7',
    brandPrimary: '#008060',
    brandActive: '#004C3F',
  },
  dark: {
    textPrimary: '#E3E3E3',
    textSecondary: '#B5B5B5',
    textSubdued: '#8C9196',
    bgSurface: '#1A1A1A',
    bgSurfaceHover: '#262626',
    brandPrimary: '#00A47C',
    brandActive: '#00D9A7',
  },
};

// Helper function to get theme-aware color
export function getThemeColor(
  token: string,
  theme: 'light' | 'dark' = 'light'
): string {
  // Map Polaris tokens to fallback colors
  const tokenMap: Record<string, keyof typeof FALLBACK_COLORS.light> = {
    'var(--p-color-text)': 'textPrimary',
    'var(--p-color-text-secondary)': 'textSecondary',
    'var(--p-color-text-subdued)': 'textSubdued',
    'var(--p-color-bg-surface)': 'bgSurface',
    'var(--p-color-bg-surface-hover)': 'bgSurfaceHover',
    'var(--p-color-bg-fill-brand)': 'brandPrimary',
    'var(--p-color-bg-fill-brand-active)': 'brandActive',
    'var(--p-color-icon)': 'textPrimary',
    'var(--p-color-icon-secondary)': 'textSecondary',
  };

  const fallbackKey = tokenMap[token];
  if (fallbackKey) {
    return FALLBACK_COLORS[theme][fallbackKey];
  }

  return token; // Return original if no mapping found
}
