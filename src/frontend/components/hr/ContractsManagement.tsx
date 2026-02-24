import React, { useState, useEffect, useMemo } from 'react'
import { useHR } from '../../../backend/context/HRContext'
import { useCompany } from '../../../backend/context/CompanyContext'
import { logDataExport } from '../../../backend/services/audit/dataExportAudit'
import CRUDModal from '../reusable/CRUDModal'
import ContractCRUDForm from './forms/ContractCRUDForm'
import DataHeader from '../reusable/DataHeader'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  Tooltip,
  CircularProgress,
} from '@mui/material'
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { Employee, Contract, ContractTemplate } from '../../../backend/interfaces/HRs'
import { format } from 'date-fns'

const ContractsManagement: React.FC = () => {
  const { state: companyState } = useCompany()
  const { 
    state, 
    fetchContractTemplates, 
    createContractTemplate,
    updateContractTemplate,
    deleteContractTemplate,
    initializeDefaultContractTemplates,
    refreshContracts,
    addContract,
    updateContract,
    deleteContract,
  } = useHR()
  
  const [tab, setTab] = useState(0)
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const contracts = state.contracts || []
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [loading, setLoading] = useState(false)

  // CRUD Modal states
  const [contractCRUDModalOpen, setContractCRUDModalOpen] = useState(false)
  const [selectedContractForCRUD, setSelectedContractForCRUD] = useState<any>(null)
  const [contractCrudMode, setContractCrudMode] = useState<'create' | 'edit' | 'view'>('create')

  // Template Dialog state
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState<{ name: string; bodyHtml: string }>({ name: '', bodyHtml: '' })
  const [templateMode, setTemplateMode] = useState<'create' | 'edit'>('create')

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: 'template' | 'contract', id: string, name: string } | null>(null)

  // DataHeader state
  const [searchTerm, setSearchTerm] = useState('')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('contractTitle')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Load templates from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        await initializeDefaultContractTemplates()
        const templatesData = await fetchContractTemplates()
        setTemplates(templatesData)
      } catch (error) {
        console.error('Error loading contract templates:', error)
        setSnackbar({ open: true, message: 'Failed to load contract templates', severity: 'error' })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Template CRUD handlers
  const handleOpenTemplateDialog = (template: ContractTemplate | null = null, mode: 'create' | 'edit' = 'create') => {
    setSelectedTemplate(template)
    setTemplateMode(mode)
    if (template) {
      setTemplateForm({ name: template.name, bodyHtml: template.bodyHtml })
    } else {
      setTemplateForm({ name: '', bodyHtml: '' })
    }
    setTemplateDialogOpen(true)
  }

  const handleCloseTemplateDialog = () => {
    setTemplateDialogOpen(false)
    setSelectedTemplate(null)
    setTemplateForm({ name: '', bodyHtml: '' })
  }

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.bodyHtml) {
      setSnackbar({ open: true, message: 'Please fill in all fields', severity: 'error' })
      return
    }

    try {
      setLoading(true)
      if (templateMode === 'create') {
        const newTemplate = await createContractTemplate({
          name: templateForm.name,
          bodyHtml: templateForm.bodyHtml,
          defaultType: 'permanent',
          terms: [],
          active: true,
          createdBy: 'user',
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
        if (newTemplate) {
          setTemplates(prev => [...prev, newTemplate])
          setSnackbar({ open: true, message: 'Template created successfully', severity: 'success' })
        }
      } else if (templateMode === 'edit' && selectedTemplate) {
        const updatedTemplate = await updateContractTemplate(selectedTemplate.id, {
          name: templateForm.name,
          bodyHtml: templateForm.bodyHtml,
          updatedAt: Date.now()
        })
        if (updatedTemplate) {
          setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? updatedTemplate : t))
          setSnackbar({ open: true, message: 'Template updated successfully', severity: 'success' })
        }
      }
      handleCloseTemplateDialog()
    } catch (error) {
      console.error('Error saving template:', error)
      setSnackbar({ open: true, message: `Failed to ${templateMode} template`, severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    setItemToDelete({ type: 'template', id: templateId, name: templateName })
    setDeleteConfirmOpen(true)
  }

  // Contract CRUD handlers
  const handleOpenContractCRUD = (contract: any = null, mode: 'create' | 'edit' | 'view' = 'create') => {
    setSelectedContractForCRUD(contract)
    setContractCrudMode(mode)
    setContractCRUDModalOpen(true)
  }

  const handleCloseContractCRUD = () => {
    setContractCRUDModalOpen(false)
    setSelectedContractForCRUD(null)
    setContractCrudMode('create')
  }

  const handleSaveContractCRUD = async (contractData: any) => {
    try {
      setLoading(true)
      if (contractCrudMode === 'create') {
        const result = await addContract(contractData)
        if (result) {
          await refreshContracts()
          setSnackbar({ open: true, message: 'Contract created successfully', severity: 'success' })
        } else {
          setSnackbar({ open: true, message: 'Failed to create contract', severity: 'error' })
        }
      } else if (contractCrudMode === 'edit' && selectedContractForCRUD) {
        const result = await updateContract(selectedContractForCRUD.id, contractData)
        if (result) {
          await refreshContracts()
          setSnackbar({ open: true, message: 'Contract updated successfully', severity: 'success' })
        } else {
          setSnackbar({ open: true, message: 'Failed to update contract', severity: 'error' })
        }
      }
      handleCloseContractCRUD()
    } catch (error) {
      console.error('Error saving contract:', error)
      setSnackbar({ open: true, message: `Failed to ${contractCrudMode === 'create' ? 'create' : 'update'} contract`, severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContract = async (contractId: string, contractTitle: string) => {
    setItemToDelete({ type: 'contract', id: contractId, name: contractTitle })
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    try {
      setLoading(true)
      if (itemToDelete.type === 'template') {
        await deleteContractTemplate(itemToDelete.id)
        setTemplates(prev => prev.filter(t => t.id !== itemToDelete.id))
        setSnackbar({ open: true, message: 'Template deleted successfully', severity: 'success' })
      } else {
        await deleteContract(itemToDelete.id)
        await refreshContracts()
        setSnackbar({ open: true, message: 'Contract deleted successfully', severity: 'success' })
      }
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Error deleting item:', error)
      setSnackbar({ open: true, message: 'Failed to delete item', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Utility functions
  const handleCopyLink = async (contract: Contract) => {
    const shareLink = `${window.location.origin}/contract/${contract.id}`
    try {
      await navigator.clipboard.writeText(shareLink)
      setSnackbar({ open: true, message: 'Link copied to clipboard', severity: 'success' })
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to copy link', severity: 'error' })
    }
  }

  const handleSendEmail = (contract: Contract) => {
    const employee = state.employees.find((e: Employee) => e.id === contract.employeeId)
    if (!employee) return

    const shareLink = `${window.location.origin}/contract/${contract.id}`
    const subject = encodeURIComponent(`Contract: ${contract.contractTitle || 'Employment Contract'}`)
    const emailBody = encodeURIComponent(`Hello ${employee.firstName},\n\nPlease review and sign your contract here: ${shareLink}\n\nThanks`)
    
    window.open(`mailto:${employee.email}?subject=${subject}&body=${emailBody}`, "_blank")
  }

  const handleSendWhatsApp = (contract: Contract) => {
    const employee = state.employees.find((e: Employee) => e.id === contract.employeeId)
    if (!employee || !employee.phone) return

    const shareLink = `${window.location.origin}/contract/${contract.id}`
    const text = encodeURIComponent(`Hello ${employee.firstName}, please review and sign your contract: ${shareLink}`)
    const phoneNumber = employee.phone.replace(/\D/g, '')
    
    window.open(`https://wa.me/${phoneNumber}?text=${text}`, "_blank")
  }

  // DataHeader handlers
  const handleSortChange = (value: string, direction: 'asc' | 'desc') => {
    setSortBy(value)
    setSortOrder(direction)
  }

  const handleRefresh = async () => {
    try {
      setLoading(true)
      await refreshContracts()
      const templatesData = await fetchContractTemplates()
      setTemplates(templatesData)
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    const data = tab === 0 ? templates : sortedContracts
    const headers = tab === 0 
      ? ['Name', 'Type', 'Created', 'Status']
      : ['Title', 'Employee', 'Type', 'Status', 'Created']
    
    const csvData = data.map((item: any) => {
      if (tab === 0) {
        return {
          Name: item.name,
          Type: item.defaultType || 'N/A',
          Created: item.createdAt ? format(new Date(item.createdAt), 'yyyy-MM-dd') : 'N/A',
          Status: item.active ? 'Active' : 'Inactive'
        }
      } else {
        const employee = state.employees.find((e: Employee) => e.id === item.employeeId)
        const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'
        return {
          Title: item.contractTitle || `${item.type} Contract`,
          Employee: employeeName,
          Type: item.type || 'N/A',
          Status: item.status || 'N/A',
          Created: item.createdAt ? format(new Date(item.createdAt), 'yyyy-MM-dd') : 'N/A'
        }
      }
    })
    
    const csvContent = [
      headers.join(','),
      ...csvData.map((row: Record<string, unknown>) => headers.map(header => `"${String(row[header] ?? '')}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${tab === 0 ? 'contract-templates' : 'contracts'}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)

    const companyId = companyState.companyID || companyState.selectedCompany?.id
    if (companyId) {
      logDataExport(companyId, 'contracts', `Exported ${tab === 0 ? 'contract templates' : 'contracts'} to CSV`, data.length)
    }
    setSnackbar({ open: true, message: 'CSV exported successfully', severity: 'success' })
  }

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.bodyHtml || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [templates, searchTerm])

  const sortedTemplates = useMemo(() => {
    return [...filteredTemplates].sort((a, b) => {
      let aValue = ''
      let bValue = ''
      
      switch (sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'createdAt':
          aValue = a.createdAt?.toString() || ''
          bValue = b.createdAt?.toString() || ''
          break
        default:
          aValue = a.name
          bValue = b.name
      }
      
      const comparison = aValue.localeCompare(bValue)
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [filteredTemplates, sortBy, sortOrder])

  // Filter and sort contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const employee = state.employees.find((e: Employee) => e.id === contract.employeeId)
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : ''
      const contractTitle = contract.contractTitle || `${contract.type} Contract - ${employeeName}`
      
      const matchesSearch = contractTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contract.type?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(contract.status)
      
      return matchesSearch && matchesStatus
    })
  }, [contracts, searchTerm, statusFilter, state.employees])

  const sortedContracts = useMemo(() => {
    return [...filteredContracts].sort((a, b) => {
      let aValue = ''
      let bValue = ''
      
      switch (sortBy) {
        case 'contractTitle':
          const aEmployee = state.employees.find((e: Employee) => e.id === a.employeeId)
          const bEmployee = state.employees.find((e: Employee) => e.id === b.employeeId)
          const aEmployeeName = aEmployee ? `${aEmployee.firstName} ${aEmployee.lastName}` : ''
          const bEmployeeName = bEmployee ? `${bEmployee.firstName} ${bEmployee.lastName}` : ''
          aValue = a.contractTitle || `${a.type} Contract - ${aEmployeeName}`
          bValue = b.contractTitle || `${b.type} Contract - ${bEmployeeName}`
          break
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
          break
        case 'createdAt':
          aValue = a.createdAt?.toString() || ''
          bValue = b.createdAt?.toString() || ''
          break
        default:
          const aEmployeeDefault = state.employees.find((e: Employee) => e.id === a.employeeId)
          const bEmployeeDefault = state.employees.find((e: Employee) => e.id === b.employeeId)
          const aEmployeeNameDefault = aEmployeeDefault ? `${aEmployeeDefault.firstName} ${aEmployeeDefault.lastName}` : ''
          const bEmployeeNameDefault = bEmployeeDefault ? `${bEmployeeDefault.firstName} ${bEmployeeDefault.lastName}` : ''
          aValue = a.contractTitle || `${a.type} Contract - ${aEmployeeNameDefault}`
          bValue = b.contractTitle || `${b.type} Contract - ${bEmployeeNameDefault}`
      }
      
      const comparison = aValue.localeCompare(bValue)
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [filteredContracts, sortBy, sortOrder, state.employees])

  // DataHeader configuration
  const filters = [
    {
      label: "Status",
      options: [
        { id: "active", name: "Active", color: "#4caf50" },
        { id: "inactive", name: "Inactive", color: "#757575" },
        { id: "expired", name: "Expired", color: "#f44336" },
        { id: "terminated", name: "Terminated", color: "#f44336" },
        { id: "draft", name: "Draft", color: "#9e9e9e" },
        { id: "pending_signature", name: "Pending Signature", color: "#ff9800" },
      ],
      selectedValues: statusFilter,
      onSelectionChange: setStatusFilter,
    },
  ]

  const sortOptions = tab === 0 
    ? [
        { value: "name", label: "Name" },
        { value: "createdAt", label: "Created Date" },
      ]
    : [
        { value: "contractTitle", label: "Title" },
        { value: "status", label: "Status" },
        { value: "createdAt", label: "Created Date" },
      ]

  return (
    <Box>
      <DataHeader
        onCreateNew={() => tab === 0 ? handleOpenTemplateDialog(null, 'create') : handleOpenContractCRUD(null, 'create')}
        onExportCSV={handleExportCSV}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={tab === 0 ? "Search templates..." : "Search contracts..."}
        showDateControls={false}
        filters={tab === 1 ? filters : []}
        filtersExpanded={filtersExpanded}
        onFiltersToggle={() => setFiltersExpanded(!filtersExpanded)}
        sortOptions={sortOptions}
        sortValue={sortBy}
        sortDirection={sortOrder}
        onSortChange={handleSortChange}
        onRefresh={handleRefresh}
        createButtonLabel={tab === 0 ? "New Template" : "New Contract"}
        additionalControls={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Button
              variant={tab === 0 ? "contained" : "outlined"}
              size="small"
              onClick={() => setTab(0)}
              sx={
                tab === 0
                  ? { 
                      bgcolor: "white", 
                      color: "primary.main", 
                      "&:hover": { bgcolor: "grey.100" },
                      whiteSpace: "nowrap"
                    }
                  : { 
                      color: "white", 
                      borderColor: "rgba(255, 255, 255, 0.5)", 
                      "&:hover": { borderColor: "white", bgcolor: "rgba(255, 255, 255, 0.1)" },
                      whiteSpace: "nowrap"
                    }
              }
            >
              Templates ({templates.length})
            </Button>
            <Button
              variant={tab === 1 ? "contained" : "outlined"}
              size="small"
              onClick={() => setTab(1)}
              sx={
                tab === 1
                  ? { 
                      bgcolor: "white", 
                      color: "primary.main", 
                      "&:hover": { bgcolor: "grey.100" },
                      whiteSpace: "nowrap"
                    }
                  : { 
                      color: "white", 
                      borderColor: "rgba(255, 255, 255, 0.5)", 
                      "&:hover": { borderColor: "white", bgcolor: "rgba(255, 255, 255, 0.1)" },
                      whiteSpace: "nowrap"
                    }
              }
            >
              Contracts ({sortedContracts.length})
            </Button>
          </Box>
        }
      />

      {/* Loading overlay */}
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
          <CircularProgress size={16} />
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            Loading...
          </Typography>
        </Box>
      )}

      {/* Templates Table */}
      {tab === 0 && (
        <TableContainer component={Paper} elevation={1} sx={{ mt: 2, opacity: loading ? 0.7 : 1, transition: 'opacity 0.3s' }}>
          <Table>
            <TableHead sx={{ bgcolor: "action.hover" }}>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>Template Name</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>Type</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>Created</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTemplates.map((template) => (
                <TableRow 
                  key={template.id} 
                  hover
                  onClick={() => handleOpenTemplateDialog(template, 'edit')}
                  sx={{ 
                    cursor: "pointer",
                    '& > td': {
                      paddingTop: 1,
                      paddingBottom: 1,
                    }
                  }}
                >
                  <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{template.name}</TableCell>
                  <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{template.defaultType || 'N/A'}</TableCell>
                  <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                    {template.createdAt ? format(new Date(template.createdAt), 'MMM dd, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                    <Chip 
                      label={template.active ? 'Active' : 'Inactive'} 
                      size="small" 
                      color={template.active ? 'success' : 'default'} 
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                    <Box display="flex" gap={1} justifyContent="center">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenTemplateDialog(template, 'edit')
                        }}
                        title="Edit Template"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTemplate(template.id, template.name)
                        }}
                        title="Delete Template"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {sortedTemplates.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Templates Found
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {searchTerm ? "No templates match your search criteria." : "Get started by creating your first template."}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenTemplateDialog(null, 'create')}
              >
                Create Template
              </Button>
            </Box>
          )}
        </TableContainer>
      )}

      {/* Contracts Table */}
      {tab === 1 && (
        <TableContainer component={Paper} elevation={1} sx={{ mt: 2, opacity: loading ? 0.7 : 1, transition: 'opacity 0.3s' }}>
          <Table>
            <TableHead sx={{ bgcolor: "action.hover" }}>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>Contract Title</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>Employee</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>Type</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>Created</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedContracts.map((contract) => {
                const employee = state.employees.find((e: Employee) => e.id === contract.employeeId)
                const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee'
                const contractTitle = contract.contractTitle || `${contract.type} Contract - ${employeeName}`
                
                return (
                  <TableRow 
                    key={contract.id} 
                    hover
                    onClick={() => handleOpenContractCRUD(contract, 'view')}
                    sx={{ 
                      cursor: "pointer",
                      '& > td': {
                        paddingTop: 1,
                        paddingBottom: 1,
                      }
                    }}
                  >
                    <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{contractTitle}</TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{employeeName}</TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{contract.type || 'N/A'}</TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                      <Chip 
                        label={contract.status || 'N/A'} 
                        size="small" 
                        color={
                          contract.status === 'active' ? 'success' : 
                          contract.status === 'pending_signature' ? 'warning' :
                          contract.status === 'expired' || contract.status === 'terminated' ? 'error' : 
                          'default'
                        } 
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                      {contract.createdAt ? format(new Date(contract.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <Tooltip title="View Contract">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenContractCRUD(contract, 'view')
                            }}
                            title="View Contract"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Contract">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenContractCRUD(contract, 'edit')
                            }}
                            title="Edit Contract"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Copy Link">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyLink(contract)
                            }}
                            title="Copy Link"
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Send Email">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSendEmail(contract)
                            }}
                            title="Send Email"
                          >
                            <EmailIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Send WhatsApp">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSendWhatsApp(contract)
                            }}
                            title="Send WhatsApp"
                          >
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Contract">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteContract(contract.id, contractTitle)
                            }}
                            title="Delete Contract"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {sortedContracts.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Contracts Found
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {contracts.length === 0 
                  ? 'No contracts created yet. Create your first contract from a template.' 
                  : 'No contracts match your current filters.'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenContractCRUD(null, 'create')}
              >
                Create Contract
              </Button>
            </Box>
          )}
        </TableContainer>
      )}

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onClose={handleCloseTemplateDialog} maxWidth="md" fullWidth>
        <DialogTitle>{templateMode === 'create' ? 'Create' : 'Edit'} Contract Template</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField 
              fullWidth 
              label="Template Name" 
              value={templateForm.name} 
              onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))} 
              sx={{ mb: 2 }}
            />
            <TextField 
              fullWidth 
              label="Contract Body (HTML)" 
              multiline 
              minRows={8} 
              value={templateForm.bodyHtml} 
              onChange={(e) => setTemplateForm(prev => ({ ...prev, bodyHtml: e.target.value }))}
              helperText="Use placeholders like {{employeeName}}, {{role}}, {{salary}}, {{companyName}}, {{startDate}}, {{contractDuration}}. HTML tags are supported."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTemplateDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTemplate} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Save Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {itemToDelete?.type === 'template' ? 'template' : 'contract'}? 
            This action cannot be undone.
          </Typography>
          {itemToDelete && (
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
              {itemToDelete.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contract CRUD Modal */}
      <CRUDModal
        open={contractCRUDModalOpen}
        onClose={handleCloseContractCRUD}
        title={
          contractCrudMode === 'create' ? 'Create Contract' : 
          contractCrudMode === 'edit' ? 'Edit Contract' : 
          'View Contract'
        }
        mode={contractCrudMode}
        maxWidth="lg"
        onSave={contractCrudMode !== 'view' ? handleSaveContractCRUD : undefined}
        actions={
          contractCrudMode === 'view' && selectedContractForCRUD ? (
            <>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setContractCrudMode('edit')}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  if (selectedContractForCRUD && window.confirm('Are you sure you want to delete this contract?')) {
                    handleDeleteContract(selectedContractForCRUD.id, selectedContractForCRUD.contractTitle || 'Contract')
                    handleCloseContractCRUD()
                  }
                }}
              >
                Delete
              </Button>
            </>
          ) : contractCrudMode === 'edit' && selectedContractForCRUD ? (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => {
                if (selectedContractForCRUD && window.confirm('Are you sure you want to delete this contract?')) {
                  handleDeleteContract(selectedContractForCRUD.id, selectedContractForCRUD.contractTitle || 'Contract')
                  handleCloseContractCRUD()
                }
              }}
            >
              Delete
            </Button>
          ) : undefined
        }
      >
        <ContractCRUDForm
          contract={selectedContractForCRUD}
          mode={contractCrudMode}
          onSave={handleSaveContractCRUD}
        />
      </CRUDModal>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ContractsManagement
