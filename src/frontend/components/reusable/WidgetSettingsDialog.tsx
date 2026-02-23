"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Tabs,
  Tab,
  Grid,
  IconButton,
  Tooltip,
} from "@mui/material"
import { HexColorPicker } from "react-colorful"
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material"
import { Icon } from "@iconify/react"
import CRUDModal from "./CRUDModal"
import {
  type WidgetSettingsDialogProps,
  WidgetType,
  DataType,
  type WidgetSettings,
  type DataSeries,
} from "../../types/WidgetTypes"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`widget-settings-tabpanel-${index}`}
      aria-labelledby={`widget-settings-tab-${index}`}
      {...other}
      style={{ padding: "16px 0" }}
    >
      {value === index && children}
    </div>
  )
}

const WidgetSettingsDialog: React.FC<WidgetSettingsDialogProps> = ({
  open,
  onClose,
  widget,
  onSave,
  availableDataTypes,
}) => {
  const [settings, setSettings] = useState<WidgetSettings | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null)
  const availableIcons = [
    "mdi:cash-register",
    "mdi:package-variant-closed",
    "mdi:alert-circle-outline",
    "mdi:chart-line",
    "mdi:information-outline",
    "mdi:tag-outline",
    "mdi:account-group",
    "mdi:store",
    "mdi:truck-delivery",
    "mdi:calendar-check",
  ]

  useEffect(() => {
    if (widget) {
      setSettings({ ...widget })
      setOpenColorPicker(null) // Close any open color pickers when widget changes
    }
  }, [widget])

  // Close color picker when clicking outside
  useEffect(() => {
    if (!open) {
      setOpenColorPicker(null)
    }
  }, [open])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleChange = (field: keyof WidgetSettings, value: any) => {
    if (!settings) return

    setSettings((prev) => {
      if (!prev) return null

      // Special handling for widget type changes
      if (field === "type") {
        const newSettings = { ...prev, [field]: value }

        // Set appropriate defaults based on widget type
        switch (value) {
          case WidgetType.STAT:
            newSettings.minW = 2
            newSettings.minH = 1
            newSettings.width = Math.max(newSettings.width, 200)
            newSettings.height = Math.max(newSettings.height, 100)
            break

          case WidgetType.BAR_CHART:
          case WidgetType.LINE_CHART:
          case WidgetType.PIE_CHART:
            newSettings.minW = 4
            newSettings.minH = 3
            newSettings.width = Math.max(newSettings.width, 400)
            newSettings.height = Math.max(newSettings.height, 300)
            break

          case WidgetType.TABLE:
            newSettings.minW = 6
            newSettings.minH = 4
            newSettings.width = Math.max(newSettings.width, 600)
            newSettings.height = Math.max(newSettings.height, 400)
            break

          case WidgetType.DASHBOARD_CARD:
            newSettings.minW = 3
            newSettings.minH = 2
            newSettings.width = Math.max(newSettings.width, 300)
            newSettings.height = Math.max(newSettings.height, 200)
            break
        }

        return newSettings
      }

      return { ...prev, [field]: value }
    })
  }

  const handleColorChange = (colorField: string, color: string) => {
    if (!settings) return

    setSettings((prev) => {
      if (!prev) return null

      const newColors = { ...prev.colors }

      if (colorField.startsWith("series")) {
        const index = Number.parseInt(colorField.split("-")[1])
        const newSeries = [...newColors.series]
        newSeries[index] = color
        return {
          ...prev,
          colors: {
            ...newColors,
            series: newSeries,
          },
        }
      } else {
        return {
          ...prev,
          colors: {
            ...newColors,
            [colorField as keyof typeof newColors]: color,
          },
        }
      }
    })
  }

  const handleDataSeriesChange = (index: number, field: keyof DataSeries, value: any) => {
    if (!settings) return

    setSettings((prev) => {
      if (!prev) return null

      const newSeries = [...prev.dataSeries]
      newSeries[index] = { ...newSeries[index], [field]: value }

      return { ...prev, dataSeries: newSeries }
    })
  }

  const handleAddSeries = () => {
    if (!settings) return

    setSettings((prev) => {
      if (!prev) return null

      const newSeries = [...prev.dataSeries]
      const defaultColor = prev.colors.series[newSeries.length % prev.colors.series.length] || "#4CAF50"

      newSeries.push({
        dataType: DataType.STOCK_VALUE,
        displayMode: "price",
        color: defaultColor,
        visible: true,
        label: `Series ${newSeries.length + 1}`,
      })

      return { ...prev, dataSeries: newSeries }
    })
  }

  const handleRemoveSeries = (index: number) => {
    if (!settings) return

    setSettings((prev) => {
      if (!prev) return null

      const newSeries = [...prev.dataSeries]
      newSeries.splice(index, 1)

      // Ensure we always have at least one data series
      if (newSeries.length === 0) {
        const defaultColor = prev.colors.series[0] || "#4CAF50"
        newSeries.push({
          dataType: DataType.STOCK_VALUE,
          displayMode: "price",
          color: defaultColor,
          visible: true,
          label: "Series 1",
        })
      }

      return { ...prev, dataSeries: newSeries }
    })
  }

  const handleToggleSeriesVisibility = (index: number) => {
    if (!settings) return

    setSettings((prev) => {
      if (!prev) return null

      const newSeries = [...prev.dataSeries]
      newSeries[index] = { ...newSeries[index], visible: !newSeries[index].visible }

      return { ...prev, dataSeries: newSeries }
    })
  }

  const handleSave = async () => {
    if (settings) {
      await onSave(settings)
    }
  }

  if (!settings) return null

  return (
    <CRUDModal
      open={open}
      onClose={onClose}
      title="Widget Settings"
      icon={<SettingsIcon />}
      mode="edit"
      onSave={handleSave}
      saveButtonText="Save Changes"
      maxWidth="md"
      fullWidth
    >
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="widget settings tabs"
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          mb: 3,
        }}
      >
        <Tab label="General & Appearance" />
        <Tab label="Data Configuration" />
        {settings.type === WidgetType.DASHBOARD_CARD && <Tab label="Card Options" />}
      </Tabs>

      <Box>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {/* General Settings Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                ⚙️ General Settings
              </Typography>
              
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Widget Title"
                value={settings.title}
                onChange={(e) => handleChange("title", e.target.value)}
                fullWidth
                variant="outlined"
                    helperText="This appears at the top of your widget"
                    placeholder="e.g. Total Sales, Employee Count, etc."
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                    <InputLabel>How to Display Data</InputLabel>
                <Select
                  value={settings.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                      label="How to Display Data"
                    >
                      <MenuItem value={WidgetType.STAT}>
                        <Box>
                          <Typography variant="body1">📊 Stat Card</Typography>
                          <Typography variant="caption" color="text.secondary">Show a single number</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value={WidgetType.BAR_CHART}>
                        <Box>
                          <Typography variant="body1">📊 Bar Chart</Typography>
                          <Typography variant="caption" color="text.secondary">Compare values with vertical bars</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value={WidgetType.LINE_CHART}>
                        <Box>
                          <Typography variant="body1">📈 Line Chart</Typography>
                          <Typography variant="caption" color="text.secondary">Show trends over time</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value={WidgetType.PIE_CHART}>
                        <Box>
                          <Typography variant="body1">🥧 Pie Chart</Typography>
                          <Typography variant="caption" color="text.secondary">Show proportions of a whole</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value={WidgetType.MULTIPLE_SERIES_LINE_CHART}>
                        <Box>
                          <Typography variant="body1">📈 Multi-Line Chart</Typography>
                          <Typography variant="caption" color="text.secondary">Compare multiple trends</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value={WidgetType.TABLE}>
                        <Box>
                          <Typography variant="body1">📋 Data Table</Typography>
                          <Typography variant="caption" color="text.secondary">Show detailed data in rows</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value={WidgetType.DASHBOARD_CARD}>
                        <Box>
                          <Typography variant="body1">🎴 Dashboard Card</Typography>
                          <Typography variant="caption" color="text.secondary">Highlighted metric with icon</Typography>
                        </Box>
                      </MenuItem>
                </Select>
              </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    Choose how you want to visualize your data
                  </Typography>
                </Grid>
            </Grid>
            </Box>

            {/* Appearance Section */}
            <Box sx={{ pt: 3, borderTop: 1, borderColor: "divider" }}>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                🎨 Appearance
              </Typography>

              <Grid container spacing={3}>
                {[
                  { label: "Background Color", key: "background" },
                  { label: "Border Color", key: "border" },
                  { label: "Text Color", key: "text" },
                  { label: "Title Color (optional)", key: "title", fallback: settings.colors.text },
                ].map(({ label, key, fallback }) => (
                  <Grid item xs={6} sm={3} key={key}>
                    <Box>
                      <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                        {label}
                      </Typography>
                      <Box sx={{ position: "relative", mb: openColorPicker === key ? 15 : 0, transition: "margin-bottom 0.2s" }}>
                        <Tooltip title="Click to change color">
                          <Box
                            onClick={() => setOpenColorPicker(openColorPicker === key ? null : key)}
                            sx={{
                              width: "100%",
                              height: 50,
                              borderRadius: 1,
                              bgcolor: (settings.colors[key as keyof typeof settings.colors] || fallback) as string,
                              border: "2px solid",
                              borderColor: openColorPicker === key ? "primary.main" : "divider",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              "&:hover": {
                                borderColor: "primary.main",
                                transform: "scale(1.02)",
                              },
                            }}
                          />
                        </Tooltip>
                        {openColorPicker === key && (
                          <Box sx={{ 
                            position: "absolute", 
                            top: "calc(100% + 8px)", 
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 1000,
                            p: 1,
                            bgcolor: "background.paper",
                            borderRadius: 2,
                            boxShadow: 3,
                          }}>
                            <HexColorPicker
                              color={(settings.colors[key as keyof typeof settings.colors] || fallback) as string}
                              onChange={(color: string) => handleColorChange(key, color)}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                ))}

                {(settings.type === WidgetType.BAR_CHART ||
                  settings.type === WidgetType.LINE_CHART ||
                  settings.type === WidgetType.PIE_CHART ||
                  settings.type === WidgetType.MULTIPLE_SERIES_LINE_CHART) && (
                  <Grid item xs={12}>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                        {settings.type === WidgetType.PIE_CHART ? "Pie Slice Colors" : "Chart Series Colors"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: "block", mb: 2 }}>
                        {settings.type === WidgetType.PIE_CHART 
                          ? "Colors for each slice of the pie chart (automatically applied to data series)"
                          : "Default colors for data series (can be customized per series in Data tab)"}
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, position: "relative" }}>
                        {settings.colors.series.slice(0, settings.type === WidgetType.PIE_CHART ? 8 : 6).map((color, index) => {
                          const pickerId = `series-${index}`
                          const isOpen = openColorPicker === pickerId
                          return (
                            <Box key={index} sx={{ position: "relative", mb: isOpen ? 15 : 0, transition: "margin-bottom 0.2s" }}>
                              <Typography variant="caption" display="block" gutterBottom sx={{ textAlign: "center", mb: 1 }}>
                                {settings.type === WidgetType.PIE_CHART ? `Slice ${index + 1}` : `Series ${index + 1}`}
                              </Typography>
                              <Tooltip title={`Click to change ${settings.type === WidgetType.PIE_CHART ? 'slice' : 'series'} color`}>
                                <Box
                                  onClick={() => setOpenColorPicker(isOpen ? null : pickerId)}
                                  sx={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 1,
                                    bgcolor: color,
                                    border: "2px solid",
                                    borderColor: isOpen ? "primary.main" : "divider",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    "&:hover": {
                                      borderColor: "primary.main",
                                      transform: "scale(1.05)",
                                    },
                                  }}
                                />
                              </Tooltip>
                              {isOpen && (
                                <Box sx={{ 
                                  position: "absolute", 
                                  top: "calc(100% + 8px)", 
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  zIndex: 1000,
                                  p: 1,
                                  bgcolor: "background.paper",
                                  borderRadius: 2,
                                  boxShadow: 3,
                                }}>
                                  <HexColorPicker
                                    color={color}
                                    onChange={(newColor: string) => handleColorChange(`series-${index}`, newColor)}
                                  />
                                </Box>
                              )}
                            </Box>
                          )
                        })}
                      </Box>
                    </Box>
            </Grid>
                )}
          </Grid>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Stat Cards and Dashboard Cards - Simple single data source */}
          {(settings.type === WidgetType.STAT || settings.type === WidgetType.DASHBOARD_CARD) && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Select what data this {settings.type === WidgetType.STAT ? 'stat card' : 'dashboard card'} should display
              </Typography>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Data Source</InputLabel>
              <Select
                value={settings.dataType || ""}
                onChange={(e) => handleChange("dataType", e.target.value)}
                  label="Data Source"
              >
                {availableDataTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            </Box>
          )}

          {/* Charts - Can have multiple data series */}
          {(settings.type === WidgetType.BAR_CHART ||
            settings.type === WidgetType.LINE_CHART ||
            settings.type === WidgetType.PIE_CHART ||
            settings.type === WidgetType.MULTIPLE_SERIES_LINE_CHART) && (
            <Box>
              <Box sx={{ mb: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  📊 About Data Series
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Each series represents a line of data on your chart. Add multiple series to compare different metrics on the same chart.
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">
                  Data Series ({settings.dataSeries.length})
              </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddSeries}
                  variant="outlined"
                  size="small"
                >
                  Add Series
                </Button>
              </Box>

              {settings.dataSeries.map((series, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 3,
                    p: 2.5,
                    border: "2px solid",
                    borderColor: series.visible ? "primary.main" : "divider",
                    borderRadius: "12px",
                    position: "relative",
                    backgroundColor: series.visible ? "action.hover" : "background.paper",
                    opacity: series.visible ? 1 : 0.6,
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Series {index + 1}
                    {series.label && `: ${series.label}`}
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Series Label (appears in legend)"
                        value={series.label || ""}
                        onChange={(e) => handleDataSeriesChange(index, "label", e.target.value)}
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder={`Series ${index + 1}`}
                        helperText="Give this series a descriptive name"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth variant="outlined" size="small">
                        <InputLabel>What to Display</InputLabel>
                        <Select
                          value={series.dataType}
                          onChange={(e) => handleDataSeriesChange(index, "dataType", e.target.value)}
                          label="What to Display"
                        >
                          {availableDataTypes.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                        Choose the metric to visualize
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth variant="outlined" size="small">
                        <InputLabel>Display As</InputLabel>
                        <Select
                          value={series.displayMode}
                          onChange={(e) => handleDataSeriesChange(index, "displayMode", e.target.value)}
                          label="Display As"
                        >
                          <MenuItem value="price">💷 Currency Value</MenuItem>
                          <MenuItem value="quantity">🔢 Number/Count</MenuItem>
                        </Select>
                      </FormControl>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                        How to format the values
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                        {/* Only show color picker for line and bar charts, not pie charts */}
                        {settings.type !== WidgetType.PIE_CHART && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, position: "relative", mb: openColorPicker === `data-series-${index}` ? 15 : 0, transition: "margin-bottom 0.2s" }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              Series Color:
                            </Typography>
                            <Tooltip title="Click to change color">
                              <Box
                                onClick={() => setOpenColorPicker(openColorPicker === `data-series-${index}` ? null : `data-series-${index}`)}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 1,
                                  bgcolor: series.color,
                                  border: "2px solid",
                                  borderColor: openColorPicker === `data-series-${index}` ? "primary.main" : "divider",
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                  "&:hover": {
                                    borderColor: "primary.main",
                                    transform: "scale(1.1)",
                                  },
                                }}
                              />
                            </Tooltip>
                            {openColorPicker === `data-series-${index}` && (
                              <Box sx={{ 
                                position: "absolute", 
                                top: "calc(100% + 8px)", 
                                left: "50%",
                                transform: "translateX(-50%)",
                                zIndex: 1000,
                                p: 1,
                                bgcolor: "background.paper",
                                borderRadius: 2,
                                boxShadow: 3,
                              }}>
                                <HexColorPicker
                                  color={series.color || "#000000"}
                                  onChange={(color: string) => handleDataSeriesChange(index, "color", color)}
                                />
                              </Box>
                            )}
                          </Box>
                        )}

                        {settings.type === WidgetType.PIE_CHART && (
                          <Typography variant="caption" color="text.secondary">
                            💡 Pie chart colors are set in the Appearance section
                          </Typography>
                        )}

                        <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
                          <Tooltip title={series.visible ? "Hide this series" : "Show this series"}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleToggleSeriesVisibility(index)}
                              color={series.visible ? "primary" : "default"}
                            >
                            {series.visible ? (
                                <VisibilityIcon />
                            ) : (
                                <VisibilityOffIcon />
                            )}
                          </IconButton>
                        </Tooltip>

                        {settings.dataSeries.length > 1 && (
                            <Tooltip title="Remove this series">
                            <IconButton size="small" onClick={() => handleRemoveSeries(index)} color="error">
                                <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              ))}

              {settings.dataSeries.length === 0 && (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    No data series configured
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddSeries}
                    variant="contained"
                    sx={{ mt: 1 }}
                  >
                    Add Your First Series
                  </Button>
                </Box>
              )}
                </Box>
            )}
        </TabPanel>


        {settings.type === WidgetType.DASHBOARD_CARD && (
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Card Type</InputLabel>
                  <Select
                    value={settings.cardType || "sales"}
                    onChange={(e) => handleChange("cardType", e.target.value)}
                    label="Card Type"
                  >
                    <MenuItem value="sales">Sales</MenuItem>
                    <MenuItem value="inventory">Inventory</MenuItem>
                    <MenuItem value="alerts">Alerts</MenuItem>
                    <MenuItem value="performance">Performance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Icon
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
                  {availableIcons.map((iconName) => (
                    <Tooltip key={iconName} title={iconName.split(":")[1]}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid",
                          borderColor: settings.icon === iconName ? "primary.main" : "divider",
                          borderRadius: "8px",
                          cursor: "pointer",
                          backgroundColor: settings.icon === iconName ? "primary.light" : "transparent",
                          "&:hover": {
                            backgroundColor: settings.icon === iconName ? "primary.light" : "action.hover",
                          },
                        }}
                        onClick={() => handleChange("icon", iconName)}
                      >
                        <Icon icon={iconName} style={{ fontSize: "24px" }} />
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </TabPanel>
        )}
      </Box>
    </CRUDModal>
  )
}

export default WidgetSettingsDialog
