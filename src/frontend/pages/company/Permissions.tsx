"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react"
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from "@mui/material"
import {
  Security as SecurityIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Person as PersonIcon,
} from "@mui/icons-material"
import { useCompany, CompanyPermissions, UserPermissions } from "../../../backend/context/CompanyContext"
import { useHR } from "../../../backend/context/HRContext"
import { DEFAULT_PERMISSIONS as BASE_DEFAULT_PERMISSIONS, COMPANY_PERMISSION_KEY_ALIASES } from "../../../backend/interfaces/Company"
import type { Role, Department } from "../../../backend/interfaces/HRs"
import DataHeader from "../../components/reusable/DataHeader"
const DEFAULT_PERMISSIONS: CompanyPermissions = BASE_DEFAULT_PERMISSIONS

type PermissionAction = "view" | "edit" | "delete"

type ModuleGroupDefinition = {
  key: string
  sourceKey: string
  title: string
  tabs: string[]
}

type ModuleDefinition = {
  label: string
  groups: ModuleGroupDefinition[]
}

const getPagePermissions = (
  moduleKey: string,
  modulePermissions: Record<string, Record<PermissionAction, boolean>> | undefined,
  sourceKey: string,
): Record<PermissionAction, boolean> | undefined => {
  if (!modulePermissions) return undefined
  const direct = modulePermissions[sourceKey]
  if (direct) return direct
  if (moduleKey === "company") {
    const legacyKey = COMPANY_PERMISSION_KEY_ALIASES[sourceKey]
    if (legacyKey) {
      return modulePermissions[legacyKey]
    }
  }
  return undefined
}

const setModulePagePermissions = (
  moduleKey: string,
  modulePermissions: Record<string, Record<PermissionAction, boolean>>,
  sourceKey: string,
  value: Record<PermissionAction, boolean>,
) => {
  modulePermissions[sourceKey] = { ...value }
  if (moduleKey === "company") {
    const legacyKey = COMPANY_PERMISSION_KEY_ALIASES[sourceKey]
    if (legacyKey) {
      modulePermissions[legacyKey] = { ...value }
    }
  }
}

