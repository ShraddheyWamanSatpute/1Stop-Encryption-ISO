"use client"

import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  SelectChangeEvent,
} from "@mui/material"
import { Edit as EditIcon } from "@mui/icons-material"
import { useCompany } from "../../../backend/context/CompanyContext"
import { db, ref, get, set } from "../../../backend/services/Firebase"
import type { Site } from "../../../backend/interfaces/Company"
import DataHeader from "../../components/reusable/DataHeader"

interface UserSiteAccess {
  uid: string
  email: string
  displayName: string
  role: string
  department: string
  accessLevel: "company" | "site" | "subsite"
  assignedSites: string[] // Array of site IDs
  assignedSubsites: string[] // Array of subsite IDs
  assignedSiteNames?: string[]
  assignedSubsiteNames?: string[]
}

const UserSiteAllocation: React.FC = () => {
  const { state: companyState, getCompanyUsers } = useCompany()
  const [users, setUsers] = useState<UserSiteAccess[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserSiteAccess | null>(null)
  const [tempAccessLevel, setTempAccessLevel] = useState<"company" | "site" | "subsite">("company")
  const [tempAssignedSites, setTempAssignedSites] = useState<string[]>([])
  const [tempAssignedSubsites, setTempAssignedSubsites] = useState<string[]>([])
  const [tempUserRole, setTempUserRole] = useState<string>("")

  // Load users and sites
  useEffect(() => {
    if (!companyState.companyID) return
    loadData()
  }, [companyState.companyID])

  const loadData = async () => {
    if (!companyState.companyID) return

    setLoading(true)
    setError(null)

    try {
      // Use sites from CompanyContext
      const sitesList: Site[] = companyState.sites || []
      setSites(sitesList)

      // Load all company users using the context function
      const companyUsers = await getCompanyUsers(companyState.companyID)
      
      const usersList: UserSiteAccess[] = []
      
      for (const userData of companyUsers) {
        const uid = userData.uid || (userData as any).id || ""
        if (!uid) continue

        // Get user's access configuration from their user profile
        const userCompanyRef = ref(db, `users/${uid}/companies/${companyState.companyID}`)
        const userCompanySnapshot = await get(userCompanyRef)
        
        let accessLevel: "company" | "site" | "subsite" = "company"
        let assignedSites: string[] = []
        let assignedSubsites: string[] = []
        
        if (userCompanySnapshot.exists()) {
          const userCompanyData = userCompanySnapshot.val()
          accessLevel = userCompanyData.accessLevel || "company"
          
          // Handle both single site and multiple sites
          if (userCompanyData.assignedSites && Array.isArray(userCompanyData.assignedSites)) {
            assignedSites = userCompanyData.assignedSites
          } else if (userCompanyData.siteId) {
            assignedSites = [userCompanyData.siteId]
          }

          // Handle subsites
          if (userCompanyData.assignedSubsites && Array.isArray(userCompanyData.assignedSubsites)) {
            assignedSubsites = userCompanyData.assignedSubsites
          } else if (userCompanyData.subsiteId) {
            assignedSubsites = [userCompanyData.subsiteId]
          }
        }

        // Get site and subsite names
        const assignedSiteNames = assignedSites
          .map(siteId => sitesList.find(s => s.siteID === siteId)?.name)
          .filter(Boolean) as string[]

        const assignedSubsiteNames: string[] = []
        for (const subsiteId of assignedSubsites) {
          for (const site of sitesList) {
            if (site.subsites) {
              const subsite = Object.values(site.subsites).find((sub: any) => sub.subsiteID === subsiteId)
              if (subsite) {
                assignedSubsiteNames.push((subsite as any).name)
                break
              }
            }
          }
        }

        usersList.push({
          uid,
          email: userData.email || "",
          displayName: userData.displayName || userData.email || "Unknown User",
          role: userData.role || userData.companyRole || "staff",
          department: userData.department || userData.companyDepartment || "general",
          accessLevel,
          assignedSites,
          assignedSubsites,
          assignedSiteNames,
          assignedSubsiteNames,
        })
      }
      
      setUsers(usersList)
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load users and sites")
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: UserSiteAccess) => {
    setSelectedUser(user)
    setTempAccessLevel(user.accessLevel)
    setTempAssignedSites(user.assignedSites || [])
    setTempAssignedSubsites(user.assignedSubsites || [])
    setTempUserRole(user.role || "site")
    setEditDialogOpen(true)
  }

  const handleAccessLevelChange = (event: SelectChangeEvent<"company" | "site" | "subsite">) => {
    const newAccessLevel = event.target.value as "company" | "site" | "subsite"
    setTempAccessLevel(newAccessLevel)
    
    // Clear assigned sites/subsites if access level is company
    if (newAccessLevel === "company") {
      setTempAssignedSites([])
      setTempAssignedSubsites([])
    } else if (newAccessLevel === "site") {
      setTempAssignedSubsites([])
    }
  }

  const handleSiteToggle = (siteId: string) => {
    setTempAssignedSites(prev => {
      if (prev.includes(siteId)) {
        // When unchecking a site, also remove its subsites
        const site = sites.find(s => s.siteID === siteId)
        if (site?.subsites) {
          const subsiteIds = Object.values(site.subsites).map((sub: any) => sub.subsiteID)
          setTempAssignedSubsites(prevSubsites => prevSubsites.filter(id => !subsiteIds.includes(id)))
        }
        return prev.filter(id => id !== siteId)
      } else {
        return [...prev, siteId]
      }
    })
  }

  const handleSubsiteToggle = (subsiteId: string) => {
    setTempAssignedSubsites(prev => {
      if (prev.includes(subsiteId)) {
        return prev.filter(id => id !== subsiteId)
      } else {
        return [...prev, subsiteId]
      }
    })
  }

  const handleSaveUserAllocation = async () => {
    if (!selectedUser || !companyState.companyID) return

    setLoading(true)
    setError(null)

    try {
      // Update user's company data in their profile (users/{uid}/companies/{companyID})
      const userCompanyRef = ref(db, `users/${selectedUser.uid}/companies/${companyState.companyID}`)
      const userCompanySnapshot = await get(userCompanyRef)
      
      if (userCompanySnapshot.exists()) {
        const existingData = userCompanySnapshot.val()
        
        // Prepare updated data for user's profile
        const updatedUserData: any = {
          ...existingData,
          role: tempUserRole,
          accessLevel: tempAccessLevel,
        }

        if (tempAccessLevel === "site" || tempAccessLevel === "subsite") {
          updatedUserData.assignedSites = tempAssignedSites
          updatedUserData.assignedSubsites = tempAssignedSubsites
          
          // For backward compatibility, also set siteId if there's only one site
          if (tempAssignedSites.length === 1) {
            const site = sites.find(s => s.siteID === tempAssignedSites[0])
            updatedUserData.siteId = tempAssignedSites[0]
            updatedUserData.siteName = site?.name || ""
          } else {
            // Remove single site fields if multiple sites are assigned
            delete updatedUserData.siteId
            delete updatedUserData.siteName
          }

          // Handle subsite
          if (tempAssignedSubsites.length === 1) {
            for (const site of sites) {
              if (site.subsites) {
                const subsite = Object.values(site.subsites).find((sub: any) => sub.subsiteID === tempAssignedSubsites[0])
                if (subsite) {
                  updatedUserData.subsiteId = tempAssignedSubsites[0]
                  updatedUserData.subsiteName = (subsite as any).name
                  break
                }
              }
            }
          } else {
            delete updatedUserData.subsiteId
            delete updatedUserData.subsiteName
          }
        } else {
          // Company level access - remove site restrictions
          updatedUserData.assignedSites = []
          updatedUserData.assignedSubsites = []
          delete updatedUserData.siteId
          delete updatedUserData.siteName
          delete updatedUserData.subsiteId
          delete updatedUserData.subsiteName
        }

        // Update in users/{uid}/companies/{companyID}
        await set(userCompanyRef, updatedUserData)

        // Also update role in companies/{companyID}/users/{uid}
        const companyUserRef = ref(db, `companies/${companyState.companyID}/users/${selectedUser.uid}`)
        const companyUserSnapshot = await get(companyUserRef)
        
        if (companyUserSnapshot.exists()) {
          const existingCompanyData = companyUserSnapshot.val()
          await set(companyUserRef, {
            ...existingCompanyData,
            role: tempUserRole,
          })
        }
        
        setSuccess(`Successfully updated ${selectedUser.displayName} to ${tempUserRole} with ${tempAccessLevel} level access`)
        setEditDialogOpen(false)
        setSelectedUser(null)
        
        // Reload data
        await loadData()
      } else {
        setError("User company data not found")
      }
    } catch (err) {
      console.error("Error saving user allocation:", err)
      setError("Failed to save user allocation")
    } finally {
      setLoading(false)
    }
  }

  const getAccessLevelChip = (accessLevel: "company" | "site" | "subsite") => {
    const colors = {
      company: "success",
      site: "primary",
      subsite: "secondary",
    } as const

    return (
      <Chip
        label={accessLevel.charAt(0).toUpperCase() + accessLevel.slice(1)}
        size="small"
        color={colors[accessLevel]}
        variant="outlined"
      />
    )
  }

  const getRoleChip = (role: string) => {
    const colors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
      admin: "error",
      site: "info",
      manager: "warning",
      supervisor: "secondary",
      staff: "default",
    }

    return (
      <Chip
        label={role.charAt(0).toUpperCase() + role.slice(1)}
        size="small"
        color={colors[role] || "default"}
      />
    )
  }

  if (loading && users.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 0 }}>
      <DataHeader
        onRefresh={loadData}
        showDateControls={false}
        additionalControls={
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: "white" }}>
            User Site Allocation
          </Typography>
        }
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

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role Type</TableCell>
                <TableCell>Access Level</TableCell>
                <TableCell>Assigned Sites</TableCell>
                <TableCell>Assigned Subsites</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No users found. Invite users to your company first.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell>{user.displayName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {getRoleChip(user.role)}
                    </TableCell>
                    <TableCell>{getAccessLevelChip(user.accessLevel)}</TableCell>
                    <TableCell>
                      {user.accessLevel === "company" ? (
                        <Typography variant="body2" color="text.secondary">
                          All Sites
                        </Typography>
                      ) : user.assignedSiteNames && user.assignedSiteNames.length > 0 ? (
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                          {user.assignedSiteNames.map((siteName, index) => (
                            <Chip key={index} label={siteName} size="small" />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="error">
                          No sites assigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.accessLevel === "subsite" && user.assignedSubsiteNames && user.assignedSubsiteNames.length > 0 ? (
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                          {user.assignedSubsiteNames.map((subsiteName, index) => (
                            <Chip key={index} label={subsiteName} size="small" variant="outlined" />
                          ))}
                        </Box>
                      ) : user.accessLevel === "subsite" ? (
                        <Typography variant="body2" color="error">
                          No subsites assigned
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEditUser(user)} color="primary">
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit User Access & Role</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 3 }}>
                User: <strong>{selectedUser.displayName}</strong> ({selectedUser.email})
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>User Role</InputLabel>
                <Select
                  value={tempUserRole}
                  label="User Role"
                  onChange={(e) => setTempUserRole(e.target.value)}
                >
                  <MenuItem value="admin">Admin - Full permissions within their access level</MenuItem>
                  <MenuItem value="site">Site - Limited permissions for site operations</MenuItem>
                  <MenuItem value="manager">Manager - Management level permissions</MenuItem>
                  <MenuItem value="supervisor">Supervisor - Supervisory permissions</MenuItem>
                  <MenuItem value="staff">Staff - Basic permissions</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Access Level</InputLabel>
                <Select
                  value={tempAccessLevel}
                  label="Access Level"
                  onChange={handleAccessLevelChange}
                >
                  <MenuItem value="company">Company Level - Access to all sites</MenuItem>
                  <MenuItem value="site">Site Level - Access to specific sites</MenuItem>
                  <MenuItem value="subsite">Subsite Level - Access to specific subsites</MenuItem>
                </Select>
              </FormControl>

              {(tempAccessLevel === "site" || tempAccessLevel === "subsite") && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Select Sites to Assign:
                  </Typography>
                  {sites.length === 0 ? (
                    <Alert severity="info">No sites available. Create sites first.</Alert>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {sites.map((site) => {
                        const siteSubsites = site.subsites && typeof site.subsites === "object" ? Object.values(site.subsites) : []
                        return (
                          <Paper key={site.siteID} variant="outlined" sx={{ p: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={tempAssignedSites.includes(site.siteID)}
                                  onChange={() => handleSiteToggle(site.siteID)}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body1">{site.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {site.address?.street || "No address"}
                                  </Typography>
                                </Box>
                              }
                            />
                            {tempAssignedSites.includes(site.siteID) && tempAccessLevel === "subsite" && siteSubsites.length > 0 && (
                              <Box sx={{ pl: 4, mt: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                                  Select Subsites:
                                </Typography>
                                {siteSubsites.map((subsite: any) => (
                                  <FormControlLabel
                                    key={subsite.subsiteID}
                                    control={
                                      <Checkbox
                                        checked={tempAssignedSubsites.includes(subsite.subsiteID)}
                                        onChange={() => handleSubsiteToggle(subsite.subsiteID)}
                                        size="small"
                                      />
                                    }
                                    label={
                                      <Typography variant="body2">{subsite.name}</Typography>
                                    }
                                    sx={{ display: "block", mb: 0.5 }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Paper>
                        )
                      })}
                    </Box>
                  )}
                </Box>
              )}

              {tempAccessLevel === "site" && tempAssignedSites.length === 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Please select at least one site for site-level access
                </Alert>
              )}
              {tempAccessLevel === "subsite" && (tempAssignedSites.length === 0 || tempAssignedSubsites.length === 0) && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Please select at least one site and one subsite for subsite-level access
                </Alert>
              )}

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Role</strong> determines what actions the user can perform (view, edit, delete).<br />
                  <strong>Access Level</strong> determines which sites the user can see and access.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveUserAllocation}
            variant="contained"
            disabled={
              loading ||
              !tempUserRole ||
              (tempAccessLevel === "site" && tempAssignedSites.length === 0) ||
              (tempAccessLevel === "subsite" && (tempAssignedSites.length === 0 || tempAssignedSubsites.length === 0))
            }
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UserSiteAllocation

