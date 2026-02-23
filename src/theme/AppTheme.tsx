import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import type { ReactNode } from 'react';

// Centralized theme configuration
// Modify these values to change the entire application's appearance
const themeConfig = {
  // Core Brand Colors (3-color palette)
  brandColors: {
    navy: '#17234e',        // Main navy blue for navigation and headers
    offWhite: '#f8f9fa',    // Off-white for backgrounds
    lightBlue: '#4a90e2',   // Light blue for accents and interactive elements
  },

  // Color Palette
  colors: {
    primary: {
      main: '#17234e',       // Navy blue
      light: '#2d3a66',
      dark: '#0d1429',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4a90e2',       // Light blue accent
      light: '#6ba4e8',
      dark: '#3a7bc8',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
      contrastText: '#ffffff',
    },
    info: {
      main: '#4a90e2',       // Light blue accent
      light: '#6ba4e8',
      dark: '#3a7bc8',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',    // Off-white background
      paper: '#ffffff',       // White for cards/elevated surfaces
    },
    text: {
      primary: '#17234e',     // Navy for primary text
      secondary: 'rgba(23, 35, 78, 0.7)', // Navy at 70% opacity
      disabled: 'rgba(23, 35, 78, 0.4)',  // Navy at 40% opacity
    },
    divider: 'rgba(23, 35, 78, 0.12)',
  },

  // Typography - 5 Font Size Scale
  fontSizes: {
    xs: '0.75rem',   // 12px - Small labels, captions
    sm: '0.875rem',  // 14px - Secondary text, small buttons
    md: '1rem',      // 16px - Body text, standard UI
    lg: '1.25rem',   // 20px - Section headers, large buttons
    xl: '1.5rem',    // 24px - Page titles, major headings
  },

  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    
    // Heading sizes (using our 5-size scale)
    h1: {
      fontSize: '1.5rem',   // xl - 24px - Page titles
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h2: {
      fontSize: '1.25rem', // lg - 20px - Section headers
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1rem',    // md - 16px - Subsection headers
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '0.875rem', // sm - 14px - Small headers
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '0.875rem', // sm - 14px
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '0.75rem',  // xs - 12px
      fontWeight: 500,
      lineHeight: 1.4,
    },
    
    // Body text
    body1: {
      fontSize: '1rem',     // md - 16px - Main body text
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem', // sm - 14px - Secondary text
      fontWeight: 400,
      lineHeight: 1.5,
    },
    
    // Button text
    button: {
      fontSize: '0.875rem', // sm - 14px
      fontWeight: 500,
      lineHeight: 1.75,
      textTransform: 'none' as const,
    },
    
    // Caption and overline
    caption: {
      fontSize: '0.75rem',  // xs - 12px
      fontWeight: 400,
      lineHeight: 1.5,
    },
    overline: {
      fontSize: '0.75rem',  // xs - 12px
      fontWeight: 400,
      lineHeight: 1.5,
      textTransform: 'uppercase' as const,
    },
  },

  // Spacing (reduced by 10% for global scale)
  spacing: 7.2, // Base spacing unit (7.2px = 8px * 0.9)

  // Border radius
  borderRadius: 4,

  // Shadows
  shadows: {
    elevation1: '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    elevation2: '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
    elevation3: '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
    elevation4: '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
  },

  // Component-specific overrides
  components: {
    // Card styling
    card: {
      padding: 16,
      borderRadius: 8,
      boxShadow: '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    },
    
    // Button styling
    button: {
      borderRadius: 4,
      padding: '8px 16px',
      minHeight: 36,
    },
    
    // Input styling
    input: {
      borderRadius: 4,
      padding: '8px 12px',
    },
    
    // Table styling
    table: {
      headerBackground: '#f8f9fa',  // Off-white
      borderColor: 'rgba(23, 35, 78, 0.12)',
    },
    
    // Sidebar styling - Navy Blue
    sidebar: {
      width: 280,
      backgroundColor: '#17234e',  // Navy blue
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    
    // Header styling - Navy Blue (matches sidebar)
    header: {
      height: 64,
      backgroundColor: '#17234e',  // Navy blue
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    
    // Additional component configurations
    chip: {
      borderRadius: 16,
      fontSize: '0.75rem',
    },
    
    dialog: {
      borderRadius: 8,
      padding: 24,
    },
    
    menu: {
      borderRadius: 4,
      elevation: 3,
    },
    
    list: {
      itemPadding: '8px 16px',
      itemBorderRadius: 4,
    },
  },
};

// Create the MUI theme using our configuration
const theme = createTheme({
  palette: {
    primary: themeConfig.colors.primary,
    secondary: themeConfig.colors.secondary,
    error: themeConfig.colors.error,
    warning: themeConfig.colors.warning,
    info: themeConfig.colors.info,
    success: themeConfig.colors.success,
    background: themeConfig.colors.background,
    text: themeConfig.colors.text,
    divider: themeConfig.colors.divider,
  },
  typography: {
    fontFamily: themeConfig.typography.fontFamily,
    fontSize: themeConfig.typography.fontSize,
    fontWeightLight: themeConfig.typography.fontWeightLight,
    fontWeightRegular: themeConfig.typography.fontWeightRegular,
    fontWeightMedium: themeConfig.typography.fontWeightMedium,
    fontWeightBold: themeConfig.typography.fontWeightBold,
    h1: themeConfig.typography.h1,
    h2: themeConfig.typography.h2,
    h3: themeConfig.typography.h3,
    h4: themeConfig.typography.h4,
    h5: themeConfig.typography.h5,
    h6: themeConfig.typography.h6,
    body1: themeConfig.typography.body1,
    body2: themeConfig.typography.body2,
    button: themeConfig.typography.button,
    caption: themeConfig.typography.caption,
    overline: themeConfig.typography.overline,
  },
  spacing: themeConfig.spacing,
  shape: {
    borderRadius: themeConfig.borderRadius,
  },
  components: {
    // Global component overrides
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: themeConfig.colors.background.default,
          fontFamily: themeConfig.typography.fontFamily,
        },
        '#root': {
          backgroundColor: themeConfig.colors.background.default,
          minHeight: '100vh',
        },
      },
    },
    
    // Cards
    MuiCard: {
      styleOverrides: {
        root: {
          padding: themeConfig.components.card.padding,
          borderRadius: themeConfig.components.card.borderRadius,
          boxShadow: themeConfig.components.card.boxShadow,
        },
      },
    },
    
    // Buttons - Navy primary, Light Blue secondary
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: themeConfig.components.button.borderRadius,
          padding: themeConfig.components.button.padding,
          minHeight: themeConfig.components.button.minHeight,
          textTransform: 'none',
          fontFamily: themeConfig.typography.fontFamily,
          fontSize: themeConfig.typography.button.fontSize,
          fontWeight: themeConfig.typography.button.fontWeight,
        },
        containedPrimary: {
          backgroundColor: themeConfig.brandColors.navy,
          color: '#ffffff',
          '&:hover': {
            backgroundColor: themeConfig.colors.primary.light,
          },
        },
        containedSecondary: {
          backgroundColor: themeConfig.brandColors.lightBlue,
          color: '#ffffff',
          '&:hover': {
            backgroundColor: themeConfig.colors.secondary.dark,
          },
        },
        outlinedPrimary: {
          borderColor: themeConfig.brandColors.navy,
          color: themeConfig.brandColors.navy,
          '&:hover': {
            borderColor: themeConfig.colors.primary.light,
            backgroundColor: 'rgba(23, 35, 78, 0.04)',
          },
        },
        outlinedSecondary: {
          borderColor: themeConfig.brandColors.lightBlue,
          color: themeConfig.brandColors.lightBlue,
          '&:hover': {
            borderColor: themeConfig.colors.secondary.dark,
            backgroundColor: 'rgba(74, 144, 226, 0.04)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: themeConfig.borderRadius,
        },
      },
    },
    
    // Text Fields and Inputs
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: themeConfig.components.input.borderRadius,
            fontFamily: themeConfig.typography.fontFamily,
          },
          '& .MuiInputLabel-root': {
            fontFamily: themeConfig.typography.fontFamily,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: themeConfig.components.input.borderRadius,
          fontFamily: themeConfig.typography.fontFamily,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: themeConfig.typography.fontFamily,
        },
      },
    },
    
    // Tables
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: themeConfig.components.table.headerBackground,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: themeConfig.components.table.borderColor,
          fontFamily: themeConfig.typography.fontFamily,
        },
        head: {
          fontWeight: themeConfig.typography.fontWeightMedium,
          backgroundColor: themeConfig.components.table.headerBackground,
        },
      },
    },
    
    // Typography - All variants
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: themeConfig.typography.fontFamily,
        },
        h1: themeConfig.typography.h1,
        h2: themeConfig.typography.h2,
        h3: themeConfig.typography.h3,
        h4: themeConfig.typography.h4,
        h5: themeConfig.typography.h5,
        h6: themeConfig.typography.h6,
        body1: themeConfig.typography.body1,
        body2: themeConfig.typography.body2,
        caption: themeConfig.typography.caption,
        overline: themeConfig.typography.overline,
      },
    },
    
    // Chips
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: themeConfig.borderRadius,
          fontFamily: themeConfig.typography.fontFamily,
          fontSize: themeConfig.typography.caption.fontSize,
        },
      },
    },
    
    // Dialogs
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: themeConfig.borderRadius * 2,
          boxShadow: themeConfig.shadows.elevation4,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: themeConfig.typography.fontFamily,
          fontSize: themeConfig.typography.h5.fontSize,
          fontWeight: themeConfig.typography.fontWeightMedium,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          fontFamily: themeConfig.typography.fontFamily,
        },
      },
    },
    
    // Tabs - Light blue accent for active tabs
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: themeConfig.typography.fontFamily,
          fontSize: themeConfig.typography.button.fontSize,
          fontWeight: themeConfig.typography.fontWeightMedium,
          textTransform: 'none',
          '&.Mui-selected': {
            color: themeConfig.brandColors.lightBlue,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderRadius: themeConfig.borderRadius,
          '& .MuiTabs-indicator': {
            backgroundColor: themeConfig.brandColors.lightBlue,
          },
        },
      },
    },
    
    // App Bar and Navigation - Navy Blue
    MuiAppBar: {
      styleOverrides: {
        root: {
          height: themeConfig.components.header.height,
          backgroundColor: themeConfig.components.header.backgroundColor,
          borderBottom: `1px solid ${themeConfig.components.header.borderColor}`,
          boxShadow: 'none',
          color: '#ffffff',  // White text on navy
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: `${themeConfig.components.header.height}px !important`,
          fontFamily: themeConfig.typography.fontFamily,
        },
      },
    },
    
    // Drawer/Sidebar - Navy Blue
    MuiDrawer: {
      styleOverrides: {
        paper: {
          width: themeConfig.components.sidebar.width,
          backgroundColor: themeConfig.components.sidebar.backgroundColor,
          borderRight: `1px solid ${themeConfig.components.sidebar.borderColor}`,
          color: '#ffffff',  // White text on navy
        },
      },
    },
    
    // Lists
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: themeConfig.borderRadius,
          fontFamily: themeConfig.typography.fontFamily,
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontFamily: themeConfig.typography.fontFamily,
          fontSize: themeConfig.typography.body1.fontSize,
        },
        secondary: {
          fontFamily: themeConfig.typography.fontFamily,
          fontSize: themeConfig.typography.body2.fontSize,
        },
      },
    },
    
    // Menus
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: themeConfig.borderRadius,
          boxShadow: themeConfig.shadows.elevation3,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: themeConfig.typography.fontFamily,
          fontSize: themeConfig.typography.body2.fontSize,
        },
      },
    },
    
    // Form Controls
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontFamily: themeConfig.typography.fontFamily,
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontFamily: themeConfig.typography.fontFamily,
        },
      },
    },
    
    // Select
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: themeConfig.components.input.borderRadius,
          fontFamily: themeConfig.typography.fontFamily,
        },
      },
    },
    
    // Accordion
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: themeConfig.borderRadius,
          '&:before': {
            display: 'none',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        content: {
          fontFamily: themeConfig.typography.fontFamily,
          fontWeight: themeConfig.typography.fontWeightMedium,
        },
      },
    },
    
    // Paper
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: themeConfig.borderRadius,
        },
        elevation1: {
          boxShadow: themeConfig.shadows.elevation1,
        },
        elevation2: {
          boxShadow: themeConfig.shadows.elevation2,
        },
        elevation3: {
          boxShadow: themeConfig.shadows.elevation3,
        },
        elevation4: {
          boxShadow: themeConfig.shadows.elevation4,
        },
      },
    },
    
    // Alerts
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: themeConfig.borderRadius,
          fontFamily: themeConfig.typography.fontFamily,
        },
      },
    },
    
    // Snackbar
    MuiSnackbar: {
      styleOverrides: {
        root: {
          fontFamily: themeConfig.typography.fontFamily,
        },
      },
    },
    
    // Links - Light blue accent
    MuiLink: {
      styleOverrides: {
        root: {
          color: themeConfig.brandColors.lightBlue,
          textDecorationColor: themeConfig.brandColors.lightBlue,
          '&:hover': {
            color: themeConfig.colors.secondary.dark,
          },
        },
      },
    },
    
    // Checkbox - Light blue accent
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: themeConfig.colors.text.secondary,
          '&.Mui-checked': {
            color: themeConfig.brandColors.lightBlue,
          },
        },
      },
    },
    
    // Radio - Light blue accent
    MuiRadio: {
      styleOverrides: {
        root: {
          color: themeConfig.colors.text.secondary,
          '&.Mui-checked': {
            color: themeConfig.brandColors.lightBlue,
          },
        },
      },
    },
    
    // Switch - Light blue accent
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: themeConfig.brandColors.lightBlue,
            '& + .MuiSwitch-track': {
              backgroundColor: themeConfig.brandColors.lightBlue,
            },
          },
        },
      },
    },
    
    // Slider - Light blue accent
    MuiSlider: {
      styleOverrides: {
        root: {
          color: themeConfig.brandColors.lightBlue,
        },
      },
    },
    
    // Progress indicators - Light blue accent
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: themeConfig.borderRadius,
          backgroundColor: 'rgba(74, 144, 226, 0.15)',
        },
        bar: {
          backgroundColor: themeConfig.brandColors.lightBlue,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: themeConfig.brandColors.lightBlue,
        },
      },
    },
    
    // Badge - Light blue accent
    MuiBadge: {
      styleOverrides: {
        badge: {
          backgroundColor: themeConfig.brandColors.lightBlue,
          color: '#ffffff',
        },
      },
    },
  },
});

// Export the theme configuration for direct access if needed
export { themeConfig };

// Export the MUI theme for use in components
export { theme };

// Theme Provider Component
interface AppThemeProviderProps {
  children: ReactNode;
}

const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default AppThemeProvider;
