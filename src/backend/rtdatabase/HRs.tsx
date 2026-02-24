"use client"

import { useState, useEffect } from "react"
import { db, ref, set, push, remove, update, onValue, off, get } from "../services/Firebase"
import { calculateHRAnalytics } from "../functions/HRs"
import { sensitiveDataService } from "../services/encryption/SensitiveDataService"
import type {
  Employee,
  Department,
  Role,
  TimeOffRequest,
  PerformanceReview,
  Announcement,
  Benefit,
  Warning,
  Schedule,
  JobPosting,
  Candidate,
  Interview,
  HRAnalytics,
  Contract,
  ContractTemplate,
} from "../interfaces/HRs"

// Define missing interfaces that are used in the component
interface TrainingRecord {
  id: string
  employeeId: string
  title: string
  description?: string
  startDate: number
  endDate?: number
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  type: "onboarding" | "compliance" | "skills" | "leadership" | "other"
  provider?: string
  location?: string
  cost?: number
  notes?: string
  createdAt: number
  updatedAt?: number
}

interface Event {
  id: string
  title: string
  description: string
  type: "meeting" | "training" | "social" | "company_wide" | "department" | "celebration"
  startDate: number
  endDate: number
  startTime: string
  endTime: string
  location: string
  isVirtual: boolean
  virtualLink?: string
  organizer: string
  attendees: string[]
  maxAttendees?: number
  isPublic: boolean
  requiresRSVP: boolean
  status: "draft" | "published" | "cancelled" | "completed"
  tags: string[]
  createdAt: number
  updatedAt?: number
}

interface Recruitment {
  id: string
  jobTitle: string
  department: string
  location: string
  employmentType: "full_time" | "part_time" | "contract" | "temporary"
  description: string
  requirements: string[]
  responsibilities: string[]
  salaryRange: {
    min: number
    max: number
    currency: string
  }
  benefits: string[]
  status: "draft" | "active" | "closed" | "on_hold"
  postedDate: number
  closingDate?: number
  hiringManager: string
  createdAt: number
  updatedAt?: number
}

interface Compliance {
  id: string
  title: string
  description: string
  type: "training" | "certification" | "document" | "review" | "other"
  assignedTo: string[]
  dueDate: number
  completedBy?: string[]
  status: "pending" | "in_progress" | "completed" | "overdue"
  priority: "low" | "medium" | "high" | "critical"
  documents: string[]
  notes?: string
  createdBy: string
  createdAt: number
  updatedAt?: number
}

interface DiversityMetric {
  id: string
  title: string
  category: "training" | "cultural" | "recruitment" | "accessibility"
  description: string
  status: "active" | "planning" | "completed"
  startDate: string
  endDate: string
  participants: number
  budget: number
  progress: number
  createdAt: number
  updatedAt?: number
}


interface ClockInOut {
  id: string
  employeeId: string
  date: number
  clockIn: string
  clockOut?: string
  breakStart?: string
  breakEnd?: string
  totalHours?: number
  status: "present" | "absent" | "late" | "early_departure" | "on_leave"
  notes?: string
  approvedBy?: string
  approvedAt?: number
  createdAt: number
  updatedAt?: number
}

interface PayrollData {
  id: string
  employeeId: string
  employeeName: string
  periodId: string
  periodStartDate: number
  periodEndDate: number
  payPeriodStart: string
  payPeriodEnd: string
  regularHours: number
  overtimeHours: number
  totalHours: number
  hoursWorked: number
  hourlyRate: number
  regularPay: number
  overtimePay: number
  bonuses: number
  grossPay: number
  totalGross: number
  deductions: {
    tax: number
    insurance: number
    retirement: number
    other: number
  }
  totalDeductions: number
  netPay: number
  totalNet: number
  status: "pending" | "approved" | "paid" | "cancelled"
  paymentMethod?: "direct_deposit" | "check" | "cash"
  paymentDate?: string
  notes?: string
  createdAt: number
  updatedAt?: number
}

