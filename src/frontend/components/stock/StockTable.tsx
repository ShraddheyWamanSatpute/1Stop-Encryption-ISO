"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useStock } from "../../../backend/context/StockContext"
import type { Product } from "../../../backend/context/StockContext"
import * as StockFunctions from "../../../backend/functions/Stock"
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tooltip,
  Menu,
  MenuItem,
  useTheme,
} from "@mui/material"
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from "@mui/icons-material"
import CRUDModal from "../reusable/CRUDModal"
import TabbedProductForm, { TabbedProductFormRef } from "./forms/TabbedProductForm"
import DataHeader from "../reusable/DataHeader"
import type { ColumnOption } from "../reusable/DataHeader"

interface SimpleProductRow {
  id: string
  name: string
  category: string
  categoryId: string
  subCategory: string
  salesDivision: string
  course: string
  type: string
  purchasePrice: number
  salesPrice: number
  purchaseSupplier: string
  status: string
  predictedStock: number
  previousStock: number
  sku: string
  barcode: string
  description: string
  unit: string
  baseUnit: string
  quantityOfBaseUnits: number
  salesMeasure: string
  purchaseMeasure: string
  costPerBaseUnit: number
  profitPerBaseUnit: number
  profitForSalesMeasure: number
  purchases: number
  sales: number
  wastage: number
  minStock: number
  maxStock: number
  location: string
  lastUpdated: string
  createdDate: string
  profitMargin: number
}



