import {
  Site,
  Subsite,
  UserProfile,
  SiteInvite,
  CompanyMessage,
  CompanySetup,
  CompanyChecklist,
  ChecklistCompletion,
  SiteDataConfigState
} from "../interfaces/Company"

import {
  createCompanyInDb,
  updateCompanyInDb,
  getCompanyFromDb,
  deleteCompanyFromDb,
  initializePermissionsInDb,
  updateRolePermissionsInDb,
  updateDepartmentPermissionsInDb,
  updateUserPermissionsInDb,
  getPermissionsFromDb,
  initializeConfigInDb,
  updateCompanyConfigInDb,
  updateSiteConfigInDb,
  updateSubsiteConfigInDb,
  getConfigFromDb,
  createSiteInDb,
  updateSiteInDb,
  deleteSiteFromDb,
  getSitesFromDb,
  createSubsiteInDb,
  updateSubsiteInDb,
  deleteSubsiteFromDb,
  getSubsiteFromDb,
  fetchChecklistsFromDb,
  createChecklistInDb,
  updateChecklistInDb,
  deleteChecklistFromDb,
  fetchCompanySetupFromDb,
  saveCompanySetupToDb,
  fetchUserProfileFromDb,
  updateUserProfileInDb,
  fetchCompanyMessagesFromDb,
  createCompanyMessageInDb,
  createSiteInviteInDb,
  getSiteInvitesFromDb,
  getSiteInviteByCodeFromDb,
  updateSiteInviteInDb,
  addUserToCompanyInDb,
  getUserCompaniesFromDb,
  getCompanyUsersFromDb
} from "../rtdatabase/Company"
import { setCurrentCompany } from "../rtdatabase/Settings"
import { createEmployeeJoinCodeInDb, getEmployeeJoinCodesFromDb, revokeEmployeeJoinCodeInDb, setCompanyUserInDb } from "../rtdatabase/Company"

// ========== COMPANY MANAGEMENT FUNCTIONS ==========

/**
 * Create a new company with initialized permissions and configuration
 * @param companyData Company data object
 * @returns Promise<string> Company ID
 */
export const createCompany = async (companyData: any): Promise<string> => {
  try {
    const companyId = await createCompanyInDb(companyData)
    
    // Initialize permissions for the new company
    await initializePermissionsInDb(companyId)
    
    // Initialize configuration for the new company
    await initializeConfigInDb(companyId)
    
    return companyId
  } catch (error) {
    throw new Error(`Error creating company: ${error}`)
  }
}

/**
 * Update company information
 * @param companyId Company ID
 * @param updates Partial company data to update
 * @returns Promise<void>
 */
export const updateCompany = async (companyId: string, updates: any): Promise<void> => {
  try {
    await updateCompanyInDb(companyId, updates)
  } catch (error) {
    throw new Error(`Error updating company: ${error}`)
  }
}

/**
 * Get company data by ID
 * @param companyId Company ID
 * @returns Promise<any | null> Company data or null if not found
 */
export const getCompany = async (companyId: string): Promise<any | null> => {
  try {
    return await getCompanyFromDb(companyId)
  } catch (error) {
    throw new Error(`Error getting company: ${error}`)
  }
}

/**
 * Delete company and all associated data
 * @param companyId Company ID
 * @returns Promise<void>
 */
export const deleteCompany = async (companyId: string): Promise<void> => {
  try {
    await deleteCompanyFromDb(companyId)
  } catch (error) {
    throw new Error(`Error deleting company: ${error}`)
  }
}

// ========== PERMISSION MANAGEMENT FUNCTIONS ==========

/**
 * Update permissions for a specific role
 * @param companyId Company ID
 * @param role Role name
 * @param permissions Boolean array of permissions
 * @returns Promise<void>
 */
export const updateRolePermissions = async (companyId: string, role: string, permissions: boolean[]): Promise<void> => {
  try {
    await updateRolePermissionsInDb(companyId, role, permissions)
  } catch (error) {
    throw new Error(`Error updating role permissions: ${error}`)
  }
}

/**
 * Update permissions for a specific department
 * @param companyId Company ID
 * @param department Department name
 * @param permissions Boolean array of permissions
 * @returns Promise<void>
 */
export const updateDepartmentPermissions = async (companyId: string, department: string, permissions: boolean[]): Promise<void> => {
  try {
    await updateDepartmentPermissionsInDb(companyId, department, permissions)
  } catch (error) {
    throw new Error(`Error updating department permissions: ${error}`)
  }
}

