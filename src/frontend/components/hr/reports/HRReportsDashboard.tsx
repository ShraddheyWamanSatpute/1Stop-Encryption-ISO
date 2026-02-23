"use client"

import React, { useState } from "react"
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
} from "@mui/material"
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  ExitToApp as ExitIcon,
  ChangeCircle as ChangeIcon,
  Description as DocumentIcon,
  EventBusy as AbsenceIcon,
  BeachAccess as HolidayIcon,
  LocalHospital as SickIcon,
  VerifiedUser as RightToWorkIcon,
  CardTravel as VisaIcon,
  School as StudentIcon,
  AccountBalance as HMRCIcon,
} from "@mui/icons-material"

import EmployeeDirectoryReport from "./EmployeeDirectoryReport"
import NewStarterFormReport from "./NewStarterFormReport"
import LeaverFormReport from "./LeaverFormReport"
import EmployeeChangesReport from "./EmployeeChangesReport"
import EmployeeDocumentationTrackerReport from "./EmployeeDocumentationTrackerReport"
import AbsenceSummaryReport from "./AbsenceSummaryReport"
import HolidayEntitlementReport from "./HolidayEntitlementReport"
import SicknessLogReport from "./SicknessLogReport"
import RightToWorkExpiryReport from "./RightToWorkExpiryReport"
import VisaStatusReport from "./VisaStatusReport"
import StudentVisaHoursMonitorReport from "./StudentVisaHoursMonitorReport"
import HMRCSubmissionHistoryReport from "./HMRCSubmissionHistoryReport"

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
      id={`hr-reports-tabpanel-${index}`}
      aria-labelledby={`hr-reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

const HRReportsDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          HR Reports
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Comprehensive employee management and compliance reporting
        </Typography>
      </Box>

      <Paper sx={{ width: "100%" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="hr reports tabs"
        >
          <Tab icon={<PeopleIcon />} label="Employee Directory" iconPosition="start" />
          <Tab icon={<PersonAddIcon />} label="New Starters" iconPosition="start" />
          <Tab icon={<ExitIcon />} label="Leavers" iconPosition="start" />
          <Tab icon={<ChangeIcon />} label="Employee Changes" iconPosition="start" />
          <Tab icon={<DocumentIcon />} label="Documentation" iconPosition="start" />
          <Tab icon={<AbsenceIcon />} label="Absence Summary" iconPosition="start" />
          <Tab icon={<HolidayIcon />} label="Holiday Entitlement" iconPosition="start" />
          <Tab icon={<SickIcon />} label="Sickness Log" iconPosition="start" />
          <Tab icon={<RightToWorkIcon />} label="Right to Work" iconPosition="start" />
          <Tab icon={<VisaIcon />} label="Visa Status" iconPosition="start" />
          <Tab icon={<StudentIcon />} label="Student Visa Hours" iconPosition="start" />
          <Tab icon={<HMRCIcon />} label="HMRC Submissions" iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <EmployeeDirectoryReport />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <NewStarterFormReport />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <LeaverFormReport />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <EmployeeChangesReport />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <EmployeeDocumentationTrackerReport />
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <AbsenceSummaryReport />
        </TabPanel>

        <TabPanel value={tabValue} index={6}>
          <HolidayEntitlementReport />
        </TabPanel>

        <TabPanel value={tabValue} index={7}>
          <SicknessLogReport />
        </TabPanel>

        <TabPanel value={tabValue} index={8}>
          <RightToWorkExpiryReport />
        </TabPanel>

        <TabPanel value={tabValue} index={9}>
          <VisaStatusReport />
        </TabPanel>

        <TabPanel value={tabValue} index={10}>
          <StudentVisaHoursMonitorReport />
        </TabPanel>
        <TabPanel value={tabValue} index={11}>
          <HMRCSubmissionHistoryReport />
        </TabPanel>
      </Paper>
    </Box>
  )
}

export default HRReportsDashboard

