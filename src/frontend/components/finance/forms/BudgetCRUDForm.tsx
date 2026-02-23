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
  LinearProgress,
  Chip,
} from '@mui/material'
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'
import FormSection from '../../reusable/FormSection'
import type { Budget } from '../../../../backend/interfaces/Finance'

interface BudgetCRUDFormProps {
  budget?: Budget | null
  mode: 'create' | 'edit' | 'view'
  onSave: (data: any) => void
}

const BudgetCRUDForm: React.FC<BudgetCRUDFormProps> = ({
  budget,
  mode,
  onSave
}) => {
  const [formData, setFormData] = useState({
    category: '',
    period: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    budgeted: 0,
    actual: 0,
  })

  // Update form data when budget prop changes
  useEffect(() => {
    if (budget) {
      // Ensure period is a valid type
      const validPeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 
        ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].includes(budget.period as string) 
          ? (budget.period as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly')
          : 'monthly'
      
      setFormData({
        category: budget.category || '',
        period: validPeriod,
        budgeted: budget.budgeted || 0,
        actual: budget.actual || 0,
      })
    }
  }, [budget])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = () => {
    const budgeted = parseFloat(String(formData.budgeted))
    const actual = parseFloat(String(formData.actual))
    const remaining = budgeted - actual
    const percentage = budgeted > 0 ? (actual / budgeted) * 100 : 0
    
    const submissionData = {
      ...formData,
      budgeted,
      actual,
      remaining,
      percentage,
      status: percentage > 100 ? 'over-budget' : percentage >= 80 ? 'near-limit' : 'under-budget',
    }
    onSave(submissionData)
  }

  const isReadOnly = mode === 'view'
  
  const budgeted = parseFloat(String(formData.budgeted)) || 0
  const actual = parseFloat(String(formData.actual)) || 0
  const remaining = budgeted - actual
  const percentage = budgeted > 0 ? (actual / budgeted) * 100 : 0

  return (
    <Box sx={{ width: '100%' }}>
      <FormSection 
        title="Budget Information" 
        icon={<AccountBalanceIcon />}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Budget Category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              required
              disabled={isReadOnly}
              placeholder="e.g., Food & Beverage, Utilities, Staff Costs"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={isReadOnly}>
              <InputLabel>Period</InputLabel>
              <Select
                value={formData.period}
                onChange={(e) => handleChange('period', e.target.value)}
                label="Period"
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Budgeted Amount"
              type="number"
              value={formData.budgeted}
              onChange={(e) => handleChange('budgeted', e.target.value)}
              required
              disabled={isReadOnly}
              InputProps={{
                startAdornment: <InputAdornment position="start">£</InputAdornment>,
              }}
              helperText="Target spending amount for this period"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Actual Spent"
              type="number"
              value={formData.actual}
              onChange={(e) => handleChange('actual', e.target.value)}
              disabled={isReadOnly}
              InputProps={{
                startAdornment: <InputAdornment position="start">£</InputAdornment>,
              }}
              helperText="Amount actually spent so far"
            />
          </Grid>
        </Grid>
      </FormSection>

      <FormSection 
        title="Budget Progress" 
        icon={<TrendingUpIcon />}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {percentage.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(percentage, 100)} 
                color={
                  percentage > 100 ? 'error' :
                  percentage >= 80 ? 'warning' : 'success'
                }
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Budgeted</Typography>
                <Typography variant="h6" color="primary.main">
                  £{budgeted.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Actual</Typography>
                <Typography variant="h6" color={percentage > 100 ? 'error.main' : 'success.main'}>
                  £{actual.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Remaining</Typography>
                <Typography variant="h6" color={remaining < 0 ? 'error.main' : 'text.primary'}>
                  £{remaining.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip 
                    label={
                      percentage > 100 ? 'Over Budget' :
                      percentage >= 80 ? 'Near Limit' : 'On Track'
                    }
                    color={
                      percentage > 100 ? 'error' :
                      percentage >= 80 ? 'warning' : 'success'
                    }
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </FormSection>

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
            {mode === 'edit' ? 'Update Budget' : 'Create Budget'}
          </button>
        </Box>
      )}
    </Box>
  )
}

export default BudgetCRUDForm