/**
 * Update permissions for a specific user
 * @param companyId Company ID
 * @param userId User ID
 * @param permissions Boolean array of permissions
 * @returns Promise<void>
 */
export const updateUserPermissions = async (companyId: string, userId: string, permissions: boolean[]): Promise<void> => {
  try {
    await updateUserPermissionsInDb(companyId, userId, permissions)
  } catch (error) {
    throw new Error(`Error updating user permissions: ${error}`)
  }
}

/**
 * Get all permissions for a company
 * @param companyId Company ID
 * @returns Promise<any> Permissions object
 */
export const getPermissions = async (companyId: string): Promise<any> => {
  try {
    return await getPermissionsFromDb(companyId)
  } catch (error) {
    throw new Error(`Error getting permissions: ${error}`)
  }
}

/**
 * Get all users for a company
 * @param companyId Company ID
 * @returns Promise<any[]> Array of company users
 */
export const getCompanyUsers = async (companyId: string): Promise<any[]> => {
  try {
    return await getCompanyUsersFromDb(companyId)
  } catch (error) {
    throw new Error(`Error getting company users: ${error}`)
  }
}

// ========== CONFIGURATION MANAGEMENT FUNCTIONS ==========

/**
 * Update company configuration settings
 * @param companyId Company ID
 * @param config String array of configuration settings
 * @returns Promise<void>
 */
export const updateCompanyConfig = async (companyId: string, config: string[]): Promise<void> => {
  try {
    await updateCompanyConfigInDb(companyId, config)
  } catch (error) {
    throw new Error(`Error updating company config: ${error}`)
  }
}

/**
 * Update site configuration settings
 * @param companyId Company ID
 * @param siteId Site ID
 * @param config String array of configuration settings
 * @returns Promise<void>
 */
export const updateSiteConfig = async (companyId: string, siteId: string, config: string[]): Promise<void> => {
  try {
    await updateSiteConfigInDb(companyId, siteId, config)
  } catch (error) {
    throw new Error(`Error updating site config: ${error}`)
  }
}

/**
 * Update subsite configuration settings
 * @param companyId Company ID
 * @param siteId Site ID
 * @param subsiteId Subsite ID
 * @param config String array of configuration settings
 * @returns Promise<void>
 */
export const updateSubsiteConfig = async (companyId: string, siteId: string, subsiteId: string, config: string[]): Promise<void> => {
  try {
    await updateSubsiteConfigInDb(companyId, siteId, subsiteId, config)
  } catch (error) {
    throw new Error(`Error updating subsite config: ${error}`)
  }
}

/**
 * Get configuration settings for a company
 * @param companyId Company ID
 * @returns Promise<any> Configuration object
 */
export const getConfig = async (companyId: string): Promise<any> => {
  try {
    return await getConfigFromDb(companyId)
  } catch (error) {
    throw new Error(`Error getting config: ${error}`)
  }
}

// ========== SITE MANAGEMENT FUNCTIONS ==========

/**
 * Create a new site for a company
 * @param companyId Company ID
 * @param siteData Site data without siteID and companyID
 * @returns Promise<string> Site ID
 */
export const createSite = async (companyId: string, siteData: Omit<Site, 'siteID' | 'companyID'>): Promise<string> => {
  try {
    return await createSiteInDb(companyId, siteData)
  } catch (error) {
    throw new Error(`Error creating site: ${error}`)
  }
}

/**
 * Update site information
 * @param companyId Company ID
 * @param siteId Site ID
 * @param updates Partial site data to update
 * @returns Promise<void>
 */
export const updateSite = async (companyId: string, siteId: string, updates: Partial<Site>): Promise<void> => {
  try {
    await updateSiteInDb(companyId, siteId, updates)
  } catch (error) {
    throw new Error(`Error updating site: ${error}`)
  }
}

/**
 * Delete a site and all associated data
 * @param companyId Company ID
 * @param siteId Site ID
 * @returns Promise<void>
 */
export const deleteSite = async (companyId: string, siteId: string): Promise<void> => {
  try {
    await deleteSiteFromDb(companyId, siteId)
  } catch (error) {
    throw new Error(`Error deleting site: ${error}`)
  }
}

/**
 * Get all sites for a company
 * @param companyId Company ID
 * @returns Promise<Site[]> Array of sites
 */
