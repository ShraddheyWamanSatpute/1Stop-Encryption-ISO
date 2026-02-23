"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Box, Typography, IconButton } from "@mui/material"
import { Settings as SettingsIcon } from "@mui/icons-material"
import { Bar, Line, Pie } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js"
import { DataGrid } from "@mui/x-data-grid"
import { type DynamicWidgetProps, WidgetType, DataType } from "../../types/WidgetTypes"
import AnimatedCounter from "./AnimatedCounter"
import DashboardCard from "./DashboardCard"
import { useTouchInteractions } from "../../hooks/useTouchInteractions"
import { getCurrencyPrefix, formatValueByDataType, isCurrencyDataType } from "../../utils/currencyUtils"
import SimpleCalculatorWidget from "../tools/SimpleCalculatorWidget"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
)

const DynamicWidget: React.FC<DynamicWidgetProps> = ({ widget, data, onSettingsOpen, isEditing = false }) => {
  console.log('DynamicWidget: Rendering widget', widget.id, 'with data:', data, 'widget type:', widget.type)
  
  const [chartData, setChartData] = useState<any>(null)
  const chartRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  // Touch interaction for long press to open settings
  const { handleTouchStart: onTouchStart, onTouchMove: onTouchMoveRaw, onTouchEnd, isLongPress } = useTouchInteractions({
    longPressDelay: 800,
    moveThreshold: 10,
  })

  // Function to handle responsive font sizing
  const getResponsiveFontSize = (baseSize: number) => {
    const scaleFactor = Math.min(containerSize.width / 300, containerSize.height / 200)
    // Don't go below 70% of base size
    return Math.max(baseSize * scaleFactor, baseSize * 0.7)
  }

  // Update container size on resize
  useEffect(() => {
    if (!containerRef.current) return

    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }

    updateSize()

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(containerRef.current)

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current)
      }
    }
  }, [])

  // Helper function to format dates for compact display
  const formatDateLabel = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      const day = date.getDate()
      const month = date.getMonth() + 1
      const year = date.getFullYear().toString().slice(-2) // Last 2 digits
      
      // Format as DD/MM/YY for compact display
      return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`
    } catch {
      return dateString
    }
  }

  // Process data for charts
  useEffect(() => {
    if (!data || !widget) {
      console.log('DynamicWidget: Missing data or widget for processing:', { data: !!data, widget: !!widget })
      setChartData(null)
      return
    }

    console.log('DynamicWidget: Processing chart data for widget:', widget.id, 'Type:', widget.type, 'DataType:', widget.dataType)
    console.log('DynamicWidget: Data structure:', {
      hasHistory: !!data.history,
      hasData: !!data.data,
      historyType: Array.isArray(data.history) ? 'array' : typeof data.history,
      dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
      historyLength: Array.isArray(data.history) ? data.history.length : 'N/A',
      dataLength: Array.isArray(data.data) ? data.data.length : 'N/A'
    })

    const processChartData = () => {
      try {
        const labels = (data.history?.map((item: any) => formatDateLabel(item.date)) || [])
        console.log('DynamicWidget: Chart labels:', labels)

      switch (widget.type) {
        case WidgetType.BAR_CHART:
          // Handle both history and data arrays for bar charts
          const barLabels = data.history?.map((item: any) => formatDateLabel(item.date)) || data.data?.map((item: any) => item.category || item.supplier || item.name) || []
          
          return {
            labels: barLabels,
            datasets: widget.dataSeries
              .filter((series) => series.visible)
              .map((series, seriesIndex) => {
                console.log('DynamicWidget: Processing BAR_CHART series:', series.dataType, 'displayMode:', series.displayMode);
                
                const dataArray = data.history || data.data || []
                if (!Array.isArray(dataArray)) {
                  console.warn('DynamicWidget: BAR_CHART dataArray is not an array:', dataArray)
                  return {
                    label: series.label || series.dataType,
                    data: [],
                    backgroundColor: series.color || "#4CAF50",
                    borderColor: series.color || "#4CAF50",
                    borderWidth: 1,
                  }
                }
                
                const chartData = dataArray.map((item: any) => {
                  let value = 0
                  
                  // For category/supplier data (data.data format)
                  if (data.data && (item.category !== undefined || item.supplier !== undefined)) {
                    value = series.displayMode === "price" ? item.value : item.count
                  } else {
                    // For history data (data.history format)
                    value = series.displayMode === "price" ? item[series.dataType]?.price : item[series.dataType]?.quantity
                  }
                  
                  console.log('DynamicWidget: BAR_CHART mapping item:', item, 'series.dataType:', series.dataType, 'value:', value);
                  return value;
                })
                
                return {
                  label: series.label || series.dataType,
                  data: chartData,
                  backgroundColor:
                    series.color || widget.colors.series[seriesIndex % widget.colors.series.length] || "#4CAF50",
                  borderColor:
                    series.color || widget.colors.series[seriesIndex % widget.colors.series.length] || "#4CAF50",
                  borderWidth: 1,
                }
              }),
          }

        case WidgetType.LINE_CHART:
        case WidgetType.MULTIPLE_SERIES_LINE_CHART:
          // For line charts, we primarily use history data (time series)
          const lineLabels = data.history?.map((item: any) => formatDateLabel(item.date)) || []
          
          return {
            labels: lineLabels,
            datasets: widget.dataSeries
              .filter((series) => series.visible)
              .map((series, seriesIndex) => {
                const dataArray = data.history || []
                if (!Array.isArray(dataArray)) {
                  console.warn('DynamicWidget: LINE_CHART dataArray is not an array:', dataArray)
                  return {
                    label: series.label || series.dataType,
                    data: [],
                    borderColor: series.color || "#4CAF50",
                    backgroundColor: `${series.color || "#4CAF50"}20`,
                    borderWidth: 2,
                    tension: 0.4,
                  }
                }
                
                const chartData = dataArray.map((item: any) => {
                  let value = 0
                  
                  // For history data (data.history format)
                  value = series.displayMode === "price" ? item[series.dataType]?.price : item[series.dataType]?.quantity
                  
                  return value || 0
                })
                
                return {
                  label: series.label || series.dataType,
                  data: chartData,
                  borderColor:
                    series.color || widget.colors.series[seriesIndex % widget.colors.series.length] || "#4CAF50",
                  backgroundColor: `${series.color || widget.colors.series[seriesIndex % widget.colors.series.length] || "#4CAF50"}20`,
                  borderWidth: 2,
                  tension: 0.4,
                  fill: widget.chartType === "area",
                  pointRadius: 3,
                  pointHoverRadius: 5,
                }
              }),
          }

        case WidgetType.PIE_CHART:
          // For pie charts, we need to aggregate data differently
          const pieData = widget.dataSeries
            .filter((series) => series.visible)
            .map((series) => {
              // Handle both history and data arrays
              const dataArray = data.history || data.data || []
              
              // Ensure dataArray is actually an array
              if (!Array.isArray(dataArray)) {
                console.warn('DynamicWidget: dataArray is not an array:', dataArray)
                return {
                  label: series.label || series.dataType,
                  value: 0,
                }
              }
              
              // Sum up all values for this series
              const total = dataArray.reduce((sum: number, item: any) => {
                let value = 0
                
                // For category/supplier data (data.data format)
                if (data.data && item.category !== undefined) {
                  value = series.displayMode === "price" ? item.value : item.count
                } else if (data.data && item.supplier !== undefined) {
                  value = series.displayMode === "price" ? item.value : item.count
                } else {
                  // For history data (data.history format)
                  value = series.displayMode === "price" ? item[series.dataType]?.price : item[series.dataType]?.quantity
                }
                
                return sum + (value || 0)
              }, 0)

              return {
                label: series.label || series.dataType,
                value: total,
              }
            })

          return {
            labels: pieData.map((item) => item.label),
            datasets: [
              {
                data: pieData.map((item) => item.value),
                backgroundColor: widget.dataSeries
                  .filter((series) => series.visible)
                  .map(
                    (series, seriesIndex) =>
                      series.color || widget.colors.series[seriesIndex % widget.colors.series.length] || "#4CAF50",
                  ),
                borderColor: widget.colors.border || "#ffffff",
                borderWidth: 2,
              },
            ],
          }

        default:
          return null
      }
      } catch (error) {
        console.error('DynamicWidget: Error processing chart data:', error, 'Widget:', widget.id, 'Data:', data)
        return null
      }
    }

    setChartData(processChartData())
  }, [data, widget])

  // Handle long press to open settings
  useEffect(() => {
    if (isLongPress && isEditing && onSettingsOpen) {
      onSettingsOpen(widget.id)
    }
  }, [isLongPress, isEditing, onSettingsOpen, widget.id])

  // Render different widget types
  const renderWidget = () => {
    if (!widget) return null

    const titleFontSize = getResponsiveFontSize(16)
    const valueFontSize = getResponsiveFontSize(24)

    switch (widget.type) {
      case WidgetType.STAT:
      case WidgetType.KPI_CARD:
        let value = 0
        let hasValidData = false

        if (!data) {
          value = 0
          hasValidData = false
        } else if (widget.dataType === DataType.STOCK_VALUE && data.totalValue !== undefined) {
          value = data.totalValue
          hasValidData = true
        } else if (widget.dataType === DataType.STOCK_QUANTITY && data.totalQuantity !== undefined) {
          value = data.totalQuantity
          hasValidData = true
        } else if (widget.dataType === DataType.STOCK_PROFIT && data.totalProfit !== undefined) {
          value = data.totalProfit
          hasValidData = true
        } else if (widget.dataType === DataType.TOTAL_ITEMS && data.totalItems !== undefined) {
          value = data.totalItems
          hasValidData = true
        } else if (widget.dataType === DataType.PROFIT_MARGIN && data.profitMargin !== undefined) {
          value = data.profitMargin
          hasValidData = true
        } else if (widget.dataType === DataType.LOW_STOCK_ITEMS && data.lowStockItems !== undefined) {
          value = data.lowStockItems
          hasValidData = true
        } else if (widget.dataType === DataType.INVENTORY_VALUE && data.inventoryValue !== undefined) {
          value = data.inventoryValue
          hasValidData = true
        } else if (widget.dataType === DataType.SALES && data.totalSalesValue !== undefined) {
          value = data.totalSalesValue
          hasValidData = true
        } else if (widget.dataType === DataType.COST_OF_SALES && data.totalCostValue !== undefined) {
          value = data.totalCostValue
          hasValidData = true
        } else if (widget.dataType === DataType.STOCK_QUANTITY && data.totalQuantity !== undefined) {
          value = data.totalQuantity
          hasValidData = true
        } else if (widget.dataType === DataType.ATTENDANCE && data.attendanceRate !== undefined) {
          value = data.attendanceRate
          hasValidData = true
        } else if (widget.dataType === DataType.PERFORMANCE && data.performanceScore !== undefined) {
          value = data.performanceScore
          hasValidData = true
        } else if (widget.dataType === DataType.TURNOVER && data.turnoverRate !== undefined) {
          value = data.turnoverRate
          hasValidData = true
        } else if (widget.dataType === DataType.RECRUITMENT && data.timeToHire !== undefined) {
          value = data.timeToHire
          hasValidData = true
        } else if (widget.dataType === DataType.TRAINING && data.trainingCompletion !== undefined) {
          value = data.trainingCompletion
          hasValidData = true
        } else if (widget.dataType === DataType.PAYROLL && data.payrollCost !== undefined) {
          value = data.payrollCost
          hasValidData = true
        } else if (widget.dataType === DataType.POS_TRANSACTIONS && data.totalTransactions !== undefined) {
          value = data.totalTransactions
          hasValidData = true
        } else if (widget.dataType === DataType.SALES_BY_DAY && data.dailySales !== undefined) {
          value = data.dailySales
          hasValidData = true
        } else if (widget.dataType === DataType.SALES_BY_HOUR && data.hourlySales !== undefined) {
          value = data.hourlySales
          hasValidData = true
        } else if (widget.dataType === DataType.PAYMENT_METHOD_BREAKDOWN && data.paymentMethods !== undefined) {
          value = data.paymentMethods
          hasValidData = true
        } else if (widget.dataType === DataType.CUSTOMER_ANALYTICS && data.customerAnalytics !== undefined) {
          value = data.customerAnalytics
          hasValidData = true
        } else if (widget.dataType === DataType.TOTAL_BOOKINGS && data.totalBookings !== undefined) {
          value = data.totalBookings
          hasValidData = true
        } else if (widget.dataType === DataType.OCCUPANCY_RATE && data.occupancyRate !== undefined) {
          value = data.occupancyRate
          hasValidData = true
        } else if (widget.dataType === DataType.WAITLIST_ANALYTICS && data.waitlistCount !== undefined) {
          value = data.waitlistCount
          hasValidData = true
        } else if (widget.dataType === DataType.TABLE_UTILIZATION && data.activeTables !== undefined) {
          value = data.activeTables
          hasValidData = true
        } else if (widget.dataType === DataType.BOOKING_TRENDS && data.totalBookings !== undefined) {
          value = data.totalBookings
          hasValidData = true
        }

        const prefix = getCurrencyPrefix(widget.dataType || DataType.STOCK_VALUE)

        return (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              p: 2,
              overflow: "hidden",
            }}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{
                color: widget.colors.title || widget.colors.text,
                mb: 1,
                fontSize: titleFontSize,
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
                px: 1,
              }}
            >
              {widget.title}
            </Typography>
            {hasValidData ? (
              <Typography
                variant="h3"
                component="div"
                sx={{
                  color: widget.colors.text,
                  fontWeight: "bold",
                  fontSize: valueFontSize,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  width: "100%",
                  px: 1,
                }}
              >
                <AnimatedCounter
                  value={value}
                  prefix={prefix}
                  suffix={widget.dataType === DataType.PROFIT_MARGIN ? "%" : ""}
                  decimals={widget.dataType === DataType.PROFIT_MARGIN ? 1 : 0}
                  isCurrency={isCurrencyDataType(widget.dataType || DataType.STOCK_VALUE)}
                />
              </Typography>
            ) : (
              <Typography
                variant="body2"
                component="div"
                sx={{
                  color: "text.secondary",
                  fontSize: valueFontSize * 0.5,
                  textAlign: "center",
                  px: 1,
                }}
              >
                No data available
              </Typography>
            )}
          </Box>
        )

      case WidgetType.BAR_CHART:
      case WidgetType.LINE_CHART:
      case WidgetType.PIE_CHART:
      case WidgetType.MULTIPLE_SERIES_LINE_CHART:
      case WidgetType.AREA_CHART:
      case WidgetType.DONUT_CHART:
      case WidgetType.STACKED_BAR_CHART:
      case WidgetType.STACKED_AREA_CHART:
        if (!chartData) {
          return (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              flexDirection: 'column',
              p: 2
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {data && data.history ? 'Processing chart data...' : 'No data available'}
              </Typography>
              {!data && (
                <Typography variant="caption" color="error">
                  Widget data not loaded
                </Typography>
              )}
            </Box>
          )
        }

        // Calculate percentage-based sizes
        const titleHeight = Math.max(containerSize.height * 0.12, 20) // 12% of height, min 20px
        const labelFontSize = Math.max(containerSize.height * 0.045, 8) // 4.5% of height, min 8px
        const axisLabelSize = Math.max(containerSize.height * 0.04, 7) // 4% of height, min 7px
        const legendSize = Math.max(containerSize.height * 0.045, 8) // 4.5% of height, min 8px
        
        const chartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: 2,
              right: 2,
              bottom: 2,
              left: 2,
            },
          },
          plugins: {
            legend: {
              display: widget.dataSeries.length > 1,
              position: "bottom" as const,
              labels: {
                boxWidth: Math.max(containerSize.width * 0.025, 8), // 2.5% of width
                padding: Math.max(containerSize.height * 0.02, 4), // 2% of height
                font: {
                  size: legendSize,
                },
              },
            },
            tooltip: {
              enabled: true,
              mode: "index" as const,
              intersect: false,
              callbacks: {
                label: (context: any) => {
                  let label = context.dataset.label || ""
                  if (label) {
                    label += ": "
                  }
                  if (context.parsed.y !== null && context.parsed.y !== undefined) {
                    const dataType = widget.dataSeries[context.datasetIndex]?.dataType
                    if (isCurrencyDataType(dataType)) {
                      label += formatValueByDataType(context.parsed.y, dataType)
                    } else {
                      label += context.parsed.y.toLocaleString('en-GB')
                    }
                  } else {
                    label += "0"
                  }
                  return label
                },
              },
            },
          },
          scales:
            widget.type !== WidgetType.PIE_CHART
              ? {
                  x: {
                    grid: {
                      display: false,
                      drawBorder: false,
                    },
                    ticks: {
                      font: {
                        size: axisLabelSize,
                      },
                      maxRotation: 35, // Reduced from 45 for better readability
                      minRotation: 35,
                      autoSkip: true,
                      maxTicksLimit: Math.max(Math.floor(containerSize.width / 45), 4), // More aggressive limiting
                      padding: 2, // Minimal padding
                    },
                  },
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: `${widget.colors.text}08`,
                      drawBorder: false,
                      lineWidth: 0.5,
                    },
                    ticks: {
                      font: {
                        size: axisLabelSize,
                      },
                      padding: Math.max(containerSize.width * 0.01, 2), // 1% of width
                      autoSkip: true,
                      maxTicksLimit: Math.max(Math.floor(containerSize.height / 35), 3), // More aggressive limiting
                      callback: (value: any) => {
                        if (
                          widget.dataSeries.some(
                            (s) => isCurrencyDataType(s.dataType)
                          )
                        ) {
                          // Compact currency format for small charts
                          const numValue = Number(value)
                          if (numValue >= 1000000) {
                            return `£${(numValue / 1000000).toFixed(1)}M`
                          } else if (numValue >= 1000) {
                            return `£${(numValue / 1000).toFixed(1)}K`
                          }
                          return formatValueByDataType(value, widget.dataSeries[0]?.dataType || 'STOCK_VALUE')
                        }
                        // Compact number format
                        const numValue = Number(value)
                        if (numValue >= 1000000) {
                          return `${(numValue / 1000000).toFixed(1)}M`
                        } else if (numValue >= 1000) {
                          return `${(numValue / 1000).toFixed(1)}K`
                        }
                        return value
                      },
                    },
                  },
                }
              : undefined,
        }

        return (
          <Box sx={{ 
            height: "100%", 
            display: "flex", 
            flexDirection: "column", 
            p: 0.5, // Minimal padding (4px)
            overflow: "visible",
          }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                color: widget.colors.title || widget.colors.text,
                height: `${titleHeight}px`,
                maxHeight: `${titleHeight}px`,
                lineHeight: `${titleHeight}px`,
                fontSize: `${labelFontSize}px`,
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                px: 0.25, // Minimal horizontal padding
                mb: 0.25, // Minimal margin bottom (2px)
                flexShrink: 0,
              }}
            >
              {widget.title}
            </Typography>
            <Box sx={{ 
              flexGrow: 1, 
              position: "relative",
              backgroundColor: "transparent",
              border: "none",
              outline: "none",
              minHeight: 0,
              overflow: "visible", // Allow labels to overflow
              mx: 0, // No negative margin needed with minimal padding
            }}>
              {widget.type === WidgetType.BAR_CHART && <Bar data={chartData} options={chartOptions} ref={chartRef} />}
              {(widget.type === WidgetType.LINE_CHART || widget.type === WidgetType.MULTIPLE_SERIES_LINE_CHART) && (
                <Line data={chartData} options={chartOptions} ref={chartRef} />
              )}
              {widget.type === WidgetType.PIE_CHART && <Pie data={chartData} options={chartOptions} ref={chartRef} />}
            </Box>
          </Box>
        )

      case WidgetType.TABLE:
      case WidgetType.DATA_GRID:
        // Prepare columns and rows for DataGrid
        const columns = [
          { field: "name", headerName: "Name", flex: 1 },
          {
            field: "quantity",
            headerName: "Quantity",
            width: 120,
            valueFormatter: (params: any) => {
              // Add null/undefined check
              return params.value !== null && params.value !== undefined ? params.value.toLocaleString() : "0"
            },
          },
          {
            field: "value",
            headerName: "Value",
            width: 120,
            valueFormatter: (params: any) => {
              // Add null/undefined check
              return params.value !== null && params.value !== undefined ? formatValueByDataType(params.value, 'STOCK_VALUE') : formatValueByDataType(0, 'STOCK_VALUE')
            },
          },
        ]

        // Ensure each item has all required properties with default values
        const rows =
          data.items?.map((item: any, index: number) => ({
            id: index,
            name: item.name || "Unknown",
            quantity: item.quantity || 0,
            value: item.value || 0,
          })) || []

        return (
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column", p: 2 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                color: widget.colors.title || widget.colors.text,
                mb: 1,
                fontSize: titleFontSize,
              }}
            >
              {widget.title}
            </Typography>
            <Box sx={{ flexGrow: 1, width: "100%" }}>
              <DataGrid
                rows={rows}
                columns={columns}
                disableRowSelectionOnClick
                density="compact"
                autoPageSize
                sx={{
                  border: "none",
                  "& .MuiDataGrid-cell": {
                    fontSize: getResponsiveFontSize(12),
                  },
                  "& .MuiDataGrid-columnHeader": {
                    fontSize: getResponsiveFontSize(12),
                  },
                }}
              />
            </Box>
          </Box>
        )

      case WidgetType.DASHBOARD_CARD:
        // Get appropriate icon based on card type
        const getCardIcon = () => {
          switch (widget.cardType) {
            case "sales":
              return "mdi:cash-register"
            case "inventory":
              return "mdi:package-variant-closed"
            case "alerts":
              return "mdi:alert-circle-outline"
            case "performance":
              return "mdi:chart-line"
            default:
              return "mdi:information-outline"
          }
        }

        // Get appropriate color based on card type
        const getCardColor = () => {
          switch (widget.cardType) {
            case "sales":
              return "#4CAF50"
            case "inventory":
              return "#2196F3"
            case "alerts":
              return "#FF9800"
            case "performance":
              return "#9C27B0"
            default:
              return "#607D8B"
          }
        }

        // Get appropriate value based on data type
        let cardValue = 0
        if (!data) {
          // Keep default value of 0
        } else if (widget.dataType === DataType.STOCK_VALUE && data.totalValue !== undefined) {
          cardValue = data.totalValue
        } else if (widget.dataType === DataType.STOCK_QUANTITY && data.totalQuantity !== undefined) {
          cardValue = data.totalQuantity
        } else if (widget.dataType === DataType.STOCK_PROFIT && data.totalProfit !== undefined) {
          cardValue = data.totalProfit
        } else if (widget.dataType === DataType.TOTAL_ITEMS && data.totalItems !== undefined) {
          cardValue = data.totalItems
        } else if (widget.dataType === DataType.PROFIT_MARGIN && data.profitMargin !== undefined) {
          cardValue = data.profitMargin
        } else if (widget.dataType === DataType.LOW_STOCK_ITEMS && data.lowStockItems !== undefined) {
          cardValue = data.lowStockItems
        } else if (widget.dataType === DataType.INVENTORY_VALUE && data.inventoryValue !== undefined) {
          cardValue = data.inventoryValue
        } else if (widget.dataType === DataType.SALES && data.totalSalesValue !== undefined) {
          cardValue = data.totalSalesValue
        } else if (widget.dataType === DataType.COST_OF_SALES && data.totalCostValue !== undefined) {
          cardValue = data.totalCostValue
        } else if (widget.dataType === DataType.STOCK_QUANTITY && data.totalQuantity !== undefined) {
          cardValue = data.totalQuantity
        } else if (widget.dataType === DataType.ATTENDANCE && data.attendanceRate !== undefined) {
          cardValue = data.attendanceRate
        } else if (widget.dataType === DataType.PERFORMANCE && data.performanceScore !== undefined) {
          cardValue = data.performanceScore
        } else if (widget.dataType === DataType.TURNOVER && data.turnoverRate !== undefined) {
          cardValue = data.turnoverRate
        } else if (widget.dataType === DataType.RECRUITMENT && data.timeToHire !== undefined) {
          cardValue = data.timeToHire
        } else if (widget.dataType === DataType.TRAINING && data.trainingCompletion !== undefined) {
          cardValue = data.trainingCompletion
        } else if (widget.dataType === DataType.PAYROLL && data.payrollCost !== undefined) {
          cardValue = data.payrollCost
        } else if (widget.dataType === DataType.POS_TRANSACTIONS && data.totalTransactions !== undefined) {
          cardValue = data.totalTransactions
        } else if (widget.dataType === DataType.SALES_BY_DAY && data.dailySales !== undefined) {
          cardValue = data.dailySales
        } else if (widget.dataType === DataType.SALES_BY_HOUR && data.hourlySales !== undefined) {
          cardValue = data.hourlySales
        } else if (widget.dataType === DataType.PAYMENT_METHOD_BREAKDOWN && data.paymentMethods !== undefined) {
          cardValue = data.paymentMethods
        } else if (widget.dataType === DataType.CUSTOMER_ANALYTICS && data.customerAnalytics !== undefined) {
          cardValue = data.customerAnalytics
        } else if (widget.dataType === DataType.TOTAL_BOOKINGS && data.totalBookings !== undefined) {
          cardValue = data.totalBookings
        } else if (widget.dataType === DataType.OCCUPANCY_RATE && data.occupancyRate !== undefined) {
          cardValue = data.occupancyRate
        } else if (widget.dataType === DataType.WAITLIST_ANALYTICS && data.waitlistCount !== undefined) {
          cardValue = data.waitlistCount
        } else if (widget.dataType === DataType.TABLE_UTILIZATION && data.activeTables !== undefined) {
          cardValue = data.activeTables
        } else if (widget.dataType === DataType.BOOKING_TRENDS && data.totalBookings !== undefined) {
          cardValue = data.totalBookings
        }

        // Format value based on data type
        const formattedCardValue = formatValueByDataType(cardValue, widget.dataType || DataType.STOCK_VALUE)

        // Calculate change percentage (mock data for now)
        const changePercentage = Math.floor(Math.random() * 20) - 5 // -5% to +15%

        return (
          <DashboardCard
            title={widget.title}
            value={formattedCardValue}
            icon={widget.icon || getCardIcon()}
            change={changePercentage}
            color={widget.colors.text || getCardColor()}
          />
        )

      case WidgetType.CALCULATOR:
        return (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <SimpleCalculatorWidget />
            </Box>
          </Box>
        )

      default:
        return <Box>Unsupported widget type</Box>
    }
  }

  return (
    <Box
      component="div"
      ref={containerRef}
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: widget?.colors?.background || "#ffffff",
        color: widget?.colors?.text || "#333333",
        border: `1px solid ${widget?.colors?.border || "#e0e0e0"}`,
        borderRadius: "6px", // Slightly smaller radius for tighter look
        overflow: "visible", // Allow labels to overflow card boundaries
        boxShadow: isEditing ? "0 0 0 2px #2196F3" : "0 1px 3px rgba(0,0,0,0.12)",
        transition: "box-shadow 0.2s ease-in-out",
        position: "relative",
        touchAction: isEditing ? "none" : "auto", // Prevent scrolling when editing
      }}
      onTouchStart={onTouchStart}
      onTouchMove={(e) => {
        // Convert React.TouchEvent to TouchEvent for the hook
        onTouchMoveRaw(e.nativeEvent)
      }}
      onTouchEnd={onTouchEnd}
    >
      {isEditing && onSettingsOpen && (
        <IconButton
          size="small"
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.9)",
            },
            zIndex: 10,
          }}
          onClick={() => onSettingsOpen(widget.id)}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      )}
      {renderWidget()}
    </Box>
  )
}

export default DynamicWidget