export const useHRData = (basePath: string) => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([])
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([])
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [warnings, setWarnings] = useState<Warning[]>([])
  const [recruitments, setRecruitments] = useState<Recruitment[]>([])
  const [compliance, setCompliance] = useState<Compliance[]>([])
  const [diversityMetrics, setDiversityMetrics] = useState<DiversityMetric[]>([])
  const [analytics, setAnalytics] = useState<HRAnalytics | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [clockInOuts, setClockInOuts] = useState<ClockInOut[]>([])
  const [payrollData, setPayrollData] = useState<PayrollData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  useEffect(() => {
    if (!basePath) {
      setLoading(false)
      return
    }

    const loadHRData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Set up real-time listeners for all HR data using basePath parameter
        const employeesRef = ref(db, `${basePath}/employees`)
        const departmentsRef = ref(db, `${basePath}/departments`)
        const rolesRef = ref(db, `${basePath}/roles`)
        const timeOffRef = ref(db, `${basePath}/timeOffRequests`)
        const performanceRef = ref(db, `${basePath}/performanceReviews`)
        const trainingRef = ref(db, `${basePath}/trainingRecords`)
        const announcementsRef = ref(db, `${basePath}/announcements`)
        const eventsRef = ref(db, `${basePath}/events`)
        const benefitsRef = ref(db, `${basePath}/benefits`)
        const warningsRef = ref(db, `${basePath}/warnings`)
        const recruitmentsRef = ref(db, `${basePath}/recruitments`)
        const complianceRef = ref(db, `${basePath}/compliance`)
        const diversityRef = ref(db, `${basePath}/diversityMetrics`)
        const analyticsRef = ref(db, `${basePath}/analytics`)
        const schedulesRef = ref(db, `${basePath}/schedules`)
        const clockInOutRef = ref(db, `${basePath}/clockInOut`)
        const payrollRef = ref(db, `${basePath}/payroll`)

        // Set up listeners
        const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const employeesList = Object.entries(data).map(([id, employee]) => ({
              id,
              ...(employee as Omit<Employee, "id">),
            }))
            setEmployees(employeesList)
          } else {
            setEmployees([])
          }
        })

        const unsubscribeDepartments = onValue(departmentsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const departmentsList = Object.entries(data).map(([id, department]) => ({
              id,
              ...(department as Omit<Department, "id">),
            }))
            setDepartments(departmentsList)
          } else {
            setDepartments([])
          }
        })

        const unsubscribeRoles = onValue(rolesRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const rolesList = Object.entries(data).map(([id, role]) => ({
              id,
              ...(role as Omit<Role, "id">),
            }))
            setRoles(rolesList)
          } else {
            setRoles([])
          }
        })

        const unsubscribeTimeOff = onValue(timeOffRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const timeOffList = Object.entries(data).map(([id, request]) => ({
              id,
              ...(request as Omit<TimeOffRequest, "id">),
            }))
            setTimeOffRequests(timeOffList)
          } else {
            setTimeOffRequests([])
          }
        })

        const unsubscribePerformance = onValue(performanceRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const performanceList = Object.entries(data).map(([id, review]) => ({
              id,
              ...(review as Omit<PerformanceReview, "id">),
            }))
            setPerformanceReviews(performanceList)
          } else {
            setPerformanceReviews([])
          }
        })

        const unsubscribeTraining = onValue(trainingRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const trainingList = Object.entries(data).map(([id, training]) => ({
              id,
              ...(training as Omit<TrainingRecord, "id">),
            }))
            setTrainingRecords(trainingList)
          } else {
            setTrainingRecords([])
          }
        })

        const unsubscribeAnnouncements = onValue(announcementsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const announcementsList = Object.entries(data).map(([id, announcement]) => ({
              id,
              ...(announcement as Omit<Announcement, "id">),
            }))
            setAnnouncements(announcementsList)
          } else {
            setAnnouncements([])
          }
        })

        const unsubscribeEvents = onValue(eventsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const eventsList = Object.entries(data).map(([id, event]) => ({
              id,
              ...(event as Omit<Event, "id">),
            }))
            setEvents(eventsList)
          } else {
            setEvents([])
          }
        })

        const unsubscribeBenefits = onValue(benefitsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const benefitsList = Object.entries(data).map(([id, benefit]) => ({
              id,
              ...(benefit as Omit<Benefit, "id">),
            }))
            setBenefits(benefitsList)
          } else {
            setBenefits([])
          }
        })

        const unsubscribeWarnings = onValue(warningsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const warningsList = Object.entries(data).map(([id, warning]) => ({
              id,
              ...(warning as Omit<Warning, "id">),
            }))
            setWarnings(warningsList)
          } else {
            setWarnings([])
          }
        })

        const unsubscribeRecruitments = onValue(recruitmentsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const recruitmentsList = Object.entries(data).map(([id, recruitment]) => ({
              id,
              ...(recruitment as Omit<Recruitment, "id">),
            }))
            setRecruitments(recruitmentsList)
          } else {
            setRecruitments([])
          }
        })

        const unsubscribeCompliance = onValue(complianceRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const complianceList = Object.entries(data).map(([id, compliance]) => ({
              id,
              ...(compliance as Omit<Compliance, "id">),
            }))
            setCompliance(complianceList)
          } else {
            setCompliance([])
          }
        })

        const unsubscribeDiversity = onValue(diversityRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const diversityList = Object.entries(data).map(([id, diversity]) => ({
              id,
              ...(diversity as Omit<DiversityMetric, "id">),
            }))
            setDiversityMetrics(diversityList)
          } else {
            setDiversityMetrics([])
          }
        })

        const unsubscribeAnalytics = onValue(analyticsRef, (snapshot) => {
          if (snapshot.exists()) {
            setAnalytics(snapshot.val() as HRAnalytics)
          } else {
            setAnalytics(null)
          }
        })

        const unsubscribeSchedules = onValue(schedulesRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const schedulesList = Object.entries(data).map(([id, schedule]) => ({
              id,
              ...(schedule as Omit<Schedule, "id">),
            }))
            setSchedules(schedulesList)
          } else {
            setSchedules([])
          }
        })

        const unsubscribeClockInOut = onValue(clockInOutRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const clockInOutList = Object.entries(data).map(([id, clockInOut]) => ({
              id,
              ...(clockInOut as Omit<ClockInOut, "id">),
            }))
            setClockInOuts(clockInOutList)
          } else {
            setClockInOuts([])
          }
        })

        const unsubscribePayroll = onValue(payrollRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            const payrollList = Object.entries(data).map(([id, payroll]) => ({
              id,
              ...(payroll as Omit<PayrollData, "id">),
            }))
            setPayrollData(payrollList)
          } else {
            setPayrollData([])
          }
        })

        setLoading(false)

        // Return cleanup function
        return () => {
          off(employeesRef, "value", unsubscribeEmployees)
          off(departmentsRef, "value", unsubscribeDepartments)
          off(rolesRef, "value", unsubscribeRoles)
          off(timeOffRef, "value", unsubscribeTimeOff)
          off(performanceRef, "value", unsubscribePerformance)
          off(trainingRef, "value", unsubscribeTraining)
          off(announcementsRef, "value", unsubscribeAnnouncements)
          off(eventsRef, "value", unsubscribeEvents)
          off(benefitsRef, "value", unsubscribeBenefits)
          off(warningsRef, "value", unsubscribeWarnings)
          off(recruitmentsRef, "value", unsubscribeRecruitments)
          off(complianceRef, "value", unsubscribeCompliance)
          off(diversityRef, "value", unsubscribeDiversity)
          off(analyticsRef, "value", unsubscribeAnalytics)
          off(schedulesRef, "value", unsubscribeSchedules)
          off(clockInOutRef, "value", unsubscribeClockInOut)
          off(payrollRef, "value", unsubscribePayroll)
        }
      } catch (err) {
        console.error("Error loading HR data:", err)
        setError("Failed to load HR data")
        setLoading(false)
      }
    }

    const cleanup = loadHRData()
    return () => {
      if (cleanup && typeof cleanup.then === "function") {
        cleanup.then((cleanupFn) => {
          if (typeof cleanupFn === "function") {
            cleanupFn()
          }
        })
      }
    }
  }, [basePath])

  return {
    employees,
    departments,
    roles,
    timeOffRequests,
    performanceReviews,
    trainingRecords,
    announcements,
    events,
    benefits,
    warnings,
    recruitments,
    compliance,
    diversityMetrics,
    analytics,
    schedules,
    clockInOuts,
    payrollData,
    loading,
    error,
    calculateHRAnalytics,
  }
}

// CRUD operations for Employees - moved to end of file

// Helper function to remove undefined values from objects for Firebase
const sanitizeForFirebase = (obj: unknown): unknown => {
  if (obj === null || obj === undefined) {
    return null
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirebase).filter(item => item !== undefined)
  }
  
  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirebase(value)
      }
    }
    return sanitized
  }
  
  return obj
}

// Duplicate CRUD operations removed - using functions at end of file

// Analytics functions
export const updateHRAnalytics = async (basePath: string, analytics: HRAnalytics): Promise<void> => {
  const analyticsRef = ref(db, `${basePath}/analytics`)
  try {
    await set(analyticsRef, analytics)
  } catch (error) {
    console.error("Error updating HR analytics:", error)
    throw error
  }
}

