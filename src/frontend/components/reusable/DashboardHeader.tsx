import React, { useState } from "react"
import {
  Box,
  Typography,
  Button,
  Paper,
  Menu,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
} from "@mui/material"
import {
  Add as AddIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  CalendarToday as CalendarTodayIcon,
  Delete as DeleteIcon,
  Undo as UndoIcon,
} from "@mui/icons-material"

export interface DashboardMenuItem {
  label: string
  onClick: () => void
  permission?: boolean
}

export interface DashboardHeaderProps {
  title: string
  subtitle?: string
  canEdit?: boolean
  isEditing?: boolean
  onToggleEdit?: () => void
  onClearWidgets?: () => void
  onRevert?: () => void
  showGrid?: boolean
  onToggleGrid?: (show: boolean) => void
  menuItems?: DashboardMenuItem[]
  dateRange?: {
    value: string
    label: string
    onChange: (range: string) => void
  }
  frequency?: {
    value: string
    options: string[]
    onChange: (freq: string) => void
  }
  className?: string
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({

  subtitle,
  canEdit = false,
  isEditing = false,
  onToggleEdit,
  onClearWidgets,
  onRevert,
  showGrid = false,
  onToggleGrid,
  menuItems = [],
  dateRange,
  frequency,
 
}) => {
  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null)
  const [dateRangeAnchor, setDateRangeAnchor] = useState<null | HTMLElement>(null)

  const handleDateRangeChange = (range: string) => {
    dateRange?.onChange(range)
    setDateRangeAnchor(null)
  }

  const handleFrequencyChange = (freq: string) => {
    frequency?.onChange(freq)
  }

  return (
    <>

      {/* Add New Menu */}
      {menuItems.length > 0 && (
        <Menu
          anchorEl={addMenuAnchor}
          open={Boolean(addMenuAnchor)}
          onClose={() => setAddMenuAnchor(null)}
        >
          {menuItems.map((item, index) => {
            // Don't render if permission is explicitly false
            if (item.permission === false) return null
            
            return (
              <MenuItem
                key={index}
                onClick={() => {
                  setAddMenuAnchor(null)
                  item.onClick()
                }}
              >
                {item.label}
              </MenuItem>
            )
          })}
        </Menu>
      )}

      {/* Overview Section with Date Range and Frequency */}
      {(dateRange || frequency) && (
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 4,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography variant="h6" component="h3">
              {subtitle || "Overview"}
            </Typography>

            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              {/* Date Range Dropdown */}
              {dateRange && (
                <Button
                  variant="text"
                  color="inherit"
                  startIcon={<CalendarTodayIcon />}
                  endIcon={<KeyboardArrowDownIcon />}
                  onClick={(e) => setDateRangeAnchor(e.currentTarget)}
                  sx={{ color: "primary.contrastText" }}
                >
                  {dateRange?.label}
                </Button>
              )}
            </Box>
          </Box>



          {/* Date Range Menu */}
          {dateRange && (
            <Menu
              anchorEl={dateRangeAnchor}
              open={Boolean(dateRangeAnchor)}
              onClose={() => setDateRangeAnchor(null)}
            >
              <MenuItem onClick={() => handleDateRangeChange("today")}>Today</MenuItem>
              <MenuItem onClick={() => handleDateRangeChange("yesterday")}>Yesterday</MenuItem>
              <MenuItem onClick={() => handleDateRangeChange("last7days")}>Last 7 Days</MenuItem>
              <MenuItem onClick={() => handleDateRangeChange("last30days")}>Last 30 Days</MenuItem>
              <MenuItem onClick={() => handleDateRangeChange("thisMonth")}>This Month</MenuItem>
              <MenuItem onClick={() => handleDateRangeChange("lastMonth")}>Last Month</MenuItem>
              <MenuItem onClick={() => handleDateRangeChange("thisYear")}>This Year</MenuItem>
              <MenuItem onClick={() => handleDateRangeChange("lastYear")}>Last Year</MenuItem>
              <MenuItem onClick={() => handleDateRangeChange("custom")}>Custom Range...</MenuItem>
            </Menu>
          )}

          {/* Frequency Chips and Buttons Row */}
          {frequency && (
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, flexWrap: "wrap", gap: 2 }}>
              {/* Frequency Chips */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {frequency?.options.map((freq) => (
                  <Chip
                    key={freq}
                    label={freq}
                    color="primary"
                    variant={frequency?.value === freq.toLowerCase() ? "filled" : "outlined"}
                    onClick={() => handleFrequencyChange(freq.toLowerCase())}
                    sx={{
                      bgcolor:
                        frequency?.value === freq.toLowerCase()
                          ? "rgba(255, 255, 255, 0.15)"
                          : "transparent",
                      color: "white",
                      "&:hover": { bgcolor: "rgba(255, 255, 255, 0.25)" },
                      borderRadius: 10,
                      borderColor: "rgba(255, 255, 255, 0.5)",
                    }}
                  />
                ))}
              </Box>

              {/* Edit Layout, Grid Toggle, Clear Widgets, and Add New Buttons */}
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                {/* Edit Layout Button */}
                {canEdit && onToggleEdit && (
                  <Button
                    variant="contained"
                    color={isEditing ? "secondary" : "primary"}
                    onClick={onToggleEdit}
                    startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                    sx={{ 
                      bgcolor: isEditing ? "secondary.main" : "primary.main",
                      color: isEditing ? "secondary.contrastText" : "primary.contrastText",
                      "&:hover": {
                        bgcolor: isEditing ? "secondary.dark" : "primary.dark"
                      }
                    }}
                  >
                    {isEditing ? "Save Layout" : "Edit Layout"}
                  </Button>
                )}

                {/* Show Grid Toggle - Only in edit mode */}
                {isEditing && onToggleGrid && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showGrid}
                        onChange={(e) => onToggleGrid?.(e.target.checked)}
                        color="primary"
                        size="small"
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "white",
                            "& + .MuiSwitch-track": {
                              backgroundColor: "rgba(255, 255, 255, 0.7)",
                            },
                          },
                        }}
                      />
                    }
                    label="Show Grid"
                    sx={{ color: "white", m: 0 }}
                  />
                )}

                {/* Revert Button - Only in edit mode */}
                {isEditing && onRevert && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onRevert}
                    startIcon={<UndoIcon />}
                    sx={{
                      borderColor: "rgba(255, 255, 255, 0.7)",
                      color: "white",
                      "&:hover": {
                        borderColor: "white",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  >
                    Revert
                  </Button>
                )}

                {/* Clear Widgets Button - Only in edit mode */}
                {isEditing && onClearWidgets && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={onClearWidgets}
                    startIcon={<DeleteIcon />}
                    sx={{
                      borderColor: "rgba(255, 255, 255, 0.7)",
                      color: "white",
                      "&:hover": {
                        borderColor: "white",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  >
                    Clear Widgets
                  </Button>
                )}

                {/* Add New Button - Same style as original stock dashboard */}
                {menuItems.length > 0 && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    endIcon={<KeyboardArrowDownIcon />}
                    onClick={(e) => setAddMenuAnchor(e.currentTarget)}
                    sx={{
                      bgcolor: "white",
                      color: "primary.main",
                      borderRadius: 2,
                      transition: "all 0.3s",
                      "&:hover": { 
                        bgcolor: "grey.100",
                        transform: "scale(1.05)" 
                      },
                      "&:active": { transform: "scale(0.95)" },
                    }}
                  >
                    Add New
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Paper>
      )}
    </>
  )
}

export default DashboardHeader