const StockTable: React.FC = () => {
  const { state, deleteProduct, createProduct, updateProduct } = useStock()
  const { dataVersion, loading } = state
  const navigate = useNavigate()
  const theme = useTheme()

  const [searchQuery, setSearchQuery] = useState("")
  const [displayedItems, setDisplayedItems] = useState<SimpleProductRow[]>([])
  const [itemsPerBatch] = useState(50)
  const [currentBatch, setCurrentBatch] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)

  // DataHeader state
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>("asc")
  
  // Legacy sorting state for compatibility
  const [orderBy, setOrderBy] = useState<keyof SimpleProductRow>("name")
  const [order, setOrder] = useState<'asc' | 'desc'>("asc")
  
  // Filters state for DataHeader
  const [filters, setFilters] = useState({
    category: [] as string[],
    subCategory: [] as string[],
    salesDivision: [] as string[],
    course: [] as string[],
    type: [] as string[],
    status: [] as string[],
    supplier: [] as string[]
  })

  // Handle filter changes from DataHeader
  const handleFilterChange = (filterType: string, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: values.includes('all') ? [] : values
    }))
  }


  const [selectedItem, setSelectedItem] = useState<SimpleProductRow | null>(null)
  
  // Column configuration for visibility and width
  const [columnConfig, setColumnConfig] = useState<Record<string, { visible: boolean; label: string; width: number }>>({
    name: { visible: true, label: "Name", width: 200 },
    category: { visible: true, label: "Category", width: 150 },
    subCategory: { visible: false, label: "Sub Category", width: 130 },
    salesDivision: { visible: false, label: "Sales Division", width: 130 },
    course: { visible: false, label: "Course", width: 100 },
    sku: { visible: true, label: "SKU", width: 120 },
    type: { visible: false, label: "Type", width: 100 },
    purchaseSupplier: { visible: true, label: "Supplier", width: 150 },
    salesMeasure: { visible: true, label: "Sales Measures", width: 200 },
    purchaseMeasure: { visible: true, label: "Purchase Measures", width: 200 },
    purchasePrice: { visible: true, label: "Purchase Price", width: 130 },
    salesPrice: { visible: true, label: "Sales Price", width: 120 },
    baseUnit: { visible: false, label: "Base Unit", width: 100 },
    quantityOfBaseUnits: { visible: false, label: "Qty Base Units", width: 120 },
    costPerBaseUnit: { visible: false, label: "Cost/Base Unit", width: 120 },
    profitPerBaseUnit: { visible: false, label: "Profit/Base Unit", width: 130 },
    profitForSalesMeasure: { visible: false, label: "Profit/Sales Measure", width: 150 },
    profitMargin: { visible: true, label: "Profit %", width: 100 },
    previousStock: { visible: true, label: "Previous Stock", width: 120 },
    purchases: { visible: true, label: "Purchases", width: 100 },
    sales: { visible: true, label: "Sales", width: 100 },
    predictedStock: { visible: true, label: "Current Stock", width: 120 },
    wastage: { visible: false, label: "Wastage", width: 100 },
    status: { visible: true, label: "Status", width: 100 },
    barcode: { visible: false, label: "Barcode", width: 120 },
    description: { visible: false, label: "Description", width: 200 },
    unit: { visible: false, label: "Unit", width: 80 },
    minStock: { visible: false, label: "Min Stock", width: 100 },
    maxStock: { visible: false, label: "Max Stock", width: 100 },
    location: { visible: false, label: "Location", width: 120 },
    lastUpdated: { visible: false, label: "Last Updated", width: 120 },
    createdDate: { visible: false, label: "Created", width: 120 },
  })

  // Product form states
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [productFormMode, setProductFormMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedProductForForm, setSelectedProductForForm] = useState<Product | null>(null)
  
  // Ref for the product form to expose submit function
  const productFormRef = useRef<TabbedProductFormRef>(null)

  // Measure change menu states
  const [salesMeasureMenuAnchorEl, setSalesMeasureMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [purchaseMeasureMenuAnchorEl, setPurchaseMeasureMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [productForMeasureChange, setProductForMeasureChange] = useState<SimpleProductRow | null>(null)
  const [, setMeasureChangeType] = useState<'sales' | 'purchase'>('sales')

  // Helper functions to get display names from IDs
  const getSupplierName = useCallback((supplierId: string | undefined) => {
    if (!supplierId) return "No Supplier"
    const supplier = state.suppliers?.find(s => s.id === supplierId)
    return supplier?.name || supplierId
  }, [state.suppliers])

  const getMeasureName = useCallback((measureId: string | undefined) => {
    if (!measureId) return "pcs"
    const measure = state.measures?.find(m => m.id === measureId)
    return measure?.name || measureId
  }, [state.measures])

  const getCategoryName = useCallback((categoryId: string | undefined) => {
    if (!categoryId) return ""
    const category = state.categories?.find(c => c.id === categoryId)
    return category?.name || categoryId
  }, [state.categories])

  const getSubCategoryName = useCallback((subcategoryId: string | undefined) => {
    if (!subcategoryId) return ""
    const subcategory = state.subcategories?.find(sc => sc.id === subcategoryId)
    return subcategory?.name || subcategoryId
  }, [state.subcategories])

  const getSalesDivisionName = useCallback((salesDivisionId: string | undefined) => {
    if (!salesDivisionId) return ""
    const salesDivision = state.salesDivisions?.find(sd => sd.id === salesDivisionId)
    return salesDivision?.name || salesDivisionId
  }, [state.salesDivisions])

  const getCourseName = useCallback((courseId: string | undefined) => {
    if (!courseId) return ""
    const course = state.courses?.find(c => c.id === courseId)
    return course?.name || courseId
  }, [state.courses])


  const rows: SimpleProductRow[] = useMemo(() => {
    if (!state.products || !Array.isArray(state.products)) return []
    
    console.log('StockTable - State Data:', {
      productsCount: state.products.length,
      latestCountsKeys: state.latestCounts ? Object.keys(state.latestCounts).length : 0,
      latestCountsSample: state.latestCounts ? Object.keys(state.latestCounts).slice(0, 3) : [],
      purchaseHistoryCount: state.purchaseHistory?.length || 0,
      salesHistoryCount: state.salesHistory?.length || 0,
      measuresCount: state.measures?.length || 0
    })
    
    return state.products.map((product: Product) => {
      // Get prices from default measure units (correct way)
      let purchasePrice = 0
      let salesPrice = 0
      
      // For recipe-type products, calculate cost from ingredients using proper helper
      if (product.type === "recipe" || product.type === "choice" || product.type === "prepped-item") {
        // Use StockFunctions.getProductCost which handles recipe calculation properly
        purchasePrice = StockFunctions.getProductCost(product, state.products, state.measures)
        
        // Sales price from default sale unit
        const defaultSaleUnit = product.sale?.units?.find(
          (u: any) => u.measure === product.sale?.defaultMeasure
        )
        salesPrice = defaultSaleUnit?.price || product.sale?.price || product.salesPrice || 0
      } else {
        // For non-recipe products, use default measure unit prices
        purchasePrice = StockFunctions.getDefaultPurchasePrice(product)
        salesPrice = StockFunctions.getDefaultSalePrice(product)
      }
      
      const profitMargin = purchasePrice > 0 ? ((salesPrice - purchasePrice) / purchasePrice) * 100 : 0
      
      // Calculate stock movements for display
      // Get the latest stock count
      const latestCount = state.latestCounts?.[product.id]
      const previousStock = latestCount?.baseQuantity || 0
      const countDate = latestCount?.date ? new Date(latestCount.date) : new Date(0)
      
      // Calculate purchases SINCE the latest stock count (in base units)
      // Use purchaseHistory for full purchase records (not purchase orders)
      let totalPurchases = 0
      if (state.purchaseHistory && Array.isArray(state.purchaseHistory)) {
        state.purchaseHistory.forEach((purchase: any) => {
          const purchaseDate = new Date(purchase.dateOrdered || purchase.date || 0)
          // Only count purchases after the stock count date
          if (purchaseDate >= countDate) {
            if (purchase.items && Array.isArray(purchase.items)) {
              purchase.items.forEach((item: any) => {
                if (item.itemID === product.id || item.productId === product.id) {
                  const baseQty = StockFunctions.convertToBaseUnits(
                    item.quantity || 0,
                    item.measureId,
                    state.measures
                  )
                  totalPurchases += baseQty
                }
              })
            }
          }
        })
      }
      
      // Calculate sales SINCE the latest stock count (in base units)
      let totalSales = 0
      if (state.salesHistory && Array.isArray(state.salesHistory)) {
        state.salesHistory.forEach((sale: any) => {
          const saleDate = new Date(sale.date || sale.timestamp || 0)
          // Only count sales after the stock count date
          if (saleDate >= countDate) {
            if (sale.productId === product.id || sale.itemID === product.id) {
              const baseQty = StockFunctions.convertToBaseUnits(
                sale.quantity || 0,
                sale.measureId,
                state.measures
              )
              totalSales += baseQty
            }
          }
        })
      }
      
      // Use the product's existing predictedStock/currentStock if available, otherwise calculate
      const currentStock = product.predictedStock || product.currentStock || (previousStock + totalPurchases - totalSales)
      
      return {
        id: product.id || "",
        name: product.name || "",
        category: product.categoryName || getCategoryName(product.categoryId) || "",
        categoryId: product.categoryId || "",
        subCategory: product.subcategoryName || getSubCategoryName(product.subcategoryId) || "",
        salesDivision: product.salesDivisionName || getSalesDivisionName(product.salesDivisionId) || "",
        course: getCourseName(product.course) || "",
        type: product.type || "",
        purchasePrice,
        salesPrice,
        profitMargin,
        purchaseSupplier: getSupplierName(product.purchase?.defaultSupplier) || "No Supplier",
        status: product.status || "Unknown",
        predictedStock: currentStock,
        previousStock: previousStock,
        sku: product.sku || product.id || "",
        barcode: product.barcode || "",
        description: product.description || "",
        unit: (product as any).unit || "pcs",
        baseUnit: (product as any).baseUnit || product.baseUnit || "pcs",
        quantityOfBaseUnits: (product as any).quantityOfBaseUnits || 1,
        // Use defaultMeasure instead of measure (CORRECTED)
        salesMeasure: getMeasureName(product.sale?.defaultMeasure || product.sale?.measure) || "pcs",
        purchaseMeasure: getMeasureName(product.purchase?.defaultMeasure || product.purchase?.measure) || "pcs",
        costPerBaseUnit: (product as any).costPerBaseUnit || purchasePrice,
        profitPerBaseUnit: (product as any).profitPerBaseUnit || (salesPrice - purchasePrice),
        profitForSalesMeasure: (product as any).profitForSalesMeasure || (salesPrice - purchasePrice),
        purchases: totalPurchases,
        sales: totalSales,
        wastage: (product as any).wastage || 0,
        minStock: (product as any).minStock || 0,
        maxStock: (product as any).maxStock || 0,
        location: (product as any).location || "",
        lastUpdated: (product as any).lastUpdated || (typeof product.createdAt === 'string' ? product.createdAt : new Date().toISOString().split('T')[0]),
        createdDate: typeof product.createdAt === 'string' ? product.createdAt : new Date().toISOString().split('T')[0],
      }
    })
  }, [state.products, state.latestCounts, state.purchaseHistory, state.salesHistory, state.measures, getSupplierName, getMeasureName, getCategoryName, getSubCategoryName, getSalesDivisionName, getCourseName, dataVersion])

  // Get unique values for filters
  const uniqueCategories = useMemo(() => {
    return [...new Set(rows.map(item => item.category).filter(Boolean))]
  }, [rows])

  const uniqueStatuses = useMemo(() => {
    return [...new Set(rows.map(item => item.status).filter(Boolean))]
  }, [rows])

  const uniqueSuppliers = useMemo(() => {
    return [...new Set(rows.map(item => item.purchaseSupplier).filter(Boolean))]
  }, [rows])

  const uniqueSubCategories = useMemo(() => {
    return [...new Set(rows.map(item => item.subCategory).filter(Boolean))]
  }, [rows])

  const uniqueSalesDivisions = useMemo(() => {
    return [...new Set(rows.map(item => item.salesDivision).filter(Boolean))]
  }, [rows])

  const uniqueCourses = useMemo(() => {
    return [...new Set(rows.map(item => item.course).filter(Boolean))]
  }, [rows])

  const uniqueTypes = useMemo(() => {
    return [...new Set(rows.map(item => item.type).filter(Boolean))]
  }, [rows])

  // DataHeader options
  const filterOptions = useMemo(() => [
    {
      label: 'Category',
      options: [
        { id: 'all', name: 'All Categories' },
        ...uniqueCategories.map(cat => ({ id: cat, name: cat }))
      ],
      selectedValues: filters.category || [],
      onSelectionChange: (values: string[]) => handleFilterChange('category', values)
    },
    {
      label: 'Sub Category',
      options: [
        { id: 'all', name: 'All Sub Categories' },
        ...uniqueSubCategories.map(subCat => ({ id: subCat, name: subCat }))
      ],
      selectedValues: filters.subCategory || [],
      onSelectionChange: (values: string[]) => handleFilterChange('subCategory', values)
    },
    {
      label: 'Sales Division',
      options: [
        { id: 'all', name: 'All Sales Divisions' },
        ...uniqueSalesDivisions.map(div => ({ id: div, name: div }))
      ],
      selectedValues: filters.salesDivision || [],
      onSelectionChange: (values: string[]) => handleFilterChange('salesDivision', values)
    },
    {
      label: 'Course',
      options: [
        { id: 'all', name: 'All Courses' },
        ...uniqueCourses.map(course => ({ id: course, name: course }))
      ],
      selectedValues: filters.course || [],
      onSelectionChange: (values: string[]) => handleFilterChange('course', values)
    },
    {
      label: 'Type',
      options: [
        { id: 'all', name: 'All Types' },
        ...uniqueTypes.map(type => ({ id: type, name: type }))
      ],
      selectedValues: filters.type || [],
      onSelectionChange: (values: string[]) => handleFilterChange('type', values)
    },
    {
      label: 'Status',
      options: [
        { id: 'all', name: 'All Statuses' },
        ...uniqueStatuses.map(status => ({ id: status, name: status }))
      ],
      selectedValues: filters.status || [],
      onSelectionChange: (values: string[]) => handleFilterChange('status', values)
    },
    {
      label: 'Supplier',
      options: [
        { id: 'all', name: 'All Suppliers' },
        ...uniqueSuppliers.map(supplier => ({ id: supplier, name: supplier }))
      ],
      selectedValues: filters.supplier || [],
      onSelectionChange: (values: string[]) => handleFilterChange('supplier', values)
    }
  ], [uniqueCategories, uniqueSubCategories, uniqueSalesDivisions, uniqueCourses, uniqueTypes, uniqueStatuses, uniqueSuppliers, filters])

  const columnOptions = useMemo((): ColumnOption[] => 
    Object.entries(columnConfig).map(([key, config]) => ({
      key: key,
      label: config.label,
      visible: config.visible
    })),
    [columnConfig]
  )

  // Handle column visibility changes from DataHeader
  const handleColumnVisibilityChange = useCallback((visibility: Record<string, boolean>) => {
    setColumnConfig(prev => {
      const newConfig = { ...prev }
      Object.keys(visibility).forEach(key => {
        if (newConfig[key]) {
          newConfig[key] = { ...newConfig[key], visible: visibility[key] }
        }
      })
      return newConfig
    })
  }, [])

  // Convert columnConfig to columnVisibility format for DataHeader
  const columnVisibility = useMemo(() => {
    const visibility: Record<string, boolean> = {}
    Object.entries(columnConfig).forEach(([key, config]) => {
      visibility[key] = config.visible
    })
    return visibility
  }, [columnConfig])

  const sortOptions = useMemo(() => [
    { value: 'name', label: 'Name' },
    { value: 'category', label: 'Category' },
    { value: 'subCategory', label: 'Sub Category' },
    { value: 'salesDivision', label: 'Sales Division' },
    { value: 'course', label: 'Course' },
    { value: 'type', label: 'Type' },
    { value: 'sku', label: 'SKU' },
    { value: 'purchasePrice', label: 'Purchase Price' },
    { value: 'salesPrice', label: 'Sales Price' },
    { value: 'predictedStock', label: 'Predicted Stock' },
    { value: 'status', label: 'Status' },
    { value: 'purchaseSupplier', label: 'Supplier' },
    { value: 'profitMargin', label: 'Profit Margin' },
    { value: 'salesMeasure', label: 'Sales Measure' },
    { value: 'purchaseMeasure', label: 'Purchase Measure' },
    { value: 'createdDate', label: 'Created Date' },
    { value: 'lastUpdated', label: 'Last Updated' }
  ], [])

  const filteredItems = useMemo(() => {
    let filtered = rows

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subCategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.salesDivision?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.course?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.purchaseSupplier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply multi-value filters
    if (filters.category && filters.category.length > 0 && !filters.category.includes('all')) {
      filtered = filtered.filter((item) => filters.category.includes(item.category))
    }

    if (filters.subCategory && filters.subCategory.length > 0 && !filters.subCategory.includes('all')) {
      filtered = filtered.filter((item) => filters.subCategory.includes(item.subCategory))
    }

    if (filters.salesDivision && filters.salesDivision.length > 0 && !filters.salesDivision.includes('all')) {
      filtered = filtered.filter((item) => filters.salesDivision.includes(item.salesDivision))
    }

    if (filters.course && filters.course.length > 0 && !filters.course.includes('all')) {
      filtered = filtered.filter((item) => filters.course.includes(item.course))
    }

    if (filters.type && filters.type.length > 0 && !filters.type.includes('all')) {
      filtered = filtered.filter((item) => filters.type.includes(item.type))
    }

    if (filters.status && filters.status.length > 0 && !filters.status.includes('all')) {
      filtered = filtered.filter((item) => filters.status.includes(item.status))
    }

    if (filters.supplier && filters.supplier.length > 0 && !filters.supplier.includes('all')) {
      filtered = filtered.filter((item) => filters.supplier.includes(item.purchaseSupplier))
    }

    // Apply sorting using new sort state
    const sortKey = sortBy as keyof SimpleProductRow
    filtered = [...filtered].sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      return 0
    })

    return filtered
  }, [rows, searchQuery, filters, sortBy, sortDirection])

  const loadMoreItems = useCallback(() => {
    console.log("loadMoreItems called - currentBatch:", currentBatch, "filteredItems.length:", filteredItems.length)
    
    // Check if there are more items to load
    const startIndex = (currentBatch - 1) * itemsPerBatch
    if (startIndex >= filteredItems.length) {
      console.log("loadMoreItems: No more items to load, startIndex:", startIndex, "filteredItems.length:", filteredItems.length)
      return
    }
    
    // Use a ref to check loading state to avoid dependency issues
    setIsLoading(currentLoading => {
      if (currentLoading) {
        console.log("loadMoreItems: Already loading, skipping")
        return currentLoading
      }
      
      console.log("loadMoreItems: Starting to load more items")
      
      setTimeout(() => {
        const endIndex = startIndex + itemsPerBatch
        const newItems = filteredItems.slice(startIndex, endIndex)
        
        console.log("loadMoreItems: Loading items", { startIndex, endIndex, newItemsLength: newItems.length })
        
        if (currentBatch === 1) {
          setDisplayedItems(newItems)
        } else {
          setDisplayedItems(prev => [...prev, ...newItems])
        }
        
        setCurrentBatch(prev => prev + 1)
        setIsLoading(false)
        console.log("loadMoreItems: Completed")
      }, 300)
      
      return true
    })
  }, [filteredItems, currentBatch, itemsPerBatch])

  useEffect(() => {
    console.log("useEffect triggered by filteredItems change - filteredItems.length:", filteredItems.length)
    setCurrentBatch(1)
    setDisplayedItems([])
    loadMoreItems()
  }, [filteredItems])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const startIndex = (currentBatch - 1) * itemsPerBatch
        const hasMoreItems = startIndex < filteredItems.length
        
        if (entries[0].isIntersecting && !isLoading && displayedItems.length < filteredItems.length && hasMoreItems) {
          loadMoreItems()
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [loadMoreItems, isLoading, displayedItems.length, filteredItems.length, currentBatch, itemsPerBatch])


  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "in stock":
        return "success"
      case "low stock":
        return "warning"
      case "out of stock":
        return "error"
      default:
        return "default"
    }
  }

  const handleSort = (column: keyof SimpleProductRow) => {
    const isAsc = orderBy === column && order === 'asc'
    const newOrder = isAsc ? 'desc' : 'asc'
    setOrder(newOrder)
    setOrderBy(column)
    // Also update DataHeader state
    setSortBy(column)
    setSortDirection(newOrder)
  }


  // Product form handlers
  const handleOpenProductForm = (product: Product | null = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedProductForForm(product)
    setProductFormMode(mode)
    setProductFormOpen(true)
  }

  const handleCloseProductForm = () => {
    setProductFormOpen(false)
    setSelectedProductForForm(null)
    setProductFormMode('create')
  }

  const handleSaveProduct = async (productData: any) => {
    try {
      console.log(`🔍 StockTable: Starting save for mode: ${productFormMode}`)
      console.log("🔍 StockTable: Product data being saved:", productData)
      console.log("🔍 StockTable: createProduct function available:", !!createProduct)
      console.log("🔍 StockTable: updateProduct function available:", !!updateProduct)
      
      if (productFormMode === 'create') {
        console.log("🔍 StockTable: Creating new product...")
        if (!createProduct) {
          throw new Error("createProduct function is not available")
        }
        
        const result = await createProduct(productData)
        console.log("✅ StockTable: Product created successfully with result:", result)
        
        // createProduct already calls refreshProducts internally
        setCurrentBatch(1)
        setDisplayedItems([])
        console.log("✅ StockTable: Create completed, display refreshed")
      } else if (productFormMode === 'edit') {
        console.log("🔍 StockTable: Updating existing product...")
        if (!updateProduct || !selectedProductForForm?.id) {
          throw new Error("updateProduct function or product ID is not available")
        }
        
        await updateProduct(selectedProductForForm.id, productData)
        console.log("✅ StockTable: Product updated successfully")
      }
      
      handleCloseProductForm()
      console.log("✅ StockTable: Save process completed successfully")
    } catch (error) {
      console.error('❌ StockTable: Error saving product:', error)
      console.error('❌ StockTable: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        productData: productData,
        mode: productFormMode
      })
      
      // Show error to user
      alert(`Failed to save product: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Don't close modal on error so user can retry
      // Fallback to navigation if CRUD functions fail
      if (productFormMode === 'create') {
        console.log("🔄 StockTable: Falling back to navigation for create")
        navigate('/Stock/AddItem')
      } else if (productFormMode === 'edit') {
        console.log("🔄 StockTable: Falling back to navigation for edit")
        navigate(`/Stock/EditItem/${selectedProductForForm!.id}`)
      }
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId)
      } catch (error) {
        console.error('Error deleting product:', error)
      }
    }
  }

  // Measure change handlers
  const handleMeasureChange = async (productId: string, measureId: string, measureType: 'sales' | 'purchase') => {
    try {
      const product = state.products?.find((p: Product) => p.id === productId)
      if (!product) return

      // Create updated product data
      const updatedProduct = { ...product }
      if (measureType === 'sales') {
        if (updatedProduct.sale) {
          updatedProduct.sale = {
            ...updatedProduct.sale,
            measure: measureId
          }
        }
      } else {
        if (updatedProduct.purchase) {
          updatedProduct.purchase = {
            ...updatedProduct.purchase,
            measure: measureId
          }
        }
      }

      if (updateProduct) {
        await updateProduct(productId, updatedProduct)
      }
      
      // Close the menu
      setSalesMeasureMenuAnchorEl(null)
      setPurchaseMeasureMenuAnchorEl(null)
      setProductForMeasureChange(null)
      
      console.log(`Updated ${measureType} measure for product ${productId} to ${measureId}`)
    } catch (error) {
      console.error('Error updating product measure:', error)
    }
  }

  // Render measure change menus
  const renderSalesMeasureMenu = () => {
    if (!productForMeasureChange) return null
    
    const product = state.products?.find((p: Product) => p.id === productForMeasureChange.id)
    if (!product) return null
    
    // Get only the measures from the product's sale units array
    const availableMeasures = product.sale?.units?.map((unit: any) => {
      return state.measures?.find((m) => m.id === unit.measure)
    }).filter(Boolean) || []
    
    return (
      <Menu
        anchorEl={salesMeasureMenuAnchorEl}
        open={Boolean(salesMeasureMenuAnchorEl)}
        onClose={() => {
          setSalesMeasureMenuAnchorEl(null)
          setProductForMeasureChange(null)
        }}
        disableAutoFocusItem
        disableRestoreFocus
        disableEnforceFocus
      >
        {availableMeasures.map((measure: any) => {
          const isSelected = product.sale?.defaultMeasure === measure.id
          return (
            <MenuItem
              key={measure.id}
              onClick={() => handleMeasureChange(productForMeasureChange.id, measure.id, 'sales')}
              sx={{
                bgcolor: isSelected ? 'primary.main' : 'transparent',
                color: isSelected ? 'primary.contrastText' : 'text.primary',
                '&:hover': {
                  bgcolor: isSelected ? 'primary.dark' : 'action.hover',
                },
              }}
            >
              {measure.name}
            </MenuItem>
          )
        })}
      </Menu>
    )
  }

  const renderPurchaseMeasureMenu = () => {
    if (!productForMeasureChange) return null
    
    const product = state.products?.find((p: Product) => p.id === productForMeasureChange.id)
    if (!product) return null
    
    // Get only the measures from the product's purchase units array
    const availableMeasures = product.purchase?.units?.map((unit: any) => {
      return state.measures?.find((m) => m.id === unit.measure)
    }).filter(Boolean) || []
    
    return (
      <Menu
        anchorEl={purchaseMeasureMenuAnchorEl}
        open={Boolean(purchaseMeasureMenuAnchorEl)}
        onClose={() => {
          setPurchaseMeasureMenuAnchorEl(null)
          setProductForMeasureChange(null)
        }}
        disableAutoFocusItem
        disableRestoreFocus
        disableEnforceFocus
      >
        {availableMeasures.map((measure: any) => {
          const isSelected = product.purchase?.defaultMeasure === measure.id
          return (
            <MenuItem
              key={measure.id}
              onClick={() => handleMeasureChange(productForMeasureChange.id, measure.id, 'purchase')}
              sx={{
                bgcolor: isSelected ? 'primary.main' : 'transparent',
                color: isSelected ? 'primary.contrastText' : 'text.primary',
                '&:hover': {
                  bgcolor: isSelected ? 'primary.dark' : 'action.hover',
                },
              }}
            >
              {measure.name}
            </MenuItem>
          )
        })}
      </Menu>
    )
  }




  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSortBy(field)
    setSortDirection(direction)
    // Also update legacy sort state for compatibility
    setOrderBy(field as keyof SimpleProductRow)
    setOrder(direction)
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting stock data as ${format}`)
    // Export functionality would be implemented here
    // For now, just log the action
  }

  // Debug loading states
  console.log("StockTable render - state.loading:", state.loading, "local isLoading:", isLoading, "state.products.length:", state.products?.length || 0, "displayedItems.length:", displayedItems.length)
  
  if (state.loading) {
    console.log("StockTable: Loading state is true, showing loading spinner")
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading products...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Loading overlay - doesn't hide content */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            bgcolor: 'info.light',
            borderRadius: 1,
            boxShadow: 2,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            Refreshing data... (v{dataVersion})
          </Typography>
        </Box>
      )}

      <DataHeader
        showDateControls={false}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search products..."
        filters={filterOptions}
        columns={columnOptions}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        sortOptions={sortOptions}
        sortValue={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onExportCSV={() => handleExport('csv')}
        onExportPDF={() => handleExport('pdf')}
        onCreateNew={() => handleOpenProductForm(null, 'create')}
        createButtonLabel="Add Product"
      />

      <Paper sx={{ opacity: loading ? 0.7 : 1, transition: 'opacity 0.3s' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {Object.entries(columnConfig)
                  .filter(([, config]) => config.visible)
                  .map(([columnId, config]) => (
                    <TableCell 
                      key={columnId} 
                      align="center"
                      sx={{ 
                        width: config.width,
                        textAlign: 'center !important',
                        padding: '16px 16px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                      onClick={() => handleSort(columnId as keyof SimpleProductRow)}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: 0.5
                      }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {config.label}
                        </Typography>
                        {orderBy === columnId && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {order === 'asc' ? '↑' : '↓'}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                  ))}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedItems.map((item) => (
                <TableRow 
                  key={item.id} 
                  hover
                  onClick={() => {
                    const product = state.products?.find((p: Product) => p.id === item.id)
                    if (product) handleOpenProductForm(product, 'view')
                  }}
                  sx={{ 
                    cursor: "pointer",
                    '& > td': {
                      paddingTop: 1,
                      paddingBottom: 1,
                    }
                  }}
                >
                  {Object.entries(columnConfig)
                    .filter(([, config]) => config.visible)
                    .map(([columnId]) => (
                      <TableCell key={columnId} align="center" sx={{ verticalAlign: 'middle' }}>
                        {(() => {
                          const value = item[columnId as keyof SimpleProductRow]
                          
                          // Price columns
                          if (columnId === 'purchasePrice' || columnId === 'salesPrice' || 
                              columnId === 'costPerBaseUnit' || columnId === 'profitPerBaseUnit' || 
                              columnId === 'profitForSalesMeasure') {
                            return `£${(Number(value) || 0).toFixed(2)}`
                          }
                          
                          // Percentage columns
                          if (columnId === 'profitMargin') {
                            return `${(Number(value) || 0).toFixed(1)}%`
                          }
                          
                          // Quantity columns (all displayed with 2 decimal places)
                          if (columnId === 'quantityOfBaseUnits' || columnId === 'purchases' || 
                              columnId === 'sales' || columnId === 'previousStock' || columnId === 'predictedStock' || 
                              columnId === 'wastage' || columnId === 'minStock' || columnId === 'maxStock') {
                            return (Number(value) || 0).toFixed(2)
                          }
                          
                          // Status column with chip
                          if (columnId === 'status') {
                            return (
                              <Chip
                                label={String(value || 'Unknown')}
                                color={getStatusColor(String(value || 'Unknown')) as any}
                                size="small"
                              />
                            )
                          }
                          
                          // Measure columns - show ALL available measures from units array with clickable dropdown
                          if (columnId === 'salesMeasure' || columnId === 'purchaseMeasure') {
                            const product = state.products?.find((p: Product) => p.id === item.id)
                            if (!product) return String(value || 'pcs')
                            
                            // Get all measures from units array
                            const units = columnId === 'salesMeasure' 
                              ? product.sale?.units 
                              : product.purchase?.units
                            
                            const defaultMeasureId = columnId === 'salesMeasure'
                              ? product.sale?.defaultMeasure
                              : product.purchase?.defaultMeasure
                            
                            if (!units || units.length === 0) {
                              return String(value || 'pcs')
                            }
                            
                            return (
                              <Box 
                                sx={{ 
                                  display: 'flex', 
                                  gap: 0.5, 
                                  flexWrap: 'wrap', 
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setProductForMeasureChange(item)
                                  setMeasureChangeType(columnId === 'salesMeasure' ? 'sales' : 'purchase')
                                  if (columnId === 'salesMeasure') {
                                    setSalesMeasureMenuAnchorEl(e.currentTarget)
                                  } else {
                                    setPurchaseMeasureMenuAnchorEl(e.currentTarget)
                                  }
                                }}
                              >
                                {units.map((unit: any, idx: number) => {
                                  const measureName = getMeasureName(unit.measure) || 'Unknown'
                                  const isDefault = unit.measure === defaultMeasureId
                                  
                                  return (
                                    <Chip
                                      key={`${unit.measure}-${idx}`}
                                      label={measureName}
                                      size="small"
                                      variant={isDefault ? "filled" : "outlined"}
                                      sx={{
                                        fontWeight: isDefault ? "bold" : "normal",
                                        bgcolor: isDefault ? theme.palette.primary.main : 'transparent',
                                        color: isDefault ? theme.palette.primary.contrastText : theme.palette.text.primary,
                                        borderColor: theme.palette.primary.main,
                                        cursor: 'pointer',
                                        '&:hover': {
                                          bgcolor: isDefault ? theme.palette.primary.dark : theme.palette.action.hover,
                                        }
                                      }}
                                    />
                                  )
                                })}
                              </Box>
                            )
                          }
                          
                          // Other unit columns
                          if (columnId === 'baseUnit' || columnId === 'unit') {
                            return String(value || 'pcs')
                          }
                          
                          // Default text columns
                          return String(value || '-')
                        })()}
                      </TableCell>
                    ))}
                  <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={(e) => {
                            e.stopPropagation()
                            const product = state.products?.find((p: Product) => p.id === item.id)
                            if (product) handleOpenProductForm(product, 'edit')
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteProduct(item.id)
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {isLoading && (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        )}

        {displayedItems.length < filteredItems.length && (
          <div ref={observerRef} style={{ height: "20px" }} />
        )}

        {displayedItems.length === 0 && !isLoading && (
          <Box textAlign="center" p={4}>
            <Typography variant="body1" color="text.secondary">
              {searchQuery ? "No products found matching your search." : "No products available."}
            </Typography>
          </Box>
        )}
      </Paper>


      {/* Item Details Dialog */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onClose={() => setSelectedItem(null)} maxWidth="md" fullWidth>
          <DialogTitle>Product Details</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Basic Information */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography variant="body1">{selectedItem.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">SKU</Typography>
                <Typography variant="body1">{selectedItem.sku}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Barcode</Typography>
                <Typography variant="body1">{selectedItem.barcode}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedItem.status}
                  color={getStatusColor(selectedItem.status) as any}
                  size="small"
                />
              </Grid>
              
              {/* Categories */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                <Typography variant="body1">{selectedItem.category}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Sub Category</Typography>
                <Typography variant="body1">{selectedItem.subCategory || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Sales Division</Typography>
                <Typography variant="body1">{selectedItem.salesDivision || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Course</Typography>
                <Typography variant="body1">{selectedItem.course || '-'}</Typography>
              </Grid>
              
              {/* Supplier & Measures */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Supplier</Typography>
                <Typography variant="body1">{selectedItem.purchaseSupplier}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Sales Measure</Typography>
                <Typography variant="body1">{selectedItem.salesMeasure}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Purchase Measure</Typography>
                <Typography variant="body1">{selectedItem.purchaseMeasure}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Base Unit</Typography>
                <Typography variant="body1">{selectedItem.baseUnit}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Quantity of Base Units</Typography>
                <Typography variant="body1">{selectedItem.quantityOfBaseUnits}</Typography>
              </Grid>
              
              {/* Pricing */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Purchase Price</Typography>
                <Typography variant="body1">£{selectedItem.purchasePrice.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Sales Price</Typography>
                <Typography variant="body1">£{selectedItem.salesPrice.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Cost per Base Unit</Typography>
                <Typography variant="body1">£{selectedItem.costPerBaseUnit.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Profit per Base Unit</Typography>
                <Typography variant="body1">£{selectedItem.profitPerBaseUnit.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Profit for Sales Measure</Typography>
                <Typography variant="body1">£{selectedItem.profitForSalesMeasure.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Profit Margin</Typography>
                <Typography variant="body1">{selectedItem.profitMargin.toFixed(1)}%</Typography>
              </Grid>
              
              {/* Stock Information */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Previous Stock</Typography>
                <Typography variant="body1">{selectedItem.previousStock.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Current Stock</Typography>
                <Typography variant="body1">{selectedItem.predictedStock.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Total Purchases</Typography>
                <Typography variant="body1">{selectedItem.purchases.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Total Sales</Typography>
                <Typography variant="body1">{selectedItem.sales.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Wastage</Typography>
                <Typography variant="body1">{selectedItem.wastage.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Min Stock</Typography>
                <Typography variant="body1">{selectedItem.minStock}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Max Stock</Typography>
                <Typography variant="body1">{selectedItem.maxStock}</Typography>
              </Grid>
              
              {/* Additional Information */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                <Typography variant="body1">{selectedItem.location}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Unit</Typography>
                <Typography variant="body1">{selectedItem.unit}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{selectedItem.description || 'No description available'}</Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedItem(null)}>Close</Button>
            <Button variant="contained" onClick={() => {
              const product = state.products?.find((p: Product) => p.id === selectedItem?.id)
              if (product) {
                setSelectedItem(null)
                handleOpenProductForm(product, 'edit')
              }
            }}>
              Edit Product
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Product Form Modal */}
      <CRUDModal
        open={productFormOpen}
        onClose={handleCloseProductForm}
        title={productFormMode === 'create' ? 'Create Product' : productFormMode === 'edit' ? 'Edit Product' : 'View Product'}
        mode={productFormMode}
        onSave={handleSaveProduct}
        onEdit={() => setProductFormMode('edit')}
        formRef={productFormRef}
        hideDefaultActions={true}
        actions={
          productFormMode === 'view' ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setProductFormMode('edit')}
            >
              Edit
            </Button>
          ) : productFormMode === 'edit' ? (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  if (selectedProductForForm && window.confirm('Are you sure you want to delete this product?')) {
                    handleDeleteProduct(selectedProductForForm.id)
                    handleCloseProductForm()
                  }
                }}
              >
                Delete
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveProduct}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveProduct}
            >
              Create Product
            </Button>
          )
        }
      >
        <TabbedProductForm
          ref={productFormRef}
          product={selectedProductForForm}
          mode={productFormMode}
          onSave={handleSaveProduct}
        />
      </CRUDModal>

      {/* Measure Change Menus */}
      {renderSalesMeasureMenu()}
      {renderPurchaseMeasureMenu()}
    </Box>
  )
}

export default StockTable