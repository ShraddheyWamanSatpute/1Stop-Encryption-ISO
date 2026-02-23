"use client"

import React, { useState, useRef } from "react"
import {
  Box,
  Card,
  CardContent,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Menu,
  Checkbox,
  ListItemText,
  Tooltip,
  Collapse,
} from "@mui/material"
import {
  Search as SearchIcon,
  Today as TodayIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CalendarToday as CalendarTodayIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { format, addDays, subDays, startOfWeek, endOfWeek } from "date-fns"
import { themeConfig } from "../../../theme/AppTheme"

export interface FilterOption {
  id: string
  name: string
  color?: string
}

export interface ColumnOption {
  key: string
  label: string
}

export interface DataHeaderProps {
  // Title for the header
  title?: string
  
  // Date functionality (optional for management components)
  currentDate?: Date
  onDateChange?: (date: Date) => void
  dateType?: "day" | "week" | "month" | "custom"
  onDateTypeChange?: (type: "day" | "week" | "month" | "custom") => void
  showDateControls?: boolean // New prop to control date visibility
  showDateTypeSelector?: boolean // New prop to control date type selector visibility
  availableDateTypes?: ("day" | "week" | "month" | "custom")[] // Custom date type options
  
  // Search functionality
  searchTerm?: string | null
  onSearchChange?: ((term: string) => void) | null
  searchPlaceholder?: string
  
  // Filter functionality
  filters?: {
    label: string
    options: FilterOption[]
    selectedValues: string[]
    onSelectionChange: (values: string[]) => void
  }[]
  filtersExpanded?: boolean
  onFiltersToggle?: () => void
  
  // Column visibility
  columns?: ColumnOption[]
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void
  
  // Group By functionality
  groupByOptions?: { value: string; label: string }[]
  groupByValue?: string
  onGroupByChange?: (value: string) => void
  
  // Sorting functionality
  sortOptions?: { value: string; label: string }[]
  sortValue?: string
  sortDirection?: "asc" | "desc"
  onSortChange?: (value: string, direction: "asc" | "desc") => void
  
  // Export functionality
  onExportCSV?: () => void
  onExportPDF?: () => void
  
  // Action buttons
  onRefresh?: () => void
  onCreateNew?: () => void
  createButtonLabel?: string
  
  // Additional buttons
  additionalButtons?: {
    label: string
    icon: React.ReactNode
    onClick: () => void
    variant?: "text" | "outlined" | "contained"
    color?: "primary" | "secondary" | "error" | "warning" | "info" | "success"
  }[]
  
  // Additional controls (like dropdowns, selects, etc.)
  additionalControls?: React.ReactNode
  
  // Custom date range (when dateType is "custom")
  customStartDate?: Date
  customEndDate?: Date
  onCustomDateRangeChange?: (startDate: Date, endDate: Date) => void
  
  // Styling
  backgroundColor?: string
  textColor?: string
  singleRow?: boolean // New prop to force single row layout
}

const DataHeader: React.FC<DataHeaderProps> = ({
  title,
  currentDate = new Date(),
  onDateChange,
  dateType = "day",
  onDateTypeChange,
  showDateControls = true,
  showDateTypeSelector = true,
  availableDateTypes = ["day", "week", "month", "custom"],
  searchTerm = undefined,
  onSearchChange = undefined,
  searchPlaceholder = "Search...",
  filters = [],
  filtersExpanded = false,
  onFiltersToggle,
  columns = [],
  columnVisibility = {},
  onColumnVisibilityChange,
  groupByOptions = [],
  groupByValue = "none",
  onGroupByChange,
  sortOptions = [],
  sortValue = "",
  sortDirection = "asc",
  onSortChange,
  onExportCSV,
  onExportPDF,
  onCreateNew,
  createButtonLabel = "Create New",
  additionalButtons = [],
  additionalControls,
  customStartDate,
  customEndDate,
  onCustomDateRangeChange,
  backgroundColor = themeConfig.colors.primary.main,
  textColor = "white",
  singleRow = false,
}) => {
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [columnsMenuAnchorEl, setColumnsMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState<null | HTMLElement>(null)
  const dateButtonRef = useRef<HTMLButtonElement>(null)

  const handlePrevPeriod = () => {
    if (!onDateChange) return
    switch (dateType) {
      case "day":
        onDateChange(subDays(currentDate, 1))
        break
      case "week":
        onDateChange(subDays(currentDate, 7))
        break
      case "month":
        const prevMonth = new Date(currentDate)
        prevMonth.setMonth(prevMonth.getMonth() - 1)
        onDateChange(prevMonth)
        break
      case "custom":
        onDateChange(subDays(currentDate, 1))
        break
    }
  }

  const handleNextPeriod = () => {
    if (!onDateChange) return
    switch (dateType) {
      case "day":
        onDateChange(addDays(currentDate, 1))
        break
      case "week":
        onDateChange(addDays(currentDate, 7))
        break
      case "month":
        const nextMonth = new Date(currentDate)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        onDateChange(nextMonth)
        break
      case "custom":
        onDateChange(addDays(currentDate, 1))
        break
    }
  }

  const handleGoToToday = () => {
    if (!onDateChange) return
    onDateChange(new Date())
  }

  const handleDatePickerChange = (date: Date | null) => {
    if (date && onDateChange) {
      onDateChange(date)
    }
    setDatePickerOpen(false)
  }

  const getDateDisplayText = () => {
    switch (dateType) {
      case "day":
        return format(currentDate, "EEE, MMM d, yyyy")
      case "week":
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday start
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${format(weekStart, "MMM d")} - ${format(weekEnd, "d, yyyy")}`
        } else {
          return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`
        }
      case "month":
        return format(currentDate, "MMMM yyyy")
      case "custom":
        return "Custom Range" // We'll show the date pickers inline instead
      default:
        return format(currentDate, "EEE, MMM d, yyyy")
    }
  }

  const toggleColumnVisibility = (key: string) => {
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange({
        ...columnVisibility,
        [key]: !columnVisibility[key],
      })
    }
  }

  const renderColumnsMenu = () => {
    const visibleColumns = columns.filter(col => columnVisibility[col.key])
    const hiddenColumns = columns.filter(col => !columnVisibility[col.key])
    
    return (
      <Menu
        anchorEl={columnsMenuAnchorEl}
        open={Boolean(columnsMenuAnchorEl)}
        onClose={() => setColumnsMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            minWidth: 280,
            maxWidth: 400,
            maxHeight: '70vh',
            overflow: 'hidden',
            '& .MuiMenu-list': {
              padding: 0
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          bgcolor: 'grey.50'
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Column Visibility
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {visibleColumns.length} of {columns.length} columns visible
          </Typography>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ 
          p: 1.5, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap'
        }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              // Show all columns
              const newVisibility: Record<string, boolean> = {}
              columns.forEach(col => {
                newVisibility[col.key] = true
              })
              onColumnVisibilityChange?.(newVisibility)
            }}
            sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1.5 }}
          >
            Show All
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              // Hide all columns
              const newVisibility: Record<string, boolean> = {}
              columns.forEach(col => {
                newVisibility[col.key] = false
              })
              onColumnVisibilityChange?.(newVisibility)
            }}
            sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1.5 }}
          >
            Hide All
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              // Show only essential columns
              const newVisibility: Record<string, boolean> = {}
              columns.forEach(col => {
                // Define essential columns (you can customize this)
                const essentialColumns = ['name', 'category', 'sku', 'purchasePrice', 'salesPrice', 'status']
                newVisibility[col.key] = essentialColumns.includes(col.key)
              })
              onColumnVisibilityChange?.(newVisibility)
            }}
            sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1.5 }}
          >
            Essential
          </Button>
        </Box>

        {/* Column List */}
        <Box sx={{ 
          maxHeight: '50vh', 
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: '3px',
          },
        }}>
          {/* Visible Columns Section */}
          {visibleColumns.length > 0 && (
            <>
              <Box sx={{ p: 1.5, bgcolor: 'success.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>
                  VISIBLE COLUMNS ({visibleColumns.length})
                </Typography>
              </Box>
              {visibleColumns.map((column) => (
                <MenuItem 
                  key={column.key} 
                  onClick={() => toggleColumnVisibility(column.key)}
                  sx={{ 
                    py: 1,
                    px: 2,
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <Checkbox 
                    checked={true} 
                    size="small"
                    sx={{ 
                      mr: 1.5,
                      '&.Mui-checked': { color: 'success.main' }
                    }} 
                  />
                  <ListItemText 
                    primary={column.label}
                    sx={{ 
                      '& .MuiListItemText-primary': { 
                        fontSize: '0.875rem',
                        fontWeight: 500
                      } 
                    }}
                  />
                  <Box sx={{ 
                    ml: 1,
                    px: 1,
                    py: 0.5,
                    bgcolor: 'success.100',
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    color: 'success.main',
                    fontWeight: 500
                  }}>
                    ON
                  </Box>
                </MenuItem>
              ))}
            </>
          )}

          {/* Hidden Columns Section */}
          {hiddenColumns.length > 0 && (
            <>
              <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  HIDDEN COLUMNS ({hiddenColumns.length})
                </Typography>
              </Box>
              {hiddenColumns.map((column) => (
                <MenuItem 
                  key={column.key} 
                  onClick={() => toggleColumnVisibility(column.key)}
                  sx={{ 
                    py: 1,
                    px: 2,
                    opacity: 0.7,
                    '&:hover': { 
                      bgcolor: 'action.hover',
                      opacity: 1 
                    }
                  }}
                >
                  <Checkbox 
                    checked={false} 
                    size="small"
                    sx={{ mr: 1.5 }} 
                  />
                  <ListItemText 
                    primary={column.label}
                    sx={{ 
                      '& .MuiListItemText-primary': { 
                        fontSize: '0.875rem',
                        color: 'text.secondary'
                      } 
                    }}
                  />
                  <Box sx={{ 
                    ml: 1,
                    px: 1,
                    py: 0.5,
                    bgcolor: 'grey.200',
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    fontWeight: 500
                  }}>
                    OFF
                  </Box>
                </MenuItem>
              ))}
            </>
          )}
        </Box>

        {/* Footer with column count */}
        <Box sx={{ 
          p: 1.5, 
          borderTop: '1px solid', 
          borderColor: 'divider',
          bgcolor: 'grey.50',
          textAlign: 'center'
        }}>
          <Typography variant="caption" color="text.secondary">
            {visibleColumns.length} columns visible • {hiddenColumns.length} hidden
          </Typography>
        </Box>
      </Menu>
    )
  }

  const renderExportMenu = () => (
    <Menu
      anchorEl={exportMenuAnchorEl}
      open={Boolean(exportMenuAnchorEl)}
      onClose={() => setExportMenuAnchorEl(null)}
    >
      {onExportCSV && (
        <MenuItem
          onClick={() => {
            onExportCSV()
            setExportMenuAnchorEl(null)
          }}
        >
          Export CSV
        </MenuItem>
      )}
      {onExportPDF && (
        <MenuItem
          onClick={() => {
            onExportPDF()
            setExportMenuAnchorEl(null)
          }}
        >
          Export PDF
        </MenuItem>
      )}
    </Menu>
  )

  return (
    <Box sx={{ mb: 3 }}>
      <Card sx={{ mb: 0, bgcolor: backgroundColor }}>
        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
          {/* Title */}
          {title && (
            <Typography variant="h6" sx={{ color: textColor, mb: 1, fontWeight: "medium" }}>
              {title}
            </Typography>
          )}


          {/* Single Horizontal Row */}
          <Box sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 1, 
            flexWrap: singleRow ? "nowrap" : "wrap",
            overflowX: singleRow ? "auto" : "visible",
            '&::-webkit-scrollbar': singleRow ? {
              height: '4px',
            } : {},
            '&::-webkit-scrollbar-track': singleRow ? {
              backgroundColor: 'rgba(255,255,255,0.1)',
            } : {},
            '&::-webkit-scrollbar-thumb': singleRow ? {
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: '2px',
            } : {},
          }}>
            {/* Date Navigation - Only show if showDateControls is true */}
            {showDateControls && dateType !== "custom" && (
              <>
                <IconButton onClick={handlePrevPeriod} size="small" sx={{ color: textColor }}>
                  <ChevronLeftIcon />
                </IconButton>
                <Button
                  ref={dateButtonRef}
                  onClick={() => setDatePickerOpen(true)}
                  variant="text"
                  startIcon={<CalendarTodayIcon />}
                  sx={{
                    fontWeight: "medium",
                    fontSize: "0.95rem",
                    minWidth: 200,
                    color: textColor,
                    textTransform: "none",
                  }}
                >
                  {getDateDisplayText()}
                </Button>
                <IconButton onClick={handleNextPeriod} size="small" sx={{ color: textColor }}>
                  <ChevronRightIcon />
                </IconButton>
                <Tooltip title="Go to Today">
                  <IconButton onClick={handleGoToToday} size="small" sx={{ color: textColor }}>
                    <TodayIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}

            {/* Custom Date Range Selectors - Inline */}
            {showDateControls && dateType === "custom" && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={customStartDate || currentDate}
                    onChange={(date) => {
                      if (date && onCustomDateRangeChange) {
                        onCustomDateRangeChange(date, customEndDate || new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000))
                      }
                    }}
                    slotProps={{ 
                      textField: { 
                        size: "small",
                        sx: {
                          width: 140,
                          "& .MuiOutlinedInput-root": {
                            bgcolor: "white",
                            "& fieldset": { borderColor: "rgba(255, 255, 255, 0.5)" },
                            "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.8)" },
                            "&.Mui-focused fieldset": { borderColor: "white" },
                          },
                          "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.8)" },
                          "& .MuiInputLabel-root.Mui-focused": { color: "white" },
                        }
                      } 
                    }}
                  />
                  <Typography variant="body2" sx={{ color: textColor, mx: 1 }}>
                    to
                  </Typography>
                  <DatePicker
                    label="End Date"
                    value={customEndDate || new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)}
                    onChange={(date) => {
                      if (date && onCustomDateRangeChange) {
                        onCustomDateRangeChange(customStartDate || currentDate, date)
                      }
                    }}
                    slotProps={{ 
                      textField: { 
                        size: "small",
                        sx: {
                          width: 140,
                          "& .MuiOutlinedInput-root": {
                            bgcolor: "white",
                            "& fieldset": { borderColor: "rgba(255, 255, 255, 0.5)" },
                            "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.8)" },
                            "&.Mui-focused fieldset": { borderColor: "white" },
                          },
                          "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.8)" },
                          "& .MuiInputLabel-root.Mui-focused": { color: "white" },
                        }
                      } 
                    }}
                  />
                </LocalizationProvider>
              </Box>
            )}

            {/* Date Type Selector - Only show if showDateControls and showDateTypeSelector are true */}
            {showDateControls && showDateTypeSelector && onDateTypeChange && (
              <FormControl size="small" sx={{ minWidth: 100, ml: 1 }}>
                <InputLabel sx={{ color: textColor }}>View</InputLabel>
                <Select
                  value={dateType}
                  onChange={(e) => onDateTypeChange?.(e.target.value as "day" | "week" | "month" | "custom")}
                  label="View"
                  sx={{
                    color: textColor,
                    "& .MuiSvgIcon-root": { color: textColor },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: textColor },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
                  }}
                  MenuProps={{
                    PaperProps: { sx: { mt: 1 } },
                  }}
                >
                  {availableDateTypes.includes("day") && <MenuItem key="day" value="day">Day</MenuItem>}
                  {availableDateTypes.includes("week") && <MenuItem key="week" value="week">Week</MenuItem>}
                  {availableDateTypes.includes("month") && <MenuItem key="month" value="month">Month</MenuItem>}
                  {availableDateTypes.includes("custom") && <MenuItem key="custom" value="custom">Custom</MenuItem>}
                </Select>
              </FormControl>
            )}

            {/* Search - only show if search props are provided */}
            {searchTerm !== undefined && onSearchChange && searchTerm !== null && onSearchChange !== null && (
              <TextField
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
                sx={{
                  ml: 1,
                  width: 250,
                  bgcolor: "white",
                  borderRadius: 1,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "white",
                    "& fieldset": { borderColor: "rgba(0, 0, 0, 0.23)" },
                    "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.87)" },
                    "&.Mui-focused fieldset": { borderColor: backgroundColor },
                  },
                }}
              />
            )}

            {/* Additional Controls */}
            {additionalControls}

            {/* Group By Dropdown */}
            {groupByOptions.length > 0 && onGroupByChange && (
              <FormControl size="small" sx={{ minWidth: 110, ml: 1 }}>
                <InputLabel sx={{ color: textColor }}>Group By</InputLabel>
                <Select
                  value={groupByValue}
                  onChange={(e) => onGroupByChange(e.target.value)}
                  label="Group By"
                  sx={{
                    color: textColor,
                    "& .MuiSvgIcon-root": { color: textColor },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: textColor },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
                  }}
                  MenuProps={{
                    PaperProps: { sx: { mt: 1 } },
                  }}
                >
                  {groupByOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Sort Dropdown */}
            {sortOptions.length > 0 && onSortChange && (
              <FormControl size="small" sx={{ minWidth: 120, ml: 1 }}>
                <InputLabel sx={{ color: textColor }}>Sort By</InputLabel>
                <Select
                  value={sortValue}
                  onChange={(e) => onSortChange(e.target.value, sortDirection)}
                  label="Sort By"
                  sx={{
                    color: textColor,
                    "& .MuiSvgIcon-root": { color: textColor },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: textColor },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
                  }}
                  MenuProps={{
                    PaperProps: { sx: { mt: 1 } },
                  }}
                >
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {option.label}
                        {sortValue === option.value && (
                          sortDirection === "asc" ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Sort Direction Toggle */}
            {sortOptions.length > 0 && onSortChange && sortValue && (
              <Tooltip title={`Sort ${sortDirection === "asc" ? "Descending" : "Ascending"}`}>
                <IconButton 
                  onClick={() => onSortChange(sortValue, sortDirection === "asc" ? "desc" : "asc")}
                  size="small" 
                  sx={{ color: textColor, ml: 0.5 }}
                >
                  {sortDirection === "asc" ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                </IconButton>
              </Tooltip>
            )}

            {/* Spacer to push actions to the right */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Actions */}
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              {/* Filters Toggle */}
              {filters.length > 0 && onFiltersToggle && (
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  endIcon={filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={onFiltersToggle}
                  size="small"
                  sx={{ 
                    color: textColor, 
                    borderColor: textColor, 
                    "&:hover": { borderColor: "grey.300", bgcolor: "rgba(255,255,255,0.1)" } 
                  }}
                >
                  Filters
                </Button>
              )}

              {/* Column Visibility */}
              {columns.length > 0 && onColumnVisibilityChange && (() => {
                const visibleCount = columns.filter(col => columnVisibility[col.key]).length
                const totalCount = columns.length
                
                return (
                  <Button
                    variant="outlined"
                    startIcon={<VisibilityIcon />}
                    onClick={(e) => setColumnsMenuAnchorEl(e.currentTarget)}
                    size="small"
                    sx={{ 
                      color: textColor, 
                      borderColor: textColor, 
                      "&:hover": { borderColor: "grey.300", bgcolor: "rgba(255,255,255,0.1)" },
                      minWidth: { xs: 'auto', sm: '120px' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    <Box sx={{ 
                      display: { xs: 'none', sm: 'flex' }, 
                      alignItems: 'center', 
                      gap: 0.5 
                    }}>
                      Columns
                      <Box sx={{
                        ml: 0.5,
                        px: 1,
                        py: 0.25,
                        bgcolor: visibleCount === totalCount ? 'success.main' : 'warning.main',
                        color: 'white',
                        borderRadius: 1,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        minWidth: '20px',
                        textAlign: 'center'
                      }}>
                        {visibleCount}
                      </Box>
                    </Box>
                    <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.5 }}>
                      <VisibilityIcon fontSize="small" />
                      <Box sx={{
                        px: 0.75,
                        py: 0.25,
                        bgcolor: visibleCount === totalCount ? 'success.main' : 'warning.main',
                        color: 'white',
                        borderRadius: 1,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        minWidth: '16px',
                        textAlign: 'center'
                      }}>
                        {visibleCount}
                      </Box>
                    </Box>
                  </Button>
                )
              })()}

              {/* Export */}
              {(onExportCSV || onExportPDF) && (
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={(e) => setExportMenuAnchorEl(e.currentTarget)}
                  size="small"
                  sx={{ 
                    color: textColor, 
                    borderColor: textColor, 
                    "&:hover": { borderColor: "grey.300", bgcolor: "rgba(255,255,255,0.1)" } 
                  }}
                >
                  Export
                </Button>
              )}


              {/* Additional Buttons */}
              {additionalButtons.map((button, index) => (
                <Button
                  key={index}
                  variant={button.variant || "outlined"}
                  startIcon={button.icon}
                  onClick={button.onClick}
                  size="small"
                  color={button.color}
                  sx={
                    button.variant === "contained"
                      ? { bgcolor: "white", color: backgroundColor, "&:hover": { bgcolor: "grey.100" } }
                      : { 
                          color: textColor, 
                          borderColor: textColor, 
                          "&:hover": { borderColor: "grey.300", bgcolor: "rgba(255,255,255,0.1)" } 
                        }
                  }
                >
                  {button.label}
                </Button>
              ))}

              {/* Create New */}
              {onCreateNew && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={onCreateNew}
                  size="small"
                  sx={{ 
                    bgcolor: "white", 
                    color: backgroundColor, 
                    "&:hover": { bgcolor: "grey.100" }, 
                    whiteSpace: "nowrap" 
                  }}
                >
                  {createButtonLabel}
                </Button>
              )}
            </Box>
          </Box>

          {/* Date Picker Dialog - Only show if showDateControls is true */}
          {showDateControls && (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                open={datePickerOpen}
                onClose={() => setDatePickerOpen(false)}
                value={currentDate}
                onChange={handleDatePickerChange}
                slotProps={{
                  textField: { sx: { display: "none" } },
                  popper: {
                    anchorEl: dateButtonRef.current,
                    placement: "bottom-start",
                    sx: {
                      zIndex: 1300,
                      "& .MuiPaper-root": { marginTop: 1 },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          )}


          {/* Filters Row - Collapsible */}
          {filters.length > 0 && (
            <Collapse in={filtersExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                {filters.map((filter, index) => (
                  <FormControl key={index} size="small" sx={{ minWidth: 180 }}>
                    <InputLabel sx={{ color: textColor }}>{filter.label}</InputLabel>
                    <Select
                      multiple
                      value={filter.selectedValues}
                      onChange={(e) => filter.onSelectionChange(Array.isArray(e.target.value) ? (e.target.value as string[]) : [])}
                      label={filter.label}
                      renderValue={(selected) => selected.join(", ")}
                      sx={{
                        color: textColor,
                        "& .MuiSvgIcon-root": { color: textColor },
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: textColor },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
                      }}
                    >
                      {filter.options.map((option, optionIndex) => (
                        <MenuItem key={option.id || option.name || `option-${optionIndex}`} value={option.name}>
                          <Checkbox checked={filter.selectedValues.indexOf(option.name) > -1} />
                          <ListItemText
                            primary={
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                {option.color && (
                                  <Box 
                                    sx={{ 
                                      width: 12, 
                                      height: 12, 
                                      borderRadius: "50%", 
                                      bgcolor: option.color, 
                                      mr: 1, 
                                      border: "1px solid rgba(0,0,0,0.1)" 
                                    }} 
                                  />
                                )}
                                {option.name}
                              </Box>
                            }
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ))}
              </Box>
            </Collapse>
          )}
        </CardContent>
      </Card>

      {/* Column Visibility Menu */}
      {renderColumnsMenu()}

      {/* Export Menu */}
      {renderExportMenu()}
    </Box>
  )
}

export default DataHeader
