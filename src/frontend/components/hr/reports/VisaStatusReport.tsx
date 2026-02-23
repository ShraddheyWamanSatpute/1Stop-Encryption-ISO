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
import { format, differenceInDays, differenceInWeeks, addDays } from "date-fns"
import { 
  filterByCompanyContext, 
  safeArray,
  safeString,
  safeParseDate 
} from "../../../utils/reportHelpers"

type GroupByType = "none" | "visaType" | "location" | "expiryStatus"

const VisaStatusReport: React.FC = () => {
  const { state: hrState } = useHR()
  const { state: companyState } = useCompany()
  const { employees = [], departments = [] } = hrState
  const { sites = [] } = companyState

  const [dateType, setDateType] = useState<"day" | "week" | "month" | "custom">("month")
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date())
  const [customEndDate, setCustomEndDate] = useState<Date>(addDays(new Date(), 90))
  const [groupBy, setGroupBy] = useState<GroupByType>("none")
  const [selectedVisaTypes, setSelectedVisaTypes] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])

  const employeesWithVisas = useMemo(() => {
    try {
      // Filter employees by company context first
      const contextFilteredEmployees = filterByCompanyContext(
        safeArray(employees),
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      )
      
      const today = new Date()
      
      return contextFilteredEmployees
        .filter((emp: any) => emp.visaType || emp.visa)
        .filter((emp: any) => {
          const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(safeString(emp.siteId))
          const matchesDepartment = selectedDepartments.length === 0 || selectedDepartments.includes(safeString(emp.departmentId))
          const visaType = safeString(emp.visaType || emp.visa?.type)
          const matchesVisaType = selectedVisaTypes.length === 0 || selectedVisaTypes.includes(visaType)
          return matchesLocation && matchesDepartment && matchesVisaType
        })
        .map((emp: any) => {
          const visaExpiryDate = safeParseDate(emp.visaExpiryDate || emp.visa?.expiryDate)
          const visaIssueDate = safeParseDate(emp.visaIssueDate || emp.visa?.issueDate)
          const visaType = safeString(emp.visaType || emp.visa?.type, "Unknown")
          
          let daysUntilExpiry = 0
          let weeksRemaining = 0
          let status = "Unknown"
          
          if (visaExpiryDate) {
            daysUntilExpiry = differenceInDays(visaExpiryDate, today)
            weeksRemaining = Math.ceil(differenceInWeeks(visaExpiryDate, today))
            
            if (daysUntilExpiry < 0) {
              status = "Expired"
            } else if (daysUntilExpiry <= 30) {
              status = "Critical"
            } else if (daysUntilExpiry <= 60) {
              status = "Warning"
            } else {
              status = "Valid"
            }
          }
          
          return {
            ...emp,
          visaType,
          visaIssueDate,
          visaExpiryDate,
          daysUntilExpiry,
          weeksRemaining,
          status,
        }
      })
      .sort((a: any, b: any) => {
        if (!a.visaExpiryDate) return 1
        if (!b.visaExpiryDate) return -1
        return a.daysUntilExpiry - b.daysUntilExpiry
      })
    } catch (error) {
      console.error("Error filtering visa holders:", error)
      return []
    }
  }, [employees, selectedLocations, selectedDepartments, selectedVisaTypes, companyState.selectedSiteID, companyState.selectedSubsiteID])

  const metrics = useMemo(() => {
    const totalVisaHolders = employeesWithVisas.length
    const expired = employeesWithVisas.filter((e: any) => e.status === "Expired").length
    const critical = employeesWithVisas.filter((e: any) => e.status === "Critical").length
    const warning = employeesWithVisas.filter((e: any) => e.status === "Warning").length
    const valid = employeesWithVisas.filter((e: any) => e.status === "Valid").length
    const expiringSoon = critical + warning
    
    const byVisaType = employeesWithVisas.reduce((acc: any, emp: any) => {
      if (!acc[emp.visaType]) acc[emp.visaType] = 0
      acc[emp.visaType] += 1
      return acc
    }, {})

    return {
      totalVisaHolders,
      expired,
      critical,
      warning,
      valid,
      expiringSoon,
      byVisaType,
    }
  }, [employeesWithVisas])

  const groupedData = useMemo(() => {
    if (groupBy === "none") return []

    const groups: Record<string, any> = {}

    employeesWithVisas.forEach((emp: any) => {
      let key = ""
      
      switch (groupBy) {
        case "visaType":
          key = emp.visaType
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
  }, [employeesWithVisas, groupBy, sites])

  const locationFilterOptions = useMemo(() => sites.map((site: any) => ({ id: site.id, name: site.name })), [sites])
  const departmentFilterOptions = useMemo(() => departments.map((dept: any) => ({ id: dept.id, name: dept.name })), [departments])
  const visaTypeOptions = useMemo(() => [
    { id: "tier-2", name: "Tier 2 (General)" },
    { id: "skilled-worker", name: "Skilled Worker" },
    { id: "student", name: "Student Visa" },
    { id: "graduate", name: "Graduate Visa" },
    { id: "youth-mobility", name: "Youth Mobility" },
    { id: "spouse", name: "Spouse/Partner" },
    { id: "other", name: "Other" },
  ], [])
  
  const groupByOptions = useMemo(() => [
    { value: "none", label: "No Grouping" },
    { value: "visaType", label: "By Visa Type" },
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
            label: "Visa Type",
            options: visaTypeOptions,
            selectedValues: selectedVisaTypes,
            onSelectionChange: setSelectedVisaTypes,
          },
          {
            label: "Location",
            options: locationFilterOptions,
            selectedValues: selectedLocations,
            onSelectionChange: setSelectedLocations,
          },
          {
            label: "Department",
            options: departmentFilterOptions,
            selectedValues: selectedDepartments,
            onSelectionChange: setSelectedDepartments,
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
              <Typography color="text.secondary" gutterBottom variant="caption">Total Visa Holders</Typography>
              <Typography variant="h5">{metrics.totalVisaHolders}</Typography>
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
              <Typography color="text.secondary" gutterBottom variant="caption">Expiring Soon (&lt;60d)</Typography>
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

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>By Visa Type</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(metrics.byVisaType).map(([type, count]) => (
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

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Visa Status Details</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Visa Type</TableCell>
              <TableCell>Issue Date</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell align="right">Remaining Weeks</TableCell>
              <TableCell align="right">Days Until Expiry</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employeesWithVisas.slice(0, 50).map((emp: any) => (
              <TableRow key={emp.id} sx={{ 
                backgroundColor: emp.status === "Expired" ? "error.lighter" : 
                                emp.status === "Critical" ? "error.light" : 
                                emp.status === "Warning" ? "warning.light" : "inherit"
              }}>
                <TableCell>{emp.firstName} {emp.lastName}</TableCell>
                <TableCell>{emp.visaType}</TableCell>
                <TableCell>
                  {emp.visaIssueDate ? format(emp.visaIssueDate, "dd/MM/yyyy") : "-"}
                </TableCell>
                <TableCell>
                  <strong>
                    {emp.visaExpiryDate ? format(emp.visaExpiryDate, "dd/MM/yyyy") : "-"}
                  </strong>
                </TableCell>
                <TableCell align="right">{emp.weeksRemaining}</TableCell>
                <TableCell align="right">
                  <strong style={{
                    color: emp.daysUntilExpiry < 0 ? "#d32f2f" : 
                          emp.daysUntilExpiry <= 30 ? "#d32f2f" :
                          emp.daysUntilExpiry <= 60 ? "#f57c00" : "#2e7d32"
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {employeesWithVisas.length > 50 && (
        <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
          Showing 50 of {employeesWithVisas.length} visa holders.
        </Typography>
      )}
    </Box>
  )
}

export default VisaStatusReport

