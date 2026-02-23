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
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Autocomplete,
  Alert,
  Divider,
} from "@mui/material"
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material"
import { useStock } from "../../../../backend/context/StockContext"
import type { Purchase, PurchaseItem } from "../../../../backend/interfaces/Stock"

interface PurchaseOrderFormProps {
  purchase?: Purchase | null
  mode: 'create' | 'edit' | 'view'
  onSave: (data: Purchase) => void
}

export interface PurchaseOrderFormRef {
  submit: () => void
}

const PurchaseOrderForm = forwardRef<PurchaseOrderFormRef, PurchaseOrderFormProps>(({
  purchase,
  mode,
  onSave,
}, ref) => {
  const { state: stockState } = useStock()
  const { products, suppliers, measures } = stockState

  const [purchaseData, setPurchaseData] = useState<Purchase>({
    supplier: "",
    dateUK: new Date().toISOString().split("T")[0],
    status: "Awaiting Submission",
    totalTax: 0,
    totalValue: 0,
    invoiceNumber: "",
    items: [],
  })

  const [applySupplierToAll] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    supplier?: string
    items?: string
  }>({})

  // Load purchase data when editing
  useEffect(() => {
    if (purchase && mode !== 'create') {
      setPurchaseData(purchase)
    }
  }, [purchase, mode])

  const isReadOnly = mode === 'view'

  // Add a new purchase item
  const addPurchaseItem = () => {
    setPurchaseData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: "",
          productName: "",
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          itemID: "",
          name: "",
          supplierId: applySupplierToAll ? prev.supplier : "",
          measureId: "",
          measureName: "",
          taxPercent: 20,
          priceExcludingVAT: 0,
          taxAmount: 0,
          salesDivisionId: "",
          categoryId: "",
          subcategoryId: "",
          type: "",
        },
      ],
    }))
  }

  // Update a purchase item
  const updatePurchaseItem = (index: number, changes: Partial<PurchaseItem>) => {
    setPurchaseData((prev) => {
      const updatedItems = [...prev.items]
      updatedItems[index] = { ...updatedItems[index], ...changes }

      // Recalculate totals
      const quantity = updatedItems[index].quantity || 0
      const unitPrice = updatedItems[index].unitPrice || 0
      const taxPercent = updatedItems[index].taxPercent || 0

      const totalPrice = quantity * unitPrice
      const taxAmount = (totalPrice * taxPercent) / (100 + taxPercent)
      const priceExcludingVAT = totalPrice - taxAmount

      updatedItems[index] = {
        ...updatedItems[index],
        totalPrice,
        taxAmount,
        priceExcludingVAT,
      }

      // Update purchase totals
      const newTotalTax = updatedItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0)
      const newTotalValue = updatedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0)

      return {
        ...prev,
        items: updatedItems,
        totalTax: newTotalTax,
        totalValue: newTotalValue,
      }
    })
  }

  // Remove a purchase item
  const removePurchaseItem = (index: number) => {
    setPurchaseData((prev) => {
      const updatedItems = prev.items.filter((_, i) => i !== index)
      
      // Recalculate totals
      const newTotalTax = updatedItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0)
      const newTotalValue = updatedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0)

      return {
        ...prev,
        items: updatedItems,
        totalTax: newTotalTax,
        totalValue: newTotalValue,
      }
    })
  }

  // Helper function to get available purchase measures for a specific product
  const getAvailablePurchaseMeasures = (productId: string) => {
    if (!productId || !products || !measures) return []
    
    const product = products.find(p => p.id === productId)
    if (!product) return []
    
    // Get measure IDs from purchase units array
    let purchaseMeasureIds: string[] = []
    
    if (product.purchase?.units && Array.isArray(product.purchase.units)) {
      purchaseMeasureIds = product.purchase.units.map(unit => unit.measure).filter(Boolean)
    } else if (product.purchase?.defaultMeasure) {
      // Fallback to default measure if units array doesn't exist
      purchaseMeasureIds = [product.purchase.defaultMeasure]
    }
    
    // Filter measures to only include those available for purchase
    return measures.filter(measure => purchaseMeasureIds.includes(measure.id))
  }

  // Handle product selection
  const handleProductChange = (index: number, product: any) => {
    if (!product) return

    const defaultMeasureId = product.purchase?.defaultMeasure || ""
    const defaultUnit = measures.find((m) => m.id === defaultMeasureId)
    const defaultSupplierId = product.purchase?.defaultSupplier || ""
    
    // Get price from the default purchase unit
    let defaultPrice = 0
    let defaultTax = 20 // Default VAT rate
    
    if (product.purchase?.units && Array.isArray(product.purchase.units)) {
      const defaultPurchaseUnit = product.purchase.units.find((u: any) => u.measure === defaultMeasureId)
      if (defaultPurchaseUnit) {
        defaultPrice = defaultPurchaseUnit.price || 0
        // Tax percentage can be stored per unit if available
        defaultTax = defaultPurchaseUnit.taxPercent || product.purchase.taxPercent || 20
      }
    } else {
      defaultPrice = product.purchase?.price || 0
      defaultTax = product.purchase?.taxPercent || 20
    }

    updatePurchaseItem(index, {
      productId: product.id,
      productName: product.name,
      itemID: product.id,
      name: product.name,
      supplierId: defaultSupplierId,
      measureId: defaultMeasureId,
      measureName: defaultUnit?.name || "Unknown Unit",
      unitPrice: defaultPrice,
      taxPercent: defaultTax,
      salesDivisionId: product.salesDivisionId || "",
      categoryId: product.categoryId || "",
      subcategoryId: product.subcategoryId || "",
      type: product.type || "",
    })
  }

  // Handle measure change - update price and tax from product data
  const handleMeasureChange = (index: number, measureId: string, measureName: string) => {
    const item = purchaseData.items[index]
    const product = products.find((p) => p.id === item.productId)
    
    if (!product) {
      updatePurchaseItem(index, { measureId, measureName })
      return
    }
    
    // Get price and tax for this specific measure
    let price = 0
    let tax = 20
    
    if (product.purchase?.units && Array.isArray(product.purchase.units)) {
      const purchaseUnit = product.purchase.units.find((u: any) => u.measure === measureId)
      if (purchaseUnit) {
        price = purchaseUnit.price || 0
        tax = purchaseUnit.taxPercent || product.purchase.taxPercent || 20
      }
    } else {
      price = product.purchase?.price || 0
      tax = product.purchase?.taxPercent || 20
    }
    
    updatePurchaseItem(index, {
      measureId,
      measureName,
      unitPrice: price,
      taxPercent: tax,
    })
  }


  const handleSubmit = (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault()
    }
    
    // Validation
    const errors: any = {}
    if (!purchaseData.supplier) {
      errors.supplier = "Supplier is required"
    }
    if (purchaseData.items.length === 0) {
      errors.items = "At least one item is required"
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setValidationErrors({})
    onSave(purchaseData)
  }

  // Expose submit function to parent component
  useImperativeHandle(ref, () => ({
    submit: () => handleSubmit()
  }))

  const handleInputChange = (field: keyof Purchase, value: any) => {
    setPurchaseData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Box sx={{ 
      width: 'max-content',
      minWidth: '300px',
      maxWidth: 'none'
    }}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Header Information */}

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select
                value={purchaseData.supplier}
                label="Supplier"
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                error={!!validationErrors.supplier}
                disabled={isReadOnly}
                required
                sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem', md: '1rem' },
                  '& .MuiSelect-select': {
                    fontSize: { xs: '0.875rem', sm: '1rem', md: '1rem' }
                  }
                }}
              >
                {(suppliers || []).map((supplier) => (
                  <MenuItem 
                    key={supplier.id} 
                    value={supplier.id}
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '1rem', md: '1rem' }
                    }}
                  >
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {validationErrors.supplier && (
              <Typography variant="caption" color="error">
                {validationErrors.supplier}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Invoice Number"
              value={purchaseData.invoiceNumber}
              onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
              disabled={isReadOnly}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.875rem', sm: '1rem', md: '1rem' }
                },
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem', md: '1rem' }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={purchaseData.dateUK}
              onChange={(e) => handleInputChange('dateUK', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={isReadOnly}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.875rem', sm: '1rem', md: '1rem' }
                },
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem', md: '1rem' }
                }
              }}
            />
          </Grid>


          {/* Purchase Items */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />

            {validationErrors.items && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {validationErrors.items}
              </Alert>
            )}

            <TableContainer 
              component={Paper} 
              sx={{ 
                overflowX: 'visible',
                maxHeight: { xs: '400px', sm: '500px', md: '600px' },
                width: 'max-content',
                minWidth: '100%'
              }}
            >
              <Table 
                size="small" 
                sx={{ 
                  tableLayout: 'auto', 
                  width: 'max-content',
                  minWidth: '100%'
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ 
                      textAlign: 'center',
                      whiteSpace: 'nowrap'
                    }}>Product</TableCell>
                    <TableCell sx={{ 
                      textAlign: 'center',
                      whiteSpace: 'nowrap'
                    }}>Measure</TableCell>
                    <TableCell sx={{ 
                      textAlign: 'center',
                      whiteSpace: 'nowrap'
                    }}>Quantity</TableCell>
                    <TableCell sx={{ 
                      textAlign: 'center',
                      whiteSpace: 'nowrap'
                    }}>Unit Price</TableCell>
                    <TableCell sx={{ 
                      textAlign: 'center',
                      whiteSpace: 'nowrap'
                    }}>Tax %</TableCell>
                    <TableCell sx={{ 
                      textAlign: 'center',
                      whiteSpace: 'nowrap'
                    }}>Total</TableCell>
                    {!isReadOnly && <TableCell sx={{ 
                      textAlign: 'center',
                      whiteSpace: 'nowrap'
                    }}>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchaseData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ 
                        textAlign: 'center',
                        width: 'auto',
                        minWidth: 'fit-content',
                        maxWidth: 'none',
                        overflow: 'visible',
                        padding: '8px'
                      }}>
                        <Autocomplete
                          size="small"
                          options={products || []}
                          getOptionLabel={(option) => option.name || ""}
                          value={(products || []).find(p => p.id === item.productId) || null}
                          onChange={(_, newValue) => handleProductChange(index, newValue)}
                          disabled={isReadOnly}
                          renderInput={(params) => (
                            <TextField 
                              {...params} 
                              placeholder="Select product"
                              sx={{
                                '& .MuiInputBase-input': {
                                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.875rem' }
                                }
                              }}
                            />
                          )}
                          sx={{ 
                            width: '100%',
                            minWidth: '200px',
                            '& .MuiAutocomplete-inputRoot': {
                              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.875rem' }
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <FormControl 
                          size="small" 
                          fullWidth
                          sx={{
                            width: 'auto',
                            minWidth: 'fit-content',
                            maxWidth: '100%'
                          }}
                        >
                          <Select
                            value={item.measureId || ""}
                            onChange={(e) => {
                              const measure = measures.find(m => m.id === e.target.value)
                              handleMeasureChange(index, e.target.value, measure?.name || "")
                            }}
                            disabled={isReadOnly}
                            sx={{
                              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.875rem' },
                              '& .MuiSelect-select': {
                                fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.875rem' }
                              }
                            }}
                          >
                            {getAvailablePurchaseMeasures(item.productId).map((measure) => (
                              <MenuItem 
                                key={measure.id} 
                                value={measure.id}
                                sx={{
                                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.875rem' }
                                }}
                              >
                                {measure.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <TextField
                          size="small"
                          type="number"
                          value={item.quantity || 0}
                          onChange={(e) => updatePurchaseItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                          disabled={isReadOnly}
                          inputProps={{ 
                            min: 0, 
                            step: 0.01,
                            style: { 
                              fontSize: 'inherit',
                              textAlign: 'center'
                            }
                          }}
                          sx={{ 
                            width: { xs: 60, sm: 70, md: 80, lg: 90, xl: 100 },
                            minWidth: { xs: 60, sm: 70, md: 80, lg: 90, xl: 100 },
                            maxWidth: '100%',
                            '& .MuiInputBase-input': {
                              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.875rem' },
                              textAlign: 'center'
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <TextField
                          size="small"
                          type="number"
                          value={item.unitPrice || 0}
                          onChange={(e) => updatePurchaseItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">£</InputAdornment>,
                          }}
                          disabled={isReadOnly}
                          inputProps={{ 
                            min: 0, 
                            step: 0.01,
                            style: { 
                              fontSize: 'inherit',
                              textAlign: 'center'
                            }
                          }}
                          sx={{ 
                            width: { xs: 80, sm: 90, md: 100, lg: 110, xl: 120 },
                            minWidth: { xs: 80, sm: 90, md: 100, lg: 110, xl: 120 },
                            maxWidth: '100%',
                            '& .MuiInputBase-input': {
                              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.875rem' },
                              textAlign: 'center'
                            },
                            '& .MuiInputAdornment-root': {
                              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.875rem' }
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <TextField
                          size="small"
                          type="number"
                          value={item.taxPercent || 20}
                          onChange={(e) => updatePurchaseItem(index, { taxPercent: parseFloat(e.target.value) || 0 })}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                          disabled={isReadOnly}
                          inputProps={{ 
                            min: 0, 
                            step: 0.01,
                            style: { 
                              fontSize: 'inherit',
                              textAlign: 'center'
                            }
                          }}
                          sx={{ 
                            width: { xs: 50, sm: 60, md: 70, lg: 80, xl: 90 },
                            minWidth: { xs: 50, sm: 60, md: 70, lg: 80, xl: 90 },
                            maxWidth: '100%',
                            '& .MuiInputBase-input': {
                              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.875rem' },
                              textAlign: 'center'
                            },
                            '& .MuiInputAdornment-root': {
                              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.875rem' }
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography variant="body2">
                          £{(item.totalPrice || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      {!isReadOnly && (
                        <TableCell sx={{ textAlign: 'center' }}>
                          <IconButton
                            color="error"
                            onClick={() => removePurchaseItem(index)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Add Item Button - Centered below table */}
            {!isReadOnly && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addPurchaseItem}
                  size="small"
                >
                  Add Item
                </Button>
              </Box>
            )}

            {/* Totals */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Grid container spacing={2} sx={{ maxWidth: 400 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right">
                    Subtotal (excl. VAT):
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right">
                    £{((purchaseData.totalValue || 0) - (purchaseData.totalTax || 0)).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right">
                    Total VAT:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right">
                    £{(purchaseData.totalTax || 0).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" align="right">
                    Total:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" align="right">
                    £{(purchaseData.totalValue || 0).toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

        </Grid>
      </form>
    </Box>
  )
})

PurchaseOrderForm.displayName = 'PurchaseOrderForm'

export default PurchaseOrderForm