import { db, ref, push, set, get, remove, update } from "../services/Firebase";
import { sensitiveDataService } from "../services/encryption/SensitiveDataService";
import type {
  CompanySetup,
  CompanyMessage,
  UserProfile,
  CompanyChecklist,
  ChecklistCompletion,
  Site,
  Subsite,
  SiteInvite,
  ExtendedCompany} from "../interfaces/Company";

// ========== FIREBASE DATABASE OPERATIONS FOR COMPANY ==========

// ===== COMPANY MANAGEMENT DATABASE FUNCTIONS =====

/**
 * Create company in database
 * @param companyData Company data
 * @returns Company ID
 */
export const createCompanyInDb = async (companyData: Omit<ExtendedCompany, 'companyID'>): Promise<string> => {
  try {
    const companiesRef = ref(db, 'companies');
    const newCompanyRef = push(companiesRef);
    const companyId = newCompanyRef.key!;
    
    let companyWithId = {
      ...companyData,
      companyID: companyId,
    };
    
    // Encrypt sensitive company data before saving if encryption service is initialized
    if (sensitiveDataService.isInitialized()) {
      try {
        const encrypted = await sensitiveDataService.encryptCompanyData(
          companyWithId as unknown as Record<string, unknown>
        );
        companyWithId = encrypted as unknown as typeof companyWithId;
        console.log("[Company] Company data encrypted before storage");
      } catch (encryptError) {
        console.error("[Company] Failed to encrypt company data:", encryptError);
        // In production, fail to prevent unencrypted storage
        if (import.meta.env.PROD) {
          throw new Error("Encryption required in production. Failed to encrypt company data.");
        }
        console.warn("[Company] WARNING: Storing company data without encryption");
      }
    } else {
      // In production, encryption must be initialized
      if (import.meta.env.PROD) {
        throw new Error("Encryption service not initialized. Cannot store company data in production.");
      }
      console.warn("[Company] Encryption service not initialized - storing company data without encryption");
    }
    
    await set(newCompanyRef, companyWithId);
    return companyId;
  } catch (error) {
    throw new Error(`Error creating company: ${error}`);
  }
};

/**
 * Update company in database
 * @param companyId Company ID
 * @param updates Company updates
 */
export const updateCompanyInDb = async (companyId: string, updates: Partial<ExtendedCompany>): Promise<void> => {
  try {
    const companyRef = ref(db, `companies/${companyId}`);
    
    let updatedData: Record<string, unknown> = {
      ...updates,
      updatedAt: Date.now()
    };
    
    // Encrypt sensitive company data before saving if encryption service is initialized
    if (sensitiveDataService.isInitialized()) {
      try {
        updatedData = await sensitiveDataService.encryptCompanyData(updatedData);
        console.log("[Company] Company update data encrypted before storage");
      } catch (encryptError) {
        console.error("[Company] Failed to encrypt company update data:", encryptError);
        // In production, fail to prevent unencrypted storage
        if (import.meta.env.PROD) {
          throw new Error("Encryption required in production. Failed to encrypt company update data.");
        }
        console.warn("[Company] WARNING: Storing company update without encryption");
      }
    } else {
      // In production, encryption must be initialized
      if (import.meta.env.PROD) {
        throw new Error("Encryption service not initialized. Cannot update company data in production.");
      }
      console.warn("[Company] Encryption service not initialized - storing company update without encryption");
    }
    
    await update(companyRef, updatedData);
  } catch (error) {
    throw new Error(`Error updating company: ${error}`);
  }
};

/**
 * Get company from database
 * @param companyId Company ID
 * @returns Company data or null (decrypted if encryption is initialized)
 */
export const getCompanyFromDb = async (companyId: string): Promise<ExtendedCompany | null> => {
  try {
    const companyRef = ref(db, `companies/${companyId}`);
    const snapshot = await get(companyRef);
    
    if (snapshot.exists()) {
      let companyData = snapshot.val() as ExtendedCompany;

      // Decrypt sensitive company data if encryption service is initialized
      if (sensitiveDataService.isInitialized()) {
        try {
          const decrypted = await sensitiveDataService.decryptCompanyData(
            companyData as unknown as Record<string, unknown>
          );
          companyData = decrypted as unknown as ExtendedCompany;
        } catch (decryptError) {
          console.error("[Company] Failed to decrypt company data:", decryptError);
          // Return raw data if decryption fails (e.g. legacy unencrypted data)
        }
      }

      return companyData;
    }
    return null;
  } catch (error) {
    throw new Error(`Error fetching company: ${error}`);
  }
};

