"use client"

import { useState, useMemo, createContext, useContext, type ReactNode, useEffect } from "react"
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import { theme, darkTheme } from "./theme"

type ThemeContextType = {
  darkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
})

export const useThemeContext = () => useContext(ThemeContext)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Get the stored theme or default to 'light'
    const storedMode = localStorage.getItem("theme-mode")
    return storedMode === "dark"
  })

  useEffect(() => {
    localStorage.setItem("theme-mode", darkMode ? "dark" : "light")
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const contextValue = useMemo(
    () => ({
      darkMode,
      toggleDarkMode,
    }),
    [darkMode],
  )

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={darkMode ? darkTheme : theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}