export const getSites = async (companyId: string): Promise<Site[]> => {
  try {
    return await getSitesFromDb(companyId)
  } catch (error) {
    throw new Error(`Error getting sites: ${error}`)
  }
}

// ========== SUBSITE MANAGEMENT FUNCTIONS ==========

/**
 * Create a new subsite for a site
 * @param companyId Company ID
 * @param siteId Site ID
 * @param subsiteData Subsite data without subsiteID
 * @returns Promise<string> Subsite ID
 */
export const createSubsite = async (companyId: string, siteId: string, subsiteData: Omit<Subsite, 'subsiteID'>): Promise<string> => {
  try {
    return await createSubsiteInDb(companyId, siteId, subsiteData)
  } catch (error) {
    throw new Error(`Error creating subsite: ${error}`)
  }
}

/**
 * Update subsite information
 * @param companyId Company ID
 * @param siteId Site ID
 * @param subsiteId Subsite ID
 * @param updates Partial subsite data to update
 * @returns Promise<void>
 */
export const updateSubsite = async (companyId: string, siteId: string, subsiteId: string, updates: Partial<Subsite>): Promise<void> => {
  try {
    await updateSubsiteInDb(companyId, siteId, subsiteId, updates)
  } catch (error) {
    throw new Error(`Error updating subsite: ${error}`)
  }
}

/**
 * Delete a subsite and all associated data
 * @param companyId Company ID
 * @param siteId Site ID
 * @param subsiteId Subsite ID
 * @returns Promise<void>
 */
export const deleteSubsite = async (companyId: string, siteId: string, subsiteId: string): Promise<void> => {
  try {
    await deleteSubsiteFromDb(companyId, siteId, subsiteId)
  } catch (error) {
    throw new Error(`Error deleting subsite: ${error}`)
  }
}

export const getSubsite = async (companyId: string, siteId: string, subsiteId: string): Promise<Subsite | null> => {
  try {
    return await getSubsiteFromDb(companyId, siteId, subsiteId)
  } catch (error) {
    console.error("Error fetching subsite:", error)
    throw error
  }
}

// ========== CHECKLIST MANAGEMENT FUNCTIONS ==========

/**
 * Get base path for checklist operations based on company, site, and subsite
 * @param companyId Company ID
 * @param siteId Optional site ID
 * @param subsiteId Optional subsite ID
 * @returns string Base path for checklist operations
 */
export const getChecklistBasePath = (companyId: string, siteId?: string, subsiteId?: string): string => {
  if (subsiteId && siteId) {
    return `companies/${companyId}/sites/${siteId}/subsites/${subsiteId}`
  } else if (siteId) {
    return `companies/${companyId}/sites/${siteId}`
  } else {
    return `companies/${companyId}`
  }
}

/**
 * Fetch checklists for company, site, or subsite
 * @param companyId Company ID
 * @param siteId Optional site ID
 * @param subsiteId Optional subsite ID
 * @returns Promise<CompanyChecklist[]> Array of checklists
 */
export const fetchChecklists = async (
  companyId: string,
  siteId?: string,
  subsiteId?: string,
): Promise<CompanyChecklist[]> => {
  try {
    const basePath = getChecklistBasePath(companyId, siteId, subsiteId)
    return await fetchChecklistsFromDb(basePath)
  } catch (error) {
    throw new Error(`Error fetching checklists: ${error}`)
  }
}

/**
 * Create a new checklist
 * @param companyId Company ID
 * @param siteId Optional site ID
 * @param subsiteId Optional subsite ID
 * @param checklist Checklist data without id, createdAt, updatedAt
 * @returns Promise<CompanyChecklist> Created checklist
 */
export const createChecklist = async (
  companyId: string,
  siteId: string | undefined,
  subsiteId: string | undefined,
  checklist: Omit<CompanyChecklist, "id" | "createdAt" | "updatedAt">,
): Promise<CompanyChecklist> => {
  try {
    const basePath = getChecklistBasePath(companyId, siteId, subsiteId)
    return await createChecklistInDb(basePath, checklist)
  } catch (error) {
    throw new Error(`Error creating checklist: ${error}`)
  }
}

/**
 * Update an existing checklist
 * @param companyId Company ID
 * @param siteId Optional site ID
 * @param subsiteId Optional subsite ID
 * @param checklistId Checklist ID
 * @param updates Partial checklist data to update
 * @returns Promise<void>
 */