/**
 * Delete company from database
 * @param companyId Company ID
 */
export const deleteCompanyFromDb = async (companyId: string): Promise<void> => {
  try {
    const companyRef = ref(db, `companies/${companyId}`);
    await remove(companyRef);
  } catch (error) {
    throw new Error(`Error deleting company: ${error}`);
  }
};

// ===== PERMISSION MANAGEMENT DATABASE FUNCTIONS =====

/**
 * Initialize company permissions in database
 * @param companyId Company ID
 */
export const initializePermissionsInDb = async (companyId: string): Promise<void> => {
  try {
    const permissionsRef = ref(db, `companies/${companyId}/permissions`);
    const defaultPermissions = {
      roles: {},
      departments: {},
      users: {}
    };
    await set(permissionsRef, defaultPermissions);
  } catch (error) {
    throw new Error(`Error initializing permissions: ${error}`);
  }
};

/**
 * Update role permissions in database
 * @param companyId Company ID
 * @param role Role name
 * @param permissions Permission array
 */
export const updateRolePermissionsInDb = async (companyId: string, role: string, permissions: boolean[]): Promise<void> => {
  try {
    const roleRef = ref(db, `companies/${companyId}/permissions/roles/${role}`);
    await set(roleRef, permissions);
  } catch (error) {
    throw new Error(`Error updating role permissions: ${error}`);
  }
};

/**
 * Update department permissions in database
 * @param companyId Company ID
 * @param department Department name
 * @param permissions Permission array
 */
export const updateDepartmentPermissionsInDb = async (companyId: string, department: string, permissions: boolean[]): Promise<void> => {
  try {
    const deptRef = ref(db, `companies/${companyId}/permissions/departments/${department}`);
    await set(deptRef, permissions);
  } catch (error) {
    throw new Error(`Error updating department permissions: ${error}`);
  }
};

/**
 * Update user permissions in database
 * @param companyId Company ID
 * @param userId User ID
 * @param permissions Permission array
 */
export const updateUserPermissionsInDb = async (companyId: string, userId: string, permissions: boolean[]): Promise<void> => {
  try {
    const userRef = ref(db, `companies/${companyId}/permissions/users/${userId}`);
    await set(userRef, permissions);
  } catch (error) {
    throw new Error(`Error updating user permissions: ${error}`);
  }
};

/**
 * Get permissions from database
 * @param companyId Company ID
 * @returns Permissions data
 */
