"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { getDatabase, ref, get, remove } from "firebase/database"
import { Page, PageHeader } from "../styles/StyledComponents"
import { People, Search, Refresh, Person, Email, Badge, Delete, Warning } from "@mui/icons-material"
import { useRole } from "../context/RoleContext"

interface StaffMember {
  uid: string
  email: string
  firstName: string
  lastName: string
  role: string
}

const StaffListPage: React.FC = () => {
  const { state: roleState } = useRole()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [openDialog, setOpenDialog] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null)

  const isManager = roleState.role === "Manager"
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  useEffect(() => {
    fetchStaff()
  }, [refreshKey])

  const fetchStaff = async () => {
    setLoading(true)
    setError(null)
    try {
      const db = getDatabase()
      const usersRef = ref(db, "users")
      const snapshot = await get(usersRef)

      if (snapshot.exists()) {
        const data = snapshot.val()
        const staffArray: StaffMember[] = Object.keys(data).map((key) => ({
          uid: key,
          email: data[key].email || "N/A",
          firstName: data[key].firstName || "N/A",
          lastName: data[key].lastName || "N/A",
          role: data[key].role || "Unknown",
        }))

        // Sort by role (Manager first) then by first name
        staffArray.sort((a, b) => {
          if (a.role === "Manager" && b.role !== "Manager") return -1
          if (a.role !== "Manager" && b.role === "Manager") return 1
          return a.firstName.localeCompare(b.firstName)
        })

        setStaff(staffArray)
      } else {
        setStaff([])
      }
    } catch (err) {
      console.error("Error fetching staff:", err)
      setError("Failed to fetch staff list")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const filteredStaff = staff.filter((member) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      member.firstName.toLowerCase().includes(searchLower) ||
      member.lastName.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower) ||
      member.role.toLowerCase().includes(searchLower)
    )
  })

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "manager":
        return "error"
      case "supervisor":
        return "warning"
      case "chef":
        return "info"
      case "server":
        return "success"
      default:
        return "default"
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getRoleStats = () => {
    const stats: Record<string, number> = {}
    staff.forEach((member) => {
      stats[member.role] = (stats[member.role] || 0) + 1
    })
    return stats
  }

  const handleTerminateStaff = (member: StaffMember) => {
    setStaffToDelete(member)
    setOpenDialog(true)
  }

  const confirmTermination = async () => {
    if (!staffToDelete) return

    setLoading(true)
    try {
      const db = getDatabase()
      const userRef = ref(db, `users/${staffToDelete.uid}`)
      await remove(userRef)

      setSuccess(
        `${staffToDelete.firstName} ${staffToDelete.lastName} has been terminated and removed from the system.`,
      )
      setTimeout(() => setSuccess(null), 5000)

      // Refresh the staff list
      fetchStaff()
    } catch (err) {
      console.error("Error terminating staff:", err)
      setError("Failed to terminate staff member. Please try again.")
    } finally {
      setLoading(false)
      setOpenDialog(false)
      setStaffToDelete(null)
    }
  }

  return (
    <Page sx={{ maxWidth: "100vw", overflow: "hidden" }}>
      <PageHeader>
        <Box display="flex" alignItems="center" gap={2} flexDirection={isMobile ? "column" : "row"}>
          <People color="primary" sx={{ fontSize: isMobile ? 28 : 32 }} />
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} component="h1" fontWeight="bold">
              Staff Directory
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              View and manage staff members
            </Typography>
          </Box>
        </Box>
      </PageHeader>

      <Box sx={{ mb: 3 }}></Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }} direction={isMobile ? "column" : "row"}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {staff.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Staff
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {Object.entries(getRoleStats()).map(([role, count]) => (
          <Grid item xs={12} sm={6} md={3} key={role}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" color={getRoleColor(role)} fontWeight="bold">
                  {count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {role}
                  {count !== 1 ? "s" : ""}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search and Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexDirection={isMobile ? "column" : "row"}
            gap={isMobile ? 2 : 0}
            sx={{ width: "100%", maxWidth: "100%" }}
          >
            <TextField
              placeholder="Search staff members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ minWidth: isMobile ? "100%" : 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title="Refresh" placement="bottom">
              <IconButton onClick={handleRefresh} disabled={loading} size={isMobile ? "small" : "medium"}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : filteredStaff.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No staff members found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery ? "No staff members match your search criteria." : "No staff members are registered."}
          </Typography>
        </Paper>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Staff Members ({filteredStaff.length})
            </Typography>
            <TableContainer sx={{ overflowX: "auto", maxWidth: "100%" }}>
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell>Staff Member</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>User ID</TableCell>
                    {isManager && <TableCell align="center">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStaff.map((member) => (
                    <TableRow key={member.uid} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            sx={{
                              bgcolor: getRoleColor(member.role) + ".main",
                              width: isMobile ? 30 : 40,
                              height: isMobile ? 30 : 40,
                              fontSize: isMobile ? "1rem" : "1.25rem",
                            }}
                          >
                            {getInitials(member.firstName, member.lastName)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {member.firstName} {member.lastName}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Person fontSize="small" color="action" />
                              <Typography variant="caption" color="text.secondary">
                                {member.firstName}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.role}
                          color={getRoleColor(member.role) as any}
                          size="small"
                          icon={<Badge />}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Email fontSize="small" color="action" />
                          <Typography variant="body2">{member.email}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                          {member.uid}
                        </Typography>
                      </TableCell>
                      {isManager && (
                        <TableCell align="center">
                          <Tooltip title="Terminate Staff" placement="bottom">
                            <IconButton
                              color="error"
                              onClick={() => handleTerminateStaff(member)}
                              disabled={member.role === "Manager"} // Prevent terminating managers
                              size={isMobile ? "small" : "medium"}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Termination Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullScreen={isMobile}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Warning color="error" />
          Confirm Staff Termination
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to terminate {staffToDelete?.firstName} {staffToDelete?.lastName}? This will
            permanently remove their account and they will no longer have access to the system. This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={confirmTermination} color="error" variant="contained" startIcon={<Delete />}>
            Terminate Staff
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  )
}

export default StaffListPage