export const updateChecklist = async (
  companyId: string,
  siteId: string | undefined,
  subsiteId: string | undefined,
  checklistId: string,
  updates: Partial<CompanyChecklist>,
): Promise<void> => {
  try {
    const basePath = getChecklistBasePath(companyId, siteId, subsiteId)
    await updateChecklistInDb(basePath, checklistId, updates)
  } catch (error) {
    throw new Error(`Error updating checklist: ${error}`)
  }
}

/**
 * Delete a checklist
 * @param companyId Company ID
 * @param siteId Optional site ID
 * @param subsiteId Optional subsite ID
 * @param checklistId Checklist ID
 * @returns Promise<void>
 */
export const deleteChecklist = async (
  companyId: string,
  siteId: string | undefined,
  subsiteId: string | undefined,
  checklistId: string,
): Promise<void> => {
  try {
    const basePath = getChecklistBasePath(companyId, siteId, subsiteId)
    await deleteChecklistFromDb(basePath, checklistId)
  } catch (error) {
    throw new Error(`Error deleting checklist: ${error}`)
  }
}

// ========== COMPANY SETUP FUNCTIONS ==========

/**
 * Fetch company setup configuration
 * @param companyId Company ID
 * @returns Promise<CompanySetup | null> Company setup data or null
 */
export const fetchCompanySetup = async (companyId: string): Promise<CompanySetup | null> => {
  try {
    return await fetchCompanySetupFromDb(companyId)
  } catch (error) {
    throw new Error(`Error fetching company setup: ${error}`)
  }
}

/**
 * Save company setup configuration
 * @param companyId Company ID
 * @param setup Company setup data without id
 * @returns Promise<void>
 */
export const saveCompanySetup = async (
  companyId: string,
  setup: Omit<CompanySetup, "id">,
): Promise<void> => {
  try {
    await saveCompanySetupToDb(companyId, setup)
  } catch (error) {
    throw new Error(`Error saving company setup: ${error}`)
  }
}

// ========== USER PROFILE FUNCTIONS ==========

/**
 * Fetch user profile data
 * @param userId User ID
 * @returns Promise<UserProfile | null> User profile data or null
 */
export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    return await fetchUserProfileFromDb(userId)
  } catch (error) {
    throw new Error(`Error fetching user profile: ${error}`)
  }
}

/**
 * Update user profile data
 * @param userId User ID
 * @param updates Partial user profile data to update
 * @returns Promise<void>
 */
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    await updateUserProfileInDb(userId, updates)
  } catch (error) {
    throw new Error(`Error updating user profile: ${error}`)
  }
}

// ========== COMPANY MESSAGES FUNCTIONS ==========

/**
 * Fetch all company messages
 * @param companyId Company ID
 * @returns Promise<CompanyMessage[]> Array of company messages
 */
export const fetchCompanyMessages = async (companyId: string): Promise<CompanyMessage[]> => {
  try {
    return await fetchCompanyMessagesFromDb(companyId)
  } catch (error) {
    throw new Error(`Error fetching company messages: ${error}`)
  }
}

/**
 * Create a new company message
 * @param companyId Company ID
 * @param message Message data without id, createdAt, updatedAt
 * @returns Promise<CompanyMessage> Created message
 */
export const createCompanyMessage = async (
  companyId: string,
  message: Omit<CompanyMessage, "id" | "createdAt" | "updatedAt">,
): Promise<CompanyMessage> => {
  try {
    return await createCompanyMessageInDb(companyId, message)
  } catch (error) {
    throw new Error(`Error creating company message: ${error}`)
  }
}

// ========== SITE INVITE FUNCTIONS ==========

/**
 * Create a new site invite
 * @param companyId Company ID
 * @param siteId Site ID
 * @param inviteData Invite data including email, role, department, and names
 * @returns Promise<string> Invite ID
 */
export const createSiteInvite = async (
  companyId: string,
  siteId: string,
  inviteData: {
    email: string
    role: string
    department: string
    invitedBy: string
    companyName: string
    siteName: string
    invitedByName: string
  },
): Promise<string> => {
  try {
    // Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    const invite = {
      email: inviteData.email,
      companyID: companyId,
      companyName: inviteData.companyName,
      siteId,
      siteName: inviteData.siteName,
      role: inviteData.role,
      department: inviteData.department,
      invitedBy: inviteData.invitedBy,
      invitedByName: inviteData.invitedByName,
      invitedAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending' as const,
      code: inviteCode
    }
    
    return await createSiteInviteInDb(companyId, invite)
  } catch (error) {
    throw new Error(`Error creating site invite: ${error}`)
  }
}

