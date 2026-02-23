"use client"

import type React from "react"
import { createContext, useMemo, useState, useContext, useEffect } from "react"
import { createTheme, ThemeProvider, CssBaseline, useMediaQuery } from "@mui/material"

// Create Theme Context
interface ThemeContextType {
  darkMode: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useThemeContext = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider")
  }
  return context
}

const AppTheme: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)")
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("darkMode")
    return saved ? JSON.parse(saved) : prefersDarkMode
  })

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode))
  }, [darkMode])

  const toggleTheme = () => setDarkMode((prev) => !prev)

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: {
            // Gold for dark mode, soft blue for light mode
            main: darkMode ? "#FFD700" : "#4285F4",
            light: darkMode ? "#FFEB3B" : "#7BAAF7",
            dark: darkMode ? "#FFC107" : "#3367D6",
          },
          secondary: {
            main: darkMode ? "#FF9800" : "#34A853",
            light: darkMode ? "#FFB74D" : "#66BB6A",
            dark: darkMode ? "#F57C00" : "#2E7D32",
          },
          background: {
            default: darkMode ? "#121212" : "#F8F9FA",
            paper: darkMode ? "#1E1E1E" : "#FFFFFF",
          },
          text: {
            primary: darkMode ? "#F5F5F5" : "#202124",
            secondary: darkMode ? "#BBBBBB" : "#5F6368",
          },
          divider: darkMode ? "#333333" : "#E8EAED",
          success: {
            main: "#34A853",
            light: "#66BB6A",
            dark: "#2E7D32",
          },
          warning: {
            main: "#FBBC05",
            light: "#FDD835",
            dark: "#F9A825",
          },
          error: {
            main: "#EA4335",
            light: "#EF5350",
            dark: "#D32F2F",
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontSize: "2.5rem",
            fontWeight: 700,
            lineHeight: 1.2,
          },
          h2: {
            fontSize: "2rem",
            fontWeight: 600,
            lineHeight: 1.3,
          },
          h3: {
            fontSize: "1.75rem",
            fontWeight: 600,
            lineHeight: 1.3,
          },
          h4: {
            fontSize: "1.5rem",
            fontWeight: 600,
            lineHeight: 1.4,
          },
          h5: {
            fontSize: "1.25rem",
            fontWeight: 600,
            lineHeight: 1.4,
          },
          h6: {
            fontSize: "1.125rem",
            fontWeight: 600,
            lineHeight: 1.4,
          },
          body1: {
            fontSize: "1rem",
            lineHeight: 1.6,
          },
          body2: {
            fontSize: "0.875rem",
            lineHeight: 1.5,
          },
          button: {
            textTransform: "none",
            fontWeight: 500,
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: "none",
                borderRadius: 0, // Ensure no border radius
                borderBottom: `1px solid ${darkMode ? "#333333" : "#E8EAED"}`,
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                borderRadius: 0, // Ensure no border radius
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: "none",
                borderRadius: 8,
                fontWeight: 500,
                padding: "8px 16px",
                boxShadow: "none",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                },
              },
              contained: {
                "&:hover": {
                  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: darkMode
                  ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)"
                  : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: darkMode
                    ? "0 10px 25px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)"
                    : "0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                },
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                "& .MuiOutlinedInput-root": {
                  borderRadius: 8,
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: darkMode
                  ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)"
                  : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                textTransform: "none",
                fontWeight: 500,
                minHeight: 48,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                fontWeight: 500,
              },
            },
          },
        },
      }),
    [darkMode],
  )

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}

export default AppTheme