const MODULE_GROUP_DEFINITIONS: Record<string, ModuleDefinition> = {
        company: {
    label: "Company",
    groups: [
      {
        key: "company-dashboard",
        sourceKey: "dashboard",
        title: "Dashboard",
        tabs: ["Dashboard"],
      },
      {
        key: "company-info",
        sourceKey: "info",
        title: "Company Info",
        tabs: ["Company Info"],
      },
      {
        key: "company-site-management",
        sourceKey: "siteManagement",
        title: "Site Management",
        tabs: ["Site Management"],
      },
      {
        key: "company-permissions",
        sourceKey: "permissions",
        title: "Permissions",
        tabs: ["Permissions"],
      },
      {
        key: "company-checklists",
        sourceKey: "checklists",
        title: "Checklists",
        tabs: ["Checklists"],
      },
      {
        key: "company-my-checklists",
        sourceKey: "myChecklists",
        title: "My Checklists",
        tabs: ["My Checklists"],
      },
    ],
        },
        hr: {
    label: "Human Resources",
    groups: [
      { key: "hr-dashboard", sourceKey: "dashboard", title: "Dashboard", tabs: ["Dashboard"] },
      { key: "hr-employees", sourceKey: "employees", title: "Employees", tabs: ["Employees"] },
      { key: "hr-scheduling", sourceKey: "scheduling", title: "Scheduling", tabs: ["Scheduling"] },
      { key: "hr-timeoff", sourceKey: "timeoff", title: "Time Off", tabs: ["Time Off"] },
      { key: "hr-payroll", sourceKey: "payroll", title: "Payroll", tabs: ["Payroll"] },
      { key: "hr-selfservice", sourceKey: "selfservice", title: "Self Service", tabs: ["Employee Self Service"] },
      { key: "hr-performance", sourceKey: "performance", title: "Performance", tabs: ["Performance"] },
      { key: "hr-warnings", sourceKey: "warnings", title: "Warnings", tabs: ["Warnings"] },
      { key: "hr-recruitment", sourceKey: "recruitment", title: "Recruitment", tabs: ["Recruitment"] },
      { key: "hr-roles", sourceKey: "roles", title: "Roles", tabs: ["Roles"] },
      { key: "hr-departments", sourceKey: "departments", title: "Departments", tabs: ["Departments"] },
      { key: "hr-announcements", sourceKey: "announcements", title: "Announcements", tabs: ["Announcements"] },
      { key: "hr-benefits", sourceKey: "benefits", title: "Benefits", tabs: ["Benefits"] },
      { key: "hr-expenses", sourceKey: "expenses", title: "Expenses", tabs: ["Expenses"] },
      { key: "hr-compliance", sourceKey: "compliance", title: "Risk & Compliance", tabs: ["Risk & Compliance"] },
      { key: "hr-events", sourceKey: "events", title: "Events", tabs: ["Events"] },
      { key: "hr-diversity", sourceKey: "diversity", title: "Diversity & Inclusion", tabs: ["Diversity & Inclusion"] },
      { key: "hr-training", sourceKey: "training", title: "Training", tabs: ["Training"] },
      { key: "hr-analytics", sourceKey: "analytics", title: "Analytics", tabs: ["Analytics"] },
      { key: "hr-reports", sourceKey: "reports", title: "Reports", tabs: ["Reports"] },
      { key: "hr-settings", sourceKey: "settings", title: "Settings", tabs: ["Settings"] },
    ],
  },
  pos: {
    label: "Point of Sale",
    groups: [
      { key: "pos-dashboard", sourceKey: "dashboard", title: "Dashboard", tabs: ["Dashboard"] },
      { key: "pos-sales", sourceKey: "sales", title: "Item Sales", tabs: ["Item Sales"] },
      { key: "pos-bills", sourceKey: "bills", title: "Bills", tabs: ["Bills"] },
      { key: "pos-floorplan", sourceKey: "floorplan", title: "Floor Plan", tabs: ["Floor Plan"] },
      { key: "pos-items", sourceKey: "items", title: "Items", tabs: ["Items"] },
      { key: "pos-tillscreens", sourceKey: "tillscreens", title: "Till Screens", tabs: ["Till Screens"] },
      { key: "pos-tickets", sourceKey: "tickets", title: "Tickets", tabs: ["Tickets"] },
      { key: "pos-bagcheck", sourceKey: "bagcheck", title: "Bag Check", tabs: ["Bag Check"] },
      { key: "pos-management", sourceKey: "management", title: "Management", tabs: ["Management"] },
      { key: "pos-devices", sourceKey: "devices", title: "Devices", tabs: ["Devices"] },
      { key: "pos-locations", sourceKey: "locations", title: "Locations", tabs: ["Locations"] },
      { key: "pos-payments", sourceKey: "payments", title: "Payments", tabs: ["Payments"] },
      { key: "pos-groups", sourceKey: "groups", title: "Groups", tabs: ["Groups"] },
      { key: "pos-categories", sourceKey: "categories", title: "Categories", tabs: ["Categories"] },
      { key: "pos-tables", sourceKey: "tables", title: "Tables", tabs: ["Tables"] },
      { key: "pos-courses", sourceKey: "courses", title: "Courses", tabs: ["Courses"] },
      { key: "pos-usage", sourceKey: "usage", title: "Till Usage", tabs: ["Till Usage"] },
      { key: "pos-corrections", sourceKey: "corrections", title: "Corrections", tabs: ["Corrections"] },
      { key: "pos-discounts", sourceKey: "discounts", title: "Discounts", tabs: ["Discounts"] },
      { key: "pos-promotions", sourceKey: "promotions", title: "Promotions", tabs: ["Promotions"] },
      { key: "pos-reports", sourceKey: "reports", title: "Reports", tabs: ["Reports"] },
      { key: "pos-settings", sourceKey: "settings", title: "Settings", tabs: ["Settings"] },
    ],
        },
        bookings: {
    label: "Bookings",
    groups: [
      { key: "bookings-dashboard", sourceKey: "dashboard", title: "Dashboard", tabs: ["Dashboard"] },
      { key: "bookings-list", sourceKey: "list", title: "Bookings List", tabs: ["Bookings List"] },
      { key: "bookings-calendar", sourceKey: "calendar", title: "Calendar", tabs: ["Calendar"] },
      { key: "bookings-diary", sourceKey: "diary", title: "Diary", tabs: ["Diary"] },
      { key: "bookings-floorplan", sourceKey: "floorplan", title: "Floor Plan", tabs: ["Floor Plan"] },
      { key: "bookings-waitlist", sourceKey: "waitlist", title: "Waitlist", tabs: ["Waitlist"] },
      { key: "bookings-tables", sourceKey: "tables", title: "Tables", tabs: ["Tables"] },
      { key: "bookings-locations", sourceKey: "locations", title: "Locations", tabs: ["Locations"] },
      { key: "bookings-types", sourceKey: "types", title: "Booking Types", tabs: ["Booking Types"] },
      { key: "bookings-preorders", sourceKey: "preorders", title: "Preorder Profiles", tabs: ["Preorder Profiles"] },
      { key: "bookings-status", sourceKey: "status", title: "Status", tabs: ["Status"] },
      { key: "bookings-tags", sourceKey: "tags", title: "Tags", tabs: ["Tags"] },
      { key: "bookings-reports", sourceKey: "reports", title: "Reports", tabs: ["Reports"] },
      { key: "bookings-settings", sourceKey: "settings", title: "Settings", tabs: ["Settings"] },
    ],
        },
        finance: {
    label: "Finance",
    groups: [
      { key: "finance-dashboard", sourceKey: "dashboard", title: "Dashboard", tabs: ["Dashboard"] },
      { key: "finance-sales", sourceKey: "sales", title: "Sales", tabs: ["Sales"] },
      { key: "finance-banking", sourceKey: "banking", title: "Banking", tabs: ["Banking"] },
      { key: "finance-purchases", sourceKey: "purchases", title: "Purchases", tabs: ["Purchases"] },
      { key: "finance-expenses", sourceKey: "expenses", title: "Expenses", tabs: ["Expenses"] },
      { key: "finance-contacts", sourceKey: "contacts", title: "Contacts", tabs: ["Contacts"] },
      { key: "finance-accounting", sourceKey: "accounting", title: "Accounting", tabs: ["Accounting"] },
      { key: "finance-currency", sourceKey: "currency", title: "Currency", tabs: ["Currency"] },
      { key: "finance-budgeting", sourceKey: "budgeting", title: "Budgeting", tabs: ["Budgeting"] },
      { key: "finance-reports", sourceKey: "reports", title: "Reports", tabs: ["Reports"] },
      { key: "finance-settings", sourceKey: "settings", title: "Settings", tabs: ["Settings"] },
    ],
  },
  stock: {
    label: "Stock",
    groups: [
      {
        key: "stock-dashboard",
        sourceKey: "dashboard",
        title: "Stock Dashboard",
        tabs: ["Dashboard"],
      },
      {
        key: "stock-items",
        sourceKey: "items",
        title: "Items & Categories",
        tabs: ["Items"],
      },
      {
        key: "stock-purchase-orders",
        sourceKey: "orders",
        title: "Purchase Orders",
        tabs: ["Purchase Orders"],
      },
      {
        key: "stock-counts",
        sourceKey: "counts",
        title: "Stock Counts",
        tabs: ["Stock Counts"],
      },
      {
        key: "stock-par-levels",
        sourceKey: "parlevels",
        title: "Par Levels",
        tabs: ["Par Levels"],
      },
      {
        key: "stock-management",
        sourceKey: "management",
        title: "Management",
        tabs: ["Management"],
      },
      {
        key: "stock-reports",
        sourceKey: "reports",
        title: "Reports",
        tabs: ["Reports"],
      },
      {
        key: "stock-settings",
        sourceKey: "settings",
        title: "Settings",
        tabs: ["Settings"],
      },
    ],
  },
  messenger: {
    label: "Messenger",
    groups: [
      {
        key: "messenger-chat",
        sourceKey: "chat",
        title: "Chats",
        tabs: ["Chats"],
      },
      {
        key: "messenger-contacts",
        sourceKey: "contacts",
        title: "Contacts",
        tabs: ["Contacts"],
      },
      {
        key: "messenger-groups",
        sourceKey: "groups",
        title: "Groups",
        tabs: ["Groups"],
      },
    ],
  },
  tools: {
    label: "Tools",
    groups: [
      {
        key: "tools-excel",
        sourceKey: "excel",
        title: "Excel Import/Export",
        tabs: ["Excel"],
      },
      {
        key: "tools-pdf",
        sourceKey: "pdf",
        title: "PDF Tools",
        tabs: ["PDF"],
      },
      {
        key: "tools-floorfriend",
        sourceKey: "floorfriend",
        title: "Floor Friend",
        tabs: ["Floor Friend"],
      },
    ],
  },
}

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  edit: "Edit",
  delete: "Delete",
}