/**
 * Get all site invites for a company
 * @param companyId Company ID
 * @returns Promise<any[]> Array of site invites
 */
export const getSiteInvites = async (companyId: string): Promise<any[]> => {
  try {
    return await getSiteInvitesFromDb(companyId)
  } catch (error) {
    throw new Error(`Error getting site invites: ${error}`)
  }
}

/**
 * Accept a site invite using invite code
 * @param inviteCode Unique invite code
 * @param userId User ID accepting the invite
 * @returns Promise<object> Result object with success status and details
 */
export const acceptSiteInvite = async (
  inviteCode: string,
  userId: string,
): Promise<{
  success: boolean
  message: string
  companyId?: string
  siteId?: string
}> => {
  try {
    // Get invite by code
    const invite = await getSiteInviteByCodeFromDb(inviteCode)
    
    if (!invite) {
      return { success: false, message: "Invalid invite code" }
    }
    
    if (invite.status !== 'pending') {
      return { success: false, message: "Invite has already been used" }
    }
    
    if (invite.expiresAt < Date.now()) {
      return { success: false, message: "Invite has expired" }
    }
    
    // Add user to company
    const companyData = {
      companyID: invite.companyID,
      companyName: invite.companyName,
      role: invite.role,
      department: invite.department,
      siteId: invite.siteId,
      siteName: invite.siteName,
      accessLevel: 'site' as const,
      joinedAt: Date.now(),
    }
    
    await addUserToCompanyInDb(userId, invite.companyID, companyData)
    // Mirror membership under company/users for faster queries elsewhere
    await setCompanyUserInDb(invite.companyID, userId, {
      role: invite.role,
      department: invite.department,
      joinedAt: Date.now(),
    })
    
    // Set current company for the user so the app selects it immediately
    await setCurrentCompany(userId, invite.companyID)
    
    // Update invite status - only update allowed properties
    await updateSiteInviteInDb(invite.id, {
      status: 'accepted'
    })
    
    return {
      success: true,
      message: "Successfully joined company",
      companyId: invite.companyID,
      siteId: invite.siteId
    }
  } catch (error) {
    throw new Error(`Error accepting site invite: ${error}`)
  }
}

/**
 * Get site invite by invite code
 * @param code Invite code
 * @returns Promise<SiteInvite | null> Site invite data or null
 */
export const getSiteInviteByCode = async (code: string): Promise<SiteInvite | null> => {
  try {
    return await getSiteInviteByCodeFromDb(code)
  } catch (error) {
    throw new Error(`Error getting site invite by code: ${error}`)
  }
}

// ========== USER ↔ COMPANY FUNCTIONS ==========

export const addUserToCompany = async (userId: string, companyId: string, companyData: any): Promise<void> => {
  await addUserToCompanyInDb(userId, companyId, companyData)
}

export const getUserCompanies = async (
  uid: string,
): Promise<{ companyID: string; companyName: string; userPermission: string }[]> => {
  return await getUserCompaniesFromDb(uid)
}

// ========== EMPLOYEE INVITE (JOIN CODE) FUNCTIONS ==========

/**
 * Create a join code for an existing employee record.
 * The code is later accepted at /join?code=... by a signed-in user, which links
 * the user's UID to that employee and adds the company to the user's companies.
 */
export const createEmployeeJoinCode = async (
  companyId: string,
  siteId: string,
  employeeId: string,
  roleId?: string,
  expiresInDays: number = 7,
): Promise<string> => {
  try {
    return await createEmployeeJoinCodeInDb({ companyId, siteId, employeeId, roleId, expiresInDays })
  } catch (error) {
    throw new Error(`Error creating employee join code: ${error}`)
  }
}

export const listEmployeeJoinCodes = async (
  companyId: string,
  employeeId?: string,
): Promise<Array<{ code: string; data: any }>> => {
  try {
    return await getEmployeeJoinCodesFromDb(companyId, employeeId)
  } catch (error) {
    throw new Error(`Error listing employee join codes: ${error}`)
  }
}

