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
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  DirectionsWalk as WalkInIcon,
  Payment as PaymentIcon,
  Restaurant as RestaurantIcon,
  Source as SourceIcon,
  People as PeopleIcon,
  EventAvailable as EventAvailableIcon,
  Cancel as CancelIcon,
  Event as EventIcon,
} from "@mui/icons-material"

// Import all report components
import BookingsSummaryReport from "./BookingsSummaryReport"
import BookingVelocityReport from "./BookingVelocityReport"
import WalkInLiveBookingsReport from "./WalkInLiveBookingsReport"
import PaymentsDepositsReport from "./PaymentsDepositsReport"
import PreordersPackagesReport from "./PreordersPackagesReport"
import SourceConversionReport from "./SourceConversionReport"
import StaffPerformanceReport from "./StaffPerformanceReport"
import ForecastAvailabilityReport from "./ForecastAvailabilityReport"
import CancellationsNoShowReport from "./CancellationsNoShowReport"
import EventPromotionPerformanceReport from "./EventPromotionPerformanceReport"

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
      id={`booking-reports-tabpanel-${index}`}
      aria-labelledby={`booking-reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

const BookingsReportsDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Bookings Reports
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Comprehensive booking analytics and performance insights
        </Typography>
      </Box>

      <Paper sx={{ width: "100%" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="booking reports tabs"
        >
          <Tab icon={<AssessmentIcon />} label="Bookings Summary" iconPosition="start" />
          <Tab icon={<TrendingUpIcon />} label="Booking Velocity" iconPosition="start" />
          <Tab icon={<WalkInIcon />} label="Walk-in & Live" iconPosition="start" />
          <Tab icon={<PaymentIcon />} label="Payments & Deposits" iconPosition="start" />
          <Tab icon={<RestaurantIcon />} label="Preorders & Packages" iconPosition="start" />
          <Tab icon={<SourceIcon />} label="Source & Conversion" iconPosition="start" />
          <Tab icon={<PeopleIcon />} label="Staff Performance" iconPosition="start" />
          <Tab icon={<EventAvailableIcon />} label="Forecast & Availability" iconPosition="start" />
          <Tab icon={<CancelIcon />} label="Cancellations & No-shows" iconPosition="start" />
          <Tab icon={<EventIcon />} label="Event & Promotion" iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <BookingsSummaryReport />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <BookingVelocityReport />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <WalkInLiveBookingsReport />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <PaymentsDepositsReport />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <PreordersPackagesReport />
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <SourceConversionReport />
        </TabPanel>

        <TabPanel value={tabValue} index={6}>
          <StaffPerformanceReport />
        </TabPanel>

        <TabPanel value={tabValue} index={7}>
          <ForecastAvailabilityReport />
        </TabPanel>

        <TabPanel value={tabValue} index={8}>
          <CancellationsNoShowReport />
        </TabPanel>

        <TabPanel value={tabValue} index={9}>
          <EventPromotionPerformanceReport />
        </TabPanel>
      </Paper>
    </Box>
  )
}

export default BookingsReportsDashboard