const formatLabel = (value: string): string =>
  value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
import RequireCompanyContext from "../../components/global/RequireCompanyContext"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`permissions-tabpanel-${index}`}
      aria-labelledby={`permissions-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const Permissions: React.FC = () => {
  const {
    state: companyState,
    hasPermission,
    updateRolePermissions,
    updateDepartmentPermissions,
    updateUserPermissions,
    addRole: addCompanyRole,
    addDepartment: addCompanyDepartment,
    getCompanyUsers,
    refreshSites,
  } = useCompany()

  const hrContext = useHR()
  const { state: hrState, handleHRAction } = hrContext || {}
  
  // Check if HR provider is available (not just empty context)
  const hrProviderAvailable = hrContext && hrState && (hrState.initialized || hrState.roles?.length > 0 || hrState.departments?.length > 0)

  const [tabValue, setTabValue] = useState(0)
  const [permissions, setPermissions] = useState<CompanyPermissions>(DEFAULT_PERMISSIONS)
  const [users, setUsers] = useState<any[]>([])
  const employees = (hrState?.employees || [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Local state for roles and departments
  const [roles, setRoles] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  // Create stable string keys from HR data (only depend on length to prevent loops)
  const rolesKey = useMemo(() => {
    if (!hrState?.roles || hrState.roles.length === 0) return ""
    return hrState.roles.map(r => r.id || r.name || r.label || "").sort().join("|")
  }, [hrState?.roles?.length])
  
  const departmentsKey = useMemo(() => {
    if (!hrState?.departments || hrState.departments.length === 0) return ""
    return hrState.departments.map(d => d.id || d.name || "").sort().join("|")
  }, [hrState?.departments?.length])
  
  // UI visibility toggles removed per request


  // Helper to create a safe key for Firebase paths and permission maps
  const toKey = (name: string) =>
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "")

  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any | null>(null)

  // Form states
  const [newRoleName, setNewRoleName] = useState("")
  const [newDepartmentName, setNewDepartmentName] = useState("")
  const [userRole, setUserRole] = useState("")
  const [userDepartment, setUserDepartment] = useState("")

  // Check if user has permission to manage permissions using the permission system
  const canManagePermissions = hasPermission("company", "permissions", "edit")

  // Get the current data path based on hierarchy
  const getDataPath = () => {
    if (companyState.selectedSubsiteID && companyState.selectedSiteID) {
      return {
        companyId: companyState.companyID,
        siteId: companyState.selectedSiteID,
        subsiteId: companyState.selectedSubsiteID
      }
    }
    if (companyState.selectedSiteID) {
      return {
        companyId: companyState.companyID,
        siteId: companyState.selectedSiteID
      }
    }
    // If no site is selected, use the first available site or empty string
    const firstSiteId = companyState.sites && companyState.sites.length > 0 
      ? companyState.sites[0].siteID 
      : ""
    return {
      companyId: companyState.companyID,
      siteId: firstSiteId
    }
  }

  // Load company users when company changes
  useEffect(() => {
    if (!companyState.companyID) {
      setUsers([])
      return
    }

    const loadUsers = async () => {
      try {
        const companyUsers = await getCompanyUsers(companyState.companyID)
        setUsers(Array.isArray(companyUsers) ? companyUsers : [])
      } catch (err) {
        console.warn("Error loading company users:", err)
        setUsers([])
      }
    }

    loadUsers()
  }, [companyState.companyID, getCompanyUsers])
  
  // Sync HR data whenever it's available (use stable keys to prevent infinite loops)
  const lastRolesKeyRef = useRef<string>("")
  const lastDepartmentsKeyRef = useRef<string>("")
  
  useEffect(() => {
    if (rolesKey !== lastRolesKeyRef.current) {
      lastRolesKeyRef.current = rolesKey
      if (hrState?.roles && hrState.roles.length > 0) {
        const hrRoles = hrState.roles.map(r => toKey(r.name || r.label || ""))
        setRoles(hrRoles)
      } else {
        setRoles([])
      }
    }
  }, [rolesKey])
  
  useEffect(() => {
    if (departmentsKey !== lastDepartmentsKeyRef.current) {
      lastDepartmentsKeyRef.current = departmentsKey
      if (hrState?.departments && hrState.departments.length > 0) {
        const hrDepartments = hrState.departments.map(d => toKey(d.name || ""))
        setDepartments(hrDepartments)
      } else {
        setDepartments([])
      }
    }
  }, [departmentsKey])

  // Set loading to false once we have data or context is ready - optimized
  useEffect(() => {
    if (companyState.companyID) {
      // If HR context has data or is initialized, we're ready
      if (hrState && (hrState.initialized || (hrState.roles && hrState.roles.length > 0) || (hrState.departments && hrState.departments.length > 0))) {
        setLoading(false)
        return
      }
      // Also stop loading after a shorter delay to prevent infinite loading
      const timer = setTimeout(() => setLoading(false), 1000)
      return () => clearTimeout(timer)
    } else {
      setLoading(false)
    }
  }, [companyState.companyID, hrState?.initialized, hrState?.roles?.length, hrState?.departments?.length])

  // Load permissions
  useEffect(() => {
    if (companyState.permissions) {
      setPermissions(companyState.permissions)
    }
  }, [companyState.permissions])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      savePermissions()
    } else {
      // Enter edit mode
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // Reset permissions to original state
    if (companyState.permissions) {
      setPermissions(companyState.permissions)
    }
  }

  const handlePermissionChange = (
    type: "roles" | "departments",
    name: string,
    module: string,
    page: string,
    action: "view" | "edit" | "delete",
    value: boolean,
  ) => {
    if (!canManagePermissions || !isEditing) return

    setPermissions((prev) => {
      const next = { ...prev }
      // Ensure container exists
      if (!next[type]) {
        (next as any)[type] = {}
      }
      // Seed default structure if missing
      const current = (next as any)[type][name] || DEFAULT_PERMISSIONS.roles.staff
      const currentModules = (current.modules || {}) as any
      const moduleObj: Record<string, Record<PermissionAction, boolean>> = {
        ...(currentModules[module] || {}),
      }
      const existingPagePermissions = getPagePermissions(module, moduleObj, page)
      const pageObj = { ...(existingPagePermissions || { view: false, edit: false, delete: false }) }
      pageObj[action] = value
      setModulePagePermissions(module, moduleObj, page, pageObj)
      const newUserPerms = { modules: { ...currentModules, [module]: moduleObj } }
      ;(next as any)[type][name] = newUserPerms
      return next
    })
  }

  const updateAllActions = (
    type: "roles" | "departments",
    name: string,
    module: string,
    page: string,
    value: boolean,
  ) => {
    if (!canManagePermissions || !isEditing) return

    setPermissions((prev) => {
      const next = { ...prev }
      const collection = { ...((next as any)[type] || {}) }
      const current = collection[name] || { modules: {} }
      const modules = { ...(current.modules || {}) }
    const modulePages: Record<string, Record<PermissionAction, boolean>> = {
      ...(modules[module] || {}),
    }
      const updatedPage: Record<PermissionAction, boolean> = {
        view: value,
        edit: value,
        delete: value,
      }
    setModulePagePermissions(module, modulePages, page, updatedPage)
      modules[module] = modulePages
      collection[name] = { modules }
      ;(next as any)[type] = collection
      return next
    })
  }

  // Use centralized mapping and extend with new HR keys if missing
const PERMISSION_KEYS = Object.entries(MODULE_GROUP_DEFINITIONS).flatMap(([moduleKey, moduleDef]) =>
  moduleDef.groups.map((group) => ({ module: moduleKey, page: group.sourceKey }))
)

// Convert permission object to boolean array based on module/page definitions
  const convertPermissionsToArray = (userPermissions: UserPermissions): boolean[] => {
    const permissionArray: boolean[] = []

  PERMISSION_KEYS.forEach(({ module, page }) => {
    const modulePerms = userPermissions.modules?.[module as keyof typeof userPermissions.modules] as
      | Record<string, Record<PermissionAction, boolean>>
      | undefined
    const pagePerms = getPagePermissions(module, modulePerms, page)

    ;(["view", "edit", "delete"] as PermissionAction[]).forEach((action) => {
      permissionArray.push(Boolean(pagePerms?.[action]))
    })
    })

    return permissionArray
  }

  // Convert boolean array back to permission object structure

  const savePermissions = async () => {
    if (!companyState.companyID || !canManagePermissions) return

    setLoading(true)
    try {
      // Persist only roles/departments sourced from HR context
      for (const roleKey of roles) {
        const rolePermissions = permissions.roles[roleKey] || DEFAULT_PERMISSIONS.roles.staff
        const rolePermissionArray = convertPermissionsToArray(rolePermissions)
        await updateRolePermissions(roleKey, rolePermissionArray)
      }

      for (const deptKey of departments) {
        const deptPermissions = permissions.departments[deptKey] || DEFAULT_PERMISSIONS.roles.staff
        const deptPermissionArray = convertPermissionsToArray(deptPermissions)
        await updateDepartmentPermissions(deptKey, deptPermissionArray)
      }
      
      // Refresh permissions from backend to ensure UI is in sync
      await refreshSites()
      
      setSuccess("Permissions updated successfully")
      setIsEditing(false) // Exit edit mode after successful save
    } catch (err) {
      console.error("Error saving permissions:", err)
      setError("Failed to save permissions")
    } finally {
      setLoading(false)
    }
  }

  // Test the end-to-end permissions save/load cycle with conversion logic

  const handleAddRole = async () => {
    if (!companyState.companyID || !newRoleName || !canManagePermissions) return

    setLoading(true)
    try {
      const { companyId, siteId } = getDataPath()

      // Create new role in HR system
      const roleData: Omit<Role, "id"> = {
        name: newRoleName.toLowerCase(),
        label: newRoleName,
        permissions: ["*"],
        description: `${newRoleName} role`,
        departmentId: "",
        isActive: true,
        createdAt: Date.now()
      }

      if (hrProviderAvailable && handleHRAction) {
        await handleHRAction({
          companyId,
          siteId,
          action: "create",
          entity: "roles",
          data: roleData
        })
      }

      // Create role in permissions system
      await addCompanyRole({
        name: newRoleName.toLowerCase(),
        label: newRoleName,
        description: `${newRoleName} role`,
        permissions: ["*"],
        active: true,
        createdAt: new Date().toISOString(),
      })

      // Add to local permissions state
      const defaultRolePermissions = permissions.roles.staff
      setPermissions((prev) => ({
        ...prev,
        roles: {
          ...prev.roles,
          [newRoleName.toLowerCase()]: defaultRolePermissions,
        },
      }))

      setRoles((prev) => [...prev, newRoleName.toLowerCase()])
      setNewRoleName("")
      setRoleDialogOpen(false)
      setSuccess("Role added successfully")
      // Data will sync automatically via useEffect hooks
    } catch (err) {
      console.error("Error adding role:", err)
      setError("Failed to add role")
    } finally {
      setLoading(false)
    }
  }

  const handleAddDepartment = async () => {
    if (!companyState.companyID || !newDepartmentName || !canManagePermissions) return

    setLoading(true)
    try {
      const { companyId, siteId } = getDataPath()

      // Create department in HR system
      const departmentData: Omit<Department, "id"> = {
        name: newDepartmentName,
        description: `${newDepartmentName} department`,
        managerId: "",
        employees: [],
        roles: [],
        isActive: true,
        createdAt: Date.now(),
      }

      if (hrProviderAvailable && handleHRAction) {
        await handleHRAction({
          companyId,
          siteId,
          action: "create",
          entity: "departments",
          data: departmentData
        })
      }

      // Create department in permissions system
      const departmentKey = newDepartmentName.toLowerCase().replace(/\s+/g, "-")
      await addCompanyDepartment({
        name: newDepartmentName,
        description: `${newDepartmentName} department`,
        managerId: "",
        employees: [],
        roles: [],
        createdAt: Date.now(),
      })

      setPermissions((prev) => ({
        ...prev,
        departments: {
          ...prev.departments,
          [departmentKey]: permissions.departments["front-of-house"],
        },
      }))

      setDepartments((prev) => [...prev, departmentKey])
      setNewDepartmentName("")
      setDepartmentDialogOpen(false)
      setSuccess("Department added successfully")
      // Data will sync automatically via useEffect hooks
    } catch (err) {
      console.error("Error adding department:", err)
      setError("Failed to add department")
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const handleUpdateUser = async () => {
    if (!currentUser || !userRole || !userDepartment || !canManagePermissions) return

    setLoading(true)
    try {
      await updateUserPermissions(currentUser.uid, [])
      await refreshSites()
      setUserDialogOpen(false)
      setCurrentUser(null)
      setUserRole("")
      setUserDepartment("")
      setSuccess("User permissions updated successfully")
    } catch (err) {
      console.error("Error updating user:", err)
      setError("Failed to update user permissions")
    } finally {
      setLoading(false)
    }
  }

  const openUserDialog = (user: any) => {
    setCurrentUser(user)
    setUserRole(user.companyRole || permissions.defaultRole)
    setUserDepartment(user.companyDepartment || permissions.defaultDepartment)
    setUserDialogOpen(true)
  }

  // Render permission matrix - memoized for performance
const ensurePermissionContainer = useCallback((
  collection: Record<string, UserPermissions> | undefined,
  name: string,
): UserPermissions => {
  if (collection && collection[name]) {
    return collection[name]
  }
  return { modules: {} }
}, [])

const renderPermissionMatrix = useCallback((
  type: "roles" | "departments",
  items: Record<string, UserPermissions>,
  roles: string[],
  departments: string[],
  isEditing: boolean,
  canManagePermissions: boolean,
  handlePermissionChange: (
    type: "roles" | "departments",
    name: string,
    module: string,
    page: string,
    action: PermissionAction,
    value: boolean,
  ) => void,
  updateAllActions: (
    type: "roles" | "departments",
    name: string,
    module: string,
    page: string,
    value: boolean,
  ) => void,
) => {
  const entities = type === "roles" ? roles : departments

  if (entities.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        {type === "roles" ? "No roles found." : "No departments found."}
      </Alert>
    )
  }

    return (
      <Box>
      {entities.map((entityName, index) => {
        const entityPermissions = ensurePermissionContainer(items, entityName)
        const label = formatLabel(entityName)

        return (
          <Accordion key={`${type}-${entityName}-${index}`} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <Typography variant="subtitle2" sx={{ fontSize: "0.875rem" }}>{label}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 1, pb: 1 }}>
              <Grid container spacing={1}>
                {Object.entries(MODULE_GROUP_DEFINITIONS).map(([moduleKey, moduleDef]) => {
                  const modulePermissions = entityPermissions.modules?.[moduleKey as keyof typeof entityPermissions.modules] as
                    | Record<string, Record<PermissionAction, boolean>>
                    | undefined

                  return (
                    <Grid item xs={12} md={6} key={`${entityName}-${moduleKey}`}>
                      <Card variant="outlined" sx={{ mb: 1 }}>
                        <CardHeader 
                          title={moduleDef.label} 
                          titleTypographyProps={{ variant: "caption", sx: { fontWeight: 600, fontSize: "0.75rem" } }} 
                          sx={{ py: 0.5, px: 1 }}
                        />
                        <CardContent sx={{ pt: 0.5, pb: 1, px: 1 }}>
                          {moduleDef.groups.map((group) => {
                            const pagePermissions =
                              getPagePermissions(moduleKey, modulePermissions, group.sourceKey) ?? {
                                view: false,
                                edit: false,
                                delete: false,
                              }
                            const isGroupEnabled = (["view", "edit", "delete"] as PermissionAction[]).some(
                              (action) => pagePermissions[action],
                            )

                            return (
                              <Box key={`${moduleKey}-${group.key}`} sx={{ mb: 1 }}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                    gap: 1,
                                  }}
                                >
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.7rem" }}>
                                      {group.title}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", display: "block" }}>
                                      {group.tabs.join(" • ")}
                                    </Typography>
                                  </Box>
                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                        checked={isGroupEnabled}
                                        disabled={!isEditing || !canManagePermissions}
                                        onChange={(e) =>
                                          updateAllActions(type, entityName, moduleKey, group.sourceKey, e.target.checked)
                                        }
                                      />
                                    }
                                    label="All"
                                    sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.65rem" }, m: 0 }}
                                  />
                                </Box>
                                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                                  {(["view", "edit", "delete"] as PermissionAction[]).map((action) => (
                                    <FormControlLabel
                                      key={action}
                                      control={
                                        <Switch
                                          size="small"
                                          checked={Boolean(pagePermissions[action])}
                                          disabled={!isEditing || !canManagePermissions}
                                          onChange={(e) =>
                                            handlePermissionChange(
                                              type,
                                              entityName,
                                              moduleKey,
                                              group.sourceKey,
                                              action,
                                              e.target.checked,
                                            )
                                          }
                                        />
                                      }
                                      label={ACTION_LABELS[action]}
                                      sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.65rem" }, m: 0 }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )
                          })}
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )
      })}
      </Box>
    )
  }, [])

  // Check permissions using the hasPermission function instead of hard-coded checks
  if (!hasPermission("company", "permissions", "view")) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You don't have permission to view permissions settings.</Alert>
      </Box>
    )
  }

  return (
    <RequireCompanyContext>
    <Box sx={{ p: 0 }}>
      <DataHeader
        onRefresh={async () => {
          if (companyState.companyID) {
            setLoading(true)
            try {
              // Refresh HR data if available
              if (hrState?.roles) {
                const hrRoles = hrState.roles.map(r => toKey(r.name || r.label || ""))
                setRoles(hrRoles)
              }
              if (hrState?.departments) {
                const hrDepartments = hrState.departments.map(d => toKey(d.name || ""))
                setDepartments(hrDepartments)
              }
              // Refresh company users
              const companyUsers = await getCompanyUsers(companyState.companyID)
              setUsers(Array.isArray(companyUsers) ? companyUsers : [])
            } catch (err) {
              console.warn("Error refreshing data:", err)
            } finally {
              setLoading(false)
            }
          }
        }}
        showDateControls={false}
        additionalControls={
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": {
                minHeight: 48,
                textTransform: "none",
                fontSize: "0.875rem",
                fontWeight: 500,
                gap: 1,
                color: "white",
                "&.Mui-selected": {
                  color: "white",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "white",
              },
            }}
          >
            <Tab icon={<GroupIcon />} iconPosition="start" label="Roles" />
            <Tab icon={<BusinessIcon />} iconPosition="start" label="Departments" />
            <Tab icon={<SecurityIcon />} iconPosition="start" label="Users" />
            <Tab icon={<PersonIcon />} iconPosition="start" label="Employees" />
          </Tabs>
        }
        additionalButtons={[
          ...(canManagePermissions ? [
            ...(isEditing ? [{
              label: "Cancel",
              icon: <EditIcon />,
              onClick: handleCancelEdit,
              variant: "outlined" as const,
              color: "secondary" as const
            }] : []),
            {
              label: isEditing ? (loading ? "Saving..." : "Save Changes") : "Edit",
              icon: isEditing ? <SaveIcon /> : <EditIcon />,
              onClick: handleEditToggle,
              variant: "contained" as const,
              color: "primary" as const
            }
          ] : [])
        ]}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box sx={{ p: 2 }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!loading && (
          <>
            <TabPanel value={tabValue} index={0}>
              {renderPermissionMatrix(
                "roles",
                permissions.roles,
                roles,
                departments,
                isEditing,
                canManagePermissions,
                handlePermissionChange,
                updateAllActions,
              )}
            </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderPermissionMatrix(
            "departments",
            permissions.departments,
            roles,
            departments,
            isEditing,
            canManagePermissions,
            handlePermissionChange,
            updateAllActions,
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>User</TableCell>
                  <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Email</TableCell>
                  <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Role</TableCell>
                  <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Department</TableCell>
                  <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell sx={{ py: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                        {user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>{user.email}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5 }}>
                      <Chip
                        label={user.companyRole || permissions.defaultRole}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ height: 20, fontSize: "0.65rem" }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 0.5 }}>
                      <Chip
                        label={(user.companyDepartment || permissions.defaultDepartment).replace(/-/g, " ")}
                        size="small"
                        color="secondary"
                        variant="outlined"
                        sx={{ height: 20, fontSize: "0.65rem" }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 0.5 }}>
                      {canManagePermissions && (
                        <Tooltip title="Edit User Permissions">
                          <IconButton size="small" onClick={() => openUserDialog(user)} sx={{ p: 0.5 }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {employees.length === 0 ? (
            <Alert severity="info" sx={{ py: 1 }}>No employees available.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Name</TableCell>
                    <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Email</TableCell>
                    <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Role</TableCell>
                    <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Department</TableCell>
                    <TableCell sx={{ py: 1, fontSize: "0.75rem" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((employee: any) => (
                    <TableRow key={employee.id || employee.uid || employee.email}>
                      <TableCell sx={{ py: 0.5 }}>
                        <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                          {formatLabel(
                            `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
                              employee.displayName ||
                              "Unknown Employee",
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 0.5 }}>
                        <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>{employee.email || "N/A"}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 0.5 }}>
                        <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                          {formatLabel(employee.roleName || employee.roleId || permissions.defaultRole)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 0.5 }}>
                        <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                          {formatLabel(employee.departmentName || employee.departmentId || permissions.defaultDepartment)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 0.5 }}>
                        <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                          {formatLabel(employee.status || "active")}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
          </>
        )}

      </Box>

      {/* Add Role Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Role</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            fullWidth
            variant="outlined"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddRole} variant="contained" disabled={!newRoleName || loading}>
            Add Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Department Dialog */}
      <Dialog open={departmentDialogOpen} onClose={() => setDepartmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Department</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Department Name"
            fullWidth
            variant="outlined"
            value={newDepartmentName}
            onChange={(e) => setNewDepartmentName(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepartmentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddDepartment} variant="contained" disabled={!newDepartmentName || loading}>
            Add Department
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User Permissions</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              User: {currentUser?.displayName || currentUser?.email}
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select value={userRole} label="Role" onChange={(e) => setUserRole(e.target.value)}>
                {roles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select value={userDepartment} label="Department" onChange={(e) => setUserDepartment(e.target.value)}>
                {departments.map((department) => (
                  <MenuItem key={department} value={department}>
                    {department.replace(/-/g, " ").charAt(0).toUpperCase() + department.replace(/-/g, " ").slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateUser} variant="contained" disabled={loading}>
            Update User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </RequireCompanyContext>
  )
}

export default Permissions