// CRUD operations for Trainings
export const fetchTrainings = async (basePath: string): Promise<TrainingRecord[]> => {
  try {
    const trainingsRef = ref(db, `${basePath}/trainings`)
    const snapshot = await get(trainingsRef)
    if (snapshot.exists()) {
      const trainingsData = snapshot.val()
      return Object.keys(trainingsData).map(key => ({
        id: key,
        ...trainingsData[key]
      }))
    }
    return []
  } catch (error) {
    console.error("Error fetching trainings:", error)
    return []
  }
}

export const createTraining = async (basePath: string, training: Omit<TrainingRecord, "id">): Promise<string> => {
  try {
    const trainingsRef = ref(db, `${basePath}/trainings`)
    const newTrainingRef = push(trainingsRef, {
      ...training,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return newTrainingRef.key || ""
  } catch (error) {
    console.error("Error creating training:", error)
    throw error
  }
}

export const updateTraining = async (basePath: string, trainingId: string, training: Partial<TrainingRecord>): Promise<void> => {
  try {
    const trainingRef = ref(db, `${basePath}/trainings/${trainingId}`)
    await update(trainingRef, {
      ...training,
      updatedAt: Date.now(),
    })
  } catch (error) {
    console.error("Error updating training:", error)
    throw error
  }
}

export const deleteTraining = async (basePath: string, trainingId: string): Promise<void> => {
  try {
    const trainingRef = ref(db, `${basePath}/trainings/${trainingId}`)
    await remove(trainingRef)
  } catch (error) {
    console.error("Error deleting training:", error)
    throw error
  }
}

// CRUD operations for Time Off Requests
export const fetchTimeOffs = async (basePath: string): Promise<TimeOffRequest[]> => {
  try {
    const timeOffsRef = ref(db, `${basePath}/timeOffs`)
    const snapshot = await get(timeOffsRef)
    if (snapshot.exists()) {
      const timeOffsData = snapshot.val()
      return Object.keys(timeOffsData).map(key => ({
        id: key,
        ...timeOffsData[key]
      }))
    }
    return []
  } catch (error) {
    console.error("Error fetching time offs:", error)
    return []
  }
}

export const createTimeOff = async (basePath: string, timeOff: Omit<TimeOffRequest, "id">): Promise<string> => {
  try {
    const timeOffsRef = ref(db, `${basePath}/timeOffs`)
    const newTimeOffRef = push(timeOffsRef, {
      ...timeOff,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return newTimeOffRef.key || ""
  } catch (error) {
    console.error("Error creating time off:", error)
    throw error
  }
}

export const updateTimeOff = async (basePath: string, timeOffId: string, timeOff: Partial<TimeOffRequest>): Promise<void> => {
  try {
    const timeOffRef = ref(db, `${basePath}/timeOffs/${timeOffId}`)
    await update(timeOffRef, {
      ...timeOff,
      updatedAt: Date.now(),
    })
  } catch (error) {
    console.error("Error updating time off:", error)
    throw error
  }
}

export const deleteTimeOff = async (basePath: string, timeOffId: string): Promise<void> => {
  try {
    const timeOffRef = ref(db, `${basePath}/timeOffs/${timeOffId}`)
    await remove(timeOffRef)
  } catch (error) {
    console.error("Error deleting time off:", error)
    throw error
  }
}

// CRUD operations for Warnings
export const fetchWarnings = async (basePath: string): Promise<Warning[]> => {
  try {
    console.log("Fetching warnings from database for basePath:", basePath)
    const warningsRef = ref(db, `${basePath}/warnings`)
    const snapshot = await get(warningsRef)
    if (!snapshot.exists()) return []
    
    const warnings: Warning[] = []
    snapshot.forEach((childSnapshot: { key: string | null; val: () => unknown }) => {
      const raw = childSnapshot.val() as unknown
      const data = raw as unknown as Omit<Warning, 'id'>
      warnings.push({ ...data, id: childSnapshot.key || '' })
    })
    console.log("Found warnings:", warnings.length)
    return warnings
  } catch (error) {
    console.error("Error fetching warnings:", error)
    return []
  }
}

export const createWarning = async (basePath: string, warning: Omit<Warning, "id">): Promise<string> => {
  try {
    const warningsRef = ref(db, `${basePath}/warnings`)
    const newWarningRef = push(warningsRef, {
      ...warning,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return newWarningRef.key || ""
  } catch (error) {
    console.error("Error creating warning:", error)
    throw error
  }
}

export const updateWarning = async (basePath: string, warningId: string, warning: Partial<Warning>): Promise<void> => {
  try {
    const warningRef = ref(db, `${basePath}/warnings/${warningId}`)
    await update(warningRef, {
      ...warning,
      updatedAt: Date.now(),
    })
  } catch (error) {
    console.error("Error updating warning:", error)
    throw error
  }
}

export const deleteWarning = async (basePath: string, warningId: string): Promise<void> => {
  try {
    const warningRef = ref(db, `${basePath}/warnings/${warningId}`)
    await remove(warningRef)
  } catch (error) {
    console.error("Error deleting warning:", error)
    throw error
  }
}

// CRUD operations for Attendances
export const fetchAttendances = async (basePath: string): Promise<ClockInOut[]> => {
  try {
    const attendancesRef = ref(db, `${basePath}/attendances`)
    const snapshot = await get(attendancesRef)
    if (snapshot.exists()) {
      const attendancesData = snapshot.val()
      return Object.keys(attendancesData).map(key => ({
        id: key,
        ...attendancesData[key]
      }))
    }
    return []
  } catch (error) {
    console.error("Error fetching attendances:", error)
    return []
  }
}

export const createAttendance = async (basePath: string, attendance: Omit<ClockInOut, "id">): Promise<string> => {
  try {
    const attendancesRef = ref(db, `${basePath}/attendances`)
    const newAttendanceRef = push(attendancesRef, {
      ...attendance,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return newAttendanceRef.key || ""
  } catch (error) {
    console.error("Error creating attendance:", error)
    throw error
  }
}

export const updateAttendance = async (basePath: string, attendanceId: string, attendance: Partial<ClockInOut>): Promise<void> => {
  try {
    const attendanceRef = ref(db, `${basePath}/attendances/${attendanceId}`)
    await update(attendanceRef, {
      ...attendance,
      updatedAt: Date.now(),
    })
  } catch (error) {
    console.error("Error updating attendance:", error)
    throw error
  }
}

export const deleteAttendance = async (basePath: string, attendanceId: string): Promise<void> => {
  try {
    const attendanceRef = ref(db, `${basePath}/attendances/${attendanceId}`)
    await remove(attendanceRef)
  } catch (error) {
    console.error("Error deleting attendance:", error)
    throw error
  }
}

// CRUD operations for Job Postings
export const fetchJobs = async (basePath: string): Promise<JobPosting[]> => {
  try {
    console.log("Fetching jobs from database for basePath:", basePath)
    const jobsRef = ref(db, `${basePath}/jobPostings`)
    const snapshot = await get(jobsRef)
    if (!snapshot.exists()) return []
    
    const jobs: JobPosting[] = []
    snapshot.forEach((childSnapshot: { key: string | null; val: () => unknown }) => {
      const raw = childSnapshot.val() as unknown
      const data = raw as unknown as Omit<JobPosting, 'id'>
      jobs.push({ ...data, id: childSnapshot.key || '' })
    })
    console.log("Found jobs:", jobs.length)
    return jobs
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return []
  }
}

export const createJob = async (basePath: string, job: Omit<JobPosting, "id">): Promise<string> => {
  try {
    const jobsRef = ref(db, `${basePath}/jobPostings`)
    const newJobRef = push(jobsRef)
    const jobId = newJobRef.key!
    const jobData = sanitizeForFirebase({
      ...job,
      id: jobId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    await set(newJobRef, jobData)
    console.log("Job created successfully:", jobId)
    return jobId
  } catch (error) {
    console.error("Error creating job:", error)
    throw error
  }
}

export const updateJob = async (basePath: string, jobId: string, updates: Partial<JobPosting>): Promise<void> => {
  try {
    const jobRef = ref(db, `${basePath}/jobPostings/${jobId}`)
    const updateData = sanitizeForFirebase({
      ...updates,
      updatedAt: Date.now()
    }) as Record<string, unknown>
    await update(jobRef, updateData)
    console.log("Job updated successfully:", jobId)
  } catch (error) {
    console.error("Error updating job:", error)
    throw error
  }
}

export const deleteJob = async (basePath: string, jobId: string): Promise<void> => {
  try {
    const jobRef = ref(db, `${basePath}/jobPostings/${jobId}`)
    await remove(jobRef)
  } catch (error) {
    console.error("Error deleting job:", error)
    throw error
  }
}

// CRUD operations for Candidates
export const fetchCandidates = async (basePath: string): Promise<Candidate[]> => {
  try {
    console.log("Fetching candidates from database for basePath:", basePath)
    const candidatesRef = ref(db, `${basePath}/candidates`)
    const snapshot = await get(candidatesRef)
    if (!snapshot.exists()) return []
    
    const candidates: Candidate[] = []
    snapshot.forEach((childSnapshot: { key: string | null; val: () => unknown }) => {
      const raw = childSnapshot.val() as unknown
      const data = raw as unknown as Omit<Candidate, 'id'>
      candidates.push({ ...data, id: childSnapshot.key || '' })
    })
    console.log("Found candidates:", candidates.length)
    return candidates
  } catch (error) {
    console.error("Error fetching candidates:", error)
    return []
  }
}

export const createCandidate = async (basePath: string, candidate: Omit<Candidate, "id">): Promise<string> => {
  try {
    const candidatesRef = ref(db, `${basePath}/candidates`)
    const newCandidateRef = push(candidatesRef)
    const candidateId = newCandidateRef.key!
    const candidateData = sanitizeForFirebase({
      ...candidate,
      id: candidateId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    await set(newCandidateRef, candidateData)
    console.log("Candidate created successfully:", candidateId)
    return candidateId
  } catch (error) {
    console.error("Error creating candidate:", error)
    throw error
  }
}

export const updateCandidate = async (basePath: string, candidateId: string, updates: Partial<Candidate>): Promise<void> => {
  try {
    const candidateRef = ref(db, `${basePath}/candidates/${candidateId}`)
    const updateData = sanitizeForFirebase({
      ...updates,
      updatedAt: Date.now()
    }) as Record<string, unknown>
    await update(candidateRef, updateData)
    console.log("Candidate updated successfully:", candidateId)
  } catch (error) {
    console.error("Error updating candidate:", error)
    throw error
  }
}

export const deleteCandidate = async (basePath: string, candidateId: string): Promise<void> => {
  try {
    const candidateRef = ref(db, `${basePath}/candidates/${candidateId}`)
    await remove(candidateRef)
    console.log("Candidate deleted successfully:", candidateId)
  } catch (error) {
    console.error("Error deleting candidate:", error)
    throw error
  }
}

// Interview CRUD functions
export const createInterview = async (basePath: string, interview: Omit<Interview, "id">): Promise<string> => {
  try {
    const interviewsRef = ref(db, `${basePath}/interviews`)
    const newInterviewRef = push(interviewsRef)
    const interviewId = newInterviewRef.key!
    const interviewData = sanitizeForFirebase({
      ...interview,
      id: interviewId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }) as Record<string, unknown>
    await set(newInterviewRef, interviewData)
    console.log("Interview created successfully:", interviewId)
    return interviewId
  } catch (error) {
    console.error("Error creating interview:", error)
    throw error
  }
}

export const updateInterview = async (basePath: string, interviewId: string, updates: Partial<Interview>): Promise<void> => {
  try {
    const interviewRef = ref(db, `${basePath}/interviews/${interviewId}`)
    const updateData = sanitizeForFirebase({
      ...updates,
      updatedAt: Date.now()
    }) as Record<string, unknown>
    await update(interviewRef, updateData)
    console.log("Interview updated successfully:", interviewId)
  } catch (error) {
    console.error("Error updating interview:", error)
    throw error
  }
}

export const deleteInterview = async (basePath: string, interviewId: string): Promise<void> => {
  try {
    const interviewRef = ref(db, `${basePath}/interviews/${interviewId}`)
    await remove(interviewRef)
    console.log("Interview deleted successfully:", interviewId)
  } catch (error) {
    console.error("Error deleting interview:", error)
    throw error
  }
}

export const fetchInterviews = async (basePath: string): Promise<Interview[]> => {
  try {
    const interviewsRef = ref(db, `${basePath}/interviews`)
    const snapshot = await get(interviewsRef)
    
    if (snapshot.exists()) {
      const interviewsData = snapshot.val()
      return Object.values(interviewsData) as Interview[]
    }
    return []
  } catch (error) {
    console.error("Error fetching interviews:", error)
    throw error
  }
}

// Aliases for backwards compatibility - removed to avoid circular references

// Contract CRUD operations
export const fetchContracts = async (basePath: string): Promise<Contract[]> => {
  try {
    const contractsRef = ref(db, `${basePath}/contracts`)
    console.log("fetchContracts - looking for contracts at path:", `${basePath}/contracts`)
    const snapshot = await get(contractsRef)
    console.log("fetchContracts - snapshot exists:", snapshot.exists())
    if (!snapshot.exists()) {
      console.log("fetchContracts - no contracts found at path:", `${basePath}/contracts`)
      return []
    }
    
    const contracts: Contract[] = []
    snapshot.forEach((childSnapshot: any) => {
      contracts.push({ id: childSnapshot.key, ...childSnapshot.val() } as Contract)
    })
    console.log("fetchContracts - found contracts:", contracts.length)
    if (contracts.length > 0) {
      console.log("fetchContracts - first contract:", contracts[0])
    }
    return contracts
  } catch (error) {
    console.error("Error fetching contracts:", error)
    return []
  }
}

export const updateContract = async (basePath: string, contractId: string, contractUpdates: Partial<Contract>): Promise<Contract | null> => {
  try {
    const contractRef = ref(db, `${basePath}/contracts/${contractId}`)
    const snapshot = await get(contractRef)
    
    if (!snapshot.exists()) {
      console.error("Contract not found:", contractId)
      return null
    }
    
    const currentContract = snapshot.val()
    const updatedContract = { ...currentContract, ...contractUpdates, updatedAt: Date.now() }
    
    await update(contractRef, updatedContract)
    return updatedContract
  } catch (error) {
    console.error("Error updating contract:", error)
    throw error
  }
}

export const fetchContractTemplates = async (basePath: string): Promise<ContractTemplate[]> => {
  try {
    const templatesRef = ref(db, `${basePath}/contractTemplates`)
    const snapshot = await get(templatesRef)
    
    if (!snapshot.exists()) {
      return []
    }
    
    const templates: ContractTemplate[] = []
    snapshot.forEach((childSnapshot) => {
      const template = childSnapshot.val()
      if (template) {
        templates.push({
          ...template,
          id: childSnapshot.key || ''
        })
      }
    })
    
    return templates
  } catch (error) {
    console.error("Error fetching contract templates:", error)
    throw error
  }
}

export const createContract = async (basePath: string, contract: Partial<Contract> & { employeeId: string; type: string; startDate: number; status: string; createdAt: number }): Promise<Contract | null> => {
  try {
    const contractsRef = ref(db, `${basePath}/contracts`)
    const newContractRef = push(contractsRef)
    const contractId = newContractRef.key
    
    if (!contractId) {
      console.error("Failed to generate contract ID")
      return null
    }
    
    const newContract = {
      ...contract,
      id: contractId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      salary: contract.salary || 0,
      benefits: contract.benefits || [],
      terms: contract.terms || [],
      workingHours: contract.workingHours || "",
      holidayEntitlement: contract.holidayEntitlement || ""
    } as Contract
    
    await set(newContractRef, newContract)
    return newContract
  } catch (error) {
    console.error("Error creating contract:", error)
    throw error
  }
}

export const createContractTemplate = async (basePath: string, template: Omit<ContractTemplate, "id">): Promise<ContractTemplate | null> => {
  try {
    const templatesRef = ref(db, `${basePath}/contractTemplates`)
    const newTemplateRef = push(templatesRef)
    const templateId = newTemplateRef.key
    
    if (!templateId) {
      console.error("Failed to generate template ID")
      return null
    }
    
    const newTemplate: ContractTemplate = {
      ...template,
      id: templateId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    await set(newTemplateRef, newTemplate)
    return newTemplate
  } catch (error) {
    console.error("Error creating contract template:", error)
    throw error
  }
}

export const deleteContract = async (basePath: string, contractId: string): Promise<void> => {
  try {
    const contractRef = ref(db, `${basePath}/contracts/${contractId}`)
    await remove(contractRef)
    console.log(`Contract ${contractId} deleted successfully`)
  } catch (error) {
    console.error("Error deleting contract:", error)
    throw error
  }
}

export const deleteContractTemplate = async (basePath: string, templateId: string): Promise<void> => {
  try {
    const templateRef = ref(db, `${basePath}/contractTemplates/${templateId}`)
    await remove(templateRef)
    console.log(`Contract template ${templateId} deleted successfully`)
  } catch (error) {
    console.error("Error deleting contract template:", error)
    throw error
  }
}

// Announcements CRUD operations
export const fetchAnnouncements = async (basePath: string): Promise<Announcement[]> => {
  try {
    const announcementsRef = ref(db, `${basePath}/announcements`)
    const snapshot = await get(announcementsRef)
    if (!snapshot.exists()) return []
    
    const announcements: Announcement[] = []
    snapshot.forEach((childSnapshot: { key: string | null; val: () => unknown }) => {
      const raw = childSnapshot.val() as unknown
      const data = raw as unknown as Omit<Announcement, 'id'>
      announcements.push({ ...data, id: childSnapshot.key || '' })
    })
    return announcements
  } catch (error) {
    console.error("Error fetching announcements:", error)
    throw error
  }
}

export const createAnnouncement = async (basePath: string, announcement: Omit<Announcement, 'id'>): Promise<Announcement> => {
  try {
    const announcementsRef = ref(db, `${basePath}/announcements`)
    const newAnnouncementRef = push(announcementsRef)
    const announcementId = newAnnouncementRef.key!
    
    const announcementData: Announcement = {
      ...announcement,
      id: announcementId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    await set(newAnnouncementRef, announcementData)
    console.log(`Announcement ${announcementId} created successfully`)
    return announcementData
  } catch (error) {
    console.error("Error creating announcement:", error)
    throw error
  }
}

export const updateAnnouncement = async (basePath: string, announcementId: string, updates: Partial<Announcement>): Promise<void> => {
  try {
    const announcementRef = ref(db, `${basePath}/announcements/${announcementId}`)
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: Date.now()
    }
    await update(announcementRef, updatesWithTimestamp)
    console.log(`Announcement ${announcementId} updated successfully`)
  } catch (error) {
    console.error("Error updating announcement:", error)
    throw error
  }
}

export const deleteAnnouncement = async (basePath: string, announcementId: string): Promise<void> => {
  try {
    const announcementRef = ref(db, `${basePath}/announcements/${announcementId}`)
    await remove(announcementRef)
    console.log(`Announcement ${announcementId} deleted successfully`)
  } catch (error) {
    console.error("Error deleting announcement:", error)
    throw error
  }
}

// Benefits operations - extracted from contracts
export const fetchBenefits = async (basePath: string): Promise<Benefit[]> => {
  try {
    // Fetch contracts to extract benefits from them
    const contracts = await fetchContracts(basePath)
    
    // Extract unique benefits from all contracts
    const benefitsSet = new Set<string>()
    
    contracts.forEach(contract => {
      if (contract.benefits && Array.isArray(contract.benefits)) {
        contract.benefits.forEach(benefit => {
          if (typeof benefit === 'string') {
            benefitsSet.add(benefit)
          }
        })
      }
    })
    
    // Convert to Benefit objects
    const benefits: Benefit[] = Array.from(benefitsSet).map((benefit, index) => ({
      id: `benefit_${index + 1}`,
      name: benefit,
      description: `${benefit} benefit package`,
      type: 'other' as const,
      provider: 'Company Provided',
      cost: {
        employer: 0,
        employee: 0,
        frequency: 'monthly' as const
      },
      eligibility: {
        employmentTypes: ['full_time' as const],
        waitingPeriod: 0,
        waitingPeriodUnit: 'days' as const,
        minimumHours: 0
      },
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }))
    
    console.log(`Found ${benefits.length} unique benefits from contracts`)
    return benefits
  } catch (error) {
    console.error("Error fetching benefits:", error)
    throw error
  }
}

// Employee CRUD Operations
export const fetchEmployees = async (basePath: string): Promise<Employee[]> => {
  try {
    const fullPath = `${basePath}/employees`
    console.log("🔍 fetchEmployees - attempting to fetch from path:", fullPath)

    const employeesRef = ref(db, fullPath)
    const snapshot = await get(employeesRef)

    console.log("🔍 fetchEmployees - snapshot result:", {
      exists: snapshot.exists(),
      hasChildren: snapshot.hasChildren()
    })

    if (!snapshot.exists()) {
      console.log("❌ fetchEmployees - no data exists at path:", fullPath)
      return []
    }

    const employees: Employee[] = []
    snapshot.forEach((childSnapshot: { key: string | null; val: () => unknown }) => {
      const raw = childSnapshot.val() as unknown
      const data = raw as unknown as Omit<Employee, 'id'>
      employees.push({ ...data, id: childSnapshot.key || '' })
    })

    // Decrypt sensitive employee data if encryption service is initialized
    const decryptedEmployees: Employee[] = []
    for (const employee of employees) {
      try {
        if (sensitiveDataService.isInitialized()) {
          const decrypted = await sensitiveDataService.decryptEmployeeData(
            employee as unknown as Record<string, unknown>
          )
          decryptedEmployees.push(decrypted as unknown as Employee)
        } else {
          decryptedEmployees.push(employee)
        }
      } catch (decryptError) {
        // If decryption fails, return the raw data (might not be encrypted)
        console.warn(`[HRs] Failed to decrypt employee ${employee.id}, using raw data`)
        decryptedEmployees.push(employee)
      }
    }

    console.log("✅ fetchEmployees - loaded employees:", {
      count: decryptedEmployees.length,
      sampleEmployee: decryptedEmployees[0] ? {
        id: decryptedEmployees[0].id,
        employeeID: decryptedEmployees[0].employeeID,
        name: `${decryptedEmployees[0].firstName} ${decryptedEmployees[0].lastName}`,
        status: decryptedEmployees[0].status,
        isActive: (decryptedEmployees[0] as Employee & { isActive?: boolean }).isActive
      } : null
    })

    return decryptedEmployees
  } catch (error) {
    console.error("❌ fetchEmployees - Error fetching employees from path:", basePath, error)
    return []
  }
}

export const createEmployee = async (basePath: string, employee: Omit<Employee, "id">): Promise<string | null> => {
  try {
    const employeesRef = ref(db, `${basePath}/employees`)
    const newEmployeeRef = push(employeesRef)
    const employeeId = newEmployeeRef.key

    if (!employeeId) {
      console.error("Failed to generate employee ID")
      return null
    }

    let newEmployee: Employee = {
      ...employee,
      id: employeeId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    // Encrypt sensitive employee data before saving if encryption service is initialized
    if (sensitiveDataService.isInitialized()) {
      try {
        const encrypted = await sensitiveDataService.encryptEmployeeData(
          newEmployee as unknown as Record<string, unknown>
        )
        newEmployee = encrypted as unknown as Employee
        console.log("[HRs] Employee data encrypted before storage")
      } catch (encryptError) {
        console.error("[HRs] Failed to encrypt employee data:", encryptError)
        // In production, fail to prevent unencrypted storage
        if (import.meta.env.PROD) {
          throw new Error("Encryption required in production. Failed to encrypt employee data.")
        }
        console.warn("[HRs] WARNING: Storing employee data without encryption")
      }
    } else {
      // In production, encryption must be initialized
      if (import.meta.env.PROD) {
        throw new Error("Encryption service not initialized. Cannot store employee data in production.")
      }
      console.warn("[HRs] Encryption service not initialized - storing employee data without encryption")
    }

    await set(newEmployeeRef, newEmployee)
    return employeeId
  } catch (error) {
    console.error("Error creating employee:", error)
    throw error
  }
}

export const updateEmployee = async (basePath: string, employeeId: string, updates: Partial<Employee>): Promise<Employee | null> => {
  try {
    const employeeRef = ref(db, `${basePath}/employees/${employeeId}`)

    let updatedData: Record<string, unknown> = {
      ...updates,
      updatedAt: Date.now()
    }

    // Encrypt sensitive employee data before saving if encryption service is initialized
    if (sensitiveDataService.isInitialized()) {
      try {
        updatedData = await sensitiveDataService.encryptEmployeeData(updatedData)
        console.log("[HRs] Employee update data encrypted before storage")
      } catch (encryptError) {
        console.error("[HRs] Failed to encrypt employee update data:", encryptError)
        // In production, fail to prevent unencrypted storage
        if (import.meta.env.PROD) {
          throw new Error("Encryption required in production. Failed to encrypt employee update data.")
        }
        console.warn("[HRs] WARNING: Storing employee update without encryption")
      }
    } else {
      // In production, encryption must be initialized
      if (import.meta.env.PROD) {
        throw new Error("Encryption service not initialized. Cannot update employee data in production.")
      }
      console.warn("[HRs] Encryption service not initialized - storing employee update without encryption")
    }

    await update(employeeRef, updatedData)

    // Return the updated employee (decrypted)
    const snapshot = await get(employeeRef)
    if (snapshot.exists()) {
      let employee = { id: employeeId, ...snapshot.val() } as Employee
      // Decrypt the data before returning
      if (sensitiveDataService.isInitialized()) {
        try {
          employee = await sensitiveDataService.decryptEmployeeData(
            employee as unknown as Record<string, unknown>
          ) as unknown as Employee
        } catch (decryptError) {
          console.warn("[HRs] Failed to decrypt updated employee, returning raw data")
        }
      }
      return employee
    }
    return null
  } catch (error) {
    console.error("Error updating employee:", error)
    throw error
  }
}

export const deleteEmployee = async (basePath: string, employeeId: string): Promise<boolean> => {
  try {
    const employeeRef = ref(db, `${basePath}/employees/${employeeId}`)
    await remove(employeeRef)
    return true
  } catch (error) {
    console.error("Error deleting employee:", error)
    throw error
  }
}

// Role CRUD Operations
export const fetchRoles = async (basePath: string): Promise<Role[]> => {
  try {
    const rolesRef = ref(db, `${basePath}/roles`)
    const snapshot = await get(rolesRef)
    if (!snapshot.exists()) return []
    
    const roles: Role[] = []
    snapshot.forEach((childSnapshot: { key: string | null; val: () => unknown }) => {
      const raw = childSnapshot.val() as unknown
      const data = raw as unknown as Omit<Role, 'id'>
      roles.push({ ...data, id: childSnapshot.key || '' })
    })
    return roles
  } catch (error) {
    console.error("Error fetching roles:", error)
    return []
  }
}

// Department CRUD Operations
export const fetchDepartments = async (basePath: string): Promise<Department[]> => {
  try {
    const departmentsRef = ref(db, `${basePath}/departments`)
    const snapshot = await get(departmentsRef)
    if (!snapshot.exists()) return []
    
    const departments: Department[] = []
    snapshot.forEach((childSnapshot: { key: string | null; val: () => unknown }) => {
      const raw = childSnapshot.val() as unknown
      const data = raw as unknown as Omit<Department, 'id'>
      departments.push({ ...data, id: childSnapshot.key || '' })
    })
    return departments
  } catch (error) {
    console.error("Error fetching departments:", error)
    return []
  }
}

// Schedule CRUD Operations
export const fetchSchedules = async (basePath: string): Promise<Schedule[]> => {
  try {
    const schedulesRef = ref(db, `${basePath}/schedules`)
    const snapshot = await get(schedulesRef)
    if (!snapshot.exists()) return []
    
    const schedules: Schedule[] = []
    snapshot.forEach((childSnapshot: { key: string | null; val: () => unknown }) => {
      const scheduleData = childSnapshot.val() as Record<string, unknown>
      
      // Normalize date to YYYY-MM-DD format
      let normalizedDate = ""
      if (scheduleData.date) {
        if (typeof scheduleData.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(scheduleData.date)) {
          normalizedDate = scheduleData.date
        } else if (typeof scheduleData.date === 'number') {
          normalizedDate = new Date(scheduleData.date).toISOString().split("T")[0]
        } else if (typeof scheduleData.date === 'string') {
          const parsed = new Date(scheduleData.date)
          if (!isNaN(parsed.getTime())) {
            normalizedDate = parsed.toISOString().split("T")[0]
          } else {
            // Try to extract YYYY-MM-DD from string
            const match = scheduleData.date.match(/(\d{4}-\d{2}-\d{2})/)
            normalizedDate = match ? match[1] : scheduleData.date
          }
        }
      }
      
      // Map Firebase field names to our interface (match actual database structure)
      const mappedSchedule: Schedule = {
        id: childSnapshot.key ?? '',
        employeeId: String(scheduleData.employeeID ?? scheduleData.employeeId ?? ''),
        employeeName: String(scheduleData.employeeName ?? ''),
        date: normalizedDate,
        startTime: String(scheduleData.startTime ?? ''),
        endTime: String(scheduleData.endTime ?? ''),
        department: String(scheduleData.department ?? ''),
        role: String(scheduleData.role ?? ''),
        notes: String(scheduleData.notes ?? ''),
        status: (scheduleData.status as Schedule['status']) || 'scheduled',
        shiftType: (scheduleData.shiftType as Schedule['shiftType']) || 'regular',
        payType: (scheduleData.payType as Schedule['payType']) || 'hourly',
        payRate: scheduleData.payRate != null ? Number(scheduleData.payRate) : undefined,
        departmentID: String(scheduleData.departmentID ?? ''),
        createdAt: scheduleData.createdAt != null ? new Date(scheduleData.createdAt as string | number).toISOString() : new Date().toISOString(),
        updatedAt: scheduleData.updatedAt != null ? new Date(scheduleData.updatedAt as string | number).toISOString() : undefined
      }
      schedules.push(mappedSchedule)
    })
    return schedules
  } catch (error) {
    console.error("Error fetching schedules:", error)
    return []
  }
}

export const createSchedule = async (basePath: string, schedule: Omit<Schedule, "id">): Promise<string | null> => {
  try {
    const fullPath = `${basePath}/schedules`
    console.log("🔍 createSchedule - attempting to save to path:", fullPath)
    console.log("🔍 createSchedule - schedule data:", {
      employeeId: schedule.employeeId,
      employeeName: schedule.employeeName,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime
    })
    
    const schedulesRef = ref(db, fullPath)
    const newScheduleRef = push(schedulesRef)
    const scheduleId = newScheduleRef.key
    
    if (!scheduleId) {
      console.error("Failed to generate schedule ID")
      return null
    }
    
    // Convert Schedule interface format to database format (match actual database structure)
    const databaseSchedule = {
      scheduleID: scheduleId,
      employeeID: schedule.employeeId,
      employeeName: schedule.employeeName,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      department: schedule.department,
      status: schedule.status,
      departmentID: schedule.departmentID || "", // Add departmentID if available
      createdAt: Date.now(), // Use timestamp for database
      createdBy: "system" // Add createdBy field
    }
    
    await set(newScheduleRef, databaseSchedule)
    console.log("✅ createSchedule - Schedule created successfully:", {
      scheduleId,
      fullPath,
      databaseSchedule: {
        scheduleID: databaseSchedule.scheduleID,
        employeeID: databaseSchedule.employeeID,
        employeeName: databaseSchedule.employeeName,
        date: databaseSchedule.date,
        startTime: databaseSchedule.startTime,
        endTime: databaseSchedule.endTime
      }
    })
    return scheduleId
  } catch (error) {
    console.error("Error creating schedule:", error)
    throw error
  }
}

export const updateSchedule = async (basePath: string, scheduleId: string, updates: Partial<Schedule>): Promise<Schedule | null> => {
  try {
    const scheduleRef = ref(db, `${basePath}/schedules/${scheduleId}`)
    
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    await update(scheduleRef, updatedData)
    
    // Return the updated schedule
    const snapshot = await get(scheduleRef)
    if (snapshot.exists()) {
      return { id: scheduleId, ...snapshot.val() } as Schedule
    }
    return null
  } catch (error) {
    console.error("Error updating schedule:", error)
    throw error
  }
}

export const deleteSchedule = async (basePath: string, scheduleId: string): Promise<boolean> => {
  try {
    const scheduleRef = ref(db, `${basePath}/schedules/${scheduleId}`)
    await remove(scheduleRef)
    return true
  } catch (error) {
    console.error("Error deleting schedule:", error)
    throw error
  }
}

// Generic HR Action Database Operations
export const handleHRActionDB = async <T = Record<string, unknown>>(
  basePath: string,
  action: "fetch" | "create" | "edit" | "delete",
  id?: string,
  data?: Partial<T>
): Promise<T | T[] | boolean> => {
  try {
    switch (action) {
      case "fetch": {
        // Fetch all items of the entity type
        const snapshot = await get(ref(db, basePath))
        if (!snapshot.exists()) return [] as T[]
        
        const items: T[] = []
        snapshot.forEach((childSnapshot: { key: string | null; val: () => Record<string, unknown> }) => {
          items.push({ id: childSnapshot.key || '', ...(childSnapshot.val() as T) })
        })
        return items
      }
      
      case "create": {
        // Create a new item
        if (!data) throw new Error("Data is required for create action")
        const newRef = push(ref(db, basePath))
        const newId = newRef.key
        if (!newId) throw new Error("Failed to generate ID")
        
        await set(newRef, data)
        return { id: newId, ...data } as T
      }
      
      case "edit": {
        // Update an existing item
        if (!id) throw new Error("ID is required for edit action")
        if (!data) throw new Error("Data is required for edit action")
        
        await update(ref(db, `${basePath}/${id}`), data)
        return { id, ...data } as T
      }
      
      case "delete": {
        // Delete an item
        if (!id) throw new Error("ID is required for delete action")
        
        await remove(ref(db, `${basePath}/${id}`))
        return true
      }
      
      default:
        throw new Error(`Unsupported action: ${action}`)
    }
  } catch (error) {
    console.error(`Error in handleHRActionDB (${action}):`, error)
    throw error
  }
}

// Role CRUD operations
export const createRole = async (basePath: string, role: Omit<Role, "id">): Promise<Role> => {
  try {
    const roleRef = ref(db, `${basePath}/roles`)
    const newRoleRef = push(roleRef)
    const roleId = newRoleRef.key!
    
    const roleData: Role = {
      ...role,
      id: roleId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    await set(newRoleRef, roleData)
    console.log(`Role ${roleId} created successfully`)
    return roleData
  } catch (error) {
    console.error("Error creating role:", error)
    throw error
  }
}

export const updateRole = async (basePath: string, roleId: string, updates: Partial<Role>): Promise<void> => {
  try {
    const roleRef = ref(db, `${basePath}/roles/${roleId}`)
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: Date.now()
    }
    await update(roleRef, updatesWithTimestamp)
    console.log(`Role ${roleId} updated successfully`)
  } catch (error) {
    console.error("Error updating role:", error)
    throw error
  }
}

export const deleteRole = async (basePath: string, roleId: string): Promise<void> => {
  try {
    const roleRef = ref(db, `${basePath}/roles/${roleId}`)
    await remove(roleRef)
    console.log(`Role ${roleId} deleted successfully`)
  } catch (error) {
    console.error("Error deleting role:", error)
    throw error
  }
}

// Department CRUD operations
export const createDepartment = async (basePath: string, department: Omit<Department, "id">): Promise<Department> => {
  try {
    const departmentRef = ref(db, `${basePath}/departments`)
    const newDepartmentRef = push(departmentRef)
    const departmentId = newDepartmentRef.key!
    
    const departmentData: Department = {
      ...department,
      id: departmentId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    await set(newDepartmentRef, departmentData)
    console.log(`Department ${departmentId} created successfully`)
    return departmentData
  } catch (error) {
    console.error("Error creating department:", error)
    throw error
  }
}

export const updateDepartment = async (basePath: string, departmentId: string, updates: Partial<Department>): Promise<void> => {
  try {
    const departmentRef = ref(db, `${basePath}/departments/${departmentId}`)
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: Date.now()
    }
    await update(departmentRef, updatesWithTimestamp)
    console.log(`Department ${departmentId} updated successfully`)
  } catch (error) {
    console.error("Error updating department:", error)
    throw error
  }
}

export const deleteDepartment = async (basePath: string, departmentId: string): Promise<void> => {
  try {
    const departmentRef = ref(db, `${basePath}/departments/${departmentId}`)
    await remove(departmentRef)
    console.log(`Department ${departmentId} deleted successfully`)
  } catch (error) {
    console.error("Error deleting department:", error)
    throw error
  }
}

// Payroll CRUD operations
export const fetchPayroll = async (basePath: string): Promise<PayrollData[]> => {
  try {
    const payrollRef = ref(db, `${basePath}/payroll`)
    const snapshot = await get(payrollRef)
    if (!snapshot.exists()) return []
    
    const payroll: PayrollData[] = []
    snapshot.forEach((childSnapshot: { key: string | null; val: () => unknown }) => {
      const raw = childSnapshot.val() as unknown
      const data = raw as unknown as Omit<PayrollData, 'id'>
      payroll.push({ ...data, id: childSnapshot.key || '' })
    })
    return payroll
  } catch (error) {
    console.error("Error fetching payroll:", error)
    return []
  }
}

export const fetchPayrollById = async (basePath: string, payrollId: string): Promise<PayrollData | null> => {
  try {
    const payrollRef = ref(db, `${basePath}/payroll/${payrollId}`)
    const snapshot = await get(payrollRef)
    if (!snapshot.exists()) return null
    return { id: payrollId, ...snapshot.val() } as PayrollData
  } catch (error) {
    console.error("Error fetching payroll by id:", error)
    return null
  }
}

// Performance Reviews CRUD operations
export const fetchPerformanceReviews = async (basePath: string): Promise<PerformanceReview[]> => {
  try {
    const performanceRef = ref(db, `${basePath}/performanceReviews`)
    const snapshot = await get(performanceRef)
    if (!snapshot.exists()) return []
    
    const reviews: PerformanceReview[] = []
    snapshot.forEach((childSnapshot: { key: string | null; val: () => unknown }) => {
      const raw = childSnapshot.val() as unknown
      const data = raw as unknown as Omit<PerformanceReview, 'id'>
      reviews.push({ ...data, id: childSnapshot.key || '' })
    })
    return reviews
  } catch (error) {
    console.error("Error fetching performance reviews:", error)
    return []
  }
}


