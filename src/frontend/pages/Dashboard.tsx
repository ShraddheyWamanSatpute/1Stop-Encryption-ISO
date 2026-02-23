"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  LinearProgress,
  Menu,
  MenuItem,
  Checkbox,
  Chip,
} from "@mui/material"
import {
  BarChart,
  TrendingUp,
  ShoppingCart,
  People,
  MoreVert as MoreVertIcon,
  Notifications as NotificationsIcon,
  CalendarToday as CalendarIcon,
  ArrowUpward as ArrowUpwardIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material"
import { useCompany } from "../../backend/context/CompanyContext"
import { useStock } from "../../backend/context/StockContext"
import { useFinance } from "../../backend/context/FinanceContext"
import { useHR } from "../../backend/context/HRContext"
import AnimatedCounter from "../components/reusable/AnimatedCounter"
import CategoryChart from "../components/reusable/CategoryChart"
import { format } from "date-fns"
import StockTable from "../components/stock/StockTable"
import LocationPlaceholder from "../components/common/LocationPlaceholder"

// Mock data for recent activities
const recentActivities = [
  {
    id: 1,
    type: "stock",
    message: "New stock delivery received",
    user: "John Doe",
    avatar: "JD",
    time: "10 minutes ago",
  },
  {
    id: 2,
    type: "order",
    message: "Purchase order #1234 approved",
    user: "Sarah Smith",
    avatar: "SS",
    time: "1 hour ago",
  },
  {
    id: 3,
    type: "booking",
    message: "New booking for Friday evening",
    user: "Mike Johnson",
    avatar: "MJ",
    time: "2 hours ago",
  },
  {
    id: 4,
    type: "finance",
    message: "Monthly financial report ready",
    user: "Emma Wilson",
    avatar: "EW",
    time: "3 hours ago",
  },
  {
    id: 5,
    type: "staff",
    message: "Staff meeting scheduled",
    user: "Robert Brown",
    avatar: "RB",
    time: "Yesterday",
  },
]

// Mock data for upcoming events
const upcomingEvents = [
  {
    id: 1,
    title: "Staff Meeting",
    date: "Today, 2:00 PM",
    location: "Conference Room",
  },
  {
    id: 2,
    title: "Inventory Check",
    date: "Tomorrow, 10:00 AM",
    location: "Warehouse",
  },
  {
    id: 3,
    title: "Supplier Meeting",
    date: format(new Date(new Date().setDate(new Date().getDate() + 2)), "EEE, MMM d, h:mm a"),
    location: "Main Office",
  },
]

// Mock data for tasks
const tasks = [
  {
    id: 1,
    title: "Review inventory levels",
    completed: false,
    priority: "high",
  },
  {
    id: 2,
    title: "Approve purchase orders",
    completed: true,
    priority: "medium",
  },
  {
    id: 3,
    title: "Schedule staff for next week",
    completed: false,
    priority: "high",
  },
  {
    id: 4,
    title: "Follow up with suppliers",
    completed: false,
    priority: "medium",
  },
  { id: 5, title: "Prepare monthly report", completed: false, priority: "low" },
]

const Dashboard: React.FC = () => {
  // Context states
  const { state: companyState } = useCompany()
  const { state: stockState, refreshAll: refreshStock } = useStock()
  const { refreshAll: refreshFinance } = useFinance()
  const { state: hrState } = useHR()

  // Show location placeholder if no company is selected
  if (!companyState.companyID) {
    return <LocationPlaceholder />
  }

  const [activeTab, setActiveTab] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [taskMenuAnchor, setTaskMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [localTasks, setLocalTasks] = useState(tasks)

  // Dashboard metrics derived from contexts
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalSales: 0,
    growth: 0,
    orders: 0,
    customers: 0,
  })

  // Load data from all contexts
  useEffect(() => {
    if (companyState.companyID && companyState.selectedSiteID) {
      const loadAllData = async () => {
        setRefreshing(true)
        try {
          await Promise.all([refreshStock(), refreshFinance()])
        } catch (error) {
          console.error("Error loading dashboard data:", error)
        } finally {
          setRefreshing(false)
        }
      }
      loadAllData()
    }
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID, refreshStock, refreshFinance])

  // Calculate dashboard metrics from context data
  useEffect(() => {
    const calculateMetrics = () => {
      // Calculate total sales from POS bills
      const totalSales = 0

      // Calculate growth (mock calculation based on data availability)
      const growth = stockState.products.length > 0 ? 18.2 : 0

      // Calculate orders from POS bills
      const orders = 0

      // Calculate customers from HR employees (as a proxy)
      const customers = hrState.employees.length * 10 // Assuming each employee serves 10 customers

      setDashboardMetrics({
        totalSales,
        growth,
        orders,
        customers,
      })
    }

    calculateMetrics()
  }, [stockState.products, hrState.employees])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleTaskMenuClick = (event: React.MouseEvent<HTMLButtonElement>, taskId: number) => {
    setTaskMenuAnchor(event.currentTarget)
    setSelectedTaskId(taskId)
  }

  const handleTaskMenuClose = () => {
    setTaskMenuAnchor(null)
    setSelectedTaskId(null)
  }

  const handleTaskToggle = (taskId: number) => {
    setLocalTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
    )
  }

  const handleTaskDelete = () => {
    if (selectedTaskId) {
      setLocalTasks((prevTasks) => prevTasks.filter((task) => task.id !== selectedTaskId))
      handleTaskMenuClose()
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    // Refresh all context data
    Promise.all([refreshStock(), refreshFinance()]).finally(() => {
      setRefreshing(false)
    })
  }

  const completedTasksCount = localTasks.filter((task) => task.completed).length
  const taskCompletionPercentage = (completedTasksCount / localTasks.length) * 100

  // Show message if no company/site selected
  if (!companyState.companyID || !companyState.selectedSiteID) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          p: 3,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Please select a company and site to view dashboard data.
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        p: 3,
        height: "calc(100vh - 64px)",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header with welcome message and quick stats */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
            Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back! Here's what's happening today.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton color="primary" onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
          <IconButton color="primary">
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Button variant="contained" startIcon={<CalendarIcon />}>
            Today: {format(new Date(), "MMM d, yyyy")}
          </Button>
        </Box>
      </Box>

      {refreshing && <LinearProgress sx={{ mb: 3 }} />}

      {/* Key metrics cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%", position: "relative", overflow: "hidden" }}>
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 80,
                height: 80,
                background: "rgba(76, 175, 80, 0.1)",
                borderRadius: "0 0 0 100%",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                p: 1,
              }}
            >
              <BarChart color="primary" />
            </Box>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Sales
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", mt: 1 }}>
                <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                  $<AnimatedCounter value={dashboardMetrics.totalSales} duration={1.5} />
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <ArrowUpwardIcon sx={{ color: "success.main", fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  12%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%", position: "relative", overflow: "hidden" }}>
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 80,
                height: 80,
                background: "rgba(33, 150, 243, 0.1)",
                borderRadius: "0 0 0 100%",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                p: 1,
              }}
            >
              <TrendingUp color="primary" />
            </Box>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Growth
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", mt: 1 }}>
                <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                  <AnimatedCounter value={dashboardMetrics.growth} duration={1.5} decimals={1} />%
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <ArrowUpwardIcon sx={{ color: "success.main", fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  5.4%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%", position: "relative", overflow: "hidden" }}>
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 80,
                height: 80,
                background: "rgba(255, 152, 0, 0.1)",
                borderRadius: "0 0 0 100%",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                p: 1,
              }}
            >
              <ShoppingCart color="primary" />
            </Box>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Orders
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", mt: 1 }}>
                <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                  <AnimatedCounter value={dashboardMetrics.orders} duration={1.5} />
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <ArrowUpwardIcon sx={{ color: "success.main", fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  8%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%", position: "relative", overflow: "hidden" }}>
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 80,
                height: 80,
                background: "rgba(156, 39, 176, 0.1)",
                borderRadius: "0 0 0 100%",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                p: 1,
              }}
            >
              <People color="primary" />
            </Box>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Customers
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", mt: 1 }}>
                <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                  <AnimatedCounter value={dashboardMetrics.customers} duration={1.5} />
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <ArrowUpwardIcon sx={{ color: "success.main", fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  15%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main content area */}
      <Grid container spacing={3} sx={{ flexGrow: 1 }}>
        {/* Left column - Charts and tables */}
        <Grid item xs={12} md={8} sx={{ display: "flex", flexDirection: "column" }}>
          <Card sx={{ mb: 3, height: "calc(50% - 12px)" }}>
            <CardHeader
              title="Performance Overview"
              titleTypographyProps={{ variant: "h6" }}
              action={
                <>
                  <IconButton aria-label="settings" onClick={handleMenuClick}>
                    <MoreVertIcon />
                  </IconButton>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <MenuItem onClick={handleMenuClose}>Daily</MenuItem>
                    <MenuItem onClick={handleMenuClose}>Weekly</MenuItem>
                    <MenuItem onClick={handleMenuClose}>Monthly</MenuItem>
                    <MenuItem onClick={handleMenuClose}>Export Data</MenuItem>
                  </Menu>
                </>
              }
            />
            <CardContent
              sx={{
                height: "calc(100% - 72px)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                <Tab label="Sales" />
                <Tab label="Orders" />
                <Tab label="Customers" />
              </Tabs>
              <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                <CategoryChart dateRange={""} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ height: "calc(50% - 12px)" }}>
            <CardHeader
              title="Recent Stock Activity"
              titleTypographyProps={{ variant: "h6" }}
              action={
                <Button variant="text" color="primary">
                  View All
                </Button>
              }
            />
            <CardContent sx={{ height: "calc(100% - 72px)", overflow: "auto" }}>
              <StockTable />
            </CardContent>
          </Card>
        </Grid>

        {/* Right column - Activity, tasks, and quick actions */}
        <Grid item xs={12} md={4} sx={{ display: "flex", flexDirection: "column" }}>
          {/* Recent Activity */}
          <Card sx={{ mb: 3, height: "33%" }}>
            <CardHeader
              title="Recent Activity"
              titleTypographyProps={{ variant: "h6" }}
              action={
                <Button variant="text" color="primary">
                  View All
                </Button>
              }
            />
            <CardContent sx={{ height: "calc(100% - 72px)", overflow: "auto", pt: 0 }}>
              <List sx={{ p: 0 }}>
                {recentActivities.map((activity) => (
                  <ListItem key={activity.id} alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor:
                            activity.type === "stock"
                              ? "primary.main"
                              : activity.type === "order"
                                ? "secondary.main"
                                : activity.type === "booking"
                                  ? "success.main"
                                  : activity.type === "finance"
                                    ? "warning.main"
                                    : "info.main",
                        }}
                      >
                        {activity.avatar}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.message}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {activity.user}
                          </Typography>
                          {` — ${activity.time}`}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card sx={{ mb: 3, height: "33%" }}>
            <CardHeader
              title="Tasks"
              titleTypographyProps={{ variant: "h6" }}
              subheader={`${completedTasksCount}/${localTasks.length} completed`}
              action={
                <Button variant="text" color="primary">
                  Add Task
                </Button>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <LinearProgress
                variant="determinate"
                value={taskCompletionPercentage}
                sx={{ mb: 2, height: 8, borderRadius: 4 }}
              />
              <List sx={{ p: 0, maxHeight: 200, overflow: "auto" }}>
                {localTasks.map((task) => (
                  <ListItem
                    key={task.id}
                    dense
                    secondaryAction={
                      <IconButton edge="end" aria-label="task options" onClick={(e) => handleTaskMenuClick(e, task.id)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    }
                    sx={{
                      px: 0,
                      textDecoration: task.completed ? "line-through" : "none",
                      color: task.completed ? "text.disabled" : "text.primary",
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Checkbox
                        edge="start"
                        checked={task.completed}
                        onChange={() => handleTaskToggle(task.id)}
                        sx={{ p: 0 }}
                      />
                    </ListItemAvatar>
                    <ListItemText primary={task.title} secondary={task.priority} />
                    <Box sx={{ ml: 1, display: "flex", alignItems: "center" }}>
                      <Chip
                        label={task.priority}
                        size="small"
                        color={task.priority === "high" ? "error" : task.priority === "medium" ? "warning" : "info"}
                        sx={{ height: 20, fontSize: "0.7rem" }}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card sx={{ height: "33%" }}>
            <CardHeader
              title="Upcoming Events"
              titleTypographyProps={{ variant: "h6" }}
              action={
                <Button variant="text" color="primary">
                  View Calendar
                </Button>
              }
            />
            <CardContent sx={{ height: "calc(100% - 72px)", overflow: "auto", pt: 0 }}>
              <List sx={{ p: 0 }}>
                {upcomingEvents.map((event) => (
                  <ListItem key={event.id} alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        <CalendarIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={event.title}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {event.date}
                          </Typography>
                          {` — ${event.location}`}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Task menu */}
      <Menu anchorEl={taskMenuAnchor} open={Boolean(taskMenuAnchor)} onClose={handleTaskMenuClose}>
        <MenuItem
          onClick={() => {
            handleTaskToggle(selectedTaskId || 0)
            handleTaskMenuClose()
          }}
        >
          Toggle Completion
        </MenuItem>
        <MenuItem onClick={handleTaskDelete}>Delete Task</MenuItem>
        <MenuItem onClick={handleTaskMenuClose}>Edit Task</MenuItem>
      </Menu>
    </Box>
  )
}

export default Dashboard