export const getPermissionsFromDb = async (companyId: string): Promise<Record<string, unknown> | null> => {
  try {
    const permissionsRef = ref(db, `companies/${companyId}/permissions`);
    const snapshot = await get(permissionsRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    throw new Error(`Error fetching permissions: ${error}`);
  }
};

// ===== CONFIGURATION MANAGEMENT DATABASE FUNCTIONS =====

/**
 * Initialize company configuration in database
 * @param companyId Company ID
 */
export const initializeConfigInDb = async (companyId: string): Promise<void> => {
  try {
    const configRef = ref(db, `companies/${companyId}/config`);
    const defaultConfig: string[] = [];
    await set(configRef, defaultConfig);
  } catch (error) {
    throw new Error(`Error initializing config: ${error}`);
  }
};

/**
 * Update company config in database
 * @param companyId Company ID
 * @param config Configuration array
 */
export const updateCompanyConfigInDb = async (companyId: string, config: string[]): Promise<void> => {
  try {
    const configRef = ref(db, `companies/${companyId}/config`);
    await set(configRef, config);
  } catch (error) {
    throw new Error(`Error updating company config: ${error}`);
  }
};

/**
 * Update site config in database
 * @param companyId Company ID
 * @param siteId Site ID
 * @param config Configuration array
 */
export const updateSiteConfigInDb = async (companyId: string, siteId: string, config: string[]): Promise<void> => {
  try {
    const configRef = ref(db, `companies/${companyId}/sites/${siteId}/config`);
    await set(configRef, config);
  } catch (error) {
    throw new Error(`Error updating site config: ${error}`);
  }
};

/**
 * Update subsite config in database
 * @param companyId Company ID
 * @param siteId Site ID
 * @param subsiteId Subsite ID
 * @param config Configuration array
 */
export const updateSubsiteConfigInDb = async (companyId: string, siteId: string, subsiteId: string, config: string[]): Promise<void> => {
  try {
    const configRef = ref(db, `companies/${companyId}/sites/${siteId}/subsites/${subsiteId}/config`);
    await set(configRef, config);
  } catch (error) {
    throw new Error(`Error updating subsite config: ${error}`);
  }
};

/**
 * Get config from database
 * @param companyId Company ID
 * @returns Configuration data
 */
export const getConfigFromDb = async (companyId: string): Promise<string[] | null> => {
  try {
    const configRef = ref(db, `companies/${companyId}/config`);
    const snapshot = await get(configRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    throw new Error(`Error fetching config: ${error}`);
  }
};

// ===== SITE MANAGEMENT DATABASE FUNCTIONS =====

/**
 * Create site in database
 * @param companyId Company ID
 * @param siteData Site data
 * @returns Site ID
 */
export const createSiteInDb = async (companyId: string, siteData: Omit<Site, 'siteID' | 'companyID'>): Promise<string> => {
  try {
    const sitesRef = ref(db, `companies/${companyId}/sites`);
    const newSiteRef = push(sitesRef);
    const siteId = newSiteRef.key!;
    
    const siteWithId = {
      ...siteData,
      siteID: siteId,
      companyID: companyId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    await set(newSiteRef, siteWithId);
    return siteId;
  } catch (error) {
    throw new Error(`Error creating site: ${error}`);
  }
};

/**
 * Update site in database
 * @param companyId Company ID
 * @param siteId Site ID
 * @param updates Site updates
 */
export const updateSiteInDb = async (companyId: string, siteId: string, updates: Partial<Site>): Promise<void> => {
  try {
    const siteRef = ref(db, `companies/${companyId}/sites/${siteId}`);
    // If dataManagement is being updated, ensure it has the correct structure
    if (updates.dataManagement) {
      updates.dataManagement = {
        accessibleModules: updates.dataManagement.accessibleModules || {},
        accessibleSites: updates.dataManagement.accessibleSites || [],
        accessibleSubsites: updates.dataManagement.accessibleSubsites || []
      };
    }
    await update(siteRef, { ...updates, updatedAt: Date.now() });
  } catch (error) {
    throw new Error(`Error updating site: ${error}`);
  }
};

/**
 * Delete site from database
 * @param companyId Company ID
 * @param siteId Site ID
 */
export const deleteSiteFromDb = async (companyId: string, siteId: string): Promise<void> => {
  try {
    const siteRef = ref(db, `companies/${companyId}/sites/${siteId}`);
    await remove(siteRef);
  } catch (error) {
    throw new Error(`Error deleting site: ${error}`);
  }
};

/**
 * Get sites from database
 * @param companyId Company ID
 * @returns Array of sites
 */
// Cache for sites to avoid redundant Firebase calls
// Using Map (in-memory) instead of localStorage to avoid quota issues
const sitesCache = new Map<string, { data: Site[], timestamp: number }>();
const SITES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clear cache periodically to prevent memory issues
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of sitesCache.entries()) {
      if (now - value.timestamp > SITES_CACHE_TTL * 2) {
        sitesCache.delete(key);
      }
    }
  }, 10 * 60 * 1000); // Clean every 10 minutes
}

/**
 * OPTIMIZED: Fetch sites with minimal data first, then lazy-load full data
 * This prevents fetching massive nested objects (subsites, data, etc.) on initial load
 */
