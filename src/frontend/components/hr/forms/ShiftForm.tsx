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
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { parseISO, format } from 'date-fns'
import { useHRContext } from '../../../../backend/context/HRContext'
import type { Schedule } from '../../../../backend/interfaces/HRs'

interface ShiftFormProps {
  shift?: Schedule | null
  mode: 'create' | 'edit' | 'view'
  onSave: (data: any) => void
  employees?: any[]
}

const ShiftForm: React.FC<ShiftFormProps> = ({
  shift,
  mode,
  onSave,
  employees: employeesProp
}) => {
  const { state: hrState } = useHRContext()
  
  // Use employees from props if provided, otherwise from hrState
  const employees = employeesProp || hrState.employees || []

  const [formData, setFormData] = useState<{
    employeeId: string
    employeeName: string
    date: Date
    startTime: Date
    endTime: Date
    department: string
    role: string
    notes: string
    status: 'draft' | 'scheduled' | 'completed' | 'cancelled'
    shiftType: 'regular' | 'holiday' | 'off' | 'training'
    payType: 'hourly' | 'salary'
    payRate: number
  }>({
    employeeId: '',
    employeeName: '',
    date: new Date(),
    startTime: new Date(),
    endTime: new Date(),
    department: '',
    role: '',
    notes: '',
    status: 'draft',
    shiftType: 'regular',
    payType: 'hourly',
    payRate: 0,
  })

  // Update form data when shift prop changes
  useEffect(() => {
    if (shift) {
      // Handle date - can be string (yyyy-MM-dd) or Date object
      let dateValue: Date
      if (typeof shift.date === 'string') {
        dateValue = parseISO(shift.date)
      } else if (shift.date && typeof shift.date === 'object' && 'getTime' in shift.date) {
        dateValue = shift.date as Date
      } else {
        dateValue = new Date()
      }

      setFormData({
        employeeId: shift.employeeId || '',
        employeeName: shift.employeeName || '',
        date: dateValue,
        startTime: shift.startTime ? parseISO(`2000-01-01T${shift.startTime}`) : new Date(),
        endTime: shift.endTime ? parseISO(`2000-01-01T${shift.endTime}`) : new Date(),
        department: shift.department || '',
        role: shift.role || '',
        notes: shift.notes || '',
        status: (shift.status as "draft" | "scheduled" | "completed" | "cancelled") || 'draft',
        shiftType: (shift.shiftType as "regular") || 'regular',
        payType: (shift.payType as "hourly") || 'hourly',
        payRate: shift.payRate || 0,
      })
    } else {
      // Reset form when shift is null (creating new)
      setFormData({
        employeeId: '',
        employeeName: '',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        department: '',
        role: '',
        notes: '',
        status: 'draft',
        shiftType: 'regular',
        payType: 'hourly',
        payRate: 0,
      })
    }
  }, [shift])

  // Auto-fill employee data when employee is selected
  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees?.find(emp => emp.id === employeeId)
    if (employee) {
      setFormData(prev => ({
        ...prev,
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        department: employee.department || '',
        role: employee.roleId ? (hrState.roles?.find(r => r.id === employee.roleId)?.label || hrState.roles?.find(r => r.id === employee.roleId)?.name || '') : '',
        payRate: employee.hourlyRate || 0,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        employeeId,
        employeeName: '',
        department: '',
        role: '',
        payRate: 0,
      }))
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const isReadOnly = mode === 'view'

  // Expose submit handler for CRUDModal
  React.useEffect(() => {
    if (mode !== 'view') {
      (window as any).shiftFormSubmit = () => {
        const shiftData = {
          employeeId: formData.employeeId,
          employeeName: formData.employeeName,
          date: typeof formData.date === 'string' ? formData.date : format(formData.date, 'yyyy-MM-dd'),
          startTime: typeof formData.startTime === 'string' ? formData.startTime : format(formData.startTime, 'HH:mm'),
          endTime: typeof formData.endTime === 'string' ? formData.endTime : format(formData.endTime, 'HH:mm'),
          department: formData.department,
          role: formData.role,
          notes: formData.notes,
          status: formData.status,
          shiftType: formData.shiftType,
          payType: formData.payType,
          payRate: formData.payRate,
        }
        if (onSave) {
          onSave(shiftData)
        }
      }
    }
    return () => {
      delete (window as any).shiftFormSubmit
    }
  }, [formData, mode, onSave])

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <form onSubmit={(e) => {
        e.preventDefault()
        if ((window as any).shiftFormSubmit) {
          (window as any).shiftFormSubmit()
        }
      }}>
        <Box sx={{ width: '100%' }}>
          <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Employee</InputLabel>
              <Select
                value={formData.employeeId}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                label="Employee"
                disabled={isReadOnly}
              >
                <MenuItem value="">
                  <em>Select an employee</em>
                </MenuItem>
                {employees?.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} - {employee.department || 'No Department'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Date"
              value={formData.date}
              onChange={(date) => handleChange('date', date || new Date())}
              disabled={isReadOnly}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TimePicker
              label="Start Time"
              value={formData.startTime}
              onChange={(time) => handleChange('startTime', time || new Date())}
              disabled={isReadOnly}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TimePicker
              label="End Time"
              value={formData.endTime}
              onChange={(time) => handleChange('endTime', time || new Date())}
              disabled={isReadOnly}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Department"
              value={formData.department}
              disabled
              helperText="Auto-filled from employee information"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Role"
              value={formData.role}
              disabled
              helperText="Auto-filled from employee information"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Shift Type</InputLabel>
              <Select
                value={formData.shiftType}
                onChange={(e) => handleChange('shiftType', e.target.value)}
                label="Shift Type"
                disabled={isReadOnly}
              >
                <MenuItem value="regular">Regular</MenuItem>
                <MenuItem value="holiday">Holiday</MenuItem>
                <MenuItem value="off">Off</MenuItem>
                <MenuItem value="training">Training</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
                disabled={isReadOnly}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              multiline
              rows={3}
              disabled={isReadOnly}
              placeholder="Add any notes about this shift..."
            />
          </Grid>
          </Grid>
        </Box>
      </form>
    </LocalizationProvider>
    )
  }

export default ShiftForm
