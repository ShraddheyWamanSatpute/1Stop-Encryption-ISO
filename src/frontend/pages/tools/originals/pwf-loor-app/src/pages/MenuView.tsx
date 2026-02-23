"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
  Grid,
  Chip,
} from "@mui/material"
import { Restaurant, PictureAsPdf, QrCode, Visibility } from "@mui/icons-material"
import { ref as dbRef, onValue } from "firebase/database"
import { db } from "../services/firebase"
import * as QRCode from "qrcode"

interface Menu {
  id: string
  name: string
  fileName: string
  downloadUrl: string
  uploadDate: string
  fileSize: number
}

const MenuView: React.FC = () => {
  const theme = useTheme()
  const [menus, setMenus] = useState<Menu[]>([])
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")

  useEffect(() => {
    const menusRef = dbRef(db, "menus")
    const unsubscribe = onValue(menusRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const menuList = Object.entries(data).map(([id, menu]: [string, any]) => ({
          id,
          ...menu,
        }))
        setMenus(menuList)
      } else {
        setMenus([])
      }
    })

    return () => unsubscribe()
  }, [])

  const generateQRCode = async (menu: Menu) => {
    try {
      // Create a customer-friendly URL for the menu
      const customerMenuUrl = `${window.location.origin}/customer-menu/${menu.id}`

      const qrDataUrl = await QRCode.toDataURL(customerMenuUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: theme.palette.text.primary,
          light: theme.palette.background.paper,
        },
      })
      setQrCodeUrl(qrDataUrl)
      setSelectedMenu(menu)
      setQrDialogOpen(true)
    } catch (error) {
      console.error("Error generating QR code:", error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Restaurant sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 1 }} />
          <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
            Restaurant Menus
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View available menus and generate QR codes for customers
          </Typography>
        </Box>

        {/* Menus Grid */}
        {menus.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <Restaurant sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No menus available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Contact your manager to upload menus
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {menus.map((menu) => (
              <Grid item xs={12} sm={6} md={4} key={menu.id}>
                <Card
                  elevation={2}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardContent sx={{ flex: 1 }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PictureAsPdf color="error" sx={{ fontSize: 32 }} />
                        <Typography variant="h6" fontWeight={600}>
                          {menu.name}
                        </Typography>
                      </Box>

                      <Stack spacing={1}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {menu.fileName}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <Chip label={formatFileSize(menu.fileSize)} size="small" variant="outlined" />
                          <Chip
                            label={new Date(menu.uploadDate).toLocaleDateString()}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Stack>
                    </Stack>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Visibility />}
                      href={menu.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      fullWidth
                    >
                      View Menu
                    </Button>
                    <Button variant="contained" startIcon={<QrCode />} onClick={() => generateQRCode(menu)} fullWidth>
                      QR Code
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: "center" }}>Customer QR Code</DialogTitle>
        <DialogContent sx={{ textAlign: "center", pb: 3 }}>
          <Stack spacing={3}>
            <Typography variant="h6" color="primary">
              {selectedMenu?.name}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Customers can scan this QR code to view the menu on their device
            </Typography>

            {qrCodeUrl && (
              <Box
                sx={{
                  display: "inline-block",
                  p: 3,
                  bgcolor: "background.default",
                  borderRadius: 2,
                  border: `2px solid ${theme.palette.divider}`,
                }}
              >
                <img src={qrCodeUrl || "/placeholder.svg"} alt="Menu QR Code" style={{ display: "block" }} />
              </Box>
            )}

            <Paper sx={{ p: 2, bgcolor: theme.palette.primary.main + "08" }}>
              <Typography variant="body2" color="primary" fontWeight={600}>
                Instructions for Customers:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Point your phone camera at the QR code to view the menu
              </Typography>
            </Paper>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default MenuView