export const revokeEmployeeJoinCode = async (code: string): Promise<void> => {
  try {
    await revokeEmployeeJoinCodeInDb(code)
  } catch (error) {
    throw new Error(`Error revoking employee join code: ${error}`)
  }
}

/**
 * Type utilities for fixing TypeScript errors in the company management components
 */

/**
 * Type-safe wrapper for setSiteDataConfig to avoid 'implicit any' errors
 * 
 * @param prevState Previous state object
 * @returns Updated state object
 */

export function updateSiteDataConfig(
  prevState: SiteDataConfigState, 
  moduleId: string, 
  sites: string[] | null, 
  subsites: string[] | null
): SiteDataConfigState {
  // Create a safe copy of the state
  const result = { ...prevState };
  
  // Safely update the module config using type assertion for the specific property
  const updatedConfig = {
    ...result,
    [moduleId]: {
      // Use type assertion to safely access dynamic properties
      sites: sites !== null ? sites : ((result as any)[moduleId]?.sites || []),
      subsites: subsites !== null ? subsites : ((result as any)[moduleId]?.subsites || []),
    }
  };
  
  return updatedConfig;
}

/**
 * Helper function to safely convert MUI Select's value to string array
 * 
 * @param value The value from MUI Select component
 * @returns String array representation
 */
export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  return [];
}

// ========== CHECKLIST COMPLETION FUNCTIONS ==========

/**
 * Get the base path for checklist completions
 * @param companyId Company ID
 * @param siteId Optional site ID
 * @param subsiteId Optional subsite ID
 * @returns Base path string
 */
const getChecklistCompletionsPath = (companyId: string, siteId?: string, subsiteId?: string): string => {
  if (subsiteId && siteId) {
    return `companies/${companyId}/sites/${siteId}/subsites/${subsiteId}/checklistCompletions`
  }
  if (siteId) {
    return `companies/${companyId}/sites/${siteId}/checklistCompletions`
  }
  return `companies/${companyId}/checklistCompletions`
}

/**
 * Fetch checklist completions
 * @param companyId Company ID
 * @param siteId Optional site ID
 * @param subsiteId Optional subsite ID
 * @param checklistId Optional checklist ID to filter by
 * @returns Promise<ChecklistCompletion[]> Array of checklist completions
 */
export const fetchChecklistCompletions = async (
  companyId: string,
  siteId?: string,
  subsiteId?: string,
  checklistId?: string,
): Promise<ChecklistCompletion[]> => {
  try {
    const { db, ref, get } = await import("../services/Firebase")
    
    if (!siteId) {
      // If no siteID provided, fetch from all sites
      const sitesRef = ref(db, `companies/${companyId}/sites`)
      const sitesSnapshot = await get(sitesRef)

      if (!sitesSnapshot.exists()) {
        return []
      }

      const allCompletions: ChecklistCompletion[] = []
      const sitesData = sitesSnapshot.val()

      // Iterate through all sites
      for (const currentSiteID of Object.keys(sitesData)) {
        // Fetch completions from site level
        const siteCompletionsRef = ref(db, `companies/${companyId}/sites/${currentSiteID}/checklistCompletions`)
        const siteCompletionsSnapshot = await get(siteCompletionsRef)

        if (siteCompletionsSnapshot.exists()) {
          const completionsData = siteCompletionsSnapshot.val()
          Object.keys(completionsData).forEach((cId) => {
            if (completionsData[cId]) {
              Object.keys(completionsData[cId]).forEach((completionId) => {
                allCompletions.push({
                  ...completionsData[cId][completionId],
                  id: completionId,
                  checklistId: cId,
                })
              })
            }
          })
        }

        // Fetch completions from subsites
        const subsitesRef = ref(db, `companies/${companyId}/sites/${currentSiteID}/subsites`)
        const subsitesSnapshot = await get(subsitesRef)

        if (subsitesSnapshot.exists()) {
          const subsitesData = subsitesSnapshot.val()

          for (const currentSubsiteID of Object.keys(subsitesData)) {
            const subsiteCompletionsRef = ref(
              db,
              `companies/${companyId}/sites/${currentSiteID}/subsites/${currentSubsiteID}/checklistCompletions`,
            )
            const subsiteCompletionsSnapshot = await get(subsiteCompletionsRef)

            if (subsiteCompletionsSnapshot.exists()) {
              const completionsData = subsiteCompletionsSnapshot.val()
              Object.keys(completionsData).forEach((cId) => {
                if (completionsData[cId]) {
                  Object.keys(completionsData[cId]).forEach((completionId) => {
                    allCompletions.push({
                      ...completionsData[cId][completionId],
                      id: completionId,
                      checklistId: cId,
                    })
                  })
                }
              })
            }
          }
        }
      }

      return allCompletions
    }

    // Fetch from specific site/subsite
    const completionsPath = getChecklistCompletionsPath(companyId, siteId, subsiteId)
    const path = checklistId ? `${completionsPath}/${checklistId}` : completionsPath

    const completionsRef = ref(db, path)
    const snapshot = await get(completionsRef)

    if (snapshot.exists()) {
      const completionsData = snapshot.val()

      if (checklistId) {
        // Single checklist completions
        return Object.keys(completionsData).map((id) => ({
          ...completionsData[id],
          id,
          checklistId: checklistId,
        }))
      } else {
        // All completions
        const allCompletions: ChecklistCompletion[] = []
        Object.keys(completionsData).forEach((cId) => {
          if (completionsData[cId]) {
            Object.keys(completionsData[cId]).forEach((completionId) => {
              allCompletions.push({
                ...completionsData[cId][completionId],
                id: completionId,
                checklistId: cId,
              })
            })
          }
        })
        return allCompletions
      }
    }

    return []
  } catch (error) {
    console.error("Error fetching checklist completions:", error)
    throw error
  }
}

