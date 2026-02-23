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
import { format, subDays } from "date-fns"
import { 
  filterByCompanyContext, 
  safeArray,
  safeString 
} from "../../../utils/reportHelpers"
import type { Employee, Department } from "../../../../backend/interfaces/HRs"
import type { Site } from "../../../../backend/interfaces/Company"

type GroupByType = "none" | "department" | "location" | "employmentType" | "status"

const EmployeeDirectoryReport: React.FC = () => {
  const { state: hrState } = useHR()
  const { state: companyState } = useCompany()
  const { employees = [], departments = [] } = hrState
  const { sites = [] } = companyState

  const [dateType, setDateType] = useState<"day" | "week" | "month" | "custom">("month")
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [customStartDate, setCustomStartDate] = useState<Date>(subDays(new Date(), 30))
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date())
  const [groupBy, setGroupBy] = useState<GroupByType>("none")
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  const filteredEmployees = useMemo(() => {
    try {
      // Filter employees by company context first
      const contextFilteredEmployees = filterByCompanyContext(
        safeArray(employees),
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      )
      
      return contextFilteredEmployees.filter((employee: Employee) => {
        const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(safeString(employee.siteId))
        const matchesDepartment = selectedDepartments.length === 0 || selectedDepartments.includes(safeString(employee.departmentId || employee.department))
        const matchesEmploymentType = selectedEmploymentTypes.length === 0 || selectedEmploymentTypes.includes(safeString(employee.employmentType))
        const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(safeString(employee.status))
        
        return matchesLocation && matchesDepartment && matchesEmploymentType && matchesStatus
      })
    } catch (error) {
      console.error("Error filtering employees:", error)
      return []
    }
  }, [employees, selectedLocations, selectedDepartments, selectedEmploymentTypes, selectedStatuses, companyState.selectedSiteID, companyState.selectedSubsiteID])

  const metrics = useMemo(() => {
    try {
      const totalEmployees = filteredEmployees.length
      const activeEmployees = filteredEmployees.filter((e: Employee) => safeString(e.status) === "active").length
      const inactiveEmployees = filteredEmployees.filter((e: Employee) => {
        const status = safeString(e.status)
        return status === "inactive" || status === "on_leave"
      }).length
      const leavers = filteredEmployees.filter((e: Employee) => safeString(e.status) === "terminated").length
    
      const fullTimeEmployees = filteredEmployees.filter((e: Employee) => e.isFullTime || safeString(e.employmentType) === "full-time").length
      const partTimeEmployees = filteredEmployees.filter((e: Employee) => !e.isFullTime || safeString(e.employmentType) === "part-time").length
      const contractors = filteredEmployees.filter((e: Employee) => safeString(e.employmentType) === "contractor").length

      // Department breakdown
      const departmentBreakdown = filteredEmployees.reduce((acc: Record<string, number>, employee: Employee) => {
        const deptId = safeString(employee.departmentId || employee.department, "Unknown")
        const dept = safeArray(departments).find((d: Department) => d.id === deptId)
        const deptName = dept?.name || deptId
        if (!acc[deptName]) acc[deptName] = 0
        acc[deptName] += 1
        return acc
      }, {})

      return {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        leavers,
        fullTimeEmployees,
        partTimeEmployees,
        contractors,
        departmentBreakdown,
      }
    } catch (error) {
      console.error("Error calculating metrics:", error)
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        inactiveEmployees: 0,
        leavers: 0,
        fullTimeEmployees: 0,
        partTimeEmployees: 0,
        contractors: 0,
        departmentBreakdown: {},
      }
    }
  }, [filteredEmployees, departments])

  interface GroupedDataItem {
    key: string
    total: number
    active: number
    inactive: number
    fullTime: number
    partTime: number
  }

  const groupedData = useMemo(() => {
    if (groupBy === "none") return []

    const groups: Record<string, GroupedDataItem> = {}

    filteredEmployees.forEach((employee: Employee) => {
      let key = ""
      
      switch (groupBy) {
        case "department": {
          const deptId = employee.departmentId || employee.department || "Unknown"
          const dept = departments.find((d: Department) => d.id === deptId)
          key = dept?.name || deptId
          break
        }
        case "location": {
          const site = sites.find((s: Site) => s.siteID === employee.siteId)
          key = site?.name || employee.siteId || "Unknown"
          break
        }
        case "employmentType":
          key = employee.employmentType || (employee.isFullTime ? "Full-Time" : "Part-Time")
          break
        case "status":
          key = employee.status || "Unknown"
          break
      }

      if (!groups[key]) {
        groups[key] = {
          key,
          total: 0,
          active: 0,
          inactive: 0,
          fullTime: 0,
          partTime: 0,
        }
      }

      groups[key].total += 1
      if (employee.status === "active") groups[key].active += 1
      if (employee.status === "inactive" || employee.status === "on_leave") groups[key].inactive += 1
      if (employee.isFullTime || employee.employmentType === "full-time") groups[key].fullTime += 1
      else groups[key].partTime += 1
    })

    return Object.values(groups).sort((a: GroupedDataItem, b: GroupedDataItem) => b.total - a.total)
  }, [filteredEmployees, groupBy, departments, sites])

  const locationFilterOptions = useMemo(() => 
    sites.map((site: Site) => ({ id: site.siteID, name: site.name })),
    [sites]
  )

  const departmentFilterOptions = useMemo(() => 
    departments.map((dept: Department) => ({ id: dept.id, name: dept.name })),
    [departments]
  )

  const employmentTypeOptions = useMemo(() => [
    { id: "full-time", name: "Full-Time" },
    { id: "part-time", name: "Part-Time" },
    { id: "contractor", name: "Contractor" },
    { id: "temporary", name: "Temporary" },
  ], [])

  const statusOptions = useMemo(() => [
    { id: "active", name: "Active" },
    { id: "inactive", name: "Inactive" },
    { id: "on_leave", name: "On Leave" },
    { id: "terminated", name: "Leaver" },
  ], [])

  const groupByOptions = useMemo(() => [
    { value: "none", label: "No Grouping" },
    { value: "department", label: "By Department" },
    { value: "location", label: "By Location" },
    { value: "employmentType", label: "By Employment Type" },
    { value: "status", label: "By Status" },
  ], [])

  return (
    <Box>
      <DataHeader
        showDateControls={true}
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
            label: "Department",
            options: departmentFilterOptions,
            selectedValues: selectedDepartments,
            onSelectionChange: setSelectedDepartments,
          },
          {
            label: "Employment Type",
            options: employmentTypeOptions,
            selectedValues: selectedEmploymentTypes,
            onSelectionChange: setSelectedEmploymentTypes,
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

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">Total Employees</Typography>
              <Typography variant="h5">{metrics.totalEmployees}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">Active</Typography>
              <Typography variant="h5" color="success.main">{metrics.activeEmployees}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">Inactive/On Leave</Typography>
              <Typography variant="h5" color="warning.main">{metrics.inactiveEmployees}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">Leavers</Typography>
              <Typography variant="h5" color="error">{metrics.leavers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">Full-Time</Typography>
              <Typography variant="h6">{metrics.fullTimeEmployees}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">Part-Time</Typography>
              <Typography variant="h6">{metrics.partTimeEmployees}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">Contractors</Typography>
              <Typography variant="h6">{metrics.contractors}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Department Breakdown */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Department Breakdown</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(metrics.departmentBreakdown).slice(0, 6).map(([dept, count]) => (
          <Grid item xs={6} sm={4} md={2} key={dept}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="caption">{dept}</Typography>
                <Typography variant="h6">{count as number}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Grouped Data Table */}
      {groupBy !== "none" && groupedData.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Breakdown by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Active</TableCell>
                  <TableCell align="right">Inactive</TableCell>
                  <TableCell align="right">Full-Time</TableCell>
                  <TableCell align="right">Part-Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupedData.map((row: GroupedDataItem) => (
                  <TableRow key={row.key}>
                    <TableCell>{row.key}</TableCell>
                    <TableCell align="right"><strong>{row.total}</strong></TableCell>
                    <TableCell align="right">
                      <Chip label={row.active} size="small" color="success" />
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={row.inactive} size="small" color={row.inactive > 0 ? "warning" : "default"} />
                    </TableCell>
                    <TableCell align="right">{row.fullTime}</TableCell>
                    <TableCell align="right">{row.partTime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Employee List Table */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Employee Directory</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Employee ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Job Title</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Employment Type</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.slice(0, 50).map((employee: Employee) => {
              const dept = departments.find((d: Department) => d.id === (employee.departmentId || employee.department))
              const site = sites.find((s: Site) => s.siteID === employee.siteId)
              
              return (
                <TableRow key={employee.id}>
                  <TableCell>{employee.employeeID || employee.id}</TableCell>
                  <TableCell>{employee.firstName} {employee.lastName}</TableCell>
                  <TableCell>{employee.jobTitle || employee.position || "-"}</TableCell>
                  <TableCell>{dept?.name || "-"}</TableCell>
                  <TableCell>{site?.name || "-"}</TableCell>
                  <TableCell>{employee.hireDate ? format(new Date(employee.hireDate), "dd/MM/yyyy") : "-"}</TableCell>
                  <TableCell>{employee.employmentType || (employee.isFullTime ? "Full-Time" : "Part-Time")}</TableCell>
                  <TableCell>{employee.email || employee.phone || "-"}</TableCell>
                  <TableCell>
                    <Chip 
                      label={employee.status || "active"} 
                      size="small" 
                      color={employee.status === "active" ? "success" : employee.status === "terminated" ? "error" : "warning"}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {filteredEmployees.length > 50 && (
        <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
          Showing 50 of {filteredEmployees.length} employees. Use filters to narrow results.
        </Typography>
      )}
    </Box>
  )
}

export default EmployeeDirectoryReport

