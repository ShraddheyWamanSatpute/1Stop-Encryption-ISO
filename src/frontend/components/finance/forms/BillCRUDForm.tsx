"use client"

import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  InputAdornment,
  Chip,
} from '@mui/material'
import {
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material'
import FormSection from '../../reusable/FormSection'
import { useFinance } from '../../../../backend/context/FinanceContext'
import type { Bill } from '../../../../backend/interfaces/Finance'

interface BillCRUDFormProps {
  bill?: Bill | null
  mode: 'create' | 'edit' | 'view'
  onSave: (data: any) => void
}

const BillCRUDForm: React.FC<BillCRUDFormProps> = ({
  bill,
  mode,
  onSave
}) => {
  const { state: financeState } = useFinance()

  const [formData, setFormData] = useState({
    supplierId: '',
    supplierName: '',
    reference: '',
    description: '',
    subtotal: 0,
    taxAmount: 0,
    currency: 'USD',
    receiveDate: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
  })

  // Update form data when bill prop changes
  useEffect(() => {
    if (bill) {
      setFormData({
        supplierId: bill.supplierId || '',
        supplierName: bill.supplierName || '',
        reference: bill.reference || '',
        description: bill.description || '',
        subtotal: bill.subtotal || 0,
        taxAmount: bill.taxAmount || 0,
        currency: bill.currency || 'USD',
        receiveDate: bill.receiveDate || new Date().toISOString().split("T")[0],
        dueDate: bill.dueDate || new Date().toISOString().split("T")[0],
      })
    }
  }, [bill])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Auto-update supplier name when supplier is selected
    if (field === 'supplierId') {
      const supplier = financeState.contacts?.find(c => c.id === value && c.type === 'supplier')
      if (supplier) {
        setFormData(prev => ({
          ...prev,
          [field]: value,
          supplierName: supplier.name
        }))
      }
    }
  }

  const handleSubmit = () => {
    const subtotal = parseFloat(String(formData.subtotal))
    const taxAmount = parseFloat(String(formData.taxAmount))
    const totalAmount = subtotal + taxAmount
    
    const submissionData = {
      billNumber: bill?.billNumber || `BILL-${Date.now()}`,
      supplierId: formData.supplierId,
      supplierName: formData.supplierName,
      reference: formData.reference,
      description: formData.description,
      subtotal,
      taxAmount,
      totalAmount,
      currency: formData.currency,
      status: bill?.status || 'pending',
      receiveDate: formData.receiveDate,
      dueDate: formData.dueDate,
      lineItems: bill?.lineItems || [],
      createdAt: bill?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    onSave(submissionData)
  }

  const isReadOnly = mode === 'view'
  
  const subtotal = parseFloat(String(formData.subtotal)) || 0
  const taxAmount = parseFloat(String(formData.taxAmount)) || 0
  const totalAmount = subtotal + taxAmount

  // Get suppliers from contacts
  const suppliers = financeState.contacts?.filter(c => c.type === 'supplier') || []

  return (
    <Box sx={{ width: '100%' }}>
      <FormSection 
        title="Bill Information" 
        icon={<ReceiptIcon />}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={isReadOnly}>
              <InputLabel>Supplier</InputLabel>
              <Select
                value={formData.supplierId}
                onChange={(e) => handleChange('supplierId', e.target.value)}
                label="Supplier"
              >
                <MenuItem value="">
                  <em>Select a supplier</em>
                </MenuItem>
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                    {supplier.email && ` (${supplier.email})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Reference/Invoice #"
              value={formData.reference}
              onChange={(e) => handleChange('reference', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g., INV-2024-001"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Receive Date"
              type="date"
              value={formData.receiveDate}
              onChange={(e) => handleChange('receiveDate', e.target.value)}
              required
              disabled={isReadOnly}
              InputLabelProps={{ shrink: true }}
              helperText="Date the bill was received"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              required
              disabled={isReadOnly}
              InputLabelProps={{ shrink: true }}
              helperText="Payment due date"
            />
          </Grid>
        </Grid>
      </FormSection>

      <FormSection 
        title="Amount Details" 
        icon={<DescriptionIcon />}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Subtotal"
              type="number"
              value={formData.subtotal}
              onChange={(e) => handleChange('subtotal', e.target.value)}
              required
              disabled={isReadOnly}
              InputProps={{
                startAdornment: <InputAdornment position="start">{formData.currency}</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tax Amount"
              type="number"
              value={formData.taxAmount}
              onChange={(e) => handleChange('taxAmount', e.target.value)}
              disabled={isReadOnly}
              InputProps={{
                startAdornment: <InputAdornment position="start">{formData.currency}</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={isReadOnly}>
              <InputLabel>Currency</InputLabel>
              <Select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                label="Currency"
              >
                <MenuItem value="USD">USD - US Dollar</MenuItem>
                <MenuItem value="GBP">GBP - British Pound</MenuItem>
                <MenuItem value="EUR">EUR - Euro</MenuItem>
                {financeState.currencies?.map((curr) => (
                  <MenuItem key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'primary.light', 
              borderRadius: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography variant="caption" color="primary.contrastText">
                Total Amount
              </Typography>
              <Typography variant="h5" color="primary.contrastText" fontWeight="bold">
                {formData.currency} {totalAmount.toLocaleString()}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={isReadOnly}
              placeholder="Describe what this bill is for..."
            />
          </Grid>
        </Grid>
      </FormSection>

      {bill && (
        <FormSection 
          title="Bill Status" 
          icon={<ReceiptIcon />}
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Bill Number</Typography>
                  <Typography variant="body1" fontWeight="bold">{bill.billNumber}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip 
                      label={bill.status.toUpperCase()} 
                      color={
                        bill.status === 'paid' ? 'success' :
                        bill.status === 'approved' ? 'info' :
                        bill.status === 'overdue' ? 'error' : 'warning'
                      }
                      size="small"
                    />
                  </Box>
                </Box>
                {bill.approvedBy && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Approved By</Typography>
                    <Typography variant="body2">{bill.approvedBy}</Typography>
                  </Box>
                )}
                {bill.approvedAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Approved On</Typography>
                    <Typography variant="body2">
                      {new Date(bill.approvedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </FormSection>
      )}

      {!isReadOnly && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              padding: '12px 24px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {mode === 'edit' ? 'Update Bill' : 'Create Bill'}
          </button>
        </Box>
      )}
    </Box>
  )
}

export default BillCRUDForm

