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
import { format } from "date-fns"
import { 
  calculateDateRange, 
  filterByCompanyContext, 
  isDateInRange, 
  safeArray,
  safeString,
  safeParseDate 
} from "../../../utils/reportHelpers"
import type { Employee, Department } from "../../../../backend/interfaces/HRs"
import type { Site } from "../../../../backend/interfaces/Company"

interface EmployeeChange {
  id: string
  employeeId: string
  employeeName: string
  departmentId: string
  changeType: string
  oldValue: string
  newValue: string
  effectiveDate: Date
  siteId: string
}

type GroupByType = "none" | "department" | "changeType" | "month"

const EmployeeChangesReport: React.FC = () => {
  const { state: hrState } = useHR()
  const { state: companyState } = useCompany()
  const { employees = [], departments = [] } = hrState
  const { sites = [] } = companyState

  const [dateType, setDateType] = useState<"day" | "week" | "month" | "custom">("month")
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() - 3)))
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date())
  const [groupBy, setGroupBy] = useState<GroupByType>("none")
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedChangeTypes, setSelectedChangeTypes] = useState<string[]>([])

  const { startDate, endDate } = useMemo(() => {
    return calculateDateRange(dateType, currentDate, customStartDate, customEndDate)
  }, [dateType, currentDate, customStartDate, customEndDate])

  // Mock data structure for demonstration
  // In a real system, this would come from a change history/audit log
  const employeeChanges = useMemo(() => {
    try {
      // Filter employees by company context first
      const contextFilteredEmployees = filterByCompanyContext(
        safeArray(employees),
        companyState.selectedSiteID,
        companyState.selectedSubsiteID
      )
      
      // This is a placeholder - in reality you'd track changes in a separate collection
      const changes: EmployeeChange[] = []
      
      // Example: Generate sample data from recent employee updates
      contextFilteredEmployees.forEach((emp: Employee) => {
        if (emp.updatedAt && isDateInRange(emp.updatedAt, startDate, endDate)) {
          // Check for various types of changes
          if ((emp as Employee & { lastPromotion?: number }).lastPromotion) {
            changes.push({
              id: `${emp.id}-promotion`,
              employeeId: emp.id,
              employeeName: `${safeString(emp.firstName)} ${safeString(emp.lastName)}`,
              departmentId: safeString(emp.departmentId),
              changeType: "Promotion",
              oldValue: safeString((emp as Employee & { previousPosition?: string }).previousPosition, "-"),
              newValue: safeString(emp.jobTitle || emp.position, "-"),
              effectiveDate: safeParseDate((emp as Employee & { lastPromotion?: number }).lastPromotion) || new Date(),
              siteId: safeString(emp.siteId),
            })
          }
          
          const empWithDeptChange = emp as Employee & { departmentChangeDate?: number; previousDepartment?: string }
          if (empWithDeptChange.departmentChangeDate) {
            const dept = safeArray(departments).find((d: Department) => d.id === emp.departmentId)
            changes.push({
              id: `${emp.id}-transfer`,
              employeeId: emp.id,
              employeeName: `${safeString(emp.firstName)} ${safeString(emp.lastName)}`,
              departmentId: safeString(emp.departmentId),
              changeType: "Transfer",
              oldValue: safeString(empWithDeptChange.previousDepartment, "-"),
              newValue: safeString(dept?.name, "-"),
              effectiveDate: safeParseDate(empWithDeptChange.departmentChangeDate) || new Date(),
              siteId: safeString(emp.siteId),
            })
          }
          
          const empWithPayChange = emp as Employee & { lastPayChange?: number; previousSalary?: number }
          if (empWithPayChange.lastPayChange) {
            changes.push({
              id: `${emp.id}-pay`,
              employeeId: emp.id,
              employeeName: `${safeString(emp.firstName)} ${safeString(emp.lastName)}`,
              departmentId: safeString(emp.departmentId),
              changeType: "Pay Change",
              oldValue: empWithPayChange.previousSalary ? `£${empWithPayChange.previousSalary}` : "-",
              newValue: emp.salary ? `£${emp.salary}` : emp.hourlyRate ? `£${emp.hourlyRate}/hr` : "-",
              effectiveDate: safeParseDate(empWithPayChange.lastPayChange) || new Date(),
              siteId: safeString(emp.siteId),
            })
          }
        }
      })
      
      return changes.filter((change: EmployeeChange) => {
        const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(safeString(change.siteId))
        const matchesDepartment = selectedDepartments.length === 0 || selectedDepartments.includes(safeString(change.departmentId))
        const matchesType = selectedChangeTypes.length === 0 || selectedChangeTypes.includes(safeString(change.changeType))
        return matchesLocation && matchesDepartment && matchesType
      })
    } catch (error) {
      console.error("Error calculating employee changes:", error)
      return []
    }
  }, [employees, departments, startDate, endDate, selectedLocations, selectedDepartments, selectedChangeTypes, companyState.selectedSiteID, companyState.selectedSubsiteID])

  const metrics = useMemo(() => {
    const totalChanges = employeeChanges.length
    const promotions = employeeChanges.filter((c: EmployeeChange) => c.changeType === "Promotion").length
    const transfers = employeeChanges.filter((c: EmployeeChange) => c.changeType === "Transfer").length
    const payChanges = employeeChanges.filter((c: EmployeeChange) => c.changeType === "Pay Change").length
    const otherChanges = totalChanges - promotions - transfers - payChanges

    return {
      totalChanges,
      promotions,
      transfers,
      payChanges,
      otherChanges,
    }
  }, [employeeChanges])

  interface GroupedDataItem {
    key: string
    count: number
    promotions: number
    transfers: number
    payChanges: number
  }

  const groupedData = useMemo(() => {
    if (groupBy === "none") return []

    const groups: Record<string, GroupedDataItem> = {}

    employeeChanges.forEach((change: EmployeeChange) => {
      let key = ""
      
      switch (groupBy) {
        case "department": {
          const dept = departments.find((d: Department) => d.id === change.departmentId)
          key = dept?.name || "Unknown"
          break
        }
        case "changeType":
          key = change.changeType
          break
        case "month":
          key = format(change.effectiveDate, "MMMM yyyy")
          break
      }

      if (!groups[key]) {
        groups[key] = {
          key,
          count: 0,
          promotions: 0,
          transfers: 0,
          payChanges: 0,
        }
      }

      groups[key].count += 1
      if (change.changeType === "Promotion") groups[key].promotions += 1
      if (change.changeType === "Transfer") groups[key].transfers += 1
      if (change.changeType === "Pay Change") groups[key].payChanges += 1
    })

    return Object.values(groups).sort((a: GroupedDataItem, b: GroupedDataItem) => b.count - a.count)
  }, [employeeChanges, groupBy, departments])

  const locationFilterOptions = useMemo(() => sites.map((site: Site) => ({ id: site.siteID, name: site.name })), [sites])
  const departmentFilterOptions = useMemo(() => departments.map((dept: Department) => ({ id: dept.id, name: dept.name })), [departments])
  const changeTypeOptions = useMemo(() => [
    { id: "Promotion", name: "Promotion" },
    { id: "Transfer", name: "Transfer" },
    { id: "Pay Change", name: "Pay Change" },
    { id: "Role Change", name: "Role Change" },
    { id: "Location Change", name: "Location Change" },
  ], [])
  
  const groupByOptions = useMemo(() => [
    { value: "none", label: "No Grouping" },
    { value: "department", label: "By Department" },
    { value: "changeType", label: "By Change Type" },
    { value: "month", label: "By Month" },
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
            label: "Change Type",
            options: changeTypeOptions,
            selectedValues: selectedChangeTypes,
            onSelectionChange: setSelectedChangeTypes,
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
              <Typography color="text.secondary" gutterBottom variant="caption">Total Changes</Typography>
              <Typography variant="h5">{metrics.totalChanges}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">Promotions</Typography>
              <Typography variant="h5" color="success.main">{metrics.promotions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">Transfers</Typography>
              <Typography variant="h5">{metrics.transfers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="caption">Pay Changes</Typography>
              <Typography variant="h5">{metrics.payChanges}</Typography>
            </CardContent>
          </Card>
        </Grid>
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
                  <TableCell align="right">Total Changes</TableCell>
                  <TableCell align="right">Promotions</TableCell>
                  <TableCell align="right">Transfers</TableCell>
                  <TableCell align="right">Pay Changes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupedData.map((row: GroupedDataItem) => (
                  <TableRow key={row.key}>
                    <TableCell>{row.key}</TableCell>
                    <TableCell align="right"><strong>{row.count}</strong></TableCell>
                    <TableCell align="right">
                      <Chip label={row.promotions} size="small" color="success" />
                    </TableCell>
                    <TableCell align="right">{row.transfers}</TableCell>
                    <TableCell align="right">{row.payChanges}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Employee Change Details</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Change Type</TableCell>
              <TableCell>Old Value</TableCell>
              <TableCell>New Value</TableCell>
              <TableCell>Effective Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employeeChanges.length > 0 ? (
              employeeChanges.slice(0, 50).map((change: EmployeeChange) => {
                const dept = departments.find((d: Department) => d.id === change.departmentId)
                
                return (
                  <TableRow key={change.id}>
                    <TableCell>{change.employeeName}</TableCell>
                    <TableCell>{dept?.name || "-"}</TableCell>
                    <TableCell>
                      <Chip 
                        label={change.changeType} 
                        size="small" 
                        color={change.changeType === "Promotion" ? "success" : "primary"}
                      />
                    </TableCell>
                    <TableCell>{change.oldValue}</TableCell>
                    <TableCell><strong>{change.newValue}</strong></TableCell>
                    <TableCell>{format(change.effectiveDate, "dd/MM/yyyy")}</TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No employee changes recorded for the selected period.
                    <br />
                    <Typography variant="caption">
                      Note: This report requires change tracking to be enabled. Changes are tracked when employee records are updated.
                    </Typography>
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {employeeChanges.length > 50 && (
        <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
          Showing 50 of {employeeChanges.length} changes.
        </Typography>
      )}
    </Box>
  )
}

export default EmployeeChangesReport




