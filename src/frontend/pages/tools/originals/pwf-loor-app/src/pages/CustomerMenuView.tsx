"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Box, Paper, Typography, Button, Stack, useTheme, CircularProgress } from "@mui/material"
import { Restaurant, PictureAsPdf, Download } from "@mui/icons-material"
import { ref as dbRef, get } from "firebase/database"
import { db } from "../services/firebase"

interface Menu {
  id: string
  name: string
  fileName: string
  downloadUrl: string
  uploadDate: string
  fileSize: number
}

const CustomerMenuView: React.FC = () => {
  const theme = useTheme()
  const { menuId } = useParams<{ menuId: string }>()
  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const fetchMenu = async () => {
      if (!menuId) {
        setError("Menu not found")
        setLoading(false)
        return
      }

      try {
        const menuRef = dbRef(db, `menus/${menuId}`)
        const snapshot = await get(menuRef)

        if (snapshot.exists()) {
          setMenu({ id: menuId, ...snapshot.val() })
        } else {
          setError("Menu not found")
        }
      } catch (error) {
        console.error("Error fetching menu:", error)
        setError("Failed to load menu")
      } finally {
        setLoading(false)
      }
    }

    fetchMenu()
  }, [menuId])

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (error || !menu) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
          p: 3,
        }}
      >
        <Paper sx={{ p: 4, textAlign: "center", maxWidth: 400 }}>
          <Restaurant sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {error || "Menu not found"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The menu you're looking for is not available
          </Typography>
        </Paper>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        p: 3,
      }}
    >
      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        <Stack spacing={3}>
          {/* Header */}
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Restaurant sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h3" fontWeight={700} color="primary" gutterBottom>
              {menu.name}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Restaurant Menu
            </Typography>
          </Paper>

          {/* Menu Display */}
          <Paper sx={{ p: 4 }}>
            <Stack spacing={3} alignItems="center">
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PictureAsPdf sx={{ fontSize: 48, color: "error.main" }} />
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {menu.fileName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Updated: {new Date(menu.uploadDate).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                size="large"
                startIcon={<Download />}
                href={menu.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  py: 2,
                  px: 4,
                  fontSize: "1.1rem",
                  minWidth: 200,
                }}
              >
                View Menu
              </Button>

              <Typography variant="body2" color="text.secondary" textAlign="center">
                Click the button above to view our menu in a new tab
              </Typography>
            </Stack>
          </Paper>

          {/* Footer */}
          <Paper sx={{ p: 3, textAlign: "center", bgcolor: theme.palette.primary.main + "08" }}>
            <Typography variant="body2" color="primary" fontWeight={600}>
              Thank you for choosing our restaurant!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We hope you enjoy your dining experience
            </Typography>
          </Paper>
        </Stack>
      </Box>
    </Box>
  )
}

export default CustomerMenuView
