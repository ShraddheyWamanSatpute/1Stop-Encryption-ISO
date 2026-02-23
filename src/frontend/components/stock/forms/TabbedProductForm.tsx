"use client"

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  InputAdornment,
  FormControl,
  FormLabel,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Autocomplete,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Chip,
} from "@mui/material"
import {
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material"
import { useStock } from "../../../../backend/context/StockContext"
import type { Product, TabPanelProps } from "../../../../backend/interfaces/Stock"

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

interface TabbedProductFormProps {
  product?: Product | null
  mode: 'create' | 'edit' | 'view'
  onSave: (data: any) => void
}

export interface TabbedProductFormRef {
  submit: () => void
}

const TabbedProductForm = forwardRef<TabbedProductFormRef, TabbedProductFormProps>(({
  product,
  mode,
  onSave,
}, ref) => {
  const { 
    state: stockState, 
    fetchCourses,
  } = useStock()
  const { 
    suppliers = [], 
    measures = [], 
    salesDivisions = [], 
    categories = [], 
    subcategories = [] 
  } = stockState

  const [tabValue, setTabValue] = useState(0)
  const [recipeMeasureTab, setRecipeMeasureTab] = useState(0)
  const [, setImageFile] = useState<File | null>(null)
  const [courseOptions, setCourseOptions] = useState<any[]>([])
  const [taxPercent, setTaxPercent] = useState<number>(0)
  const [validationErrors, setValidationErrors] = useState<{
    name?: string
    purchasePrice?: string
    salesPrice?: string
    duplicatePurchaseUnits?: string
    duplicateSalesUnits?: string
  }>({})
  const [salesTaxPercent, setSalesTaxPercent] = useState<number>(0)
  const [, setHasDuplicatePurchaseUnits] = useState<boolean>(false)
  const [, setHasDuplicateSalesUnits] = useState<boolean>(false)
  const [calculatedCostPerBaseUnit, ] = useState<number>(0)
  const [calculatedGrossProfit, ] = useState<number>(0)
  const [calculatedProfitMargin, ] = useState<number>(0)

  // Helper functions for duplicate checking
  const checkDuplicatePurchaseUnits = () => {
    const measures = new Set()
    let hasDuplicates = false
    
    productData.purchase?.units?.forEach((unit) => {
      const key = `${unit.supplierId}-${unit.measure}`
      if (measures.has(key)) {
        hasDuplicates = true
      } else {
        measures.add(key)
      }
    })
    
    return hasDuplicates
  }

  const checkDuplicateSalesUnits = () => {
    const measures = new Set()
    let hasDuplicates = false
    
    productData.sale?.units?.forEach((unit) => {
      if (measures.has(unit.measure)) {
        hasDuplicates = true
      } else {
        measures.add(unit.measure)
      }
    })
    
    return hasDuplicates
  }

  // Add a new purchase unit
  const addPurchaseUnit = () => {
    setProductData((prev) => ({
      ...prev,
      purchase: {
        ...prev.purchase!,
        units: [
          ...(prev.purchase?.units || []),
          {
            price: 0,
            measure: measures[0]?.id || "",
            supplierId: suppliers[0]?.id || "",
            quantity: 1,
          },
        ],
      },
    }))
  }

  // Remove a purchase unit
  const removePurchaseUnit = (index: number) => {
    setProductData((prev) => ({
      ...prev,
      purchase: {
        ...prev.purchase!,
        units: (prev.purchase?.units || []).filter((_, i) => i !== index),
      },
    }))
  }

  // Update a purchase unit
  const updatePurchaseUnit = (index: number, field: string, value: any) => {
    setProductData((prev) => {
      const updatedUnits = [...(prev.purchase?.units || [])]
      updatedUnits[index] = {
        ...updatedUnits[index],
        [field]: value,
      }
      return {
        ...prev,
        purchase: {
          ...prev.purchase!,
          units: updatedUnits,
        },
      }
    })
  }

  // Add a new sales unit
  const addSalesUnit = () => {
    setProductData((prev) => ({
      ...prev,
      sale: {
        ...prev.sale!,
        units: [
          ...(prev.sale?.units || []),
          {
            price: 0,
            measure: measures[0]?.id || "",
            quantity: 1,
          },
        ],
      },
    }))
  }

  // Remove a sales unit
  const removeSalesUnit = (index: number) => {
    setProductData((prev) => ({
      ...prev,
      sale: {
        ...prev.sale!,
        units: (prev.sale?.units || []).filter((_, i) => i !== index),
      },
    }))
  }

  // Update a sales unit
  const updateSalesUnit = (index: number, field: string, value: any) => {
    setProductData((prev) => {
      const updatedUnits = [...(prev.sale?.units || [])]
      updatedUnits[index] = {
        ...updatedUnits[index],
        [field]: value,
      }
      return {
        ...prev,
        sale: {
          ...prev.sale!,
          units: updatedUnits,
        },
      }
    })
  }

  // Add a new ingredient to a specific sale unit's recipe
  const addIngredient = (unitIndex: number) => {
    setProductData((prev) => {
      const updatedUnits = [...(prev.sale?.units || [])]
      const unit = updatedUnits[unitIndex]
      
      updatedUnits[unitIndex] = {
        ...unit,
        recipe: {
          ...(unit.recipe || {}),
          ingredients: [
            ...(unit.recipe?.ingredients || []),
            { type: "", itemId: "", measure: "", quantity: 0 }
          ]
        }
      }
      
      return {
        ...prev,
        sale: {
          ...prev.sale!,
          units: updatedUnits
        }
      }
    })
  }

  // Update an ingredient in a specific sale unit's recipe
  const updateIngredient = (unitIndex: number, ingredientIndex: number, field: string, value: any) => {
    setProductData((prev) => {
      const updatedUnits = [...(prev.sale?.units || [])]
      const unit = updatedUnits[unitIndex]
      const updatedIngredients = [...(unit.recipe?.ingredients || [])]
      
      updatedIngredients[ingredientIndex] = {
        ...updatedIngredients[ingredientIndex],
        [field]: value,
      }

      // Auto-fill measure if product is selected
      if (field === "itemId" && typeof value === "string") {
        const selectedProduct = stockState.products.find((p: any) => p.id === value)
        if (selectedProduct?.purchase?.defaultMeasure) {
          updatedIngredients[ingredientIndex].measure = selectedProduct.purchase.defaultMeasure
        }
      }

      updatedUnits[unitIndex] = {
        ...unit,
        recipe: {
          ...(unit.recipe || {}),
          ingredients: updatedIngredients
        }
      }

      return {
        ...prev,
        sale: {
          ...prev.sale!,
          units: updatedUnits
        }
      }
    })
  }

  // Remove an ingredient from a specific sale unit's recipe
  const removeIngredient = (unitIndex: number, ingredientIndex: number) => {
    setProductData((prev) => {
      const updatedUnits = [...(prev.sale?.units || [])]
      const unit = updatedUnits[unitIndex]
      const updatedIngredients = [...(unit.recipe?.ingredients || [])]
      updatedIngredients.splice(ingredientIndex, 1)
      
      updatedUnits[unitIndex] = {
        ...unit,
        recipe: {
          ...(unit.recipe || {}),
          ingredients: updatedIngredients
        }
      }
      
      return {
        ...prev,
        sale: {
          ...prev.sale!,
          units: updatedUnits
        }
      }
    })
  }

  // Initialize product state
  const [productData, setProductData] = useState<Product>({
    id: "",
    name: "",
    description: "",
    sku: "",
    barcode: "",
    image: "",
    type: "purchase-only",
    categoryId: "",
    subcategoryId: "",
    salesDivisionId: "",
    course: "",
    active: true,
    purchase: {
      supplierId: suppliers[0]?.id || "",
      price: 0,
      measure: measures[0]?.id || "",
      quantity: 1,
      defaultMeasure: measures[0]?.id || "",
      units: [{
        price: 0,
        measure: measures[0]?.id || "",
        supplierId: suppliers[0]?.id || "",
        quantity: 1,
      }],
      taxPercent: 0,
    },
    sale: {
      price: 0,
      measure: measures[0]?.id || "",
      quantity: 1,
      supplierId: "",
      defaultMeasure: measures[0]?.id || "",
      units: [{
        price: 0,
        measure: measures[0]?.id || "",
        quantity: 1,
      }],
      taxPercent: 0,
    },
    recipe: {
      items: [],
      instructions: "",
      prepTime: 0,
      cookTime: 0,
      servings: 1,
    },
    stockTracking: {
      enabled: true,
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      reorderPoint: 0,
      reorderQuantity: 0,
    },
    ingredients: [],
    salesPrice: 0,
    purchasePrice: 0,
    predictedStock: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  // Helper functions
  const getMeasureBaseUnit = (measureId: string) => {
    const measure = measures.find(m => m.id === measureId)
    return measure?.unit || "single"
  }





  const getMeasureName = (measureId: string) => {
    const measure = measures.find(m => m.id === measureId)
    return measure?.name || "Unknown Measure"
  }

  // Load product data when editing
  useEffect(() => {
    if (product && mode !== 'create') {
      setProductData(product)
      setTaxPercent(product.purchase?.taxPercent || 0)
      setSalesTaxPercent(product.sale?.taxPercent || 0)
    }
  }, [product, mode])

  // Validation effect
  useEffect(() => {
    const hasDuplicatePurchase = checkDuplicatePurchaseUnits()
    setHasDuplicatePurchaseUnits(hasDuplicatePurchase)
    
    const hasDuplicateSales = checkDuplicateSalesUnits()
    setHasDuplicateSalesUnits(hasDuplicateSales)

    // Update validation errors
    setValidationErrors(prev => ({
      ...prev,
      duplicatePurchaseUnits: hasDuplicatePurchase ? "Duplicate supplier and measure combinations are not allowed" : undefined,
      duplicateSalesUnits: hasDuplicateSales ? "Duplicate sales measures are not allowed" : undefined,
    }))
  }, [productData.purchase?.units, productData.sale?.units])

  // Load courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const courses = await fetchCourses()
        setCourseOptions(courses || [])
      } catch (error) {
        console.error("Error loading courses:", error)
      }
    }
    loadCourses()
  }, [fetchCourses])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleInputChange = (field: string, value: any) => {
    setProductData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedInputChange = (section: string, field: string, value: any) => {
    setProductData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof Product] as any || {}),
        [field]: value
      }
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setProductData(prev => ({
          ...prev,
          image: e.target?.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault()
    }
    
    console.log("🔍 TabbedProductForm: handleSubmit called")
    console.log("🔍 TabbedProductForm: Current product data:", productData)
    console.log("🔍 TabbedProductForm: Form mode:", mode)
    
    // Validation
    const errors: any = {}
    if (!productData.name.trim()) {
      errors.name = "Product name is required"
    }
    
    // Check purchase price - could be in price field or first unit's price
    const purchasePrice = productData.purchase?.price || productData.purchase?.units?.[0]?.price || 0
    if (purchasePrice < 0) {
      errors.purchasePrice = "Purchase price cannot be negative"
    }
    
    // Check sales price - could be in price field or first unit's price  
    const salesPrice = productData.sale?.price || productData.sale?.units?.[0]?.price || 0
    if (salesPrice < 0) {
      errors.salesPrice = "Sales price cannot be negative"
    }

    console.log("🔍 TabbedProductForm: Validation errors:", errors)
    console.log("🔍 TabbedProductForm: Validation error details:", JSON.stringify(errors, null, 2))
    console.log("🔍 TabbedProductForm: Product data for validation check:", {
      name: productData.name,
      nameLength: productData.name?.length,
      purchasePrice: productData.purchase?.price,
      salesPrice: productData.sale?.price,
      calculatedPurchasePrice: purchasePrice,
      calculatedSalesPrice: salesPrice,
      purchaseExists: !!productData.purchase,
      saleExists: !!productData.sale,
      purchaseUnits: productData.purchase?.units?.length || 0,
      saleUnits: productData.sale?.units?.length || 0,
      firstPurchaseUnitPrice: productData.purchase?.units?.[0]?.price,
      firstSaleUnitPrice: productData.sale?.units?.[0]?.price
    })

    if (Object.keys(errors).length > 0) {
      console.log("❌ TabbedProductForm: Validation failed, not saving")
      console.log("❌ TabbedProductForm: Specific validation failures:")
      Object.entries(errors).forEach(([field, error]) => {
        console.log(`   - ${field}: ${error}`)
      })
      setValidationErrors(errors)
      return
    }

    console.log("✅ TabbedProductForm: Validation passed, calling onSave")
    setValidationErrors({})
    onSave(productData)
    console.log("✅ TabbedProductForm: onSave called successfully")
  }

  // Expose submit function to parent component (modal)
  useImperativeHandle(ref, () => ({
    submit: () => handleSubmit()
  }))

  const isReadOnly = mode === 'view'

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px' }}>
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="product tabs"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Basic Information" />
          <Tab label="Purchase Details" />
          <Tab label="Sales Details" />
          {["prepped-item", "choice", "recipe"].includes(productData.type) && <Tab label="Recipe Details" />}
          {productData.type !== "prepped-item" && <Tab label="Financial Details" />}
        </Tabs>

        <form onSubmit={handleSubmit}>
          {/* Basic Information Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {productData.image ? (
                  <Box sx={{ mb: 2, position: "relative" }}>
                    <img
                      src={productData.image}
                      alt={productData.name}
                      style={{
                        width: "200px",
                        height: "200px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: "200px",
                      height: "200px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px dashed #ddd",
                      borderRadius: "8px",
                      mb: 2,
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No Image
                    </Typography>
                  </Box>
                )}
                
                {!isReadOnly && (
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mt: 1 }}
                  >
                    Upload Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </Button>
                )}
              </Grid>

              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Product Name"
                      value={productData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={!!validationErrors.name}
                      helperText={validationErrors.name}
                      disabled={isReadOnly}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={productData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      multiline
                      rows={3}
                      disabled={isReadOnly}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="SKU"
                      value={productData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Barcode"
                      value={productData.barcode}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl component="fieldset">
                      <FormLabel component="legend">Product Type</FormLabel>
                      <RadioGroup
                        row
                        value={productData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                      >
                        <FormControlLabel value="purchase-only" control={<Radio />} label="Purchase Only" disabled={isReadOnly} />
                        <FormControlLabel value="purchase-sell" control={<Radio />} label="Purchase & Sell" disabled={isReadOnly} />
                        <FormControlLabel value="prepped-item" control={<Radio />} label="Prepped Item" disabled={isReadOnly} />
                        <FormControlLabel value="choice" control={<Radio />} label="Choice" disabled={isReadOnly} />
                        <FormControlLabel value="recipe" control={<Radio />} label="Recipe" disabled={isReadOnly} />
                      </RadioGroup>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Sales Division</InputLabel>
                      <Select
                        value={productData.salesDivisionId}
                        label="Sales Division"
                        onChange={(e) => handleInputChange('salesDivisionId', e.target.value)}
                        disabled={isReadOnly}
                      >
                        {(salesDivisions || []).map((division) => (
                          <MenuItem key={division.id} value={division.id}>
                            {division.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={productData.categoryId}
                        label="Category"
                        onChange={(e) => handleInputChange('categoryId', e.target.value)}
                        disabled={isReadOnly}
                      >
                        {(categories || []).map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Subcategory</InputLabel>
                      <Select
                        value={productData.subcategoryId}
                        label="Subcategory"
                        onChange={(e) => handleInputChange('subcategoryId', e.target.value)}
                        disabled={isReadOnly}
                      >
                        {(subcategories || [])
                          .filter(sub => sub.parentCategoryId === productData.categoryId)
                          .map((subcategory) => (
                            <MenuItem key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={courseOptions || []}
                      getOptionLabel={(option) => option.name || ""}
                      value={(courseOptions || []).find(c => c.id === productData.course) || null}
                      onChange={(_, newValue) => handleInputChange('course', newValue?.id || "")}
                      disabled={isReadOnly}
                      renderInput={(params) => (
                        <TextField {...params} label="Course" />
                      )}
                    />
                  </Grid>

                </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Purchase Details Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>

              {/* Purchase Units Section */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Purchase Units</Typography>
                  {!isReadOnly && (
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={addPurchaseUnit}
                      size="small"
                    >
                      Add Unit
                    </Button>
                  )}
                </Box>

                {validationErrors.duplicatePurchaseUnits && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {validationErrors.duplicatePurchaseUnits}
                  </Alert>
                )}

                {(productData.purchase?.units || []).map((unit, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Supplier</InputLabel>
                          <Select
                            value={unit.supplierId || ""}
                            label="Supplier"
                            onChange={(e) => updatePurchaseUnit(index, 'supplierId', e.target.value)}
                            disabled={isReadOnly}
                          >
                            {(suppliers || []).map((supplier) => (
                              <MenuItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Measure</InputLabel>
                          <Select
                            value={unit.measure || ""}
                            label="Measure"
                            onChange={(e) => updatePurchaseUnit(index, 'measure', e.target.value)}
                            disabled={isReadOnly}
                          >
                            {(measures || []).map((measure) => (
                              <MenuItem key={measure.id} value={measure.id}>
                                {measure.name} ({measure.unit})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Quantity"
                          type="number"
                          value={unit.quantity || 1}
                          onChange={(e) => updatePurchaseUnit(index, 'quantity', parseFloat(e.target.value) || 1)}
                          disabled={isReadOnly}
                        />
                      </Grid>

                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Price"
                          type="number"
                          value={unit.price || 0}
                          onChange={(e) => updatePurchaseUnit(index, 'price', parseFloat(e.target.value) || 0)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">£</InputAdornment>,
                          }}
                          disabled={isReadOnly}
                        />
                      </Grid>

                      <Grid item xs={12} sm={1}>
                        <FormControlLabel
                          control={
                            <Radio
                              checked={productData.purchase?.defaultMeasure === unit.measure}
                              onChange={() => {
                                setProductData(prev => ({
                                  ...prev,
                                  purchase: {
                                    ...prev.purchase!,
                                    defaultMeasure: unit.measure,
                                    defaultSupplier: unit.supplierId
                                  }
                                }))
                              }}
                              disabled={isReadOnly}
                            />
                          }
                          label="Default"
                        />
                      </Grid>

                      <Grid item xs={12} sm={1}>
                        {!isReadOnly && (
                          <IconButton
                            color="error"
                            onClick={() => removePurchaseUnit(index)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Grid>
            </Grid>
          </TabPanel>

          {/* Sales Details Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              {/* Sales Units Section */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Sales Units</Typography>
                  {!isReadOnly && (
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={addSalesUnit}
                      size="small"
                    >
                      Add Unit
                    </Button>
                  )}
                </Box>

                {validationErrors.duplicateSalesUnits && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {validationErrors.duplicateSalesUnits}
                  </Alert>
                )}

                {(productData.sale?.units || []).map((unit, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={5}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Measure</InputLabel>
                          <Select
                            value={unit.measure || ""}
                            label="Measure"
                            onChange={(e) => updateSalesUnit(index, 'measure', e.target.value)}
                            disabled={isReadOnly}
                          >
                            {(measures || []).map((measure) => (
                              <MenuItem key={measure.id} value={measure.id}>
                                {measure.name} ({measure.unit})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Price"
                          type="number"
                          value={unit.price || 0}
                          onChange={(e) => updateSalesUnit(index, 'price', parseFloat(e.target.value) || 0)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">£</InputAdornment>,
                          }}
                          disabled={isReadOnly}
                        />
                      </Grid>

                      <Grid item xs={12} sm={2}>
                        <FormControlLabel
                          control={
                            <Radio
                              checked={productData.sale?.defaultMeasure === unit.measure}
                              onChange={() => {
                                setProductData(prev => ({
                                  ...prev,
                                  sale: {
                                    ...prev.sale!,
                                    defaultMeasure: unit.measure
                                  }
                                }))
                              }}
                              disabled={isReadOnly}
                            />
                          }
                          label="Default"
                        />
                      </Grid>

                      <Grid item xs={12} sm={1}>
                        {!isReadOnly && (
                          <IconButton
                            color="error"
                            onClick={() => removeSalesUnit(index)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Grid>
            </Grid>
          </TabPanel>

          {/* Recipe Details Tab - Conditional */}
          {["prepped-item", "choice", "recipe"].includes(productData.type) && (
            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" gutterBottom>
                Recipe Details - Create recipes for each sales unit
              </Typography>

              {productData.type !== "prepped-item" && productData.sale?.units && productData.sale.units.length > 0 ? (
                <Box sx={{ width: "100%" }}>
                  <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                    <Tabs
                      value={recipeMeasureTab}
                      onChange={(_e, newValue) => setRecipeMeasureTab(newValue)}
                      aria-label="recipe measure tabs"
                    >
                      {productData.sale.units.map((unit, index) => {
                        const measure = measures.find((m) => m.id === unit.measure)
                        const isDefault = unit.measure === productData.sale?.defaultMeasure
                        return (
                          <Tab
                            key={index}
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {measure?.name || `Unit ${index + 1}`}
                                {isDefault && <Chip label="Default" size="small" color="primary" sx={{ ml: 0.5 }} />}
                              </Box>
                            }
                            id={`recipe-tab-${index}`}
                            aria-controls={`recipe-tabpanel-${index}`}
                          />
                        )
                      })}
                    </Tabs>
                  </Box>

                  {productData.sale.units.map((unit, unitIndex) => (
                    <div
                      key={unitIndex}
                      role="tabpanel"
                      hidden={recipeMeasureTab !== unitIndex}
                      id={`recipe-tabpanel-${unitIndex}`}
                      aria-labelledby={`recipe-tab-${unitIndex}`}
                    >
                      {recipeMeasureTab === unitIndex && (
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1">
                              Ingredients for {measures.find((m) => m.id === unit.measure)?.name || 'this unit'}
                            </Typography>
                            {!isReadOnly && (
                              <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => addIngredient(unitIndex)}
                                size="small"
                              >
                                Add Ingredient
                              </Button>
                            )}
                          </Box>

                          {/* Ingredients for this specific unit */}
                          {unit.recipe?.ingredients && unit.recipe.ingredients.length > 0 ? (
                            unit.recipe.ingredients.map((ingredient, ingredientIndex) => (
                              <Paper
                                key={ingredientIndex}
                                sx={{
                                  mb: 2,
                                  p: 2,
                                  border: "1px solid",
                                  borderColor: "divider",
                                }}
                              >
                                <Grid container spacing={2} alignItems="center">
                                  <Grid item xs={12} md={5}>
                                    <Autocomplete
                                      options={(stockState.products || []).filter((p: any) => p.id !== productData.id)}
                                      getOptionLabel={(option) => option.name || ""}
                                      value={(stockState.products || []).find((p: any) => p.id === ingredient.itemId) || null}
                                      onChange={(_, newValue) => {
                                        updateIngredient(unitIndex, ingredientIndex, "itemId", newValue?.id || "")
                                      }}
                                      disabled={isReadOnly}
                                      renderInput={(params) => <TextField {...params} label="Ingredient" fullWidth />}
                                    />
                                  </Grid>

                                  <Grid item xs={6} md={3}>
                                    <Autocomplete
                                      options={measures || []}
                                      getOptionLabel={(option) => option.name || ""}
                                      value={(measures || []).find((m) => m.id === ingredient.measure) || null}
                                      onChange={(_, newValue) => {
                                        updateIngredient(unitIndex, ingredientIndex, "measure", newValue?.id || "")
                                      }}
                                      disabled={isReadOnly}
                                      renderInput={(params) => <TextField {...params} label="Measure" fullWidth />}
                                      isOptionEqualToValue={(option, value) => option.id === value.id}
                                    />
                                  </Grid>

                                  <Grid item xs={6} md={3}>
                                    <TextField
                                      label="Quantity"
                                      type="number"
                                      fullWidth
                                      value={ingredient.quantity || 0}
                                      onChange={(e) => {
                                        updateIngredient(unitIndex, ingredientIndex, "quantity", Number(e.target.value) || 0)
                                      }}
                                      InputProps={{
                                        inputProps: { min: 0, step: 0.01 },
                                      }}
                                      disabled={isReadOnly}
                                    />
                                  </Grid>

                                  <Grid item xs={12} md={1}>
                                    {!isReadOnly && (
                                      <IconButton color="error" onClick={() => removeIngredient(unitIndex, ingredientIndex)}>
                                        <DeleteIcon />
                                      </IconButton>
                                    )}
                                  </Grid>
                                </Grid>
                              </Paper>
                            ))
                          ) : (
                            <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                No ingredients added yet for this unit
                              </Typography>
                            </Box>
                          )}

                        </Box>
                      )}
                    </div>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {productData.type === "prepped-item"
                    ? "Prepped items don't require sales measures."
                    : "Please add sales units in the Sales Details tab first."}
                </Typography>
              )}
            </TabPanel>
          )}

          {/* Financial Details Tab - Conditional */}
          {productData.type !== "prepped-item" && (
            <TabPanel value={tabValue} index={["prepped-item", "choice", "recipe"].includes(productData.type) ? 4 : 3}>
              <Typography variant="h6" gutterBottom>
                Financial Details
              </Typography>

              {/* Financial Summary Section */}
              <Paper sx={{ mb: 3, p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Financial Summary
                </Typography>
                <Grid container spacing={3}>
                  {/* Purchase Information */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom color="primary">
                      Purchase Information
                    </Typography>
                    {productData.purchase?.units && productData.purchase.units.length > 0 ? (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Default Purchase Price
                        </Typography>
                        <Typography variant="h6" gutterBottom>
                          £{(productData.purchase.units[0]?.price || 0).toFixed(2)}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Default Purchase Measure
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {getMeasureName(productData.purchase.units[0]?.measure || "")}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Cost per Base Unit
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          £{calculatedCostPerBaseUnit.toFixed(4)}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No purchase units configured
                      </Typography>
                    )}
                  </Grid>

                  {/* Sales Information */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom color="secondary">
                      Sales Information
                    </Typography>
                    {productData.type !== "purchase-only" && productData.sale?.units && productData.sale.units.length > 0 ? (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Default Sales Price
                        </Typography>
                        <Typography variant="h6" gutterBottom>
                          £{(productData.sale.units[0]?.price || 0).toFixed(2)}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Default Sales Measure
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {getMeasureName(productData.sale.units[0]?.measure || "")}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {productData.type === "purchase-only" ? "Purchase-only product" : "No sales units configured"}
                      </Typography>
                    )}
                  </Grid>

                  {/* Profit Analysis */}
                  {productData.type === "purchase-sell" && 
                   productData.purchase?.units && productData.purchase.units.length > 0 &&
                   productData.sale?.units && productData.sale.units.length > 0 && (
                    <>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">
                          Gross Profit (per base unit)
                        </Typography>
                        <Typography variant="h6" color={calculatedGrossProfit >= 0 ? "success.main" : "error.main"}>
                          £{calculatedGrossProfit.toFixed(4)}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">
                          Profit Margin
                        </Typography>
                        <Typography variant="h6" color={calculatedProfitMargin >= 0 ? "success.main" : "error.main"}>
                          {calculatedProfitMargin.toFixed(2)}%
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">
                          Base Unit Comparison
                        </Typography>
                        <Typography variant="body1">
                          {getMeasureBaseUnit(productData.purchase.units[0]?.measure || "")} vs{" "}
                          {getMeasureBaseUnit(productData.sale.units[0]?.measure || "")}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Paper>

              {/* Tax Configuration */}
              <Grid container spacing={3}>
                {productData.type !== "recipe" && productData.type !== "choice" && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Purchase Tax Percentage"
                      type="number"
                      value={taxPercent}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        setTaxPercent(value)
                        handleNestedInputChange('purchase', 'taxPercent', value)
                      }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        inputProps: { min: 0, max: 100, step: 0.1 },
                      }}
                      fullWidth
                      helperText="Tax percentage applied to purchases"
                      disabled={isReadOnly}
                    />
                  </Grid>
                )}

                {productData.type !== "purchase-only" && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Sales Tax Percentage"
                      type="number"
                      value={salesTaxPercent}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        setSalesTaxPercent(value)
                        handleNestedInputChange('sale', 'taxPercent', value)
                      }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        inputProps: { min: 0, max: 100, step: 0.1 },
                      }}
                      fullWidth
                      helperText="Tax percentage applied to sales"
                      disabled={isReadOnly}
                    />
                  </Grid>
                )}
              </Grid>
            </TabPanel>
          )}

        </form>
      </Paper>
    </Box>
  )
})

TabbedProductForm.displayName = 'TabbedProductForm'

export default TabbedProductForm