// ========== CHECKLIST TYPES FUNCTIONS ==========

/**
 * Fetch checklist types/categories for a company
 * @param companyId Company ID
 * @returns Promise<string[]> Array of checklist category names
 */
export const fetchChecklistTypes = async (companyId: string): Promise<string[]> => {
  try {
    const { db, ref, get } = await import("../services/Firebase")
    const categoriesRef = ref(db, `companies/${companyId}/checklistCategories`)
    const snapshot = await get(categoriesRef)
    
    if (snapshot.exists()) {
      const categories = snapshot.val()
      return Array.isArray(categories) ? categories : Object.values(categories)
    }
    
    // Return default categories if none exist
    return ["Safety", "Maintenance", "Quality", "Operations", "Compliance", "Training"]
  } catch (error) {
    console.error("Error fetching checklist categories:", error)
    return ["Safety", "Maintenance", "Quality", "Operations", "Compliance", "Training"]
  }
}

/**
 * Save a custom checklist category for a company
 * @param companyId Company ID
 * @param category Checklist category name to add
 * @returns Promise<void>
 */
export const saveChecklistType = async (companyId: string, category: string): Promise<void> => {
  try {
    const { db, ref, get, set } = await import("../services/Firebase")
    const categoriesRef = ref(db, `companies/${companyId}/checklistCategories`)
    const snapshot = await get(categoriesRef)
    
    let categories: string[] = []
    if (snapshot.exists()) {
      const existingCategories = snapshot.val()
      categories = Array.isArray(existingCategories) ? existingCategories : Object.values(existingCategories)
    } else {
      // Initialize with default categories
      categories = ["Safety", "Maintenance", "Quality", "Operations", "Compliance", "Training"]
    }
    
    // Add new category if it doesn't exist
    if (!categories.includes(category)) {
      categories.push(category)
      await set(categoriesRef, categories)
    }
  } catch (error) {
    console.error("Error saving checklist category:", error)
    throw error
  }
}

/**
 * Delete a custom checklist category for a company
 * @param companyId Company ID
 * @param category Checklist category name to delete
 * @returns Promise<void>
 */
export const deleteChecklistType = async (companyId: string, category: string): Promise<void> => {
  try {
    const { db, ref, get, set } = await import("../services/Firebase")
    const defaultCategories = ["Safety", "Maintenance", "Quality", "Operations", "Compliance", "Training"]
    if (defaultCategories.includes(category)) {
      throw new Error("Cannot delete default checklist categories")
    }
    
    const categoriesRef = ref(db, `companies/${companyId}/checklistCategories`)
    const snapshot = await get(categoriesRef)
    
    if (snapshot.exists()) {
      const existingCategories = snapshot.val()
      const categories = Array.isArray(existingCategories) ? existingCategories : Object.values(existingCategories)
      const filteredCategories = categories.filter((c: string) => c !== category)
      await set(categoriesRef, filteredCategories)
    }
  } catch (error) {
    console.error("Error deleting checklist category:", error)
    throw error
  }
}
