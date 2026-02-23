"use client"

import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Grid,
} from '@mui/material'
import {
  Diversity3 as Diversity3Icon,
} from '@mui/icons-material'
import FormSection from '../../reusable/FormSection'
import { useHR } from '../../../../backend/context/HRContext'

interface DiversityMetrics {
  id?: string
  title: string
  description: string
  metrics: {
    gender: Record<string, number>
    age: Record<string, number>
    ethnicity: Record<string, number>
    department: Record<string, number>
  }
  goals: Array<{
    metric: string
    target: number
    current: number
    deadline: Date
  }>
  initiatives: Array<{
    title: string
    description: string
    status: 'planning' | 'active' | 'completed'
    impact: string
  }>
  reportPeriod: {
    startDate: Date
    endDate: Date
  }
  createdAt: Date
  updatedAt: Date
}

interface DiversityCRUDFormProps {
  diversityMetrics?: DiversityMetrics | null
  mode: 'create' | 'edit' | 'view'
  onSave: (data: any) => void
}

const DiversityCRUDForm: React.FC<DiversityCRUDFormProps> = ({
  diversityMetrics,
  mode,
  onSave
}) => {
  useHR()

  const [formData, setFormData] = useState<DiversityMetrics>({
    title: '',
    description: '',
    metrics: {
      gender: {},
      age: {},
      ethnicity: {},
      department: {}
    },
    goals: [],
    initiatives: [],
    reportPeriod: {
      startDate: new Date(),
      endDate: new Date()
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  useEffect(() => {
    if (diversityMetrics) {
      setFormData({
        ...diversityMetrics,
        reportPeriod: {
          startDate: new Date(diversityMetrics.reportPeriod.startDate),
          endDate: new Date(diversityMetrics.reportPeriod.endDate),
        },
        createdAt: new Date(diversityMetrics.createdAt),
        updatedAt: new Date(diversityMetrics.updatedAt),
      })
    }
  }, [diversityMetrics])

  const handleSubmit = () => {
    const submissionData = {
      ...formData,
      reportPeriod: {
        startDate: formData.reportPeriod.startDate.getTime(),
        endDate: formData.reportPeriod.endDate.getTime(),
      },
      createdAt: formData.createdAt.getTime(),
      updatedAt: new Date().getTime(),
    }
    onSave(submissionData)
  }

  const isReadOnly = mode === 'view'

  return (
    <Box sx={{ width: '100%' }}>
      <FormSection title="Diversity Report" icon={<Diversity3Icon />}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Report Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              disabled={isReadOnly}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={isReadOnly}
            />
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
            {mode === 'edit' ? 'Update Report' : 'Create Report'}
          </button>
        </Box>
      )}
    </Box>
  )
}

export default DiversityCRUDForm
