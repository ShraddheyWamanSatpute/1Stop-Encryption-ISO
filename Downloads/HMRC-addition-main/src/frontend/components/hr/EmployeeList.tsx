"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Menu,
  ListItemText,
  Checkbox,
  TablePagination,
  Avatar,
  OutlinedInput
} from "@mui/material"
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Person as PersonIcon,
  Add as AddIcon
} from "@mui/icons-material"
import { useHR } from "../../../backend/context/HRContext"
import { useCompany } from "../../../backend/context/CompanyContext"
import { useSettings } from "../../../backend/context/SettingsContext"
import type { Employee } from "../../../backend/interfaces/HRs"
import EmployeeForm from "./EmployeeForm"
import ViewEmployee from "./ViewEmployee"
import CRUDModal from "../reusable/CRUDModal"
import EmployeeCRUDForm, { EmployeeCRUDFormRef } from "./forms/EmployeeCRUDForm"
import DataHeader from "../reusable/DataHeader"
import { createSampleEmployees } from "../../utils/testEmployeeCreation"

interface ColumnConfig {
  id: string
  label: string
  minWidth?: number
  align?: "left" | "right" | "center"
  format?: (value: any, employee: Employee) => string | React.ReactNode
}

const EMPLOYEE_COLUMNS: ColumnConfig[] = [
  { id: "photo", label: "Photo", minWidth: 80, align: "center" },
  { id: "name", label: "Name", minWidth: 200 },
  { id: "email", label: "Email", minWidth: 200 },
  { id: "phone", label: "Phone", minWidth: 150 },
  { id: "role", label: "Role", minWidth: 150 },
  { id: "department", label: "Department", minWidth: 150 },
  { id: "status", label: "Status", minWidth: 120, align: "center" },
  { id: "employmentType", label: "Employment Type", minWidth: 150 },
  { id: "hireDate", label: "Hire Date", minWidth: 120 },
  { id: "salary", label: "Salary", minWidth: 120, align: "right" },
  { id: "hourlyRate", label: "Hourly Rate", minWidth: 120, align: "right" },
  { id: "payType", label: "Pay Type", minWidth: 120 },
  { id: "manager", label: "Manager", minWidth: 150 },
  { id: "address", label: "Address", minWidth: 200 },
  { id: "city", label: "City", minWidth: 120 },
  { id: "state", label: "State", minWidth: 100 },
  { id: "country", label: "Country", minWidth: 120 },
  { id: "dateOfBirth", label: "Date of Birth", minWidth: 120 },
  { id: "nationalInsuranceNumber", label: "NI Number", minWidth: 150 },
  { id: "emergencyContact", label: "Emergency Contact", minWidth: 200 },
  { id: "holidaysPerYear", label: "Holidays/Year", minWidth: 120, align: "right" },
  { id: "hoursPerWeek", label: "Hours/Week", minWidth: 120, align: "right" },
  { id: "actions", label: "Actions", minWidth: 120, align: "center" }
]

const DEFAULT_VISIBLE_COLUMNS = [
  "photo", "name", "email", "phone", "role", "department", "status", "hireDate", "actions"
]

