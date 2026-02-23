import { createTheme } from "@mui/material/styles"

// Create a light theme with navy blue color scheme
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#111c35", // Darker blue from the image
      light: "#1e2c4f",
      dark: "#0a1929",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#5b6cff", // Accent blue from the image
      light: "#8a97ff",
      dark: "#4a56cc",
      contrastText: "#ffffff",
    },
    success: {
      main: "#0d8a6f",
      light: "#3aa68d",
      dark: "#076d57",
    },
    warning: {
      main: "#e6a700",
      light: "#ebbe4d",
      dark: "#b38600",
    },
    error: {
      main: "#d32f2f",
      light: "#ef5350",
      dark: "#b71c1c",
    },
    info: {
      main: "#0277bd",
      light: "#4da3df",
      dark: "#01579b",
    },
    background: {
      default: "#f5f8fc", // Light background from the image
      paper: "#ffffff",
    },
    text: {
      primary: "#111c35", // Dark blue for text
      secondary: "#3a506b",
      disabled: "#8d9db5",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 500,
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
      },
    },
  },
})

// Create a dark theme with navy blue color scheme
export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1e2c4f", // Slightly lighter blue for dark mode
      light: "#2a3a64",
      dark: "#111c35",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#5b6cff", // Keep the accent blue
      light: "#8a97ff",
      dark: "#4a56cc",
      contrastText: "#ffffff",
    },
    success: {
      main: "#26a69a",
      light: "#51b6ae",
      dark: "#00867d",
    },
    warning: {
      main: "#ffc107",
      light: "#ffcd38",
      dark: "#c79100",
    },
    error: {
      main: "#f44336",
      light: "#f6685e",
      dark: "#c62828",
    },
    info: {
      main: "#29b6f6",
      light: "#4fc3f7",
      dark: "#0288d1",
    },
    background: {
      default: "#0a1929", // Dark background from the image
      paper: "#132f4c",
    },
    text: {
      primary: "#f0f7ff",
      secondary: "#b0bec5",
      disabled: "#62727b",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 500,
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
      },
    },
  },
})
