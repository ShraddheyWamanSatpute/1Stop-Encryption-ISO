/**
 * Centralized Theme Colors
 * Use these constants for inline styles and non-MUI components
 * This ensures consistency across the entire application
 */

export const THEME_COLORS = {
  // Core Brand Colors (3-color palette)
  navy: '#17234e',
  offWhite: '#f8f9fa',
  lightBlue: '#4a90e2',
  
  // Extended Palette
  navyLight: '#2d3a66',
  navyDark: '#0d1429',
  lightBlueDark: '#3a7bc8',
  lightBlueLight: '#6ba4e8',
  white: '#ffffff',
  
  // Text Colors
  textPrimary: '#17234e',
  textSecondary: 'rgba(23, 35, 78, 0.7)',
  textDisabled: 'rgba(23, 35, 78, 0.4)',
  textOnNavy: '#ffffff',
  
  // Status Colors
  error: '#d32f2f',
  errorLight: '#ef5350',
  warning: '#ed6c02',
  warningLight: '#ff9800',
  success: '#2e7d32',
  successLight: '#4caf50',
  
  // UI Colors
  divider: 'rgba(23, 35, 78, 0.12)',
  border: 'rgba(23, 35, 78, 0.12)',
  hoverOverlay: 'rgba(74, 144, 226, 0.08)',
  selectedOverlay: 'rgba(74, 144, 226, 0.12)',
  
  // Background Colors
  backgroundDefault: '#f8f9fa',
  backgroundPaper: '#ffffff',
  backgroundNavy: '#17234e',
} as const;

export const THEME_FONT_SIZES = {
  xs: '0.75rem',   // 12px - Small labels, captions
  sm: '0.875rem',  // 14px - Secondary text, small buttons
  md: '1rem',      // 16px - Body text, standard UI
  lg: '1.25rem',   // 20px - Section headers, large buttons
  xl: '1.5rem',    // 24px - Page titles, major headings
} as const;

export const THEME_SPACING = {
  xs: 4,   // 4px
  sm: 8,   // 8px
  md: 16,  // 16px
  lg: 24,  // 24px
  xl: 32,  // 32px
  xxl: 48, // 48px
} as const;

