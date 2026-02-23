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
  Chip,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Autocomplete,
} from '@mui/material'
import {
  Work as WorkIcon,
  Group as GroupIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'
import FormSection from '../../reusable/FormSection'
import { useHR } from '../../../../backend/context/HRContext'
import type { Role } from '../../../../backend/interfaces/HRs'

interface RoleCRUDFormProps {
  role?: Role | null
  mode: 'create' | 'edit' | 'view'
  onSave: (data: any) => void
}

const RoleCRUDForm: React.FC<RoleCRUDFormProps> = ({
  role,
  mode,
  onSave
}) => {
  const { state: hrState } = useHR()

  const [formData, setFormData] = useState({
    name: '',
    label: '',
    description: '',
    departmentId: '',
    department: '',
    permissions: [] as string[],
    isActive: true,
    level: 1,
    hourlyRate: 0,
    salaryRange: {
      min: 0,
      max: 0
    },
  })

  // Available permissions (this could be moved to a config file)
  const availablePermissions = [
    'read:employees',
    'write:employees',
    'delete:employees',
    'read:departments',
    'write:departments',
    'delete:departments',
    'read:payroll',
    'write:payroll',
    'read:reports',
    'write:reports',
    'manage:roles',
    'manage:permissions',
    'view:analytics',
    'manage:settings',
  ]

  // Update form data when role prop changes
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        label: role.label || '',
        description: role.description || '',
        departmentId: role.departmentId || '',
        department: role.department || '',
        permissions: role.permissions || [],
        isActive: role.isActive !== false,
        level: (role as any).level || 1,
        hourlyRate: (role as any).hourlyRate || 0,
        salaryRange: (role as any).salaryRange || { min: 0, max: 0 },
      })
    }
  }, [role])

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any || {}),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handlePermissionChange = (permissions: string[]) => {
    handleChange('permissions', permissions)
  }

  const handleSubmit = () => {
    const submissionData = {
      ...formData,
      createdAt: role?.createdAt || Date.now(),
      updatedAt: Date.now(),
    }
    onSave(submissionData)
  }

  const isReadOnly = mode === 'view'

  // Get employees with this role
  const roleEmployees = hrState.employees?.filter(emp => 
    emp.roleId === role?.id || emp.role === role?.name
  ) || []

  // Get department details
  const department = hrState.departments?.find(dept => 
    dept.id === formData.departmentId || dept.name === formData.department
  )

  return (
    <Box sx={{ width: '100%' }}>
      <FormSection 
        title="Basic Information" 
        icon={<WorkIcon />}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Role Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              disabled={isReadOnly}
              placeholder="e.g., Chef, Server, Manager"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Display Label"
              value={formData.label}
              onChange={(e) => handleChange('label', e.target.value)}
              disabled={isReadOnly}
              placeholder="User-friendly display name"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={isReadOnly}>
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.departmentId}
                onChange={(e) => {
                  const selectedDept = hrState.departments?.find(d => d.id === e.target.value)
                  handleChange('departmentId', e.target.value)
                  handleChange('department', selectedDept?.name || '')
                }}
                label="Department"
              >
                <MenuItem value="">
                  <em>No Department</em>
                </MenuItem>
                {hrState.departments?.map((department) => (
                  <MenuItem key={department.id} value={department.id}>
                    {department.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Role Level"
              type="number"
              value={formData.level}
              onChange={(e) => handleChange('level', Number(e.target.value))}
              disabled={isReadOnly}
              InputProps={{
                inputProps: { min: 1, max: 10 }
              }}
              helperText="1 = Entry level, 10 = Executive level"
            />
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
              placeholder="Describe the role's responsibilities and requirements..."
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  disabled={isReadOnly}
                />
              }
              label="Active Role"
            />
          </Grid>
        </Grid>
      </FormSection>

      <FormSection 
        title="Compensation Guidelines" 
        icon={<SecurityIcon />}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Suggested Hourly Rate"
              type="number"
              value={formData.hourlyRate}
              onChange={(e) => handleChange('hourlyRate', Number(e.target.value))}
              disabled={isReadOnly}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>£</Typography>,
                inputProps: { min: 0, step: 0.01 }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Salary Range Min"
              type="number"
              value={formData.salaryRange.min}
              onChange={(e) => handleChange('salaryRange.min', Number(e.target.value))}
              disabled={isReadOnly}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>£</Typography>,
                inputProps: { min: 0 }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Salary Range Max"
              type="number"
              value={formData.salaryRange.max}
              onChange={(e) => handleChange('salaryRange.max', Number(e.target.value))}
              disabled={isReadOnly}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>£</Typography>,
                inputProps: { min: 0 }
              }}
            />
          </Grid>
        </Grid>
      </FormSection>

      <FormSection 
        title="Permissions & Access" 
        icon={<SecurityIcon />}
      >
        <Autocomplete
          multiple
          options={availablePermissions}
          value={formData.permissions}
          onChange={(_, newValue) => handlePermissionChange(newValue)}
          disabled={isReadOnly}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option.replace(/[_:]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {...getTagProps({ index })}
                key={option}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Permissions"
              placeholder="Select permissions for this role"
              helperText="Choose the permissions that employees with this role should have"
            />
          )}
          getOptionLabel={(option) => 
            option.replace(/[_:]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          }
        />
      </FormSection>

      {department && (
        <FormSection 
          title="Department Information" 
          icon={<GroupIcon />}
        >
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>
              {department.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {department.description || 'No description available'}
            </Typography>
            {department.managerId && (
              <Typography variant="body2">
                <strong>Manager:</strong> {
                  hrState.employees?.find(emp => emp.id === department.managerId)?.firstName
                } {
                  hrState.employees?.find(emp => emp.id === department.managerId)?.lastName
                }
              </Typography>
            )}
          </Paper>
        </FormSection>
      )}

      {mode !== 'create' && roleEmployees.length > 0 && (
        <FormSection 
          title={`Employees with this Role (${roleEmployees.length})`}
          icon={<GroupIcon />}
        >
          <List>
            {roleEmployees.map((employee) => (
              <ListItem key={employee.id} divider>
                <ListItemAvatar>
                  <Avatar
                    src={employee.photo}
                    sx={{ width: 40, height: 40 }}
                  >
                    {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${employee.firstName} ${employee.lastName}`}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {employee.email}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                          size="small"
                          label={employee.status || 'active'}
                          color={
                            employee.status === 'active' ? 'success' :
                            employee.status === 'on_leave' ? 'warning' :
                            employee.status === 'terminated' ? 'error' : 'default'
                          }
                        />
                        <Chip
                          size="small"
                          label={employee.employmentType || 'full_time'}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
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
            {mode === 'edit' ? 'Update Role' : 'Create Role'}
          </button>
        </Box>
      )}
    </Box>
  )
}

export default RoleCRUDForm