export const getSitesFromDb = async (companyId: string, _shallow = true): Promise<Site[]> => {
  try {
    // STEP 1: Check SessionPersistence cache first (fastest, persists across page reloads)
    // BUT only use it if sites have subsites (new cache format)
    if (typeof window !== 'undefined') {
      try {
        const { SessionPersistence } = await import('../../frontend/utils/sessionPersistence');
        const sessionCached = SessionPersistence.getCachedSites(companyId);
        if (sessionCached && sessionCached.length > 0) {
          // Validate that cached sites have subsites (new cache format)
          // If they don't have subsites, they're from old cache and we should skip them
          const hasSubsites = sessionCached.some(site => site.subsites && Object.keys(site.subsites || {}).length > 0);
          
          if (hasSubsites) {
            // Also update in-memory cache for faster subsequent calls
            sitesCache.set(companyId, { data: sessionCached, timestamp: Date.now() });
            if (process.env.NODE_ENV === 'development') {
              console.log(`⚡ getSitesFromDb: Using SessionPersistence cache for ${companyId} (${sessionCached.length} sites with subsites)`);
            }
            return sessionCached;
          } else {
            // Old cache format without subsites - skip it and fetch from Firebase
            if (process.env.NODE_ENV === 'development') {
              console.log(`⚠️ getSitesFromDb: Cached sites missing subsites, fetching from Firebase for ${companyId}`);
            }
          }
        }
      } catch (e) {
        // SessionPersistence not available, continue to in-memory cache
      }
    }
    
    // STEP 2: Check in-memory cache (fast, but lost on page reload)
    const cached = sitesCache.get(companyId);
    if (cached && Date.now() - cached.timestamp < SITES_CACHE_TTL) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ getSitesFromDb: Using in-memory cache for ${companyId} (${cached.data.length} sites)`);
      }
      return cached.data;
    }
    
    // CRITICAL OPTIMIZATION: Firebase Realtime Database downloads ENTIRE nested objects
    // When fetching `companies/companyId/sites`, it downloads ALL subsites, teams, data, etc.
    // This can be MBs of data even for a few sites!
    
    // SOLUTION: Fetch only site-level fields, exclude nested children
    // We'll use a workaround: fetch each site individually with only top-level fields
    // OR restructure to fetch minimal data
    
    // Try to get site IDs first (if we had shallow query support)
    // For now, fetch all but only process minimal fields
    const sitesRef = ref(db, `companies/${companyId}/sites`);
    const startTime = performance.now();
    const snapshot = await get(sitesRef);
    const fetchTime = performance.now() - startTime;
    
    if (snapshot.exists()) {
      const sitesData = snapshot.val();
      const processStartTime = performance.now();
      
      // CRITICAL OPTIMIZATION: Extract minimal data but keep subsites (needed for SubsiteDropdown)
      // Include subsites but only with minimal fields (ID, name) - exclude other nested data
      const sites = Object.entries(sitesData as Record<string, unknown>).map(([siteId, rawData]) => {
        const data = rawData as Record<string, unknown>;
        const minimalSite: Record<string, unknown> = {
          siteID: siteId,
          companyID: companyId,
          name: (data.name as string) || '',
          description: (data.description as string) || '',
          address: (data.address as Record<string, unknown>) || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          },
          createdAt: (data.createdAt as number) || Date.now(),
          updatedAt: (data.updatedAt as number) || Date.now(),
        };
        
        // Include subsites but only with minimal data (ID and name)
        // This is needed for SubsiteDropdown to work
        if (data.subsites && typeof data.subsites === 'object') {
          const minimalSubsites: Record<string, unknown> = {};
          Object.entries(data.subsites as Record<string, unknown>).forEach(([subsiteId, rawSubsite]) => {
            const subsiteData = rawSubsite as Record<string, unknown>;
            if (subsiteData && typeof subsiteData === 'object') {
              // Only include essential subsite fields
              minimalSubsites[subsiteId] = {
                subsiteID: subsiteId,
                name: (subsiteData.name as string) || '',
                description: (subsiteData.description as string) || '',
                location: (subsiteData.location as string) || '',
                // Exclude address, data, teams, and other heavy nested objects
              };
            }
          });
          if (Object.keys(minimalSubsites).length > 0) {
            minimalSite.subsites = minimalSubsites;
          }
        }
        
        // Explicitly exclude: teams, data, and other heavy nested structures
        // They'll be loaded on-demand when needed
        
        return minimalSite as unknown as Site;
      });
      
      const processTime = performance.now() - processStartTime;
      
      // Cache the result
      sitesCache.set(companyId, { data: sites, timestamp: Date.now() });
      console.log(`✅ getSitesFromDb: Fetched ${sites.length} sites in ${fetchTime.toFixed(0)}ms (processed in ${processTime.toFixed(0)}ms, excluded nested data)`);
      
      return sites;
    }
    
    // Cache empty result too to avoid repeated queries
    sitesCache.set(companyId, { data: [], timestamp: Date.now() });
    return [];
  } catch (error) {
    console.error(`❌ Error fetching sites for ${companyId}:`, error);
    // Return cached data even if expired on error - better UX than failing
    const cached = sitesCache.get(companyId);
    if (cached) {
      console.log(`⚠️ getSitesFromDb: Using expired cache due to error (${cached.data.length} sites)`);
      return cached.data;
    }
    // If no cache and error, return empty array instead of throwing
    console.warn(`⚠️ getSitesFromDb: No cache available, returning empty array`);
    return [];
  }
};

// ===== SUBSITE MANAGEMENT DATABASE FUNCTIONS =====

/**
 * Create subsite in database
 * @param companyId Company ID
 * @param siteId Site ID
 * @param subsiteData Subsite data
 * @returns Subsite ID
 */
export const createSubsiteInDb = async (companyId: string, siteId: string, subsiteData: Omit<Subsite, 'subsiteID'>): Promise<string> => {
  try {
    const subsitesRef = ref(db, `companies/${companyId}/sites/${siteId}/subsites`);
    const newSubsiteRef = push(subsitesRef);
    const subsiteId = newSubsiteRef.key!;
    
    const subsiteWithId = {
      ...subsiteData,
      subsiteID: subsiteId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    await set(newSubsiteRef, subsiteWithId);
    return subsiteId;
  } catch (error) {
    throw new Error(`Error creating subsite: ${error}`);
  }
};

/**
 * Update subsite in database
 * @param companyId Company ID
 * @param siteId Site ID
 * @param subsiteId Subsite ID
 * @param updates Subsite updates
 */
export const updateSubsiteInDb = async (companyId: string, siteId: string, subsiteId: string, updates: Partial<Subsite>): Promise<void> => {
  try {
    const subsiteRef = ref(db, `companies/${companyId}/sites/${siteId}/subsites/${subsiteId}`);
    // If dataManagement is being updated, ensure it has the correct structure
    if (updates.dataManagement) {
      updates.dataManagement = {
        accessibleModules: updates.dataManagement.accessibleModules || {},
        accessibleSites: updates.dataManagement.accessibleSites || [],
        accessibleSubsites: updates.dataManagement.accessibleSubsites || []
      };
    }
    await update(subsiteRef, { ...updates, updatedAt: Date.now() });
  } catch (error) {
    throw new Error(`Error updating subsite: ${error}`);
  }
};

/**
 * Get subsite from database
 * @param companyId Company ID
 * @param siteId Site ID
 * @param subsiteId Subsite ID
 * @returns Subsite data or null
 */
export const getSubsiteFromDb = async (companyId: string, siteId: string, subsiteId: string): Promise<Subsite | null> => {
  try {
    const subsiteRef = ref(db, `companies/${companyId}/sites/${siteId}/subsites/${subsiteId}`);
    const snapshot = await get(subsiteRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as Subsite;
    }
    return null;
  } catch (error) {
    throw new Error(`Error fetching subsite: ${error}`);
  }
};

/**
 * Delete subsite from database
 * @param companyId Company ID
 * @param siteId Site ID
 * @param subsiteId Subsite ID
 */
export const deleteSubsiteFromDb = async (companyId: string, siteId: string, subsiteId: string): Promise<void> => {
  try {
    const subsiteRef = ref(db, `companies/${companyId}/sites/${siteId}/subsites/${subsiteId}`);
    await remove(subsiteRef);
  } catch (error) {
    throw new Error(`Error deleting subsite: ${error}`);
  }
};

// ===== CHECKLIST DATABASE FUNCTIONS =====

/**
 * Fetch checklists from database
 * @param basePath Base path for checklists
 * @returns Array of checklists
 */
export const fetchChecklistsFromDb = async (basePath: string): Promise<CompanyChecklist[]> => {
  try {
    const checklistsRef = ref(db, `${basePath}/checklists`);
    const snapshot = await get(checklistsRef);
    
    if (snapshot.exists()) {
      const checklistsData = snapshot.val();
      return Object.entries(checklistsData).map(([id, data]) => ({
        id,
        ...(data as Omit<CompanyChecklist, 'id'>)
      }));
    }
    return [];
  } catch (error) {
    throw new Error(`Error fetching checklists: ${error}`);
  }
};

/**
 * Create checklist in database
 * @param basePath Base path for checklist
 * @param checklist Checklist data
 * @returns Checklist with ID
 */
export const createChecklistInDb = async (basePath: string, checklist: Omit<CompanyChecklist, "id" | "createdAt" | "updatedAt">): Promise<CompanyChecklist> => {
  try {
    const checklistsRef = ref(db, `${basePath}/checklists`);
    const newChecklistRef = push(checklistsRef);
    const checklistId = newChecklistRef.key!;
    
    const checklistWithId = {
      ...checklist,
      id: checklistId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    await set(newChecklistRef, checklistWithId);
    return checklistWithId;
  } catch (error) {
    throw new Error(`Error creating checklist: ${error}`);
  }
};

/**
 * Update checklist in database
 * @param basePath Base path for checklist
 * @param checklistId Checklist ID
 * @param updates Checklist updates
 */
export const updateChecklistInDb = async (basePath: string, checklistId: string, updates: Partial<CompanyChecklist>): Promise<void> => {
  try {
    const checklistRef = ref(db, `${basePath}/checklists/${checklistId}`);
    await update(checklistRef, { ...updates, updatedAt: Date.now() });
  } catch (error) {
    throw new Error(`Error updating checklist: ${error}`);
  }
};

/**
 * Delete checklist from database
 * @param basePath Base path for checklist
 * @param checklistId Checklist ID
 */
export const deleteChecklistFromDb = async (basePath: string, checklistId: string): Promise<void> => {
  try {
    const checklistRef = ref(db, `${basePath}/checklists/${checklistId}`);
    await remove(checklistRef);
  } catch (error) {
    throw new Error(`Error deleting checklist: ${error}`);
  }
};

// ===== CHECKLIST COMPLETION DATABASE FUNCTIONS =====

/**
 * Fetch checklist completions from database
 * @param completionsPath Path for completions
 * @returns Array of completions
 */
export const fetchChecklistCompletionsFromDb = async (completionsPath: string): Promise<ChecklistCompletion[]> => {
  try {
    const completionsRef = ref(db, completionsPath);
    const snapshot = await get(completionsRef);
    
    if (snapshot.exists()) {
      const completionsData = snapshot.val();
      return Object.entries(completionsData).map(([id, data]) => ({
        id,
        ...(data as Omit<ChecklistCompletion, 'id'>)
      }));
    }
    return [];
  } catch (error) {
    throw new Error(`Error fetching checklist completions: ${error}`);
  }
};

/**
 * Create checklist completion in database
 * @param completionsPath Path for completions
 * @param completion Completion data
 * @returns Completion with ID
 */
export const createChecklistCompletionInDb = async (completionsPath: string, completion: Omit<ChecklistCompletion, "id">): Promise<ChecklistCompletion> => {
  try {
    const completionsRef = ref(db, completionsPath);
    const newCompletionRef = push(completionsRef);
    const completionId = newCompletionRef.key!;
    
    const completionWithId = {
      ...completion,
      id: completionId,
    };
    
    await set(newCompletionRef, completionWithId);
    return completionWithId;
  } catch (error) {
    throw new Error(`Error creating checklist completion: ${error}`);
  }
};

// ===== COMPANY SETUP DATABASE FUNCTIONS =====

/**
 * Fetch company setup from database
 * @param companyId Company ID
 * @returns Company setup data
 */
export const fetchCompanySetupFromDb = async (companyId: string): Promise<CompanySetup | null> => {
  try {
    const setupRef = ref(db, `companies/${companyId}/setup`);
    const snapshot = await get(setupRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as CompanySetup;
    }
    return null;
  } catch (error) {
    throw new Error(`Error fetching company setup: ${error}`);
  }
};

/**
 * Save company setup to database
 * @param companyId Company ID
 * @param setup Setup data
 */
export const saveCompanySetupToDb = async (companyId: string, setup: Omit<CompanySetup, "id">): Promise<void> => {
  try {
    const setupRef = ref(db, `companies/${companyId}/setup`);
    const setupWithId = {
      ...setup,
      id: companyId,
      updatedAt: Date.now(),
    };
    await set(setupRef, setupWithId);
  } catch (error) {
    throw new Error(`Error saving company setup: ${error}`);
  }
};

// ===== USER PROFILE DATABASE FUNCTIONS =====

/**
 * Fetch user profile from database
 * @param userId User ID
 * @returns User profile data
 */
export const fetchUserProfileFromDb = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as UserProfile;
    }
    return null;
  } catch (error) {
    throw new Error(`Error fetching user profile: ${error}`);
  }
};

/**
 * Update user profile in database
 * @param userId User ID
 * @param updates Profile updates
 */
export const updateUserProfileInDb = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, { ...updates, updatedAt: Date.now() });
  } catch (error) {
    throw new Error(`Error updating user profile: ${error}`);
  }
};

// ===== COMPANY MESSAGES DATABASE FUNCTIONS =====

/**
 * Fetch company messages from database
 * @param companyId Company ID
 * @returns Array of messages
 */
export const fetchCompanyMessagesFromDb = async (companyId: string): Promise<CompanyMessage[]> => {
  try {
    const messagesRef = ref(db, `companies/${companyId}/messages`);
    const snapshot = await get(messagesRef);
    
    if (snapshot.exists()) {
      const messagesData = snapshot.val();
      return Object.entries(messagesData).map(([id, data]) => ({
        id,
        ...(data as Omit<CompanyMessage, 'id'>)
      }));
    }
    return [];
  } catch (error) {
    throw new Error(`Error fetching company messages: ${error}`);
  }
};

/**
 * Create company message in database
 * @param companyId Company ID
 * @param message Message data
 * @returns Message with ID
 */
export const createCompanyMessageInDb = async (companyId: string, message: Omit<CompanyMessage, "id" | "createdAt" | "updatedAt">): Promise<CompanyMessage> => {
  try {
    const messagesRef = ref(db, `companies/${companyId}/messages`);
    const newMessageRef = push(messagesRef);
    const messageId = newMessageRef.key!;
    
    const messageWithId = {
      ...message,
      id: messageId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    await set(newMessageRef, messageWithId);
    return messageWithId;
  } catch (error) {
    throw new Error(`Error creating company message: ${error}`);
  }
};

// ===== SITE INVITE DATABASE FUNCTIONS =====

/**
 * Create site invite in database
 * @param _companyId Company ID
 * @param inviteData Invite data
 * @returns Invite ID
 */
export const createSiteInviteInDb = async (_companyId: string, inviteData: Omit<SiteInvite, 'id' | 'inviteID'>): Promise<string> => {
  try {
    const invitesRef = ref(db, 'siteInvites');
    const newInviteRef = push(invitesRef);
    const inviteId = newInviteRef.key!;
    
    const inviteWithId = {
      ...inviteData,
      id: inviteId,
      inviteID: inviteId,
    };
    
    await set(newInviteRef, inviteWithId);
    return inviteId;
  } catch (error) {
    throw new Error(`Error creating site invite: ${error}`);
  }
};

/**
 * Get site invites from database
 * @param companyId Company ID
 * @returns Array of invites
 */
export const getSiteInvitesFromDb = async (companyId: string): Promise<SiteInvite[]> => {
  try {
    const invitesRef = ref(db, 'siteInvites');
    const snapshot = await get(invitesRef);
    
    if (snapshot.exists()) {
      const invitesData = snapshot.val();
      return Object.entries(invitesData)
        .filter(([_id, raw]) => {
          const data = raw as SiteInvite;
          return data.companyID === companyId;
        })
        .map(([id, raw]) => {
          const data = raw as SiteInvite;
          return {
          id,
          ...(data as Omit<SiteInvite, 'id'>)
          };
        });
    }
    return [];
  } catch (error) {
    throw new Error(`Error fetching site invites: ${error}`);
  }
};

/**
 * Get site invite by code from database
 * @param inviteCode Invite code
 * @returns Site invite data
 */
export const getSiteInviteByCodeFromDb = async (inviteCode: string): Promise<SiteInvite | null> => {
  try {
    const invitesRef = ref(db, 'siteInvites');
    const snapshot = await get(invitesRef);
    
    if (snapshot.exists()) {
      const invitesData = snapshot.val();
      const inviteEntry = Object.entries(invitesData).find(([_id, raw]) => {
        const data = raw as SiteInvite;
        return data.code === inviteCode;
      });
      
      if (inviteEntry) {
        const [id, data] = inviteEntry;
        return {
          id,
          ...(data as Omit<SiteInvite, 'id'>)
        };
      }
    }
    return null;
  } catch (error) {
    throw new Error(`Error fetching site invite by code: ${error}`);
  }
};

/**
 * Update site invite in database
 * @param inviteId Invite ID
 * @param updates Invite updates
 */
export const updateSiteInviteInDb = async (inviteId: string, updates: Partial<SiteInvite>): Promise<void> => {
  try {
    const inviteRef = ref(db, `siteInvites/${inviteId}`);
    await update(inviteRef, updates);
  } catch (error) {
    throw new Error(`Error updating site invite: ${error}`);
  }
};

/**
 * Add user to company in database
 * @param userId User ID
 * @param companyId Company ID
 * @param companyData Company association data
 */
export const addUserToCompanyInDb = async (userId: string, companyId: string, companyData: Record<string, unknown>): Promise<void> => {
  try {
    const userCompanyRef = ref(db, `users/${userId}/companies/${companyId}`);
    await set(userCompanyRef, companyData);
  } catch (error) {
    throw new Error(`Error adding user to company: ${error}`);
  }
};

/**
 * Also reflect membership under company node for quick lookups
 */
export const setCompanyUserInDb = async (
  companyId: string,
  userId: string,
  data: { role?: string; department?: string; joinedAt?: number; email?: string; displayName?: string }
): Promise<void> => {
  try {
    const companyUserRef = ref(db, `companies/${companyId}/users/${userId}`)
    await set(companyUserRef, data)
  } catch (error) {
    throw new Error(`Error setting company user: ${error}`)
  }
}

// ===== EMPLOYEE INVITE (JOIN CODE) DATABASE FUNCTIONS =====

/**
 * Create an employee-specific join code in the database.
 * This join code can be used at /join?code=... to link a signed-in user
 * to an existing employee record and add the company to the user's companies.
 *
 * Stored under: joinCodes/{code}
 */
export const createEmployeeJoinCodeInDb = async (params: {
  companyId: string
  siteId: string
  employeeId: string
  roleId?: string
  expiresInDays?: number
}): Promise<string> => {
  try {
    const { companyId, siteId, employeeId, roleId, expiresInDays = 7 } = params
    const code = Math.random().toString(36).substring(2, 10).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase()
    const joinRef = ref(db, `joinCodes/${code}`)
    const record = {
      companyId,
      siteId,
      employeeId,
      roleId: roleId || null,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
      used: false,
      type: "employee" as const,
    }
    await set(joinRef, record)
    return code
  } catch (error) {
    throw new Error(`Error creating employee join code: ${error}`)
  }
}

/**
 * Get employee join codes for a company, optionally filtered by employeeId
 */
export const getEmployeeJoinCodesFromDb = async (
  companyId: string,
  employeeId?: string,
): Promise<Array<{ code: string; data: Record<string, unknown> }>> => {
  try {
    const codesRef = ref(db, 'joinCodes')
    const snapshot = await get(codesRef)
    if (!snapshot.exists()) return []
    const all = snapshot.val() as Record<string, Record<string, unknown>>
    const results: Array<{ code: string; data: Record<string, unknown> }> = []
    Object.entries(all).forEach(([code, data]) => {
      const d = data as Record<string, unknown>
      if (d && d.type === 'employee' && d.companyId === companyId && (!employeeId || d.employeeId === employeeId)) {
        results.push({ code, data: d })
      }
    })
    // Sort by createdAt desc
  results.sort((a, b) => {
    const aCreated = (a.data.createdAt as number) || 0
    const bCreated = (b.data.createdAt as number) || 0
    return bCreated - aCreated
  })
    return results
  } catch (error) {
    throw new Error(`Error fetching employee join codes: ${error}`)
  }
}

/**
 * Revoke an employee join code by marking it as used and adding revoked flag
 */
export const revokeEmployeeJoinCodeInDb = async (code: string): Promise<void> => {
  try {
    const joinRef = ref(db, `joinCodes/${code}`)
    const snapshot = await get(joinRef)
    if (!snapshot.exists()) return
    await update(joinRef, { used: true, revoked: true, revokedAt: Date.now() })
  } catch (error) {
    throw new Error(`Error revoking employee join code: ${error}`)
  }
}

// ===== ASSIGNMENT OPTIONS DATABASE FUNCTIONS =====

/**
 * Get company users from database
 * @param companyId Company ID
 * @returns Array of users
 */
export const getCompanyUsersFromDb = async (companyId: string): Promise<UserProfile[]> => {
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const companyUsers: UserProfile[] = [];
      
      Object.entries(usersData as Record<string, unknown>).forEach(([userId, rawUser]) => {
        const userData = rawUser as Record<string, unknown>;
        const companies = userData.companies as
          | Record<string, { role?: string; department?: string }>
          | undefined;
        
        if (companies && companies[companyId]) {
          const companyEntry = companies[companyId];
          const userWithMeta = ({
            ...(userData as unknown as Record<string, unknown>),
            uid: userId,
            companyRole: companyEntry.role,
            companyDepartment: companyEntry.department,
          } as unknown) as UserProfile;
          
          companyUsers.push(userWithMeta);
        }
      });
      
      return companyUsers;
    }
    return [];
  } catch (error) {
    throw new Error(`Error fetching company users: ${error}`);
  }
};

// ===== USER ↔ COMPANY RELATION FUNCTIONS =====

/**
 * Fetch list of companies a user belongs to
 * @param uid User ID
 * @returns Array of company entries with permission info
 */
export const getUserCompaniesFromDb = async (
  uid: string,
): Promise<{ companyID: string; companyName: string; userPermission: string }[]> => {
  const userCompaniesRef = ref(db, `users/${uid}/companies`)
  const snapshot = await get(userCompaniesRef)
  if (!snapshot.exists()) return []

  const companiesData = snapshot.val()
  const companyIDs = Object.keys(companiesData)

  const results = await Promise.all(
    companyIDs.map(async (companyID) => {
      const companyRef = ref(db, `companies/${companyID}`)
      const companySnapshot = await get(companyRef)
      if (companySnapshot.exists()) {
        const companyData = companySnapshot.val()
        return {
          companyID,
          companyName: companyData.companyName || "Unknown Company",
          userPermission: companiesData[companyID]?.role || "N/A",
        }
      }
      return null
    }),
  )

  return results.filter(Boolean) as {
    companyID: string
    companyName: string
    userPermission: string
  }[]
}