const EmployeeList: React.FC = () => {
  const {
    state: hrState,
    refreshEmployees,
    refreshRoles,
    refreshDepartments,
    addEmployee,
    updateEmployee,
    deleteEmployee
  } = useHR()
  const { state: companyState } = useCompany()
  const { state: settingsState } = useSettings()

  // State hooks
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string[]>([])
  const [filterDepartment, setFilterDepartment] = useState<string[]>([])
  const [filterEmploymentType, setFilterEmploymentType] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const [viewEmployeeOpen, setViewEmployeeOpen] = useState(false)
  const [selectedEmployeeForView, setSelectedEmployeeForView] = useState<Employee | null>(null)
  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: "success" | "error" | "warning" | "info"
  }>({
    open: false,
    message: "",
    severity: "info"
  })
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null)
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null)
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null)
  const [actionMenuEmployee] = useState<Employee | null>(null) // Removed setActionMenuEmployee as it's not used
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add")

  // Filter states for DataHeader
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  // Column configuration for DataHeader
  const columns = EMPLOYEE_COLUMNS
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    Object.fromEntries(EMPLOYEE_COLUMNS.map(col => [col.id, DEFAULT_VISIBLE_COLUMNS.includes(col.id)]))
  )

  // Sync columnVisibility with visibleColumns
  useEffect(() => {
    const newVisibility: Record<string, boolean> = {}
    EMPLOYEE_COLUMNS.forEach(col => {
      newVisibility[col.id] = visibleColumns.includes(col.id)
    })
    setColumnVisibility(newVisibility)
  }, [visibleColumns])

  // Sync visibleColumns with columnVisibility changes from DataHeader
  const handleColumnVisibilityChange = useCallback((visibility: Record<string, boolean>) => {
    setColumnVisibility(visibility)
    const newVisibleColumns = Object.entries(visibility)
      .filter(([_, isVisible]) => isVisible)
      .map(([key, _]) => key)
    setVisibleColumns(newVisibleColumns)
  }, [])

  // Sync filter states with DataHeader filters
  useEffect(() => {
    setFilterDepartment(selectedDepartments)
  }, [selectedDepartments])

  useEffect(() => {
    setFilterRole(selectedRoles)
  }, [selectedRoles])

  useEffect(() => {
    setFilterStatus(selectedStatuses)
  }, [selectedStatuses])

  // New CRUD Modal state
  const [employeeCRUDModalOpen, setEmployeeCRUDModalOpen] = useState(false)
  const [selectedEmployeeForCRUD, setSelectedEmployeeForCRUD] = useState<Employee | null>(null)
  const [crudMode, setCrudMode] = useState<'create' | 'edit' | 'view'>('create')
  const employeeFormRef = useRef<EmployeeCRUDFormRef>(null)

  // Test function to create sample employees
  const handleCreateSampleEmployees = useCallback(async () => {
    try {
      console.log("🧪 Creating sample employees...")
      const result = await createSampleEmployees(addEmployee)
      
      if (result.success) {
        setNotification({
          open: true,
          message: `Successfully created ${result.created} sample employees!`,
          severity: "success"
        })
      } else {
        setNotification({
          open: true,
          message: `Created ${result.created} employees with ${result.errors.length} errors. Check console for details.`,
          severity: "warning"
        })
      }
    } catch (error) {
      console.error("Failed to create sample employees:", error)
      setNotification({
        open: true,
        message: "Failed to create sample employees. Check console for details.",
        severity: "error"
      })
    }
  }, [addEmployee])


  // Load data on component mount
  // Note: Data is now loaded automatically by HRContext with progressive loading and caching
  // No need to manually refresh - context handles all data loading efficiently
  // Only refresh if explicitly needed (e.g., after creating/updating data)
  useEffect(() => {
    // Data is available from context automatically
    // Safely handle undefined values
    if (hrState && hrState.employees && hrState.roles && hrState.departments) {
      console.log("✅ EmployeeList - Data available from HRContext:", {
        employees: hrState.employees.length || 0,
        roles: hrState.roles.length || 0,
        departments: hrState.departments.length || 0
      })
    }
  }, [hrState?.employees?.length, hrState?.roles?.length, hrState?.departments?.length])

  // Note: Roles are loaded automatically by HRContext with progressive loading
  // No need to manually refresh - context handles all data loading efficiently

  // Filtered and sorted employees
  const filteredEmployees = useMemo(() => {
    // Safely handle undefined hrState or employees
    if (!hrState || !hrState.employees || !Array.isArray(hrState.employees)) {
      console.log("❌ EmployeeList - No employees in hrState or hrState is undefined")
      return []
    }
    
    console.log("🔍 EmployeeList - Filtering employees:", {
      hrStateEmployees: hrState.employees.length || 0,
      isLoading: hrState.isLoading,
      error: hrState.error,
      searchQuery,
      filters: {
        role: filterRole.length,
        status: filterStatus.length,
        department: filterDepartment.length,
        employmentType: filterEmploymentType.length
      }
    })
    
    const filtered = hrState.employees.filter((employee) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery || 
        employee.firstName?.toLowerCase().includes(searchLower) ||
        employee.lastName?.toLowerCase().includes(searchLower) ||
        employee.email?.toLowerCase().includes(searchLower) ||
        employee.phone?.includes(searchQuery) ||
        employee.position?.toLowerCase().includes(searchLower)
      
      // Role filter - check multiple possible field names (roleID, roleId, role)
      const employeeRoleId = (employee as any).roleID || employee.roleId || employee.role
      const matchesRole = filterRole.length === 0 || 
        (employeeRoleId && filterRole.includes(employeeRoleId))
      
      // Status filter - be more lenient, include employees without status if no filter applied
      // Default to "active" if status is missing and isActive is true
      const employeeStatus = employee.status || ((employee as any).isActive === true ? "active" : undefined)
      const matchesStatus = filterStatus.length === 0 || 
        (employeeStatus && filterStatus.includes(employeeStatus))
      
      // Department filter - use departmentId (the ID field) for matching
      // The filter values are department IDs from the dropdown
      const employeeDepartmentId = employee.departmentId || (employee as any).departmentID || (employee as any).departmentId
      const matchesDepartment = filterDepartment.length === 0 || 
        (employeeDepartmentId && filterDepartment.includes(employeeDepartmentId))
      
      // Employment type filter
      const matchesEmploymentType = filterEmploymentType.length === 0 || 
        (employee.employmentType && filterEmploymentType.includes(employee.employmentType))
      
      const matches = matchesSearch && matchesRole && matchesStatus && matchesDepartment && matchesEmploymentType
      
      return matches
    })
    
    console.log(`✅ EmployeeList - Filtered ${filtered.length} of ${hrState.employees.length} employees`, {
      activeFilters: {
        search: searchQuery || "none",
        role: filterRole.length > 0 ? filterRole : "none",
        status: filterStatus.length > 0 ? filterStatus : "none",
        department: filterDepartment.length > 0 ? filterDepartment : "none",
        employmentType: filterEmploymentType.length > 0 ? filterEmploymentType : "none"
      }
    })
    
    return filtered.sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortBy) {
        case "name":
          aValue = `${a.firstName || ""} ${a.lastName || ""}`
          bValue = `${b.firstName || ""} ${b.lastName || ""}`
          break
        case "hireDate":
          aValue = new Date(a.hireDate || 0)
          bValue = new Date(b.hireDate || 0)
          break
        case "salary":
          aValue = a.salary || 0
          bValue = b.salary || 0
          break
        case "hourlyRate":
          aValue = a.hourlyRate || 0
          bValue = b.hourlyRate || 0
          break
        default:
          aValue = a[sortBy as keyof Employee] || ""
          bValue = b[sortBy as keyof Employee] || ""
      }
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [hrState.employees, searchQuery, filterRole, filterStatus, filterDepartment, filterEmploymentType, sortBy, sortOrder])

  // Paginated employees
  const paginatedEmployees = useMemo(() => {
    const startIndex = page * rowsPerPage
    return filteredEmployees.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredEmployees, page, rowsPerPage])

  // Get role name by ID (for filters)
  const getRoleNameById = useCallback((roleId?: string) => {
    if (!roleId || !hrState || !hrState.roles || !Array.isArray(hrState.roles)) return "N/A"
    const role = hrState.roles.find(r => r.id === roleId)
    return role?.label || role?.name || roleId
  }, [hrState.roles])

  // Get role name from employee object
  const getRoleName = useCallback((employee?: Employee) => {
    if (!hrState || !hrState.roles || !Array.isArray(hrState.roles)) {
      console.log("getRoleName: No roles data", { rolesCount: 0 })
      return "N/A"
    }
    
    if (!employee) {
      return "N/A"
    }
    
    // Get roleID from employee (note: backend uses roleID with capital ID)
    const roleId = (employee as any).roleID || employee.roleId
    
    if (!roleId) {
      console.log("getRoleName: No roleID found", { 
        employee: {
          id: employee.id,
          roleId: employee.roleId,
          roleID: (employee as any).roleID,
          role: employee.role,
          position: employee.position
        },
        rolesCount: hrState.roles?.length 
      })
      return "N/A"
    }
    
    // Try to find role by ID
    const role = hrState.roles.find(r => r.id === roleId)
    if (role) {
      const roleName = role.label || role.name || roleId
      console.log("getRoleName: Found role", { roleId, role, roleName })
      return roleName
    }
    
    // If not found by ID, try to find by name (in case roleId is actually a name)
    const roleByName = hrState.roles.find(r => 
      r.name === roleId || r.label === roleId
    )
    if (roleByName) {
      const roleName = roleByName.label || roleByName.name || roleId
      console.log("getRoleName: Found role by name", { roleId, roleByName, roleName })
      return roleName
    }
    
    console.log("getRoleName: Role not found", { roleId, availableRoles: hrState.roles?.map(r => ({ id: r.id, name: r.name, label: r.label })) || [] })
    return roleId || "Unknown Role"
  }, [hrState.roles])

  // Get department name (handles both ID and name)
  const getDepartmentName = useCallback((departmentValue?: string) => {
    if (!departmentValue || !hrState || !hrState.departments || !Array.isArray(hrState.departments)) return "N/A"
    
    // If departments are loaded, try to find by ID first
    if (hrState.departments.length > 0) {
      const departmentById = hrState.departments.find(d => d.id === departmentValue)
      if (departmentById) {
        return departmentById.name
      }
      
      // If not found by ID, check if it's already a department name
      const departmentByName = hrState.departments.find(d => d.name === departmentValue)
      if (departmentByName) {
        return departmentValue // Return the name as-is
      }
    }
    
    // If no departments loaded or not found, assume it's already a name
    return departmentValue
  }, [hrState.departments])

  // Format date
  const formatDate = useCallback((timestamp?: number) => {
    if (!timestamp) return "N/A"
    return new Date(timestamp).toLocaleDateString()
  }, [])

  // Format currency
  const formatCurrency = useCallback((amount?: number) => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }, [])

  // Convert text to title case (First Letter Capital, rest lowercase)
  const toTitleCase = useCallback((text: string) => {
    return text
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }, [])

  // Handle saving employee (add or edit)
  const handleSaveEmployee = useCallback(async (employeeData: Omit<Employee, "id">) => {
    try {
      if (dialogMode === "add") {
        await addEmployee(employeeData)
        setNotification({
          open: true,
          message: "Employee added successfully!",
          severity: "success"
        })
      } else if (dialogMode === "edit" && selectedEmployee) {
        await updateEmployee(selectedEmployee.id, employeeData)
        setNotification({
          open: true,
          message: "Employee updated successfully!",
          severity: "success"
        })
      }
      setIsDialogOpen(false)
      setSelectedEmployee(null)
      refreshEmployees() // Refresh the employee list
    } catch (error) {
      console.error("Error saving employee:", error)
      setNotification({
        open: true,
        message: `Failed to ${dialogMode === "add" ? "add" : "update"} employee. Please try again.`,
        severity: "error"
      })
    }
  }, [dialogMode, selectedEmployee, addEmployee, updateEmployee, refreshEmployees])

  // New CRUD Modal handlers
  const handleOpenEmployeeCRUD = useCallback((employee: Employee | null = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedEmployeeForCRUD(employee)
    setCrudMode(mode)
    setEmployeeCRUDModalOpen(true)
  }, [])

  const handleCloseEmployeeCRUD = useCallback(() => {
    setEmployeeCRUDModalOpen(false)
    setSelectedEmployeeForCRUD(null)
    setCrudMode('create')
  }, [])

  const handleViewEmployee = useCallback((employee: Employee) => {
    setSelectedEmployeeForView(employee)
    setViewEmployeeOpen(true)
  }, [])

  const handleEditEmployee = useCallback((employee: Employee) => {
    handleOpenEmployeeCRUD(employee, 'edit')
  }, [handleOpenEmployeeCRUD])

  const handleDeleteClick = useCallback((employee: Employee) => {
    setEmployeeToDelete(employee)
    setDeleteConfirmOpen(true)
  }, [])

  const handleSaveEmployeeCRUD = useCallback(async (employeeData: any) => {
    try {
      if (crudMode === 'create') {
        await addEmployee(employeeData)
        setNotification({
          open: true,
          message: "Employee created successfully!",
          severity: "success"
        })
      } else if (crudMode === 'edit' && selectedEmployeeForCRUD) {
        await updateEmployee(selectedEmployeeForCRUD.id, employeeData)
        setNotification({
          open: true,
          message: "Employee updated successfully!",
          severity: "success"
        })
      }
      handleCloseEmployeeCRUD()
      refreshEmployees()
    } catch (error) {
      console.error("Error saving employee:", error)
      setNotification({
        open: true,
        message: `Failed to ${crudMode === 'create' ? 'create' : 'update'} employee. Please try again.`,
        severity: "error"
      })
    }
  }, [crudMode, selectedEmployeeForCRUD, addEmployee, updateEmployee, refreshEmployees, handleCloseEmployeeCRUD])

  // Filter roles based on selected departments - MUST be before early returns
  const filteredRoles = useMemo(() => {
    if (!hrState.roles || hrState.roles.length === 0) return []
    
    // If no departments are selected, show all roles
    if (selectedDepartments.length === 0) {
      return hrState.roles
    }
    
    // Otherwise, only show roles that belong to selected departments
    const filtered = hrState.roles.filter(role => {
      // Check both departmentId (primary) and department (fallback) fields
      const roleDeptId = role.departmentId || (role as any).departmentID || (role as any).department
      return roleDeptId && selectedDepartments.includes(roleDeptId)
    })
    
    console.log("🔍 EmployeeList - Filtered roles:", {
      totalRoles: hrState.roles.length,
      selectedDepartments,
      filteredCount: filtered.length,
      roles: filtered.map(r => ({ id: r.id, name: r.label || r.name, departmentId: r.departmentId }))
    })
    
    return filtered
  }, [hrState.roles, selectedDepartments])

  // Clear selected roles that are no longer valid when departments change - MUST be before early returns
  useEffect(() => {
    if (selectedDepartments.length > 0 && selectedRoles.length > 0 && hrState.roles) {
      const validRoles = selectedRoles.filter(roleId => {
        const role = hrState.roles?.find(r => r.id === roleId)
        if (!role) return false
        // Check both departmentId (primary) and department (fallback) fields
        const roleDeptId = role.departmentId || (role as any).departmentID || (role as any).department
        return roleDeptId && selectedDepartments.includes(roleDeptId)
      })
      
      if (validRoles.length !== selectedRoles.length) {
        console.log("🔍 EmployeeList - Clearing invalid roles:", {
          before: selectedRoles.length,
          after: validRoles.length,
          cleared: selectedRoles.filter(id => !validRoles.includes(id))
        })
        setSelectedRoles(validRoles)
      }
    } else if (selectedDepartments.length === 0 && selectedRoles.length > 0) {
      // If no departments selected, keep all selected roles
      // (no need to clear them)
    }
  }, [selectedDepartments, hrState.roles, selectedRoles])

  const visibleColumnConfigs = EMPLOYEE_COLUMNS.filter(col => visibleColumns.includes(col.id))

  console.log("🔍 EmployeeList - Render state:", {
    isLoading: hrState.isLoading,
    error: hrState.error,
    employeesCount: hrState.employees?.length || 0,
    filteredCount: filteredEmployees.length,
    paginatedCount: paginatedEmployees.length
  })

  if (hrState.isLoading) {
    console.log("🔄 EmployeeList - Showing loading state")
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (hrState.error && hrState.error.includes("employee")) {
    console.log("❌ EmployeeList - Showing error state:", hrState.error)
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          Error loading employee data: {hrState.error}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* Reusable Data Header */}
      <DataHeader
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search employees..."
        showDateControls={false}
        filters={[
          {
            label: "Department",
            options: (hrState.departments || []).map(dept => ({ id: dept.id, name: dept.name })),
            selectedValues: selectedDepartments.map(id => {
              const dept = hrState.departments?.find(d => d.id === id)
              return dept?.name || id
            }),
            onSelectionChange: (names) => {
              const ids = names.map(name => {
                const dept = hrState.departments?.find(d => d.name === name)
                return dept?.id || name
              })
              setSelectedDepartments(ids)
            }
          },
          {
            label: "Role", 
            options: filteredRoles.map(role => ({ id: role.id, name: role.label || role.name })),
            selectedValues: selectedRoles
              .map(id => {
                // Only include roles that are in the filtered list
                const role = filteredRoles.find(r => r.id === id)
                return role ? (role.label || role.name) : null
              })
              .filter((name): name is string => name !== null),
            onSelectionChange: (names) => {
              // Only allow selection of roles that are in filteredRoles
              const ids = names
                .map(name => {
                  const role = filteredRoles.find(r => (r.label || r.name) === name)
                  return role?.id || null
                })
                .filter((id): id is string => id !== null)
              setSelectedRoles(ids)
            }
          },
          {
            label: "Status",
            options: [
              { id: "active", name: "Active" },
              { id: "inactive", name: "Inactive" },
              { id: "terminated", name: "Terminated" },
              { id: "on_leave", name: "On Leave" }
            ],
            selectedValues: selectedStatuses.map(id => {
              const statusMap: Record<string, string> = {
                "active": "Active",
                "inactive": "Inactive",
                "terminated": "Terminated",
                "on_leave": "On Leave"
              }
              return statusMap[id] || id
            }),
            onSelectionChange: (names) => {
              const statusMap: Record<string, string> = {
                "Active": "active",
                "Inactive": "inactive",
                "Terminated": "terminated",
                "On Leave": "on_leave"
              }
              const ids = names.map(name => statusMap[name] || name.toLowerCase())
              setSelectedStatuses(ids)
            }
          }
        ]}
        filtersExpanded={filtersExpanded}
        onFiltersToggle={() => setFiltersExpanded(!filtersExpanded)}
        columns={columns.map(col => ({ key: col.id, label: col.label }))}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        sortOptions={[
          { value: "name", label: "Name" },
          { value: "department", label: "Department" },
          { value: "role", label: "Role" },
          { value: "hireDate", label: "Hire Date" },
          { value: "status", label: "Status" }
        ]}
        sortValue={sortBy}
        sortDirection={sortOrder}
        onSortChange={(value, direction) => {
          setSortBy(value)
          setSortOrder(direction)
        }}
        onExportCSV={() => {
          try {
            // Create CSV content
            const headers = visibleColumnConfigs.map(col => col.label)
            const rows = filteredEmployees.map(employee => {
              return visibleColumnConfigs.map(col => {
                let value: any
                switch (col.id) {
                  case "photo":
                    return ""
                  case "name":
                    return `${employee.firstName || ""} ${employee.lastName || ""}`.trim()
                  case "role":
                    return getRoleName(employee)
                  case "department":
                    return getDepartmentName(employee.department)
                  case "status":
                    return toTitleCase(employee.status || "")
                  case "hireDate":
                  case "dateOfBirth":
                    return formatDate(employee[col.id as keyof Employee] as number)
                  case "salary":
                  case "hourlyRate":
                    return formatCurrency(employee[col.id as keyof Employee] as number).replace(/[£,]/g, "")
                  case "emergencyContact":
                    return employee.emergencyContact ? 
                      `${employee.emergencyContact.name} (${employee.emergencyContact.relationship})` : ""
                  case "address":
                    const addr = employee.address as any
                    return addr?.street ? `${addr.street}, ${addr.city || ''}`.trim() : ""
                  case "actions":
                    return ""
                  default:
                    value = employee[col.id as keyof Employee]
                    if (typeof value === "string" || typeof value === "number") {
                      return String(value || "")
                    }
                    return ""
                }
              })
            })

            // Convert to CSV string
            const csvContent = [
              headers.join(","),
              ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            ].join("\n")

            // Create blob and download
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            const link = document.createElement("a")
            const url = URL.createObjectURL(blob)
            link.setAttribute("href", url)
            link.setAttribute("download", `employees_${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = "hidden"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            setNotification({ 
              open: true, 
              message: `Exported ${filteredEmployees.length} employees to CSV`, 
              severity: "success" 
            })
          } catch (error) {
            console.error("Export error:", error)
            setNotification({ 
              open: true, 
              message: "Failed to export CSV. Please try again.", 
              severity: "error" 
            })
          }
        }}
        onRefresh={async () => {
          // Only refresh if explicitly requested by user
          await refreshEmployees()
          await refreshRoles()
          await refreshDepartments()
        }}
        onCreateNew={() => handleOpenEmployeeCRUD(null, 'create')}
        createButtonLabel="Add Employee"
        additionalButtons={
          hrState.employees?.length === 0 ? [
            {
              label: "Create Sample Employees",
              icon: <AddIcon />,
              onClick: () => { handleCreateSampleEmployees(); },
              color: "secondary" as const,
              variant: "outlined" as const
            }
          ] : undefined
        }
      />


      {/* Employee Table */}
      <Paper sx={{ width: "100%", overflow: "hidden", display: "flex", flexDirection: "column", height: "calc(100vh - 300px)", minHeight: 400 }}>
        <TableContainer sx={{ flex: 1, overflow: "auto" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {visibleColumnConfigs.map((column) => (
                  <TableCell
                    key={column.id}
                    align="center"
                    style={{ minWidth: column.minWidth }}
                    sx={{ 
                      textAlign: 'center !important',
                      padding: '16px 16px',
                      cursor: column.id !== "actions" && column.id !== "photo" ? "pointer" : "default",
                      userSelect: 'none',
                      '&:hover': {
                        backgroundColor: column.id !== "actions" && column.id !== "photo" ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                      }
                    }}
                    onClick={() => {
                      if (column.id !== "actions" && column.id !== "photo") {
                        if (sortBy === column.id) {
                          setSortOrder(prev => prev === "asc" ? "desc" : "asc")
                        } else {
                          setSortBy(column.id)
                          setSortOrder("asc")
                        }
                      }
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: 0.5
                    }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {column.label}
                      </Typography>
                      {sortBy === column.id && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEmployees.map((employee) => (
                <TableRow 
                  hover 
                  key={employee.id}
                  onClick={() => handleViewEmployee(employee)}
                  sx={{ 
                    cursor: "pointer",
                    '& > td': {
                      paddingTop: 1,
                      paddingBottom: 1,
                    }
                  }}
                >
                  {visibleColumnConfigs.map((column) => (
                    <TableCell key={column.id} align="center" sx={{ verticalAlign: 'middle' }}>
                      {(() => {
                        switch (column.id) {
                          case "photo":
                            return (
                              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Avatar
                                  src={employee.photo}
                                  sx={{ width: 40, height: 40 }}
                                >
                                  <PersonIcon />
                                </Avatar>
                              </Box>
                            )
                          case "name":
                            return `${employee.firstName || ""} ${employee.lastName || ""}`
                          case "role":
                            return getRoleName(employee)
                          case "department":
                            return getDepartmentName(employee.department)
                          case "status":
                            const statusColors = {
                              active: "success",
                              inactive: "default",
                              on_leave: "warning",
                              terminated: "error"
                            } as const
                            return (
                              <Chip
                                label={toTitleCase(employee.status || "")}
                                color={statusColors[employee.status as keyof typeof statusColors] || "default"}
                                size="small"
                              />
                            )
                          case "hireDate":
                          case "dateOfBirth":
                            return formatDate(employee[column.id as keyof Employee] as number)
                          case "salary":
                          case "hourlyRate":
                            return formatCurrency(employee[column.id as keyof Employee] as number)
                          case "emergencyContact":
                            return employee.emergencyContact ? 
                              `${employee.emergencyContact.name} (${employee.emergencyContact.relationship})` : "N/A"
                          case "actions":
                            return (
                              <Box display="flex" gap={1} justifyContent="center">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditEmployee(employee)
                                  }}
                                  title="Edit"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteClick(employee)
                                  }}
                                  title="Delete"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            )
                          default:
                            const value = employee[column.id as keyof Employee]
                            // Handle address object
                            if (column.id === "address" && value && typeof value === "object") {
                              const addr = value as any
                              return addr.street ? `${addr.street}, ${addr.city || ''}`.trim() : "N/A"
                            }
                            if (typeof value === "string" || typeof value === "number") {
                              return value || "N/A"
                            }
                            return "N/A"
                        }
                      })()}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {paginatedEmployees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={visibleColumnConfigs.length} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No employees found matching your criteria
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination - Fixed at bottom */}
        <Box sx={{ flexShrink: 0, borderTop: 1, borderColor: "divider" }}>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredEmployees.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10))
              setPage(0)
            }}
          />
        </Box>
      </Paper>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ open: false, message: "", severity: "info" })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification({ open: false, message: "", severity: "info" })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
        PaperProps={{ sx: { width: 300, maxHeight: 400 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
            Filter Options
          </Typography>
          
          {/* Role Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Roles</InputLabel>
            <Select
              multiple
              value={filterRole}
              onChange={(e) => setFilterRole(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Roles" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={getRoleNameById(value)} size="small" />
                  ))}
                </Box>
              )}
            >
              {hrState.roles?.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  <Checkbox checked={filterRole.indexOf(role.id) > -1} />
                  <ListItemText primary={role.label || role.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Status Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              multiple
              value={filterStatus}
              onChange={(e) => setFilterStatus(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Status" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={toTitleCase(value)} size="small" />
                  ))}
                </Box>
              )}
            >
              {["active", "inactive", "on_leave", "terminated"].map((status) => (
                <MenuItem key={status} value={status}>
                  <Checkbox checked={filterStatus.indexOf(status) > -1} />
                  <ListItemText primary={toTitleCase(status)} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Department Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Departments</InputLabel>
            <Select
              multiple
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Departments" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={getDepartmentName(value)} size="small" />
                  ))}
                </Box>
              )}
            >
              {hrState.departments?.map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  <Checkbox checked={filterDepartment.indexOf(department.id) > -1} />
                  <ListItemText primary={department.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Employment Type Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Employment Type</InputLabel>
            <Select
              multiple
              value={filterEmploymentType}
              onChange={(e) => setFilterEmploymentType(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Employment Type" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={toTitleCase(value)} size="small" />
                  ))}
                </Box>
              )}
            >
              {["full_time", "part_time", "contract", "temporary"].map((type) => (
                <MenuItem key={type} value={type}>
                  <Checkbox checked={filterEmploymentType.indexOf(type) > -1} />
                  <ListItemText primary={toTitleCase(type)} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
              size="small"
              onClick={() => {
                setFilterRole([])
                setFilterStatus([])
                setFilterDepartment([])
                setFilterEmploymentType([])
              }}
            >
              Clear All
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => setFilterMenuAnchor(null)}
            >
              Apply
            </Button>
          </Box>
        </Box>
      </Menu>

      {/* Column Visibility Menu */}
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={() => setColumnMenuAnchor(null)}
        PaperProps={{ sx: { width: 250, maxHeight: 400 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
            Column Visibility
          </Typography>
          
          {EMPLOYEE_COLUMNS.map((column) => (
            <MenuItem
              key={column.id}
              onClick={() => {
                if (visibleColumns.includes(column.id)) {
                  setVisibleColumns(prev => prev.filter(id => id !== column.id))
                } else {
                  setVisibleColumns(prev => [...prev, column.id])
                }
              }}
            >
              <Checkbox checked={visibleColumns.includes(column.id)} />
              <ListItemText primary={column.label} />
            </MenuItem>
          ))}
          
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 2 }}>
            <Button
              size="small"
              onClick={() => setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)}
            >
              Reset Default
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => setColumnMenuAnchor(null)}
            >
              Done
            </Button>
          </Box>
        </Box>
      </Menu>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => setActionMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            if (actionMenuEmployee) {
              handleOpenEmployeeCRUD(actionMenuEmployee, 'view')
            }
            setActionMenuAnchor(null)
          }}
        >
          <PersonIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (actionMenuEmployee) {
              setDialogMode("edit")
              setSelectedEmployee(actionMenuEmployee)
              setIsDialogOpen(true)
            }
            setActionMenuAnchor(null)
          }}
        >
          <LinkIcon sx={{ mr: 1 }} />
          Invite Link
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (actionMenuEmployee) {
              handleOpenEmployeeCRUD(actionMenuEmployee, 'edit')
            }
            setActionMenuAnchor(null)
          }}
        >
          <EditIcon sx={{ mr: 1 }} />
          Edit Employee
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (actionMenuEmployee) {
              setEmployeeToDelete(actionMenuEmployee)
              setDeleteConfirmOpen(true)
            }
            setActionMenuAnchor(null)
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Employee
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete employee{" "}
            <strong>
              {employeeToDelete?.firstName} {employeeToDelete?.lastName}
            </strong>
            ? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (employeeToDelete) {
                try {
                  await deleteEmployee(employeeToDelete.id)
                  setNotification({ open: true, message: "Employee deleted successfully", severity: "success" })
                  setDeleteConfirmOpen(false)
                  setEmployeeToDelete(null)
                } catch (error) {
                  setNotification({ open: true, message: "Failed to delete employee", severity: "error" })
                }
              }
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ViewEmployee Dialog */}
      {selectedEmployeeForView && (
        <ViewEmployee
          employee={selectedEmployeeForView}
          open={viewEmployeeOpen}
          onClose={() => {
            setViewEmployeeOpen(false)
            setSelectedEmployeeForView(null)
          }}
          onEdit={(employee) => {
            setDialogMode("edit")
            setSelectedEmployee(employee)
            setIsDialogOpen(true)
            setViewEmployeeOpen(false)
          }}
        />
      )}

      {/* Employee Add/Edit Dialog */}
      <Dialog
        open={isDialogOpen && (dialogMode === "add" || dialogMode === "edit")}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: "90vh" }
        }}
      >
        {(dialogMode === "add" || dialogMode === "edit") && (
          <EmployeeForm
            mode={dialogMode}
            employee={selectedEmployee || undefined}
            roles={hrState.roles || []}
            onSave={handleSaveEmployee}
            onCancel={() => setIsDialogOpen(false)}
          />
        )}
      </Dialog>

      {/* New CRUD Modal */}
      <CRUDModal
        open={employeeCRUDModalOpen}
        onClose={handleCloseEmployeeCRUD}
        title={
          crudMode === 'create' ? 'Create Employee' : 
          crudMode === 'edit' ? 'Edit Employee' : 
          'View Employee'
        }
        mode={crudMode}
        maxWidth="lg"
        onSave={crudMode !== 'view' ? handleSaveEmployeeCRUD : undefined}
        formRef={employeeFormRef}
        cancelButtonText={crudMode === 'create' ? undefined : 'Cancel'}
      >
        <EmployeeCRUDForm
          ref={employeeFormRef}
          employee={selectedEmployeeForCRUD}
          mode={crudMode}
          onSave={handleSaveEmployeeCRUD}
        />
      </CRUDModal>
    </Box>
  )
}

export default EmployeeList
