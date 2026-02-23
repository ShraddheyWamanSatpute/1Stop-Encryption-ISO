"use client"

import React, { useState, useMemo } from "react"
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
} from "@mui/material"
import { useHR } from "../../../../backend/context/HRContext"
import { useCompany } from "../../../../backend/context/CompanyContext"
import DataHeader from "../../reusable/DataHeader"
import { format, differenceInDays, addDays } from "date-fns"
import { 
  filterByCompanyContext, 
  safeArray,
  safeString,
  safeParseDate 
} from "../../../utils/reportHelpers"

type GroupByType = "none" | "documentType" | "location" | "expiryStatus"

const RightToWorkExpiryReport: React.FC = () => {
  const { state: hrState } = useHR()
  const { state: companyState } = useCompany()
  const { employees = [], departments = [] } = hrState
  const { sites = [] } = companyState

  const [dateType, setDateType] = useState<"day" | "week" | "month" | "custom">("month")
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date())
  const [customEndDate, setCustomEndDate] = useState<Date>(addDays(new Date(), 90))
  const [groupBy, setGroupBy] = useState<GroupByType>("none")
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  const employeesWithRTW = useMemo(() => {
    try {
      // Filter employees by company context first
      const contextFilteredEmployees = filterByCompanyContext(
        safeArray(employees),
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      )
      
      const today = new Date()
      
      return contextFilteredEmployees
        .filter((emp: any) => emp.rightToWorkExpiryDate || emp.rightToWorkExpiry || emp.workPermitExpiry)
        .filter((emp: any) => {
          const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(safeString(emp.siteId))
          const docType = safeString(emp.rightToWorkType || emp.documentType, "Right to Work")
          const matchesDocType = selectedDocumentTypes.length === 0 || selectedDocumentTypes.includes(docType)
          return matchesLocation && matchesDocType
        })
        .map((emp: any) => {
          const expiryDate = safeParseDate(emp.rightToWorkExpiryDate || emp.rightToWorkExpiry || emp.workPermitExpiry)
          
          const docType = safeString(emp.rightToWorkType || emp.documentType, "Right to Work")
          
          let daysUntilExpiry = 0
          let status = "Unknown"
          
          if (expiryDate) {
            daysUntilExpiry = differenceInDays(expiryDate, today)
            
            if (daysUntilExpiry < 0) {
              status = "Expired"
            } else if (daysUntilExpiry <= 7) {
              status = "Critical"
            } else if (daysUntilExpiry <= 30) {
              status = "Warning"
            } else {
              status = "Valid"
            }
          }
          
          const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(status)
          
          return matchesStatus ? {
            ...emp,
            documentType: docType,
            expiryDate,
            daysUntilExpiry,
            status,
          } : null
        })
        .filter(Boolean)
        .sort((a: any, b: any) => {
          if (!a.expiryDate) return 1
          if (!b.expiryDate) return -1
          return a.daysUntilExpiry - b.daysUntilExpiry
        })
    } catch (error) {
      console.error("Error calculating RTW expiry data:", error)
      return []
    }
  }, [employees, selectedLocations, selectedDocumentTypes, selectedStatuses, companyState.selectedSiteID, companyState.selectedSubsiteID])

  const metrics = useMemo(() => {
    const totalDocuments = employeesWithRTW.length
    const expired = employeesWithRTW.filter((e: any) => e.status === "Expired").length
    const critical = employeesWithRTW.filter((e: any) => e.status === "Critical").length
    const warning = employeesWithRTW.filter((e: any) => e.status === "Warning").length
    const valid = employeesWithRTW.filter((e: any) => e.status === "Valid").length
    const expiringSoon = critical + warning
    
    const byDocType = employeesWithRTW.reduce((acc: any, emp: any) => {
      if (!acc[emp.documentType]) acc[emp.documentType] = 0
      acc[emp.documentType] += 1
      return acc
    }, {})

    return {
      totalDocuments,
      expired,
      critical,
      warning,
      valid,
      expiringSoon,
      byDocType,
    }
  }, [employeesWithRTW])

  const groupedData = useMemo(() => {
    if (groupBy === "none") return []

    const groups: Record<string, any> = {}

    employeesWithRTW.forEach((emp: any) => {
      let key = ""
      
      switch (groupBy) {
        case "documentType":
          key = emp.documentType
          break
        case "location":
          const site = sites.find((s: any) => s.id === emp.siteId)
          key = site?.name || "Unknown"
          break
        case "expiryStatus":
          key = emp.status
          break
      }

      if (!groups[key]) {
        groups[key] = {
          key,
          count: 0,
          expired: 0,
          critical: 0,
          warning: 0,
          valid: 0,
        }
      }

      groups[key].count += 1
      if (emp.status === "Expired") groups[key].expired += 1
      if (emp.status === "Critical") groups[key].critical += 1
      if (emp.status === "Warning") groups[key].warning += 1
      if (emp.status === "Valid") groups[key].valid += 1
    })

    return Object.values(groups).sort((a: any, b: any) => b.count - a.count)
  }, [employeesWithRTW, groupBy, sites])

  const locationFilterOptions = useMemo(() => sites.map((site: any) => ({ id: site.id, name: site.name })), [sites])
  const documentTypeOptions = useMemo(() => [
    { id: "Right to Work", name: "Right to Work" },
    { id: "Work Permit", name: "Work Permit" },
    { id: "Passport", name: "Passport" },
    { id: "ID Card", name: "ID Card" },
    { id: "Residence Permit", name: "Residence Permit" },
  ], [])
  const statusOptions = useMemo(() => [
    { id: "Expired", name: "Expired" },
    { id: "Critical", name: "Critical (&lt;7d)" },
    { id: "Warning", name: "Warning (&lt;30d)" },
    { id: "Valid", name: "Valid" },
  ], [])
  
  const groupByOptions = useMemo(() => [
    { value: "none", label: "No Grouping" },
    { value: "documentType", label: "By Document Type" },
    { value: "location", label: "By Location" },
    { value: "expiryStatus", label: "By Expiry Status" },
  ], [])

  return (
    <Box>
      <DataHeader
        showDateControls={false}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        dateType={dateType}
        onDateTypeChange={setDateType}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateRangeChange={(start, end) => {
          setCustomStartDate(start)
          setCustomEndDate(end)
        }}
        filters={[
          {
            label: "Location",
            options: locationFilterOptions,
            selectedValues: selectedLocations,
            onSelectionChange: setSelectedLocations,
          },
          {
            label: "Document Type",
            options: documentTypeOptions,
            selectedValues: selectedDocumentTypes,
            onSelectionChange: setSelectedDocumentTypes,
          },
          {
            label: "Status",
            options: statusOptions,
            selectedValues: selectedStatuses,
            onSelectionChange: setSelectedStatuses,
          },
        ]}
        groupByOptions={groupByOptions}
        groupByValue={groupBy}
        onGroupByChange={(value) => setGroupBy(value as GroupByType)}
        onExportCSV={() => console.log("Export CSV")}
        onExportPDF={() => console.log("Export PDF")}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">Total Documents</Typography>
              <Typography variant="h5">{metrics.totalDocuments}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">Expired</Typography>
              <Typography variant="h5" color="error">{metrics.expired}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">Expiring Soon (&lt;30d)</Typography>
              <Typography variant="h5" color="warning.main">{metrics.expiringSoon}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">Valid</Typography>
              <Typography variant="h5" color="success.main">{metrics.valid}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>By Document Type</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(metrics.byDocType).map(([type, count]) => (
          <Grid item xs={6} sm={4} md={2} key={type}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="caption">{type}</Typography>
                <Typography variant="h6">{count as number}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {groupBy !== "none" && groupedData.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Breakdown by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Expired</TableCell>
                  <TableCell align="right">Critical</TableCell>
                  <TableCell align="right">Warning</TableCell>
                  <TableCell align="right">Valid</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupedData.map((row: any) => (
                  <TableRow key={row.key}>
                    <TableCell>{row.key}</TableCell>
                    <TableCell align="right"><strong>{row.count}</strong></TableCell>
                    <TableCell align="right">
                      <Chip label={row.expired} size="small" color="error" />
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={row.critical} size="small" color="error" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={row.warning} size="small" color="warning" />
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={row.valid} size="small" color="success" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Right to Work Expiry Details</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Document Type</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell align="right">Days Until Expiry</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employeesWithRTW.slice(0, 50).map((emp: any) => {
              const dept = departments.find((d: any) => d.id === emp.departmentId)
              
              return (
                <TableRow key={emp.id} sx={{ 
                  backgroundColor: emp.status === "Expired" ? "error.lighter" : 
                                  emp.status === "Critical" ? "error.light" : 
                                  emp.status === "Warning" ? "warning.light" : "inherit"
                }}>
                  <TableCell>{emp.firstName} {emp.lastName}</TableCell>
                  <TableCell>{dept?.name || "-"}</TableCell>
                  <TableCell>{emp.documentType}</TableCell>
                  <TableCell>
                    <strong>
                      {emp.expiryDate ? format(emp.expiryDate, "dd/MM/yyyy") : "-"}
                    </strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong style={{
                      color: emp.daysUntilExpiry < 0 ? "#d32f2f" : 
                            emp.daysUntilExpiry <= 7 ? "#d32f2f" :
                            emp.daysUntilExpiry <= 30 ? "#f57c00" : "#2e7d32"
                    }}>
                      {emp.daysUntilExpiry}
                    </strong>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={emp.status} 
                      size="small" 
                      color={
                        emp.status === "Expired" || emp.status === "Critical" ? "error" :
                        emp.status === "Warning" ? "warning" : "success"
                      }
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {employeesWithRTW.length > 50 && (
        <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
          Showing 50 of {employeesWithRTW.length} documents.
        </Typography>
      )}
    </Box>
  )
}

export default RightToWorkExpiryReport




