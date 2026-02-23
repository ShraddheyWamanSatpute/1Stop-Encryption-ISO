"use client"

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback, useMemo, type ReactNode } from "react"
import { useCompany } from "./CompanyContext"
import { useSettings } from "./SettingsContext"
import { measurePerformance } from "../utils/PerformanceTimer"
import { createCachedFetcher } from "../utils/CachedFetcher"
// import { dataCache } from "../utils/DataCache" // Unused
import type { Employee, Role, Department, Training, TimeOff, TimeOffRequest, Warning, Attendance, ComplianceTask, Announcement, JobPosting, Payroll, Candidate, Interview, PerformanceReview, PerformanceReviewForm, Schedule, Benefit, EmployeeBenefit, Contract, ContractTemplate, HRActionParams } from "../interfaces/HRs"
import { 
  createRole, 
  updateRole as updateRoleAPI, 
  deleteRole as deleteRoleAPI,
  createDepartment,
  updateDepartment as updateDepartmentAPI,
  deleteDepartment as deleteDepartmentAPI,
  handleHRAction,
  updateContractTemplate as updateContractTemplateAPI,
  deleteContractTemplate as deleteContractTemplateAPI,
} from "../functions/HRs"
import { createNotification } from "../functions/Notifications"
import * as rtdb from "../rtdatabase/HRs"
import {
  fetchEmployees,
  createEmployee as createEmployeeRTDB,
  updateEmployee as updateEmployeeRTDB,
  deleteEmployee as deleteEmployeeRTDB,
  fetchRoles,
  fetchDepartments,
  fetchSchedules,
  createSchedule as createScheduleRTDB,
  updateSchedule as updateScheduleRTDB,
  deleteSchedule as deleteScheduleRTDB,
  fetchPayroll,
  fetchPayrollById,
  fetchPerformanceReviews,
  fetchWarnings
} from "../rtdatabase/HRs"
import {
  createEmployeeSecureCall,
  updateEmployeeSecureCall,
  fetchEmployeesSecureCall,
  fetchEmployeeDetailSecureCall,
} from "../functions/hrSecureClient"
import { fetchPayrollSecureCall, fetchPayrollDetailSecureCall } from "../functions/payrollSecureClient"
import { createEmployeeJoinCode, listEmployeeJoinCodes, revokeEmployeeJoinCode } from "../functions/Company"
import {
  fetchTrainings,
  createTraining as createTrainingAPI,
  updateTraining as updateTrainingAPI,
  deleteTraining as deleteTrainingAPI,
  fetchTimeOffs,
  createTimeOff as createTimeOffAPI,
  updateTimeOff as updateTimeOffAPI,
  deleteTimeOff as deleteTimeOffAPI,
  createWarning as createWarningAPI,
  updateWarning as updateWarningAPI,
  deleteWarning as deleteWarningAPI,
  fetchAttendances,
  createAttendance as createAttendanceAPI,
  updateAttendance as updateAttendanceAPI,
  deleteAttendance as deleteAttendanceAPI,
  createJob as createJobAPI,
  updateJob as updateJobAPI,
  deleteJob as deleteJobAPI,
  createCandidate as createCandidateAPI,
  updateCandidate as updateCandidateAPI,
  deleteCandidate as deleteCandidateAPI,
  createInterview as createInterviewAPI,
  updateInterview as updateInterviewAPI,
  deleteInterview as deleteInterviewAPI,
  updateContract as updateContractRTDB,
  createContract as createContractRTDB,
  fetchContracts as fetchContractsRTDB,
  createContractTemplate as createContractTemplateRTDB,
  fetchContractTemplates as fetchContractTemplatesRTDB,
  fetchBenefits as fetchBenefitsRTDB,
} from "../rtdatabase/HRs"

// Define the state type
interface HRState {
  employees: Employee[]
  roles: Role[]
  departments: Department[]
  trainings: Training[]
  timeOffs: TimeOff[]
  warnings: Warning[]
  attendances: Attendance[]
  attendanceRecords: Attendance[]  // Alias for attendances for backward compatibility
  complianceTasks: ComplianceTask[]
  announcements: Announcement[]
  jobs: JobPosting[]
  jobPostings: JobPosting[]  // Alias for jobs for backward compatibility
  candidates: Candidate[]
  interviews: Interview[]
  payrollRecords: Payroll[]
  performanceReviews: PerformanceReviewForm[]
  trainingPrograms: Training[]
  schedules: Schedule[]
  contracts: any[]
  contractTemplates: ContractTemplate[]
  benefits: Benefit[]
  events: any[]
  employeeBenefits: EmployeeBenefit[]
  expenseReports: any[]
  starterChecklists: any[]
  incentives: any[]
  venueBattles: any[]
  diversityInitiatives: any[]
  diversitySurveys: any[]
  isLoading: boolean
  error: string | null
  initialized: boolean
  // Company information
  companyID?: string
  companyName?: string
  selectedSiteID?: string
  sites?: any[]
}

// Define action types
export type HRAction =
  | { type: "SET_EMPLOYEES"; payload: Employee[] }
  | { type: "SET_ROLES"; payload: Role[] }
  | { type: "SET_DEPARTMENTS"; payload: Department[] }
  | { type: "SET_TRAININGS"; payload: Training[] }
  | { type: "SET_TIME_OFFS"; payload: TimeOff[] }
  | { type: "SET_WARNINGS"; payload: Warning[] }
  | { type: "SET_ATTENDANCES"; payload: Attendance[] }
  | { type: "SET_COMPLIANCE_TASKS"; payload: ComplianceTask[] }
  | { type: "SET_ANNOUNCEMENTS"; payload: Announcement[] }
  | { type: "SET_JOBS"; payload: JobPosting[] }
  | { type: "SET_CANDIDATES"; payload: Candidate[] }
  | { type: "SET_INTERVIEWS"; payload: any[] }
  | { type: "SET_PAYROLL_RECORDS"; payload: Payroll[] }
  | { type: "SET_PERFORMANCE_REVIEWS"; payload: PerformanceReviewForm[] }
  | { type: "SET_TRAINING_PROGRAMS"; payload: Training[] }
  | { type: "SET_SCHEDULES"; payload: Schedule[] }
  | { type: "SET_CONTRACTS"; payload: any[] }
  | { type: "ADD_CONTRACT"; payload: Contract }
  | { type: "UPDATE_CONTRACT"; payload: Contract }
  | { type: "SET_CONTRACT_TEMPLATES"; payload: ContractTemplate[] }
  | { type: "ADD_CONTRACT_TEMPLATE"; payload: ContractTemplate }
  | { type: "SET_BENEFITS"; payload: Benefit[] }
  | { type: "SET_EVENTS"; payload: any[] }
  | { type: "SET_EMPLOYEE_BENEFITS"; payload: EmployeeBenefit[] }
  | { type: "SET_EXPENSE_REPORTS"; payload: any[] }
  | { type: "SET_STARTER_CHECKLISTS"; payload: any[] }
  | { type: "SET_INCENTIVES"; payload: any[] }
  | { type: "SET_VENUE_BATTLES"; payload: any[] }
  | { type: "SET_DIVERSITY_INITIATIVES"; payload: any[] }
  | { type: "SET_DIVERSITY_SURVEYS"; payload: any[] }
  | { type: "ADD_EMPLOYEE"; payload: Employee }
  | { type: "UPDATE_EMPLOYEE"; payload: Employee }
  | { type: "DELETE_EMPLOYEE"; payload: string }
  | { type: "ADD_ROLE"; payload: Role }
  | { type: "UPDATE_ROLE"; payload: Role }
  | { type: "DELETE_ROLE"; payload: string }
  | { type: "ADD_DEPARTMENT"; payload: Department }
  | { type: "UPDATE_DEPARTMENT"; payload: Department }
  | { type: "DELETE_DEPARTMENT"; payload: string }
  | { type: "ADD_TRAINING"; payload: Training }
  | { type: "UPDATE_TRAINING"; payload: Training }
  | { type: "DELETE_TRAINING"; payload: string }
  | { type: "ADD_TIME_OFF"; payload: TimeOff }
  | { type: "UPDATE_TIME_OFF"; payload: TimeOff }
  | { type: "DELETE_TIME_OFF"; payload: string }
  | { type: "ADD_WARNING"; payload: Warning }
  | { type: "UPDATE_WARNING"; payload: Warning }
  | { type: "DELETE_WARNING"; payload: string }
  | { type: "ADD_ATTENDANCE"; payload: Attendance }
  | { type: "UPDATE_ATTENDANCE"; payload: Attendance }
  | { type: "DELETE_ATTENDANCE"; payload: string }
  | { type: "ADD_COMPLIANCE_TASK"; payload: ComplianceTask }
  | { type: "UPDATE_COMPLIANCE_TASK"; payload: ComplianceTask }
  | { type: "DELETE_COMPLIANCE_TASK"; payload: string }
  | { type: "ADD_ANNOUNCEMENT"; payload: Announcement }
  | { type: "UPDATE_ANNOUNCEMENT"; payload: Announcement }
  | { type: "DELETE_ANNOUNCEMENT"; payload: string }
  | { type: "ADD_JOB"; payload: JobPosting }
  | { type: "UPDATE_JOB"; payload: JobPosting }
  | { type: "DELETE_JOB"; payload: string }
  | { type: "ADD_CANDIDATE"; payload: Candidate }
  | { type: "UPDATE_CANDIDATE"; payload: Candidate }
  | { type: "DELETE_CANDIDATE"; payload: string }
  | { type: "ADD_INTERVIEW"; payload: any }
  | { type: "UPDATE_INTERVIEW"; payload: any }
  | { type: "DELETE_INTERVIEW"; payload: string }
  | { type: "ADD_PAYROLL"; payload: Payroll }
  | { type: "UPDATE_PAYROLL"; payload: Payroll }
  | { type: "DELETE_PAYROLL"; payload: string }
  | { type: "ADD_PERFORMANCE_REVIEW"; payload: PerformanceReviewForm }
  | { type: "UPDATE_PERFORMANCE_REVIEW"; payload: PerformanceReviewForm }
  | { type: "DELETE_PERFORMANCE_REVIEW"; payload: string }
  | { type: "ADD_SCHEDULE"; payload: Schedule }
  | { type: "UPDATE_SCHEDULE"; payload: Schedule }
  | { type: "DELETE_SCHEDULE"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_BASE_PATH"; payload: string }
  | { type: "SET_INITIALIZED"; payload: boolean }
  | { 
      type: "BATCH_UPDATE"; 
      payload: {
        employees?: Employee[]
        roles?: Role[]
        departments?: Department[]
        trainings?: Training[]
        timeOffs?: TimeOff[]
        warnings?: Warning[]
        attendances?: Attendance[]
        complianceTasks?: ComplianceTask[]
        announcements?: Announcement[]
        jobs?: JobPosting[]
        candidates?: Candidate[]
        interviews?: any[]
        payrollRecords?: Payroll[]
        performanceReviews?: PerformanceReviewForm[]
        schedules?: Schedule[]
        contracts?: any[]
        contractTemplates?: ContractTemplate[]
        benefits?: Benefit[]
        events?: any[]
        employeeBenefits?: EmployeeBenefit[]
        expenseReports?: any[]
        starterChecklists?: any[]
        incentives?: any[]
        venueBattles?: any[]
        diversityInitiatives?: any[]
        diversitySurveys?: any[]
        initialized?: boolean
      }
    }

// Define the context type
interface HRContextType {
  state: HRState
  dispatch: React.Dispatch<HRAction>
  // Permission functions
  canViewHR: () => boolean
  canEditHR: () => boolean
  canDeleteHR: () => boolean
  isOwner: () => boolean
  refreshEmployees: () => Promise<void>
  refreshRoles: () => Promise<void>
  refreshDepartments: () => Promise<void>
  refreshTrainings: () => Promise<void>
  refreshTimeOffs: () => Promise<void>
  refreshWarnings: () => Promise<void>
  refreshAttendances: () => Promise<void>
  refreshComplianceTasks: () => Promise<void>
  refreshAnnouncements: () => Promise<void>
  refreshJobs: () => Promise<void>
  refreshCandidates: () => Promise<void>
  refreshInterviews: () => Promise<void>
  refreshPayrolls: () => Promise<void>
  refreshPerformanceReviews: () => Promise<void>
  refreshSchedules: () => Promise<void>
  refreshContracts: () => Promise<void>
  addEmployee: (employee: Omit<Employee, "id">) => Promise<Employee | null>
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<Employee | null>
  deleteEmployee: (id: string) => Promise<boolean>
  /** Fetch full employee (decrypted) for detail/edit - list only has non-sensitive fields */
  fetchEmployeeDetail: (employeeId: string) => Promise<Employee | null>
  addRole: (role: Omit<Role, "id">) => Promise<Role | null>
  updateRole: (id: string, role: Partial<Role>) => Promise<Role | null>
  deleteRole: (id: string) => Promise<boolean>
  addDepartment: (department: Omit<Department, "id">) => Promise<Department | null>
  updateDepartment: (id: string, department: Partial<Department>) => Promise<Department | null>
  deleteDepartment: (id: string) => Promise<boolean>
  addTraining: (training: Omit<Training, "id">) => Promise<Training | null>
  updateTraining: (id: string, training: Partial<Training>) => Promise<Training | null>
  deleteTraining: (id: string) => Promise<boolean>
  addTimeOff: (timeOff: Omit<TimeOff, "id">) => Promise<TimeOff | null>
  updateTimeOff: (id: string, timeOff: Partial<TimeOff>) => Promise<TimeOff | null>
  deleteTimeOff: (id: string) => Promise<boolean>
  addWarning: (warning: Omit<Warning, "id">) => Promise<Warning | null>
  updateWarning: (id: string, warning: Partial<Warning>) => Promise<Warning | null>
  deleteWarning: (id: string) => Promise<boolean>
  addAttendance: (attendance: Omit<Attendance, "id">) => Promise<Attendance | null>
  updateAttendance: (id: string, attendance: Partial<Attendance>) => Promise<Attendance | null>
  deleteAttendance: (id: string) => Promise<boolean>
  addComplianceTask: (complianceTask: Omit<ComplianceTask, "id">) => Promise<ComplianceTask | null>
  updateComplianceTask: (id: string, complianceTask: Partial<ComplianceTask>) => Promise<ComplianceTask | null>
  deleteComplianceTask: (id: string) => Promise<boolean>
  addAnnouncement: (announcement: Omit<Announcement, "id">) => Promise<Announcement | null>
  updateAnnouncement: (id: string, announcement: Partial<Announcement>) => Promise<Announcement | null>
  deleteAnnouncement: (id: string) => Promise<boolean>
  addJob: (job: Omit<JobPosting, "id">) => Promise<JobPosting | null>
  updateJob: (id: string, job: Partial<JobPosting>) => Promise<JobPosting | null>
  deleteJob: (id: string) => Promise<boolean>
  addCandidate: (candidate: Omit<Candidate, "id">) => Promise<Candidate | null>
  updateCandidate: (id: string, candidate: Partial<Candidate>) => Promise<Candidate | null>
  deleteCandidate: (id: string) => Promise<boolean>
  addInterview: (interview: Omit<Interview, "id">) => Promise<Interview | null>
  updateInterview: (id: string, interview: Partial<Interview>) => Promise<Interview | null>
  deleteInterview: (id: string) => Promise<boolean>
  addPayroll: (payroll: Omit<Payroll, "id">) => Promise<Payroll | null>
  updatePayroll: (id: string, payroll: Partial<Payroll>) => Promise<Payroll | null>
  deletePayroll: (id: string) => Promise<boolean>
  updatePayrollRecord: (id: string, payroll: Partial<Payroll>) => Promise<Payroll | null>
  deletePayrollRecord: (id: string) => Promise<boolean>
  /** Fetch full payroll (decrypted) for detail/edit - list may have non-sensitive fields only */
  fetchPayrollDetail: (payrollId: string) => Promise<Payroll | null>
  addPerformanceReview: (review: Omit<PerformanceReview, "id">) => Promise<PerformanceReview | null>
  updatePerformanceReview: (id: string, review: Partial<PerformanceReview>) => Promise<PerformanceReview | null>
  deletePerformanceReview: (id: string) => Promise<boolean>
  addSchedule: (schedule: Omit<Schedule, "id">) => Promise<Schedule | null>
  updateSchedule: (id: string, schedule: Partial<Schedule>) => Promise<Schedule | null>
  deleteSchedule: (id: string) => Promise<boolean>
  // Join code generation
  generateJoinCode: (roleId: string, employeeId?: string, expiresInDays?: number) => Promise<string>
  // Employee invites management
  getEmployeeInvites: (employeeId?: string) => Promise<any>
  revokeInvite: (code: string) => Promise<void>
  // Benefits management
  fetchBenefits: () => Promise<Benefit[]>
  createBenefit: (benefit: Omit<Benefit, "id">) => Promise<Benefit | null>
  updateBenefit: (id: string, benefit: Partial<Benefit>) => Promise<Benefit | null>
  deleteBenefit: (id: string) => Promise<boolean>
  fetchEmployeeBenefits: (employeeId: string) => Promise<EmployeeBenefit[]>
  assignBenefitToEmployee: (employeeId: string, benefitId: string, data: Partial<EmployeeBenefit>) => Promise<EmployeeBenefit | null>
  updateEmployeeBenefit: (id: string, data: Partial<EmployeeBenefit>) => Promise<EmployeeBenefit | null>
  removeEmployeeBenefit: (id: string) => Promise<boolean>
  getEmployeeTrainings: (employeeId: string) => Promise<Training[]>
  getEmployeeTimeOffs: (employeeId: string) => Promise<TimeOff[]>
  getEmployeeWarnings: (employeeId: string) => Promise<Warning[]>
  getEmployeeAttendances: (employeeId: string) => Promise<Attendance[]>
  // Contract management
  fetchContractTemplates: () => Promise<ContractTemplate[]>
  createContractTemplate: (template: Omit<ContractTemplate, "id">) => Promise<ContractTemplate | null>
  updateContractTemplate: (templateId: string, template: Partial<ContractTemplate>) => Promise<ContractTemplate | null>
  deleteContractTemplate: (templateId: string) => Promise<boolean>
  addContract: (contract: Omit<Contract, "id">) => Promise<Contract | null>
  createContract: (contract: Omit<Contract, "id">) => Promise<Contract | null>
  updateContract: (contractId: string, contractUpdates: Partial<Contract>) => Promise<Contract | null>
  deleteContract: (contractId: string) => Promise<boolean>
  initializeDefaultContractTemplates: () => Promise<void>
  // Permission functions
  hasPermission: (module: string, resource: string, action: "view" | "edit" | "delete") => boolean
  // Generic HR action handler for operations not yet implemented as specific functions
  handleHRAction: (params: HRActionParams) => Promise<any>
  
  // Event management functions
  refreshEvents: () => Promise<void>
  createEvent: (event: Omit<any, "id">) => Promise<any>
  updateEvent: (eventId: string, updates: Partial<any>) => Promise<void>
  deleteEvent: (eventId: string) => Promise<void>
  fetchEventRSVPs: (eventId: string) => Promise<any[]>
  createEventRSVP: (rsvp: Omit<any, "id">) => Promise<any>
  updateEventRSVP: (rsvpId: string, updates: Partial<any>) => Promise<void>
  
  // Expense management functions
  refreshExpenseReports: () => Promise<void>
  createExpenseReport: (report: Omit<any, "id">) => Promise<any>
  updateExpenseReport: (reportId: string, updates: Partial<any>) => Promise<void>
  deleteExpenseReport: (reportId: string) => Promise<void>
  
  // Diversity and inclusion functions
  refreshDiversityInitiatives: () => Promise<void>
  createDiversityInitiative: (initiative: Omit<any, "id">) => Promise<any>
  updateDiversityInitiative: (initiativeId: string, updates: Partial<any>) => Promise<void>
  deleteDiversityInitiative: (initiativeId: string) => Promise<void>
  refreshDiversitySurveys: () => Promise<void>
  createDiversitySurvey: (survey: Omit<any, "id">) => Promise<any>
  updateDiversitySurvey: (surveyId: string, updates: Partial<any>) => Promise<void>
  deleteDiversitySurvey: (surveyId: string) => Promise<void>
  
  // Starter checklist functions
  refreshStarterChecklists: () => Promise<void>
  createStarterChecklist: (checklist: Omit<any, "id">) => Promise<any>
  updateStarterChecklist: (checklistId: string, updates: Partial<any>) => Promise<void>
  deleteStarterChecklist: (checklistId: string) => Promise<void>

}

const HRContext = createContext<HRContextType | undefined>(undefined)

// Initial state
const initialState: HRState = {
  employees: [],
  roles: [],
  departments: [],
  trainings: [],
  timeOffs: [],
  warnings: [],
  attendances: [],
  attendanceRecords: [],  // Alias for attendances
  complianceTasks: [],
  announcements: [],
  jobs: [],
  jobPostings: [],  // Alias for jobs
  candidates: [],
  interviews: [],
  payrollRecords: [],
  performanceReviews: [],
  trainingPrograms: [],
  schedules: [],
  contracts: [],
  contractTemplates: [],
  benefits: [],
  events: [],
  employeeBenefits: [],
  expenseReports: [],
  starterChecklists: [],
  incentives: [],
  venueBattles: [],
  diversityInitiatives: [],
  diversitySurveys: [],
  isLoading: false,
  error: null,
  initialized: false,
  // Company information
  companyID: undefined,
  companyName: undefined,
  selectedSiteID: undefined,
  sites: undefined,
}

// Reducer function
const hrReducer = (state: HRState, action: HRAction): HRState => {
  switch (action.type) {
    case "SET_EMPLOYEES":
      return { ...state, employees: action.payload }
    case "ADD_EMPLOYEE":
      return { ...state, employees: [...state.employees, action.payload] }
    case "UPDATE_EMPLOYEE":
      return {
        ...state,
        employees: state.employees.map((employee) =>
          employee.id === action.payload.id ? action.payload : employee
        ),
      }
    case "DELETE_EMPLOYEE":
      return {
        ...state,
        employees: state.employees.filter((employee) => employee.id !== action.payload),
      }
    case "SET_ROLES":
      return { ...state, roles: action.payload }
    case "ADD_ROLE":
      return { ...state, roles: [...state.roles, action.payload] }
    case "UPDATE_ROLE":
      return {
        ...state,
        roles: state.roles.map((role) =>
          role.id === action.payload.id ? action.payload : role
        ),
      }
    case "DELETE_ROLE":
      return {
        ...state,
        roles: state.roles.filter((role) => role.id !== action.payload),
      }
    case "SET_DEPARTMENTS":
      return { ...state, departments: action.payload }
    case "ADD_DEPARTMENT":
      return { ...state, departments: [...state.departments, action.payload] }
    case "UPDATE_DEPARTMENT":
      return {
        ...state,
        departments: state.departments.map((department) =>
          department.id === action.payload.id ? action.payload : department
        ),
      }
    case "DELETE_DEPARTMENT":
      return {
        ...state,
        departments: state.departments.filter((department) => department.id !== action.payload),
      }
    case "SET_TRAININGS":
      return { ...state, trainings: action.payload }
    case "ADD_TRAINING":
      return { ...state, trainings: [...state.trainings, action.payload] }
    case "UPDATE_TRAINING":
      return {
        ...state,
        trainings: state.trainings.map((training) =>
          training.id === action.payload.id ? action.payload : training
        ),
      }
    case "DELETE_TRAINING":
      return {
        ...state,
        trainings: state.trainings.filter((training) => training.id !== action.payload),
      }
    case "SET_TIME_OFFS":
      return { ...state, timeOffs: action.payload }
    case "ADD_TIME_OFF":
      return { ...state, timeOffs: [...state.timeOffs, action.payload] }
    case "UPDATE_TIME_OFF":
      return {
        ...state,
        timeOffs: state.timeOffs.map((timeOff) =>
          timeOff.id === action.payload.id ? action.payload : timeOff
        ),
      }
    case "DELETE_TIME_OFF":
      return {
        ...state,
        timeOffs: state.timeOffs.filter((timeOff) => timeOff.id !== action.payload),
      }
    case "SET_WARNINGS":
      return { ...state, warnings: action.payload }
    case "ADD_WARNING":
      return { ...state, warnings: [...state.warnings, action.payload] }
    case "UPDATE_WARNING":
      return {
        ...state,
        warnings: state.warnings.map((warning) =>
          warning.id === action.payload.id ? action.payload : warning
        ),
      }
    case "DELETE_WARNING":
      return {
        ...state,
        warnings: state.warnings.filter((warning) => warning.id !== action.payload),
      }
    case "SET_ATTENDANCES":
      return { ...state, attendances: action.payload, attendanceRecords: action.payload }
    case "ADD_ATTENDANCE":
      return { ...state, attendances: [...state.attendances, action.payload] }
    case "UPDATE_ATTENDANCE":
      return {
        ...state,
        attendances: state.attendances.map((attendance) =>
          attendance.id === action.payload.id ? action.payload : attendance
        ),
      }
    case "DELETE_ATTENDANCE":
      return {
        ...state,
        attendances: state.attendances.filter((attendance) => attendance.id !== action.payload),
      }
    case "SET_COMPLIANCE_TASKS":
      return { ...state, complianceTasks: action.payload }
    case "ADD_COMPLIANCE_TASK":
      return { ...state, complianceTasks: [...state.complianceTasks, action.payload] }
    case "UPDATE_COMPLIANCE_TASK":
      return {
        ...state,
        complianceTasks: state.complianceTasks.map((task) =>
          task.id === action.payload.id ? action.payload : task
        ),
      }
    case "DELETE_COMPLIANCE_TASK":
      return {
        ...state,
        complianceTasks: state.complianceTasks.filter((task) => task.id !== action.payload),
      }
    case "SET_ANNOUNCEMENTS":
      return { ...state, announcements: action.payload }
    case "ADD_ANNOUNCEMENT":
      return { ...state, announcements: [...state.announcements, action.payload] }
    case "UPDATE_ANNOUNCEMENT":
      return {
        ...state,
        announcements: state.announcements.map((announcement) =>
          announcement.id === action.payload.id ? action.payload : announcement
        ),
      }
    case "DELETE_ANNOUNCEMENT":
      return {
        ...state,
        announcements: state.announcements.filter((announcement) => announcement.id !== action.payload),
      }
    // Job actions
    case "SET_JOBS":
      return { ...state, jobs: action.payload, jobPostings: action.payload }
    case "ADD_JOB":
      return { ...state, jobs: [...state.jobs, action.payload] }
    case "UPDATE_JOB":
      return {
        ...state,
        jobs: state.jobs.map((job) =>
          job.id === action.payload.id ? action.payload : job
        ),
      }
    case "DELETE_JOB":
      return {
        ...state,
        jobs: state.jobs.filter((job) => job.id !== action.payload),
      }
    case "SET_CANDIDATES":
      return { ...state, candidates: action.payload }
    case "ADD_CANDIDATE":
      return { ...state, candidates: [...state.candidates, action.payload] }
    case "UPDATE_CANDIDATE":
      return {
        ...state,
        candidates: state.candidates.map((candidate) => (candidate.id === action.payload.id ? action.payload : candidate)),
      }
    case "DELETE_CANDIDATE":
      return {
        ...state,
        candidates: state.candidates.filter((candidate) => candidate.id !== action.payload),
      }
    case "SET_INTERVIEWS":
      return { ...state, interviews: action.payload }
    case "ADD_INTERVIEW":
      return { ...state, interviews: [...state.interviews, action.payload] }
    case "UPDATE_INTERVIEW":
      return {
        ...state,
        interviews: state.interviews.map((interview) => (interview.id === action.payload.id ? action.payload : interview)),
      }
    case "DELETE_INTERVIEW":
      return {
        ...state,
        interviews: state.interviews.filter((interview) => interview.id !== action.payload),
      }
    case "SET_PAYROLL_RECORDS":
      return { ...state, payrollRecords: action.payload }
    case "ADD_PAYROLL":
      return { ...state, payrollRecords: [...state.payrollRecords, action.payload] }
    case "UPDATE_PAYROLL":
      return {
        ...state,
        payrollRecords: state.payrollRecords.map((record) =>
          record.id === action.payload.id ? action.payload : record
        ),
      }
    case "DELETE_PAYROLL":
      return {
        ...state,
        payrollRecords: state.payrollRecords.filter((record) => record.id !== action.payload),
      }
    case "SET_PERFORMANCE_REVIEWS":
      return { ...state, performanceReviews: action.payload }
    case "ADD_PERFORMANCE_REVIEW":
      return { ...state, performanceReviews: [...state.performanceReviews, action.payload] }
    case "UPDATE_PERFORMANCE_REVIEW":
      return {
        ...state,
        performanceReviews: state.performanceReviews.map((review) =>
          review.id === action.payload.id ? action.payload : review
        ),
      }
    case "DELETE_PERFORMANCE_REVIEW":
      return {
        ...state,
        performanceReviews: state.performanceReviews.filter((review) => review.id !== action.payload),
      }
    case "SET_TRAINING_PROGRAMS":
      return { ...state, trainingPrograms: action.payload }
    case "SET_SCHEDULES":
      return { ...state, schedules: action.payload }
    case "SET_CONTRACTS":
      return { ...state, contracts: action.payload }
    case "ADD_CONTRACT":
      return {
        ...state,
        contracts: [...state.contracts, action.payload]
      }
    case "UPDATE_CONTRACT":
      return {
        ...state,
        contracts: state.contracts.map(contract =>
          contract.id === action.payload.id ? action.payload : contract
        )
      }
    case "SET_CONTRACT_TEMPLATES":
      return { ...state, contractTemplates: action.payload }
    case "ADD_CONTRACT_TEMPLATE":
      return {
        ...state,
        contractTemplates: [...(state.contractTemplates || []), action.payload]
      }
    case "SET_BENEFITS":
      return { ...state, benefits: action.payload }
    case "SET_EVENTS":
      return { ...state, events: action.payload }
    case "SET_EMPLOYEE_BENEFITS":
      return { ...state, employeeBenefits: action.payload }
    case "SET_EXPENSE_REPORTS":
      return { ...state, expenseReports: action.payload }
    case "SET_STARTER_CHECKLISTS":
      return { ...state, starterChecklists: action.payload }
    case "SET_INCENTIVES":
      return { ...state, incentives: action.payload }
    case "SET_VENUE_BATTLES":
      return { ...state, venueBattles: action.payload }
    case "SET_DIVERSITY_INITIATIVES":
      return { ...state, diversityInitiatives: action.payload }
    case "SET_DIVERSITY_SURVEYS":
      return { ...state, diversitySurveys: action.payload }
    case "ADD_SCHEDULE":
      return { ...state, schedules: [...state.schedules, action.payload] }
    case "UPDATE_SCHEDULE":
      return {
        ...state,
        schedules: state.schedules.map((schedule) =>
          schedule.id === action.payload.id ? action.payload : schedule
        ),
      }
    case "DELETE_SCHEDULE":
      return {
        ...state,
        schedules: state.schedules.filter((schedule) => schedule.id !== action.payload),
      }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "SET_INITIALIZED":
      return { ...state, initialized: action.payload }
    case "BATCH_UPDATE":
      return {
        ...state,
        ...(action.payload.employees !== undefined && { employees: action.payload.employees }),
        ...(action.payload.roles !== undefined && { roles: action.payload.roles }),
        ...(action.payload.departments !== undefined && { departments: action.payload.departments }),
        ...(action.payload.trainings !== undefined && { trainings: action.payload.trainings }),
        ...(action.payload.timeOffs !== undefined && { timeOffs: action.payload.timeOffs }),
        ...(action.payload.warnings !== undefined && { warnings: action.payload.warnings }),
        ...(action.payload.attendances !== undefined && { 
          attendances: action.payload.attendances,
          attendanceRecords: action.payload.attendances // Alias
        }),
        ...(action.payload.complianceTasks !== undefined && { complianceTasks: action.payload.complianceTasks }),
        ...(action.payload.announcements !== undefined && { announcements: action.payload.announcements }),
        ...(action.payload.jobs !== undefined && { 
          jobs: action.payload.jobs,
          jobPostings: action.payload.jobs // Alias
        }),
        ...(action.payload.candidates !== undefined && { candidates: action.payload.candidates }),
        ...(action.payload.interviews !== undefined && { interviews: action.payload.interviews }),
        ...(action.payload.payrollRecords !== undefined && { payrollRecords: action.payload.payrollRecords }),
        ...(action.payload.performanceReviews !== undefined && { performanceReviews: action.payload.performanceReviews }),
        ...(action.payload.schedules !== undefined && { schedules: action.payload.schedules }),
        ...(action.payload.contracts !== undefined && { contracts: action.payload.contracts }),
        ...(action.payload.contractTemplates !== undefined && { contractTemplates: action.payload.contractTemplates }),
        ...(action.payload.benefits !== undefined && { benefits: action.payload.benefits }),
        ...(action.payload.events !== undefined && { events: action.payload.events }),
        ...(action.payload.employeeBenefits !== undefined && { employeeBenefits: action.payload.employeeBenefits }),
        ...(action.payload.expenseReports !== undefined && { expenseReports: action.payload.expenseReports }),
        ...(action.payload.starterChecklists !== undefined && { starterChecklists: action.payload.starterChecklists }),
        ...(action.payload.incentives !== undefined && { incentives: action.payload.incentives }),
        ...(action.payload.venueBattles !== undefined && { venueBattles: action.payload.venueBattles }),
        ...(action.payload.diversityInitiatives !== undefined && { diversityInitiatives: action.payload.diversityInitiatives }),
        ...(action.payload.diversitySurveys !== undefined && { diversitySurveys: action.payload.diversitySurveys }),
        ...(action.payload.initialized !== undefined && { initialized: action.payload.initialized }),
      }
    default:
      return state
  }
}

// Provider component
interface HRProviderProps {
  children: ReactNode
}

export const HRProvider: React.FC<HRProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(hrReducer, initialState)
  const { getBasePath, state: companyState, hasPermission } = useCompany()
  const { state: settingsState } = useSettings()
  // Track active loading operations to prevent race conditions
  const activeLoadingOps = useRef<Set<string>>(new Set())

  // Helper function for creating notifications
  const createHRNotification = useCallback(async (
    action: 'created' | 'updated' | 'deleted',
    entityType: string,
    entityName: string,
    entityId: string,
    oldValue?: any,
    newValue?: any
  ) => {
    try {
      const titles = {
        created: `${entityType} Added`,
        updated: `${entityType} Updated`, 
        deleted: `${entityType} Removed`
      }
      
      const messages = {
        created: `${entityName} was added`,
        updated: `${entityName} was updated`,
        deleted: `${entityName} was removed`
      }
      
      const categories = {
        created: 'success' as const,
        updated: 'info' as const,
        deleted: 'warning' as const
      }

      await createNotification(
        companyState.companyID,
        settingsState.auth?.uid || 'system',
        'hr',
        action,
        titles[action],
        messages[action],
        {
          siteId: companyState.selectedSiteID || undefined,
          priority: 'medium',
          category: categories[action],
          details: {
            entityId,
            entityName,
            oldValue,
            newValue,
            changes: {
              [entityType.toLowerCase()]: { 
                from: action === 'created' ? {} : oldValue, 
                to: action === 'deleted' ? null : newValue 
              }
            }
          }
        }
      )
    } catch (error) {
      console.warn('Failed to create HR notification:', error)
    }
  }, [companyState.companyID, companyState.selectedSiteID, settingsState.auth?.uid])

  
  // Generic safe refresh function to handle loading state and prevent race conditions
  const safeRefresh = async <T,>(entityName: string, fetchFn: () => Promise<T[]>, actionType: string): Promise<void> => {
    try {
      // Only set loading to true if no other refresh operations are active
      if (activeLoadingOps.current.size === 0) {
        dispatch({ type: "SET_LOADING", payload: true })
      }
      
      // Mark this entity as being refreshed
      activeLoadingOps.current.add(entityName)
      
      // Fetch data
      const data = await fetchFn()
      
      // Update state with fetched data
      console.log(`🔄 HR Context - Updating ${entityName} state with ${data.length} items`)
      dispatch({ type: actionType as any, payload: data })
      console.log(`✅ HR Context - ${entityName} state updated successfully`)
      
      // Set initialized to true after successfully fetching data
      if (!state.initialized) {
        console.log(`HR Context - Setting initialized flag to true after ${entityName} loaded`)
        dispatch({ type: "SET_INITIALIZED", payload: true })
      }
    } catch (error) {
      console.error(`Error refreshing ${entityName}:`, error)
      dispatch({ type: "SET_ERROR", payload: `Failed to refresh ${entityName}` })
    } finally {
      // Remove this entity from active operations
      activeLoadingOps.current.delete(entityName)
      
      // Only set loading to false if no other refresh operations are active
      if (activeLoadingOps.current.size === 0) {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }
  }

  // Multi-path loader for HR data
  const getHRPaths = useCallback(() => {
    console.log("🔍 getHRPaths - Company state:", {
      companyID: companyState.companyID,
      selectedSiteID: companyState.selectedSiteID,
      selectedSubsiteID: companyState.selectedSubsiteID
    })
    
    if (!companyState.companyID) {
      console.log("❌ getHRPaths - No companyID available")
      return []
    }
    
    const paths = []
    const companyRoot = `companies/${companyState.companyID}`
    
    if (companyState.selectedSiteID) {
      // If subsite is selected, prioritize subsite level first
      if (companyState.selectedSubsiteID) {
        const subsitePath = `${companyRoot}/sites/${companyState.selectedSiteID}/subsites/${companyState.selectedSubsiteID}/data/hr`
        const sitePath = `${companyRoot}/sites/${companyState.selectedSiteID}/data/hr`
        const companyPath = `${companyRoot}/data/hr`
        paths.push(subsitePath)
        paths.push(sitePath)
        paths.push(companyPath)
        console.log("✅ getHRPaths - Using subsite paths:", { subsitePath, sitePath, companyPath })
      } else {
        // If no subsite selected, check site level and company level
        const sitePath = `${companyRoot}/sites/${companyState.selectedSiteID}/data/hr`
        const companyPath = `${companyRoot}/data/hr`
        paths.push(sitePath)
        paths.push(companyPath)
        console.log("⚠️ getHRPaths - No subsite selected, using site and company paths:", { sitePath, companyPath })
      }
    } else {
      // If no site selected, check company level
      const companyPath = `${companyRoot}/data/hr`
      paths.push(companyPath)
      console.log("⚠️ getHRPaths - No site selected, using company path only:", companyPath)
    }
    
    console.log("🔍 getHRPaths - Final paths:", paths)
    return paths
  }, [companyState.companyID, companyState.selectedSiteID, companyState.selectedSubsiteID])

  // Get the primary write path for HR data (uses highest priority path for write operations)
  const getHRWritePath = useCallback(() => {
    const paths = getHRPaths()
    const writePath = paths.length > 0 ? paths[0] : ""
    console.log("🔍 getHRWritePath - Selected write path:", {
      writePath,
      allPaths: paths,
      pathIndex: 0
    })
    return writePath
  }, [getHRPaths])

  // Create cached fetchers for all data types (with request deduplication)
  // Must be defined before functions that use them
  // Employees: use secure Function (server-side) - list returns non-sensitive fields only
  const fetchEmployeesSecureCached = useMemo(() => createCachedFetcher(fetchEmployeesSecureCall, 'employeesSecure'), [])
  const fetchEmployeesCached = useMemo(() => createCachedFetcher(fetchEmployees, 'employees'), [])
  const fetchRolesCached = useMemo(() => createCachedFetcher(fetchRoles, 'roles'), [])
  const fetchDepartmentsCached = useMemo(() => createCachedFetcher(fetchDepartments, 'departments'), [])
  const fetchTimeOffsCached = useMemo(() => createCachedFetcher(fetchTimeOffs, 'timeOffs'), [])
  const fetchWarningsCached = useMemo(() => createCachedFetcher(fetchWarnings, 'warnings'), [])
  const fetchTrainingsCached = useMemo(() => createCachedFetcher(fetchTrainings, 'trainings'), [])
  const fetchAttendancesCached = useMemo(() => createCachedFetcher(fetchAttendances, 'attendances'), [])
  const fetchPayrollCached = useMemo(() => createCachedFetcher(fetchPayroll, 'payroll'), [])
  const fetchPerformanceReviewsCached = useMemo(() => createCachedFetcher(fetchPerformanceReviews, 'performanceReviews'), [])

  const refreshEmployees = useCallback(async (): Promise<void> => {
    const paths = getHRPaths()
    const basePath = getBasePath("hr")
    
    if (!basePath || paths.length === 0) {
      console.log("❌ HR Context - No paths available for employee loading")
      return
    }
    
    await safeRefresh('employees', 
      async () => {
        const allEmployees: any[] = []
        const employeeIds = new Set<string>()
        
        // Helper to add employees with deduplication
        const addEmployees = (employees: any[]) => {
          if (!employees || !Array.isArray(employees)) return
          employees.forEach(emp => {
            // Generate a unique ID for deduplication - use id, employeeID, or generate one
            const empId = emp.id || emp.employeeID || `temp_${Math.random().toString(36).substr(2, 9)}`
            
            // Only skip if we've already seen this exact ID
            if (!employeeIds.has(empId)) {
              employeeIds.add(empId)
              // Ensure employee has an id field for consistency
              if (!emp.id && emp.employeeID) {
                emp.id = emp.employeeID
              } else if (!emp.id && !emp.employeeID) {
                // Generate a temporary ID if neither exists (shouldn't happen, but be safe)
                emp.id = empId
              }
              allEmployees.push(emp)
            } else {
              console.warn(`⚠️ HR Context - Duplicate employee skipped: ${empId} (${emp.firstName} ${emp.lastName})`)
            }
          })
        }
        
        // Fetch from secure Functions (server-side, list = non-sensitive only)
        for (const path of paths) {
          try {
            const data = await fetchEmployeesSecureCached(path, false)
            if (data && data.length > 0) {
              const beforeCount = allEmployees.length
              addEmployees(data)
              const addedCount = allEmployees.length - beforeCount
              if (addedCount > 0) {
                console.log(`✅ HR Context - Loaded ${addedCount} employees from secure path: ${path}`)
              }
            }
          } catch (error) {
            console.warn(`Failed to load employees from secure Function ${path}:`, error)
            continue
          }
        }
        
        console.log(`✅ HR Context - Total employees loaded: ${allEmployees.length} from ${paths.length} paths`)
        return allEmployees
      },
      "SET_EMPLOYEES"
    )
  }, [getHRPaths, getBasePath, fetchEmployeesSecureCached, safeRefresh])

  const refreshRoles = useCallback(async (): Promise<void> => {
    const basePath = getBasePath("hr")
    if (!basePath) return
    
    await safeRefresh('roles', 
      async () => {
        return await fetchRolesCached(basePath, false)
      },
      "SET_ROLES"
    )
  }, [getBasePath, fetchRolesCached, safeRefresh])

  const refreshDepartments = useCallback(async (): Promise<void> => {
    const basePath = getBasePath("hr")
    if (!basePath) return
    
    await safeRefresh('departments', 
      async () => {
        return await fetchDepartmentsCached(basePath, false)
      },
      "SET_DEPARTMENTS"
    )
  }, [getBasePath, fetchDepartmentsCached, safeRefresh])
  
  // Legacy refreshDepartments with path parsing (kept for backward compatibility)

  const refreshJobs = async (): Promise<void> => {
    const basePath = getBasePath("hr")
    if (!basePath) return
    
    console.log("HR Context - refreshJobs from database for basePath:", basePath)
    
    await safeRefresh('jobs', 
      async () => {
        const fullPath = `${basePath}/data/hr`
        console.log("HR Context - Fetching jobs from path:", fullPath)
        const jobs = await rtdb.fetchJobs(fullPath)
        console.log("HR Context - Jobs fetch result:", jobs.length, "items")
        if (jobs.length > 0) {
          console.log("HR Context - Sample job:", jobs[0])
        }
        return jobs
      },
      "SET_JOBS"
    )
  }

  const refreshCandidates = async (): Promise<void> => {
    const basePath = getBasePath("hr")
    if (!basePath) return
    
    console.log("HR Context - refreshCandidates from database for basePath:", basePath)
    
    await safeRefresh('candidates', 
      async () => {
        const fullPath = `${basePath}/data/hr`
        console.log("HR Context - Fetching candidates from path:", fullPath)
        const candidates = await rtdb.fetchCandidates(fullPath)
        console.log("HR Context - Candidates fetch result:", candidates.length, "items")
        if (candidates.length > 0) {
          console.log("HR Context - Sample candidate:", candidates[0])
        }
        return candidates
      },
      "SET_CANDIDATES"
    )
  }

  const refreshContracts = async (): Promise<void> => {
    const basePath = getBasePath("hr")
    if (!basePath) {
      console.log("HR Context - refreshContracts: No basePath available")
      return
    }
    
    console.log("HR Context - refreshContracts from database for basePath:", basePath)
    
    await safeRefresh('contracts', 
      async () => {
        const fullPath = `${basePath}/data/hr`
        console.log("HR Context - Fetching contracts from path:", fullPath)
        const contracts = await fetchContractsRTDB(fullPath)
        console.log("HR Context - Contracts fetch result:", contracts.length, "items")
        if (contracts.length > 0) {
          console.log("HR Context - Sample contract:", contracts[0])
        }
        return contracts
      },
      "SET_CONTRACTS"
    )
  }

  const refreshInterviews = async (): Promise<void> => {
    const basePath = getBasePath("hr")
    if (!basePath) return
    
    console.log("HR Context - refreshInterviews from database for basePath:", basePath)
    
    await safeRefresh('interviews', 
      async () => {
        const interviews = await rtdb.fetchInterviews(basePath)
        console.log("Found interviews:", interviews.length)
        return interviews
      },
      "SET_INTERVIEWS"
    )
  }

  const refreshAnnouncements = async (): Promise<void> => {
    const basePath = getBasePath("hr")
    if (!basePath) return
    
    console.log("HR Context - refreshAnnouncements from database for basePath:", basePath)
    
    await safeRefresh('announcements', 
      async () => await rtdb.fetchAnnouncements(`${basePath}/data/hr`),
      "SET_ANNOUNCEMENTS"
    )
  }

  const addAnnouncement = async (announcement: Omit<Announcement, 'id'>): Promise<Announcement | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) return null

    try {
      const newAnnouncement = await rtdb.createAnnouncement(`${basePath}/data/hr`, announcement)
      dispatch({ type: "ADD_ANNOUNCEMENT", payload: newAnnouncement })
      return newAnnouncement
    } catch (error) {
      console.error("Error creating announcement:", error)
      throw error
    }
  }

  const updateAnnouncement = async (announcementId: string, updates: Partial<Announcement>): Promise<Announcement | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) return null

    try {
      await rtdb.updateAnnouncement(`${basePath}/data/hr`, announcementId, updates)
      const updatedAnnouncement = { ...updates, id: announcementId } as Announcement
      dispatch({ type: "UPDATE_ANNOUNCEMENT", payload: updatedAnnouncement })
      return updatedAnnouncement
    } catch (error) {
      console.error("Error updating announcement:", error)
      throw error
    }
  }

  const deleteAnnouncement = async (announcementId: string): Promise<boolean> => {
    const basePath = getBasePath("hr")
    if (!basePath) return false

    try {
      await rtdb.deleteAnnouncement(`${basePath}/data/hr`, announcementId)
      dispatch({ type: "DELETE_ANNOUNCEMENT", payload: announcementId })
      return true
    } catch (error) {
      console.error("Error deleting announcement:", error)
      throw error
    }
  }

  const refreshPayrolls = async (): Promise<void> => {
    const basePath = getBasePath("hr")
    if (!basePath) return
    
    const hrBasePath = `${basePath}/data/hr`
    console.log("HR Context - refreshPayrolls from database for basePath:", basePath)
    
    await safeRefresh('payrolls', 
      async () => {
        try {
          const list = await fetchPayrollSecureCall(hrBasePath)
          console.log("HR Context - Payroll fetch (secure):", list.length, "items")
          return list as Payroll[]
        } catch (secureErr) {
          console.warn("HR Context - Secure payroll fetch failed, falling back to RTDB:", secureErr)
          const result = await fetchPayroll(hrBasePath)
          console.log("HR Context - Payroll fetch (RTDB fallback):", result.length, "items")
          return result
        }
      },
      "SET_PAYROLL_RECORDS"
    )
  }

  const refreshPerformanceReviews = async (): Promise<void> => {
    const basePath = getBasePath("hr")
    if (!basePath) return
    
    console.log("HR Context - refreshPerformanceReviews from database for basePath:", basePath)
    
    await safeRefresh('performanceReviews', 
      async () => {
        const fullPath = `${basePath}/data/hr`
        console.log("HR Context - Fetching performance reviews from path:", fullPath)
        const reviews = await fetchPerformanceReviews(fullPath)
        console.log("HR Context - Performance reviews fetch result:", reviews.length, "items")
        if (reviews.length > 0) {
          console.log("HR Context - Sample performance review:", reviews[0])
        }
        return reviews
      },
      "SET_PERFORMANCE_REVIEWS"
    )
  }

  const refreshSchedules = async (): Promise<void> => {
    const paths = getHRPaths()
    if (paths.length === 0) return
    
    console.log("HR Context - refreshSchedules with multi-path loading for paths:", paths)
    
    await safeRefresh('schedules', 
      async () => {
        const allSchedules: any[] = []
        const scheduleIds = new Set<string>()
        
        // Load schedules from all paths, aggregating them
        for (const path of paths) {
          try {
            console.log(`🔄 refreshSchedules - Attempting to load schedules from: ${path}`)
            const schedules = await fetchSchedules(path)
            console.log(`✅ refreshSchedules - Schedules loaded from ${path}:`, schedules.length, "schedules")
            
            if (schedules && schedules.length > 0) {
              // Add schedules from this path, avoiding duplicates
              schedules.forEach(schedule => {
                const scheduleId = schedule.id || (schedule as any).scheduleID
                if (scheduleId && !scheduleIds.has(scheduleId)) {
                  scheduleIds.add(scheduleId)
                  allSchedules.push(schedule)
                }
              })
              console.log(`✅ refreshSchedules - Added schedules from ${path}, total unique:`, allSchedules.length)
            }
          } catch (error) {
            console.warn(`❌ refreshSchedules - Failed to load schedules from ${path}:`, error)
            continue
          }
        }
        
        console.log("🔍 refreshSchedules - Final schedule aggregation:", {
          totalPaths: paths.length,
          totalUniqueSchedules: allSchedules.length,
          sampleSchedule: allSchedules[0]
        })
        
        return allSchedules
      },
      "SET_SCHEDULES"
    )
  }









  // Refresh trainings data
  const refreshTrainings = async (): Promise<void> => {
    const basePath = getBasePath("hr")
    if (!basePath) return
    
    // Extract companyId and siteId from basePath
    const pathParts = basePath.split("/")
    
    if (pathParts.length >= 2 && pathParts[0] === "companies") {
      const companyId = pathParts[1] // Index 1 contains companyId
      
      // Check if this is site-level data management
      if (pathParts.length >= 4 && pathParts[2] === "sites") {
        const siteId = pathParts[3] // Index 3 contains siteId
        console.log("HR Context - refreshTrainings (site-level) with:", { companyId, siteId, basePath })
        
        await safeRefresh('trainings', 
          () => fetchTrainings(`${basePath}/data/hr`),
          "SET_TRAININGS"
        )
      } else {
        // Company-level data management - use companyId as siteId
        console.log("HR Context - refreshTrainings (company-level) with:", { companyId, basePath })
        
        await safeRefresh('trainings', 
          () => fetchTrainings(`${basePath}/data/hr`),
          "SET_TRAININGS"
        )
      }
    } else {
      console.error("Invalid basePath format for HR context:", basePath)
      dispatch({ type: "SET_ERROR", payload: "Invalid path format for HR data" })
    }
  }

  // Refresh time offs data (using cached fetcher for performance)
  const refreshTimeOffs = useCallback(async (): Promise<void> => {
    const basePath = getBasePath("hr")
    if (!basePath) return
    
    const fullPath = `${basePath}/data/hr`
    
    await safeRefresh('timeOffs', 
      async () => {
        // Use cached fetcher for better performance
        return await fetchTimeOffsCached(fullPath, false)
      },
      "SET_TIME_OFFS"
    )
  }, [getBasePath, fetchTimeOffsCached, safeRefresh])

  // Refresh warnings data
  const refreshWarnings = async (): Promise<void> => {
    const basePath = getBasePath("hr")
    if (!basePath) return
    
    console.log("HR Context - refreshWarnings from database for basePath:", basePath)
    
    await safeRefresh('warnings', 
      async () => {
        const fullPath = `${basePath}/data/hr`
        console.log("HR Context - Fetching warnings from path:", fullPath)
        const warnings = await fetchWarnings(fullPath)
        console.log("HR Context - Warnings fetch result:", warnings.length, "items")
        if (warnings.length > 0) {
          console.log("HR Context - Sample warning:", warnings[0])
        }
        return warnings
      },
      "SET_WARNINGS"
    )
  }

  // Refresh attendances data
  const refreshAttendances = async (): Promise<void> => {
    const basePath = getBasePath("hr")
    if (!basePath) return
    
    const pathParts = basePath.split("/")
    
    if (pathParts.length >= 2 && pathParts[0] === "companies") {
      const companyId = pathParts[1]
      
      // Check if this is site-level data management
      if (pathParts.length >= 4 && pathParts[2] === "sites") {
        const siteId = pathParts[3]
        console.log("HR Context - refreshAttendances (site-level) with:", { companyId, siteId, basePath })
        
        await safeRefresh('attendances', 
          () => fetchAttendances(`${basePath}/data/hr`),
          "SET_ATTENDANCES"
        )
      } else {
        // Company-level data management
        console.log("HR Context - refreshAttendances (company-level) with:", { companyId, basePath })
        
        await safeRefresh('attendances', 
          () => fetchAttendances(`${basePath}/data/hr`),
          "SET_ATTENDANCES"
        )
      }
    } else {
      console.error("Invalid basePath format for HR context:", basePath)
      dispatch({ type: "SET_ERROR", payload: "Invalid path format for HR data" })
    }
  }

  // Track loaded base paths to prevent duplicate loading
  const loadedPaths = React.useRef<Set<string>>(new Set())
  const loadingTimeouts = React.useRef<Record<string, NodeJS.Timeout>>({})

  // Track previous basePath to detect changes
  const previousBasePathRef = useRef<string | null>(null)

  // Auto-refresh data when base path changes (with progressive loading + caching)
  useEffect(() => {
    // Wait for dependencies: Settings and Company must be ready first
    if (!settingsState.auth || settingsState.loading) {
      return // Settings not ready yet
    }
    
    // If no company selected but user is logged in, mark as initialized with empty state
    if (!companyState.companyID && settingsState.auth.isLoggedIn) {
      if (!state.initialized) {
        dispatch({ type: "SET_INITIALIZED", payload: true })
        if (process.env.NODE_ENV === 'development') {
          console.log("✅ HR Context: Initialized with empty state (no company selected)")
        }
      }
      previousBasePathRef.current = null
      loadedPaths.current.clear() // Clear loaded paths when company is deselected
      return // Company not selected yet (but user is logged in)
    }
    
    const basePath = getBasePath("hr")
    
    // If basePath changed (site/subsite changed), clear old paths and reload
    if (previousBasePathRef.current && previousBasePathRef.current !== basePath) {
      console.log(`🔄 HR Context: Base path changed from ${previousBasePathRef.current} to ${basePath} - clearing and reloading`)
      loadedPaths.current.clear() // Clear all loaded paths when path changes
      // Reset initialized state so we reload
      dispatch({ type: "SET_INITIALIZED", payload: false })
    }
    
    previousBasePathRef.current = basePath
    
    if (!basePath) {
      // If no basePath but we have a company, mark as initialized with empty state
      if (companyState.companyID && !state.initialized) {
        dispatch({ type: "SET_INITIALIZED", payload: true })
        if (process.env.NODE_ENV === 'development') {
          console.log("✅ HR Context: Initialized with empty state (no site selected)")
        }
      }
      return // No base path available
    }
    
    // Skip if this exact path is already loaded
    if (loadedPaths.current.has(basePath)) {
      return // Skip if already loaded
    }

    // Clear any existing timeout for this path
    if (loadingTimeouts.current[basePath]) {
      clearTimeout(loadingTimeouts.current[basePath])
    }

    // Debounce loading to prevent rapid fire requests
    loadingTimeouts.current[basePath] = setTimeout(async () => {
      if (loadedPaths.current.has(basePath)) return // Double check

      loadedPaths.current.add(basePath)
      
      // Clear any existing loading operations
      activeLoadingOps.current.clear()
      
      // Set loading state once at the beginning
      dispatch({ type: "SET_LOADING", payload: true })
      
      await measurePerformance('HRContext', 'loadAllData', async () => {
        try {
          const hrPaths = getHRPaths()
          
          // PROGRESSIVE LOADING: Critical data first (for immediate UI)
          // Load from all paths to ensure we get all data
          const loadFromAllPaths = async <T,>(fetchFn: (path: string) => Promise<T[]>, entityName: string): Promise<T[]> => {
            const allData: T[] = []
            const dataIds = new Set<string>()
            
            // Helper to add data with deduplication
            const addData = (items: T[]) => {
              if (!items || !Array.isArray(items)) return
              items.forEach((item: any) => {
                // Generate a unique ID for deduplication - don't filter out items without IDs
                const itemId = item.id || item.employeeID || item.roleID || item.departmentID || `temp_${Math.random().toString(36).substr(2, 9)}`
                
                // Only skip if we've already seen this exact ID (and it's not a temp ID)
                if (itemId.startsWith('temp_') || !dataIds.has(itemId)) {
                  if (!itemId.startsWith('temp_')) {
                    dataIds.add(itemId)
                  }
                  // Ensure item has an id field for consistency
                  if (!item.id) {
                    if (item.employeeID) item.id = item.employeeID
                    else if (item.roleID) item.id = item.roleID
                    else if (item.departmentID) item.id = item.departmentID
                    else item.id = itemId
                  }
                  allData.push(item)
                } else {
                  console.warn(`⚠️ HR Context - Duplicate ${entityName} skipped: ${itemId}`)
                }
              })
            }
            
            // Try cached fetch from basePath first
            try {
              const cachedData = await fetchFn(basePath)
              if (cachedData && cachedData.length > 0) {
                addData(cachedData)
                console.log(`✅ Loaded ${cachedData.length} ${entityName} from cached basePath: ${basePath}`)
              }
            } catch (error) {
              console.warn(`Cached fetch failed for ${entityName}, trying all paths:`, error)
            }
            
            // Check all paths to ensure we get all data
            for (const path of hrPaths) {
              if (path === basePath && allData.length > 0) {
                continue // Already loaded from cache
              }
              
              try {
                const data = await fetchFn(path)
                if (data && data.length > 0) {
                  const beforeCount = allData.length
                  addData(data)
                  const addedCount = allData.length - beforeCount
                  if (addedCount > 0) {
                    console.log(`✅ Loaded ${addedCount} additional ${entityName} from ${path}`)
                  }
                }
              } catch (error) {
                console.warn(`Failed to load ${entityName} from ${path}:`, error)
                continue
              }
            }
            
            return allData
          }
          
          const [employees, roles, departments] = await Promise.all([
            loadFromAllPaths(async (path) => {
              return await fetchEmployeesSecureCached(path, false)
            }, 'employees'),
            loadFromAllPaths(async (path) => {
              try {
                return await fetchRolesCached(path, false)
              } catch {
                return await fetchRoles(path)
              }
            }, 'roles'),
            loadFromAllPaths(async (path) => {
              try {
                return await fetchDepartmentsCached(path, false)
              } catch {
                return await fetchDepartments(path)
              }
            }, 'departments'),
          ])
          
          // Update critical data immediately
          dispatch({ 
            type: "BATCH_UPDATE", 
            payload: {
              employees: employees || [],
              roles: roles || [],
              departments: departments || [],
              initialized: true
            }
          })
          
          console.log(`⚡ HR Context: Critical data loaded (${employees.length} employees, ${roles.length} roles, ${departments.length} departments) from ${hrPaths.length} paths`)
          
          // BACKGROUND: Load non-critical data after (non-blocking)
          const loadBackgroundData = () => {
            Promise.all([
              fetchTimeOffsCached(basePath).catch(() => []),
              fetchWarningsCached(basePath).catch(() => []),
              fetchTrainingsCached(basePath).catch(() => []),
              fetchAttendancesCached(basePath).catch(() => []),
              fetchPayrollCached(basePath).catch(() => []),
              fetchPerformanceReviewsCached(basePath).catch(() => []),
              (async () => {
                // Fetch schedules from multi-path (needs special handling)
                let schedules: Schedule[] = []
                for (const path of hrPaths) {
                  try {
                    const pathSchedules = await fetchSchedules(path)
                    if (pathSchedules.length > 0) {
                      schedules = pathSchedules
                      break
                    }
                  } catch (error) {
                    console.warn(`Failed to load schedules from ${path}:`, error)
                  }
                }
                return schedules
              })(),
              rtdb.fetchJobs(basePath).catch(() => []),
              rtdb.fetchCandidates(basePath).catch(() => []),
              rtdb.fetchInterviews(basePath).catch(() => []),
              rtdb.fetchAnnouncements(`${basePath}/data/hr`).catch(() => []),
              fetchContractsRTDB(`${basePath}/data/hr`).catch(() => []),
              fetchBenefitsRTDB(`${basePath}/data/hr`).catch(() => []),
            ]).then(([
              timeOffs, warnings, trainings, attendances, payroll, 
              performanceReviews, schedules, jobPostings, candidates, 
              interviews, announcements, contracts, benefits
            ]) => {
              dispatch({ 
                type: "BATCH_UPDATE", 
                payload: {
                  timeOffs: (timeOffs || []) as any,
                  warnings: warnings || [],
                  trainings: trainings || [],
                  attendances: attendances || [],
                  payrollRecords: (payroll || []) as any,
                  performanceReviews: (performanceReviews || []) as any,
                  schedules: schedules || [],
                  contracts: contracts || [],
                  jobs: jobPostings || [],
                  candidates: candidates || [],
                  interviews: interviews || [],
                  announcements: announcements || [],
                  benefits: benefits || [],
                  events: [], // Not implemented yet
                  employeeBenefits: [], // Not implemented yet
                  expenseReports: [], // Not implemented yet
                  starterChecklists: [], // Not implemented yet
                  incentives: [], // Not implemented yet
                  venueBattles: [], // Not implemented yet
                }
              })
              console.log(`⚡ HR Context: Background data loaded for ${basePath}`)
            }).catch(error => {
              console.warn('Error loading background HR data:', error)
            })
          }
          
          // Use requestIdleCallback if available, otherwise setTimeout
          if ('requestIdleCallback' in window) {
            requestIdleCallback(loadBackgroundData, { timeout: 2000 })
          } else {
            setTimeout(loadBackgroundData, 100)
          }
          
        } catch (error) {
          console.error("Error loading HR data:", error)
          // Remove from loaded paths on error so it can retry
          loadedPaths.current.delete(basePath)
        } finally {
          // Ensure loading is set to false when all operations complete
          dispatch({ type: "SET_LOADING", payload: false })
          // Clean up timeout reference
          delete loadingTimeouts.current[basePath]
        }
      }, () => ({
        employees: state.employees.length,
        roles: state.roles.length,
        departments: state.departments.length,
      }))
    }, 300) // 300ms debounce

    // Cleanup function
    return () => {
      if (loadingTimeouts.current[basePath]) {
        clearTimeout(loadingTimeouts.current[basePath])
        delete loadingTimeouts.current[basePath]
      }
    }
  }, [
    getBasePath, 
    companyState.companyID, 
    companyState.selectedSiteID, 
    companyState.selectedSubsiteID,
    settingsState.auth, 
    settingsState.loading,
    fetchEmployeesSecureCached, 
    fetchRolesCached, 
    fetchDepartmentsCached, 
    fetchTimeOffsCached, 
    fetchWarningsCached, 
    fetchTrainingsCached, 
    fetchAttendancesCached, 
    fetchPayrollCached, 
    fetchPerformanceReviewsCached
  ])

  // Add role function
  const addRole = async (role: Omit<Role, "id">): Promise<Role | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) return null
    
    try {
      const companyId = companyState.companyID || localStorage.getItem("companyId") || ""
      const siteId = companyState.selectedSiteID || localStorage.getItem("siteId") || ""
      
      if (!companyId || !siteId) {
        console.error("Missing company or site ID")
        return null
      }
      
      const newRole = await createRole(basePath, role)
      if (newRole) {
        dispatch({ type: "ADD_ROLE", payload: newRole })
        return newRole
      }
      return null
    } catch (error) {
      console.error("Error adding role:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to add role" })
      return null
    }
  }
  
  // Update role function
  const updateRole = async (roleId: string, roleUpdates: Partial<Role>): Promise<Role | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) return null
    
    try {
      const companyId = companyState.companyID || localStorage.getItem("companyId") || ""
      const siteId = companyState.selectedSiteID || localStorage.getItem("siteId") || ""
      
      if (!companyId || !siteId) {
        console.error("Missing company or site ID")
        return null
      }
      
      const updatedRole = await updateRoleAPI(basePath, roleId, roleUpdates)
      if (updatedRole) {
        dispatch({ type: "UPDATE_ROLE", payload: updatedRole })
        return updatedRole
      }
      return null
    } catch (error) {
      console.error("Error updating role:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to update role" })
      return null
    }
  }
  
  // Delete role function
  const deleteRole = async (id: string): Promise<boolean> => {
    const basePath = getBasePath("hr")
    if (!basePath) return false
    
    try {
      const companyId = companyState.companyID || localStorage.getItem("companyId") || ""
      const siteId = companyState.selectedSiteID || localStorage.getItem("siteId") || ""
      
      if (!companyId || !siteId) {
        console.error("Missing company or site ID")
        return false
      }
      
      const success = await deleteRoleAPI(basePath, id)
      if (success) {
        dispatch({ type: "DELETE_ROLE", payload: id })
        return true
      }
      return false
    } catch (error) {
      console.error("Error removing role:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to remove role" })
      return false
    }
  }

  // Add employee function - uses secure Function (server-side encryption)
  const addEmployee = async (employee: Omit<Employee, "id">): Promise<Employee | null> => {
    const hrWritePath = getHRWritePath()
    if (!hrWritePath) throw new Error("HR write path not available")
    
    try {
      console.log("HR Context - addEmployee with writePath:", hrWritePath)
      
      const employeeId = await createEmployeeSecureCall(hrWritePath, employee as Record<string, unknown>)
      if (employeeId) {
        // Create the full employee object with the new ID
        const newEmployee: Employee = {
          ...employee,
          id: employeeId
        }
        dispatch({ type: "ADD_EMPLOYEE", payload: newEmployee })
        
        // Add notification
        try {
          await createNotification(
            companyState.companyID,
            settingsState.auth?.uid || 'system',
            'hr',
            'created',
            'Employee Added',
            `${employee.firstName} ${employee.lastName} joined the team`,
            {
              siteId: companyState.selectedSiteID || undefined,
              priority: 'medium',
              category: 'success',
              details: {
                entityId: employeeId,
                entityName: `${employee.firstName} ${employee.lastName}`,
                newValue: employee,
                changes: {
                  employee: { from: null, to: employee }
                }
              }
            }
          )
        } catch (notificationError) {
          console.warn('Failed to create notification:', notificationError)
        }
        
        await refreshEmployees() // Refresh data after creation
        return newEmployee
      }
      throw new Error("Failed to create employee")
    } catch (error) {
      console.error("Error adding employee:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to add employee" })
      throw new Error("Failed to add employee")
    }
  }
  
  // Update employee function
  const updateEmployee = async (employeeId: string, employeeUpdates: Partial<Employee>): Promise<Employee | null> => {
    const hrWritePath = getHRWritePath()
    if (!hrWritePath) throw new Error("HR write path not available")
    
    try {
      console.log("HR Context - updateEmployee with writePath:", hrWritePath)
      
      // Get original employee for comparison
      const originalEmployee = state.employees.find(emp => emp.id === employeeId)
      
      const updatedEmployee = await updateEmployeeSecureCall(hrWritePath, employeeId, employeeUpdates as Record<string, unknown>) as unknown as Employee | null
      if (updatedEmployee !== null) {
        dispatch({ type: "UPDATE_EMPLOYEE", payload: updatedEmployee })
        
        // Add notification
        try {
          await createNotification(
            companyState.companyID,
            settingsState.auth?.uid || 'system',
            'hr',
            'updated',
            'Employee Updated',
            `${updatedEmployee.firstName} ${updatedEmployee.lastName}'s information was updated`,
            {
              siteId: companyState.selectedSiteID || undefined,
              priority: 'medium',
              category: 'info',
              details: {
                entityId: employeeId,
                entityName: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
                oldValue: originalEmployee,
                newValue: updatedEmployee,
                changes: {
                  employee: { from: originalEmployee, to: updatedEmployee }
                }
              }
            }
          )
        } catch (notificationError) {
          console.warn('Failed to create notification:', notificationError)
        }
        
        await refreshEmployees() // Refresh data after update
        return updatedEmployee
      }
      throw new Error("Failed to update employee")
    } catch (error) {
      console.error("Error updating employee:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to update employee" })
      throw new Error("Error updating employee")
    }
  }
  
  /** Fetch full employee for detail/edit view - calls secure Function (decrypted server-side) */
  const fetchEmployeeDetail = async (employeeId: string): Promise<Employee | null> => {
    const hrWritePath = getHRWritePath()
    if (!hrWritePath) return null
    try {
      const detail = await fetchEmployeeDetailSecureCall(hrWritePath, employeeId)
      return detail as unknown as Employee | null
    } catch (error) {
      console.error('Failed to fetch employee detail:', error)
      return null
    }
  }

  // Delete employee function
  const deleteEmployee = async (employeeId: string): Promise<boolean> => {
    const hrWritePath = getHRWritePath()
    if (!hrWritePath) return false
    
    try {
      console.log("HR Context - deleteEmployee with writePath:", hrWritePath)
      
      // Get employee info before deletion for notification
      const employeeToDelete = state.employees.find(emp => emp.id === employeeId)
      
      const success = await deleteEmployeeRTDB(hrWritePath, employeeId) as unknown as boolean
      if (success === true) {
        dispatch({ type: "DELETE_EMPLOYEE", payload: employeeId })
        
        // Add notification
        if (employeeToDelete) {
          try {
            await createNotification(
              companyState.companyID,
              settingsState.auth?.uid || 'system',
              'hr',
              'deleted',
              'Employee Removed',
              `${employeeToDelete.firstName} ${employeeToDelete.lastName} was removed from the team`,
              {
                siteId: companyState.selectedSiteID || undefined,
                priority: 'medium',
                category: 'warning',
                details: {
                  entityId: employeeId,
                  entityName: `${employeeToDelete.firstName} ${employeeToDelete.lastName}`,
                  oldValue: employeeToDelete,
                  changes: {
                    employee: { from: employeeToDelete, to: null }
                  }
                }
              }
            )
          } catch (notificationError) {
            console.warn('Failed to create notification:', notificationError)
          }
        }
        
        await refreshEmployees() // Refresh data after deletion
        return true
      }
      return false
    } catch (error) {
      console.error("Error deleting employee:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to delete employee" })
      return false
    }
  }

  // Add department function
  const addDepartment = async (department: Omit<Department, "id">): Promise<Department | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) return null
    
    try {
      const companyId = companyState.companyID || localStorage.getItem("companyId") || ""
      const siteId = companyState.selectedSiteID || localStorage.getItem("siteId") || ""
      
      if (!companyId || !siteId) {
        console.error("Missing company or site ID")
        return null
      }
      
      const newDepartment = await createDepartment(basePath, department)
      if (newDepartment) {
        dispatch({ type: "ADD_DEPARTMENT", payload: newDepartment })
        
        // Add notification
        try {
          await createNotification(
            companyState.companyID,
            settingsState.auth?.uid || 'system',
            'hr',
            'created',
            'Department Added',
            `Department "${department.name}" was created`,
            {
              siteId: companyState.selectedSiteID || undefined,
              priority: 'medium',
              category: 'success',
              details: {
                entityId: newDepartment.id,
                entityName: department.name,
                newValue: newDepartment,
                changes: {
                  department: { from: {}, to: newDepartment }
                }
              }
            }
          )
        } catch (notificationError) {
          console.warn('Failed to create notification:', notificationError)
        }
        
        return newDepartment
      }
      return null
    } catch (error) {
      console.error("Error adding department:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to add department" })
      return null
    }
  }
  
  // Update department function
  const updateDepartment = async (departmentId: string, departmentUpdates: Partial<Department>): Promise<Department | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) return null
    
    try {
      const companyId = companyState.companyID || localStorage.getItem("companyId") || ""
      const siteId = companyState.selectedSiteID || localStorage.getItem("siteId") || ""
      
      if (!companyId || !siteId) {
        console.error("Missing company or site ID")
        return null
      }
      
      // Get original department for comparison
      const originalDepartment = state.departments.find(dept => dept.id === departmentId)
      
      const updatedDepartment = await updateDepartmentAPI(basePath, departmentId, departmentUpdates)
      if (updatedDepartment) {
        dispatch({ type: "UPDATE_DEPARTMENT", payload: updatedDepartment })
        
        // Add notification
        try {
          await createNotification(
            companyState.companyID,
            settingsState.auth?.uid || 'system',
            'hr',
            'updated',
            'Department Updated',
            `Department "${updatedDepartment.name}" was updated`,
            {
              siteId: companyState.selectedSiteID || undefined,
              priority: 'medium',
              category: 'info',
              details: {
                entityId: departmentId,
                entityName: updatedDepartment.name,
                oldValue: originalDepartment,
                newValue: updatedDepartment,
                changes: {
                  department: { from: originalDepartment, to: updatedDepartment }
                }
              }
            }
          )
        } catch (notificationError) {
          console.warn('Failed to create notification:', notificationError)
        }
        
        return updatedDepartment
      }
      return null
    } catch (error) {
      console.error("Error updating department:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to update department" })
      return null
    }
  }
  
  // Delete department function
  const deleteDepartment = async (departmentId: string): Promise<boolean> => {
    const basePath = getBasePath("hr")
    if (!basePath) return false
    
    try {
      const companyId = companyState.companyID || localStorage.getItem("companyId") || ""
      const siteId = companyState.selectedSiteID || localStorage.getItem("siteId") || ""
      
      if (!companyId || !siteId) {
        console.error("Missing company or site ID")
        return false
      }
      
      // Get department info before deletion for notification
      const departmentToDelete = state.departments.find(dept => dept.id === departmentId)
      
      const success = await deleteDepartmentAPI(basePath, departmentId)
      if (success) {
        dispatch({ type: "DELETE_DEPARTMENT", payload: departmentId })
        
        // Add notification
        if (departmentToDelete) {
          try {
            await createNotification(
              companyState.companyID,
              settingsState.auth?.uid || 'system',
              'hr',
              'deleted',
              'Department Removed',
              `Department "${departmentToDelete.name}" was removed`,
              {
                siteId: companyState.selectedSiteID || undefined,
                priority: 'medium',
                category: 'warning',
                details: {
                  entityId: departmentId,
                  entityName: departmentToDelete.name,
                  oldValue: departmentToDelete,
                  changes: {
                    department: { from: departmentToDelete, to: null }
                  }
                }
              }
            )
          } catch (notificationError) {
            console.warn('Failed to create notification:', notificationError)
          }
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error("Error deleting department:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to delete department" })
      return false
    }
  }

  // Add schedule function
  const addSchedule = async (schedule: Omit<Schedule, "id">): Promise<Schedule | null> => {
    const hrWritePath = getHRWritePath()
    console.log("🔍 HR Context - addSchedule called with:", {
      hrWritePath,
      scheduleData: {
        employeeId: schedule.employeeId,
        employeeName: schedule.employeeName,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime
      }
    })
    
    if (!hrWritePath) {
      console.log("❌ HR Context - No write path available for schedule creation")
      return null
    }
    
    try {
      console.log("🔍 HR Context - addSchedule calling createScheduleRTDB with path:", hrWritePath)
      
      const scheduleId = await createScheduleRTDB(hrWritePath, schedule)
      console.log("🔍 HR Context - addSchedule - createScheduleRTDB result:", scheduleId)
      
      if (scheduleId) {
        const newSchedule: Schedule = {
          ...schedule,
          id: scheduleId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        console.log("🔍 HR Context - addSchedule - Dispatching ADD_SCHEDULE with:", newSchedule)
        dispatch({ type: "ADD_SCHEDULE", payload: newSchedule })
        
        // Add notification
        try {
          await createNotification(
            companyState.companyID,
            settingsState.auth?.uid || 'system',
            'hr',
            'created',
            'Schedule Created',
            `Schedule for ${schedule.employeeName} on ${schedule.date} was created`,
            {
              siteId: companyState.selectedSiteID || undefined,
              priority: 'medium',
              category: 'success',
              details: {
                entityId: scheduleId,
                entityName: `${schedule.employeeName} - ${schedule.date}`,
                newValue: newSchedule,
                changes: {
                  schedule: { from: {}, to: newSchedule }
                }
              }
            }
          )
        } catch (notificationError) {
          console.warn('Failed to create notification:', notificationError)
        }
        
        console.log("🔍 HR Context - addSchedule - Calling refreshSchedules")
        await refreshSchedules() // Refresh data after creation
        console.log("🔍 HR Context - addSchedule - refreshSchedules completed")
        
        return newSchedule
      }
      console.log("❌ HR Context - addSchedule - No scheduleId returned from createScheduleRTDB")
      return null
    } catch (error) {
      console.error("Error adding schedule:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to add schedule" })
      return null
    }
  }
  
  // Update schedule function
  const updateSchedule = async (scheduleId: string, scheduleUpdates: Partial<Schedule>): Promise<Schedule | null> => {
    const hrWritePath = getHRWritePath()
    if (!hrWritePath) return null
    
    try {
      console.log("HR Context - updateSchedule with writePath:", hrWritePath)
      
      // Get original schedule for comparison
      const originalSchedule = state.schedules.find(sched => sched.id === scheduleId)
      
      const updatedSchedule = await updateScheduleRTDB(hrWritePath, scheduleId, scheduleUpdates)
      if (updatedSchedule) {
        dispatch({ type: "UPDATE_SCHEDULE", payload: updatedSchedule })
        
        // Add notification
        try {
          await createNotification(
            companyState.companyID,
            settingsState.auth?.uid || 'system',
            'hr',
            'updated',
            'Schedule Updated',
            `Schedule for ${updatedSchedule.employeeName} on ${updatedSchedule.date} was updated`,
            {
              siteId: companyState.selectedSiteID || undefined,
              priority: 'medium',
              category: 'info',
              details: {
                entityId: scheduleId,
                entityName: `${updatedSchedule.employeeName} - ${updatedSchedule.date}`,
                oldValue: originalSchedule,
                newValue: updatedSchedule,
                changes: {
                  schedule: { from: originalSchedule, to: updatedSchedule }
                }
              }
            }
          )
        } catch (notificationError) {
          console.warn('Failed to create notification:', notificationError)
        }
        
        await refreshSchedules() // Refresh data after update
        return updatedSchedule
      }
      return null
    } catch (error) {
      console.error("Error updating schedule:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to update schedule" })
      return null
    }
  }
  
  // Delete schedule function
  const deleteSchedule = async (scheduleId: string): Promise<boolean> => {
    const hrWritePath = getHRWritePath()
    if (!hrWritePath) return false
    
    try {
      console.log("HR Context - deleteSchedule with writePath:", hrWritePath)
      
      // Get schedule info before deletion for notification
      const scheduleToDelete = state.schedules.find(sched => sched.id === scheduleId)
      
      const success = await deleteScheduleRTDB(hrWritePath, scheduleId)
      if (success) {
        dispatch({ type: "DELETE_SCHEDULE", payload: scheduleId })
        
        // Add notification
        if (scheduleToDelete) {
          try {
            await createNotification(
              companyState.companyID,
              settingsState.auth?.uid || 'system',
              'hr',
              'deleted',
              'Schedule Removed',
              `Schedule for ${scheduleToDelete.employeeName} on ${scheduleToDelete.date} was removed`,
              {
                siteId: companyState.selectedSiteID || undefined,
                priority: 'medium',
                category: 'warning',
                details: {
                  entityId: scheduleId,
                  entityName: `${scheduleToDelete.employeeName} - ${scheduleToDelete.date}`,
                  oldValue: scheduleToDelete,
                  changes: {
                    schedule: { from: scheduleToDelete, to: null }
                  }
                }
              }
            )
          } catch (notificationError) {
            console.warn('Failed to create notification:', notificationError)
          }
        }
        
        await refreshSchedules() // Refresh data after deletion
        return true
      }
      return false
    } catch (error) {
      console.error("Error deleting schedule:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to delete schedule" })
      return false
    }
  }

  // Training methods
  const addTraining = async (training: Omit<Training, "id">): Promise<Training | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - addTraining with basePath:", hrBasePath)
      
      const trainingId = await createTrainingAPI(hrBasePath, training)
      if (trainingId) {
        const newTraining: Training = {
          ...training,
          id: trainingId
        }
        dispatch({ type: "ADD_TRAINING", payload: newTraining })
        return newTraining
      }
      throw new Error("Failed to create training")
    } catch (error) {
      console.error("Error adding training:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to add training" })
      throw new Error("Failed to add training")
    }
  }
  
  const updateTraining = async (trainingId: string, trainingUpdates: Partial<Training>): Promise<Training | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - updateTraining with basePath:", hrBasePath)
      
      await updateTrainingAPI(hrBasePath, trainingId, trainingUpdates)
      const updatedTraining = { ...trainingUpdates, id: trainingId } as Training
      dispatch({ type: "UPDATE_TRAINING", payload: updatedTraining })
      return updatedTraining
    } catch (error) {
      console.error("Error updating training:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to update training" })
      throw new Error("Failed to update training")
    }
  }
  
  const deleteTraining = async (trainingId: string): Promise<boolean> => {
    const basePath = getBasePath("hr")
    if (!basePath) return false
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - deleteTraining with basePath:", hrBasePath)
      
      // Get training info before deletion for notification
      const trainingToDelete = state.trainings.find(training => training.id === trainingId)
      
      await deleteTrainingAPI(hrBasePath, trainingId)
      dispatch({ type: "DELETE_TRAINING", payload: trainingId })
      
      // Add notification
      if (trainingToDelete) {
        await createHRNotification('deleted', 'Training', trainingToDelete.title, trainingId, trainingToDelete, undefined)
      }
      
      return true
    } catch (error) {
      console.error("Error deleting training:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to delete training" })
      return false
    }
  }
  
  const getEmployeeTrainings = async (employeeId: string): Promise<Training[]> => {
    // Filter trainings by employee ID
    return state.trainings.filter(training => training.employeeId === employeeId)
  }
  
  // Helper function to convert TimeOff to TimeOffRequest
  const mapTimeOffToRequest = (timeOff: Omit<TimeOff, "id">, employeeName: string): Omit<TimeOffRequest, "id"> => {
    return {
      employeeId: timeOff.employeeId,
      employeeName,
      startDate: new Date(timeOff.startDate).toISOString(),
      endDate: new Date(timeOff.endDate).toISOString(),
      type: timeOff.type,
      reason: timeOff.reason || "",
      status: timeOff.status,
      notes: timeOff.notes,
      createdAt: new Date(timeOff.createdAt).toISOString(),
      updatedAt: timeOff.updatedAt ? new Date(timeOff.updatedAt).toISOString() : undefined,
      approvedBy: timeOff.approvedBy,
      approvedDate: timeOff.approvedAt ? new Date(timeOff.approvedAt).toISOString() : undefined
    }
  }

  // Time Off methods
  const addTimeOff = async (timeOff: Omit<TimeOff, "id">): Promise<TimeOff | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - addTimeOff with basePath:", hrBasePath)
      
      // Get employee name for the request
      const employee = state.employees.find(emp => emp.id === timeOff.employeeId)
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : "Unknown Employee"
      
      // Convert TimeOff to TimeOffRequest format
      const timeOffRequest = mapTimeOffToRequest(timeOff, employeeName)
      
      const timeOffId = await createTimeOffAPI(hrBasePath, timeOffRequest)
      if (timeOffId) {
        const newTimeOff: TimeOff = {
          ...timeOff,
          id: timeOffId
        }
        dispatch({ type: "ADD_TIME_OFF", payload: newTimeOff })
        return newTimeOff
      }
      throw new Error("Failed to create time off")
    } catch (error) {
      console.error("Error adding time off:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to add time off" })
      throw new Error("Failed to add time off")
    }
  }
  
  const updateTimeOff = async (timeOffId: string, timeOffUpdates: Partial<TimeOff>): Promise<TimeOff | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - updateTimeOff with basePath:", hrBasePath)
      
      // Convert TimeOff updates to TimeOffRequest format
      const timeOffRequestUpdates: Partial<TimeOffRequest> = {}
      
      if (timeOffUpdates.startDate !== undefined) {
        timeOffRequestUpdates.startDate = new Date(timeOffUpdates.startDate).toISOString()
      }
      if (timeOffUpdates.endDate !== undefined) {
        timeOffRequestUpdates.endDate = new Date(timeOffUpdates.endDate).toISOString()
      }
      if (timeOffUpdates.type !== undefined) {
        timeOffRequestUpdates.type = timeOffUpdates.type
      }
      if (timeOffUpdates.reason !== undefined) {
        timeOffRequestUpdates.reason = timeOffUpdates.reason
      }
      if (timeOffUpdates.status !== undefined) {
        timeOffRequestUpdates.status = timeOffUpdates.status
      }
      if (timeOffUpdates.notes !== undefined) {
        timeOffRequestUpdates.notes = timeOffUpdates.notes
      }
      if (timeOffUpdates.approvedBy !== undefined) {
        timeOffRequestUpdates.approvedBy = timeOffUpdates.approvedBy
      }
      if (timeOffUpdates.approvedAt !== undefined) {
        timeOffRequestUpdates.approvedDate = new Date(timeOffUpdates.approvedAt).toISOString()
      }
      if (timeOffUpdates.updatedAt !== undefined) {
        timeOffRequestUpdates.updatedAt = new Date(timeOffUpdates.updatedAt).toISOString()
      }
      
      await updateTimeOffAPI(hrBasePath, timeOffId, timeOffRequestUpdates)
      const updatedTimeOff = { ...timeOffUpdates, id: timeOffId } as TimeOff
      dispatch({ type: "UPDATE_TIME_OFF", payload: updatedTimeOff })
      return updatedTimeOff
    } catch (error) {
      console.error("Error updating time off:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to update time off" })
      throw new Error("Failed to update time off")
    }
  }
  
  const deleteTimeOff = async (timeOffId: string): Promise<boolean> => {
    const basePath = getBasePath("hr")
    if (!basePath) return false
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - deleteTimeOff with basePath:", hrBasePath)
      
      await deleteTimeOffAPI(hrBasePath, timeOffId)
      dispatch({ type: "DELETE_TIME_OFF", payload: timeOffId })
      return true
    } catch (error) {
      console.error("Error deleting time off:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to delete time off" })
      return false
    }
  }
  
  const getEmployeeTimeOffs = async (employeeId: string): Promise<TimeOff[]> => {
    // Filter time offs by employee ID
    return state.timeOffs.filter(timeOff => timeOff.employeeId === employeeId)
  }
  
  // Warning methods
  const addWarning = async (warning: Omit<Warning, "id">): Promise<Warning | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - addWarning with basePath:", hrBasePath)
      
      const warningId = await createWarningAPI(hrBasePath, warning)
      if (warningId) {
        const newWarning: Warning = {
          ...warning,
          id: warningId
        }
        dispatch({ type: "ADD_WARNING", payload: newWarning })
        return newWarning
      }
      throw new Error("Failed to create warning")
    } catch (error) {
      console.error("Error adding warning:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to add warning" })
      throw new Error("Failed to add warning")
    }
  }
  
  const updateWarning = async (warningId: string, warningUpdates: Partial<Warning>): Promise<Warning | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - updateWarning with basePath:", hrBasePath)
      
      await updateWarningAPI(hrBasePath, warningId, warningUpdates)
      const updatedWarning = { ...warningUpdates, id: warningId } as Warning
      dispatch({ type: "UPDATE_WARNING", payload: updatedWarning })
      return updatedWarning
    } catch (error) {
      console.error("Error updating warning:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to update warning" })
      throw new Error("Failed to update warning")
    }
  }
  
  const deleteWarning = async (warningId: string): Promise<boolean> => {
    const basePath = getBasePath("hr")
    if (!basePath) return false
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - deleteWarning with basePath:", hrBasePath)
      
      await deleteWarningAPI(hrBasePath, warningId)
      dispatch({ type: "DELETE_WARNING", payload: warningId })
      return true
    } catch (error) {
      console.error("Error deleting warning:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to delete warning" })
      return false
    }
  }
  
  const getEmployeeWarnings = async (employeeId: string): Promise<Warning[]> => {
    // Filter warnings by employee ID
    return state.warnings.filter(warning => warning.employeeId === employeeId)
  }
  
  // Attendance methods
  const addAttendance = async (attendance: Omit<Attendance, "id">): Promise<Attendance | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - addAttendance with basePath:", hrBasePath)
      
      const attendanceId = await createAttendanceAPI(hrBasePath, attendance)
      if (attendanceId) {
        const newAttendance: Attendance = {
          ...attendance,
          id: attendanceId
        }
        dispatch({ type: "ADD_ATTENDANCE", payload: newAttendance })
        return newAttendance
      }
      throw new Error("Failed to create attendance")
    } catch (error) {
      console.error("Error adding attendance:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to add attendance" })
      throw new Error("Failed to add attendance")
    }
  }
  
  const updateAttendance = async (attendanceId: string, attendanceUpdates: Partial<Attendance>): Promise<Attendance | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - updateAttendance with basePath:", hrBasePath)
      
      await updateAttendanceAPI(hrBasePath, attendanceId, attendanceUpdates)
      const updatedAttendance = { ...attendanceUpdates, id: attendanceId } as Attendance
      dispatch({ type: "UPDATE_ATTENDANCE", payload: updatedAttendance })
      return updatedAttendance
    } catch (error) {
      console.error("Error updating attendance:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to update attendance" })
      throw new Error("Failed to update attendance")
    }
  }
  
  const deleteAttendance = async (attendanceId: string): Promise<boolean> => {
    const basePath = getBasePath("hr")
    if (!basePath) return false
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - deleteAttendance with basePath:", hrBasePath)
      
      await deleteAttendanceAPI(hrBasePath, attendanceId)
      dispatch({ type: "DELETE_ATTENDANCE", payload: attendanceId })
      return true
    } catch (error) {
      console.error("Error deleting attendance:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to delete attendance" })
      return false
    }
  }
  
  const getEmployeeAttendances = async (employeeId: string): Promise<Attendance[]> => {
    // Filter attendances by employee ID
    return state.attendances.filter(attendance => attendance.employeeId === employeeId)
  }
  
  // Compliance task methods
  const refreshComplianceTasks = async (): Promise<void> => {
    const basePath = getBasePath("hr")
    if (!basePath) return
    
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll use the existing state
      // This is a placeholder for future API integration
      
      // No need to dispatch anything if we're not changing the state
      // dispatch({ type: "SET_COMPLIANCE_TASKS", payload: state.complianceTasks })
    } catch (error) {
      console.error("Error refreshing compliance tasks:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to refresh compliance tasks" })
    }
  }
  
  const addComplianceTask = async (complianceTask: Omit<ComplianceTask, "id">): Promise<ComplianceTask> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      // Generate a unique ID for the new task
      const id = `task_${Date.now()}`
      
      // Create the new task with the generated ID
      const newTask: ComplianceTask = {
        ...complianceTask,
        id,
        createdAt: Date.now(),
        status: complianceTask.status || "pending"
      }
      
      // Update the state
      dispatch({ type: "ADD_COMPLIANCE_TASK", payload: newTask })
      
      return newTask
    } catch (error) {
      console.error("Error adding compliance task:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to add compliance task" })
      throw error
    }
  }
  
  const updateComplianceTask = async (id: string, complianceTask: Partial<ComplianceTask>): Promise<ComplianceTask> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      // Find the existing task
      const existingTask = state.complianceTasks.find(t => t.id === id)
      
      if (!existingTask) {
        throw new Error(`Task with ID ${id} not found`)
      }
      
      // Update the task
      const updatedTask: ComplianceTask = {
        ...existingTask,
        ...complianceTask,
        updatedAt: Date.now()
      }
      
      // Update the state
      dispatch({ type: "UPDATE_COMPLIANCE_TASK", payload: updatedTask })
      
      return updatedTask
    } catch (error) {
      console.error("Error updating compliance task:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to update compliance task" })
      throw error
    }
  }
  
  const deleteComplianceTask = async (id: string): Promise<boolean> => {
    const basePath = getBasePath("hr")
    if (!basePath) return false
    
    try {
      // Update the state
      dispatch({ type: "DELETE_COMPLIANCE_TASK", payload: id })
      
      return true
    } catch (error) {
      console.error("Error deleting compliance task:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to delete compliance task" })
      return false
    }
  }


  // Employee invitation methods
  // Benefits management functions
  const fetchBenefits = async (): Promise<Benefit[]> => {
    try {
      const basePath = getBasePath("hr")
      const result = await handleHRAction(basePath, "fetch", "benefits")
      return result as any || []
    } catch (error) {
      console.error("Error fetching benefits:", error)
      return []
    }
  }

  const createBenefit = async (benefit: Omit<Benefit, "id">): Promise<Benefit | null> => {
    try {
      const basePath = getBasePath("hr")
      const result = await handleHRAction(basePath, "create", "benefits", undefined, benefit)
      return result as any as Benefit
    } catch (error) {
      console.error("Error creating benefit:", error)
      throw error
    }
  }

  const updateBenefit = async (id: string, benefit: Partial<Benefit>): Promise<Benefit> => {
    try {
      const basePath = getBasePath("hr")
      const result = await handleHRAction(basePath, "edit", "benefits", id, benefit)
      return result as any
    } catch (error) {
      console.error("Error updating benefit:", error)
      throw error
    }
  }

  const deleteBenefit = async (id: string): Promise<boolean> => {
    try {
      const basePath = getBasePath("hr")
      await handleHRAction(basePath, "delete", "benefits", id)
      return true
    } catch (error) {
      console.error("Error deleting benefit:", error)
      return false
    }
  }

  const fetchEmployeeBenefits = async (_employeeId: string): Promise<EmployeeBenefit[]> => {
    try {
      const basePath = getBasePath("hr")
      const result = await handleHRAction(basePath, "fetch", "employeeBenefits")
      return result as any || []
    } catch (error) {
      console.error("Error fetching employee benefits:", error)
      return []
    }
  }

  const assignBenefitToEmployee = async (_employeeId: string, _benefitId: string, data: Partial<EmployeeBenefit>): Promise<EmployeeBenefit | null> => {
    try {
      const basePath = getBasePath("hr")
      const result = await handleHRAction(basePath, "create", "employeeBenefits", undefined, data)
      return result as any as EmployeeBenefit
    } catch (error) {
      console.error("Error assigning benefit to employee:", error)
      throw error
    }
  }

  const updateEmployeeBenefit = async (id: string, data: Partial<EmployeeBenefit>): Promise<EmployeeBenefit> => {
    try {
      const basePath = getBasePath("hr")
      const result = await handleHRAction(basePath, "edit", "employeeBenefits", id, data)
      return result as any
    } catch (error) {
      console.error("Error updating employee benefit:", error)
      throw error
    }
  }

  const removeEmployeeBenefit = async (id: string): Promise<boolean> => {
    try {
      const basePath = getBasePath("hr")
      await handleHRAction(basePath, "delete", "employeeBenefits", id)
      return true
    } catch (error) {
      console.error("Error removing employee benefit:", error)
      return false
    }
  }

  const generateJoinCode = async (roleId: string, employeeId?: string, expiresInDays: number = 7): Promise<string> => {
    try {
      const companyId = companyState.companyID || localStorage.getItem("companyId") || ""
      const siteId = companyState.selectedSiteID || localStorage.getItem("siteId") || ""
      if (!companyId || !siteId) throw new Error("Missing company or site ID")

      if (employeeId) {
        // Employee-targeted join code: links a signed-in user to this employee on accept
        return await createEmployeeJoinCode(companyId, siteId, employeeId, roleId, expiresInDays)
      }

      // Fallback: create a site-level invite code using Company functions (legacy path)
      // For simple employee onboarding without pre-created employee, we keep existing site invite flow via CompanyContext join
      const code = Math.random().toString(36).substring(2, 10).toUpperCase()
      console.log(`Generated temporary site invite code ${code} (legacy) for role ${roleId}`)
      return code
    } catch (error) {
      console.error("Error generating join code:", error)
      throw error
    }
  }

  const getEmployeeInvites = async (employeeId?: string) => {
    const companyId = companyState.companyID || localStorage.getItem("companyId") || ""
    if (!companyId) throw new Error("Missing company ID")
    return await listEmployeeJoinCodes(companyId, employeeId)
  }

  const revokeInvite = async (code: string) => {
    await revokeEmployeeJoinCode(code)
  }



  // Job management functions
  const addJob = async (job: Omit<JobPosting, "id">): Promise<JobPosting | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - addJob with basePath:", hrBasePath)
      
      const jobId = await createJobAPI(hrBasePath, job)
      if (jobId) {
        const newJob: JobPosting = {
          ...job,
          id: jobId
        }
        dispatch({ type: "ADD_JOB", payload: newJob })
        return newJob
      }
      throw new Error("Failed to create job")
    } catch (error) {
      console.error("Error adding job:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to add job" })
      throw new Error("Failed to add job")
    }
  }

  const updateJob = async (id: string, job: Partial<JobPosting>): Promise<JobPosting | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - updateJob with basePath:", hrBasePath)
      
      await updateJobAPI(hrBasePath, id, job)
      const updatedJob: JobPosting = { id, ...job } as JobPosting
      dispatch({ type: "UPDATE_JOB", payload: updatedJob })
      return updatedJob
    } catch (error) {
      console.error("Error updating job:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to update job" })
      throw new Error("Failed to update job")
    }
  }

  const deleteJob = async (id: string): Promise<boolean> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - deleteJob with basePath:", hrBasePath)
      
      await deleteJobAPI(hrBasePath, id)
      dispatch({ type: "DELETE_JOB", payload: id })
      return true
    } catch (error) {
      console.error("Error deleting job:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to delete job" })
      throw new Error("Failed to delete job")
    }
  }

  // Candidate management functions
  const addCandidate = async (candidate: Omit<Candidate, "id">): Promise<Candidate | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - addCandidate with basePath:", hrBasePath)
      
      const candidateId = await createCandidateAPI(hrBasePath, candidate)
      if (candidateId) {
        const newCandidate: Candidate = {
          ...candidate,
          id: candidateId
        }
        dispatch({ type: "ADD_CANDIDATE", payload: newCandidate })
        return newCandidate
      }
      throw new Error("Failed to create candidate")
    } catch (error) {
      console.error("Error adding candidate:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to add candidate" })
      throw new Error("Failed to add candidate")
    }
  }

  const updateCandidate = async (id: string, candidate: Partial<Candidate>): Promise<Candidate | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - updateCandidate with basePath:", hrBasePath)
      
      await updateCandidateAPI(hrBasePath, id, candidate)
      const updatedCandidate: Candidate = { id, ...candidate } as Candidate
      dispatch({ type: "UPDATE_CANDIDATE", payload: updatedCandidate })
      return updatedCandidate
    } catch (error) {
      console.error("Error updating candidate:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to update candidate" })
      throw new Error("Failed to update candidate")
    }
  }

  const deleteCandidate = async (id: string): Promise<boolean> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - deleteCandidate with basePath:", hrBasePath)
      
      await deleteCandidateAPI(hrBasePath, id)
      dispatch({ type: "DELETE_CANDIDATE", payload: id })
      return true
    } catch (error) {
      console.error("Error deleting candidate:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to delete candidate" })
      throw new Error("Failed to delete candidate")
    }
  }

  // Interview management functions
  const addInterview = async (interview: Omit<Interview, "id">): Promise<Interview | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - addInterview with basePath:", hrBasePath)
      
      const interviewId = await createInterviewAPI(hrBasePath, interview)
      if (interviewId) {
        const newInterview: Interview = {
          ...interview,
          id: interviewId
        }
        dispatch({ type: "ADD_INTERVIEW", payload: newInterview })
        return newInterview
      }
      throw new Error("Failed to create interview")
    } catch (error) {
      console.error("Error adding interview:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to add interview" })
      throw new Error("Failed to add interview")
    }
  }

  const updateInterview = async (id: string, interview: Partial<Interview>): Promise<Interview | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - updateInterview with basePath:", hrBasePath)
      
      await updateInterviewAPI(hrBasePath, id, interview)
      const updatedInterview: Interview = { id, ...interview } as Interview
      dispatch({ type: "UPDATE_INTERVIEW", payload: updatedInterview })
      return updatedInterview
    } catch (error) {
      console.error("Error updating interview:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to update interview" })
      throw new Error("Failed to update interview")
    }
  }

  const deleteInterview = async (id: string): Promise<boolean> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const hrBasePath = `${basePath}/data/hr`
      console.log("HR Context - deleteInterview with basePath:", hrBasePath)
      
      await deleteInterviewAPI(hrBasePath, id)
      dispatch({ type: "DELETE_INTERVIEW", payload: id })
      return true
    } catch (error) {
      console.error("Error deleting interview:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to delete interview" })
      throw new Error("Failed to delete interview")
    }
  }

  // Payroll operations
  const addPayroll = async (payroll: Omit<Payroll, "id">): Promise<Payroll | null> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      const basePath = getBasePath("hr")
      if (!basePath) {
        console.error("Base path not set")
        throw new Error("Base path not set")
      }
      const result = await handleHRAction(basePath, "create", "payrolls", undefined, payroll) as Payroll
      
      dispatch({ type: "ADD_PAYROLL", payload: result })
      return result as any
    } catch (error) {
      console.error("Error adding payroll:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to add payroll" })
      throw error
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const updatePayroll = async (id: string, payroll: Partial<Payroll>): Promise<Payroll | null> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      const basePath = getBasePath("hr")
      if (!basePath) {
        console.error("Base path not set")
        throw new Error("Base path not set")
      }
      const result = await handleHRAction(basePath, "edit", "payrolls", id, payroll) as Payroll
      
      dispatch({ type: "UPDATE_PAYROLL", payload: result })
      return result as any
    } catch (error) {
      console.error("Error updating payroll:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to update payroll" })
      throw error
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const deletePayroll = async (id: string): Promise<boolean> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      const basePath = getBasePath("hr")
      if (!basePath) {
        console.error("Base path not set")
        throw new Error("Base path not set")
      }
      await handleHRAction(basePath, "delete", "payrolls", id)
      
      dispatch({ type: "DELETE_PAYROLL", payload: id })
      return true
    } catch (error) {
      console.error("Error deleting payroll:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to delete payroll" })
      throw error
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const updatePayrollRecord = async (id: string, payroll: Partial<Payroll>): Promise<Payroll | null> => {
    return updatePayroll(id, payroll)
  }

  const deletePayrollRecord = async (id: string): Promise<boolean> => {
    return deletePayroll(id)
  }

  const fetchPayrollDetail = async (payrollId: string): Promise<Payroll | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) return null
    const hrBasePath = `${basePath}/data/hr`
    try {
      const detail = await fetchPayrollDetailSecureCall(hrBasePath, payrollId)
      return detail as Payroll
    } catch (secureErr) {
      console.warn("HR Context - Secure payroll detail fetch failed, falling back to RTDB:", secureErr)
      return fetchPayrollById(hrBasePath, payrollId) as Promise<Payroll | null>
    }
  }

  // Performance Review operations
  const addPerformanceReview = async (review: Omit<PerformanceReview, "id">): Promise<PerformanceReview | null> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      const basePath = getBasePath("hr")
      if (!basePath) {
        console.error("Base path not set")
        throw new Error("Base path not set")
      }
      const result = await handleHRAction(basePath, "create", "reviews", undefined, review) as unknown as PerformanceReview
      
      // Transform PerformanceReview to PerformanceReviewForm
      const transformedResult: PerformanceReviewForm = {
        id: result.id || '',
        employeeId: result.employeeId,
        employeeName: '',  // This should be filled by the component
        reviewerId: result.reviewerId,
        reviewerName: '',  // This should be filled by the component
        reviewType: 'Annual', // Default value
        reviewDate: new Date(result.startDate).toISOString().split('T')[0],
        dueDate: new Date(result.endDate).toISOString().split('T')[0],
        status: result.status,
        overallRating: result.overallScore || 0,
        categoryRatings: [],
        qualificationAssessment: result.qualificationAssessment,
        lengthOfServiceBonus: result.lengthOfServiceBonus,
        goals: result.goals,
        strengths: result.strengths,
        areasForImprovement: result.areasForImprovement,
        comments: result.comments,
        templateId: '',
        overallScore: result.overallScore,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      }
      
      dispatch({ type: "ADD_PERFORMANCE_REVIEW", payload: transformedResult })
      return result as any
    } catch (error) {
      console.error("Error adding performance review:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to add performance review" })
      throw error
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const updatePerformanceReview = async (id: string, review: Partial<PerformanceReview>): Promise<PerformanceReview | null> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      const basePath = getBasePath("hr")
      if (!basePath) {
        console.error("Base path not set")
        throw new Error("Base path not set")
      }
      const result = await handleHRAction(basePath, "edit", "reviews", id, review) as unknown as PerformanceReview
      
      // Transform PerformanceReview to PerformanceReviewForm
      const transformedResult: PerformanceReviewForm = {
        id: result.id || '',
        employeeId: result.employeeId,
        employeeName: '',  // This should be filled by the component
        reviewerId: result.reviewerId,
        reviewerName: '',  // This should be filled by the component
        reviewType: 'Annual', // Default value
        reviewDate: new Date(result.startDate).toISOString().split('T')[0],
        dueDate: new Date(result.endDate).toISOString().split('T')[0],
        status: result.status,
        overallRating: result.overallScore || 0,
        categoryRatings: [],
        qualificationAssessment: result.qualificationAssessment,
        lengthOfServiceBonus: result.lengthOfServiceBonus,
        goals: result.goals,
        strengths: result.strengths,
        areasForImprovement: result.areasForImprovement,
        comments: result.comments,
        templateId: '',
        overallScore: result.overallScore,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      }
      
      dispatch({ type: "UPDATE_PERFORMANCE_REVIEW", payload: transformedResult })
      return result as any
    } catch (error) {
      console.error("Error updating performance review:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to update performance review" })
      throw error
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const deletePerformanceReview = async (id: string): Promise<boolean> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      const basePath = getBasePath("hr")
      if (!basePath) {
        console.error("Base path not set")
        throw new Error("Base path not set")
      }
      await handleHRAction(basePath, "delete", "reviews", id)
      
      dispatch({ type: "DELETE_PERFORMANCE_REVIEW", payload: id })
      return true
    } catch (error) {
      console.error("Error deleting performance review:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to delete performance review" })
      throw error
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  // Schedule operations - using proper RTDatabase functions (duplicates removed)

  // Contract management functions
  const fetchContractTemplates = async (): Promise<ContractTemplate[]> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const templates = await fetchContractTemplatesRTDB(basePath)
      dispatch({ type: "SET_CONTRACT_TEMPLATES", payload: templates })
      return templates
    } catch (error) {
      console.error("Error fetching contract templates:", error)
      throw error
    }
  }

  const createContractTemplate = async (template: Omit<ContractTemplate, "id">): Promise<ContractTemplate | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const newTemplate = await createContractTemplateRTDB(basePath, template)
      if (newTemplate) {
        dispatch({ type: "ADD_CONTRACT_TEMPLATE", payload: newTemplate })
        return newTemplate
      }
      return null
    } catch (error) {
      console.error("Error creating contract template:", error)
      throw error
    }
  }

  const updateContractTemplate = async (templateId: string, template: Partial<ContractTemplate>): Promise<ContractTemplate | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const updatedTemplate = await updateContractTemplateAPI(basePath, templateId, template)
      if (updatedTemplate) {
        // Update in state
        const currentTemplates = state.contractTemplates || []
        const updatedTemplates = currentTemplates.map(t => t.id === templateId ? updatedTemplate : t)
        dispatch({ type: "SET_CONTRACT_TEMPLATES", payload: updatedTemplates })
        return updatedTemplate
      }
      return null
    } catch (error) {
      console.error("Error updating contract template:", error)
      throw error
    }
  }

  const deleteContractTemplate = async (templateId: string): Promise<boolean> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      await deleteContractTemplateAPI(basePath, templateId)
      // Remove from state
      const currentTemplates = state.contractTemplates || []
      const updatedTemplates = currentTemplates.filter(t => t.id !== templateId)
      dispatch({ type: "SET_CONTRACT_TEMPLATES", payload: updatedTemplates })
      return true
    } catch (error) {
      console.error("Error deleting contract template:", error)
      throw error
    }
  }

  const createContract = async (contract: Omit<Contract, "id">): Promise<Contract | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const newContract = await createContractRTDB(basePath, contract)
      if (newContract) {
        dispatch({ type: "ADD_CONTRACT", payload: newContract })
        return newContract
      }
      return null
    } catch (error) {
      console.error("Error creating contract:", error)
      throw error
    }
  }

  const updateContract = async (contractId: string, contractUpdates: Partial<Contract>): Promise<Contract | null> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      const updatedContract = await updateContractRTDB(basePath, contractId, contractUpdates)
      if (updatedContract) {
        dispatch({ type: "UPDATE_CONTRACT", payload: updatedContract })
        return updatedContract
      }
      return null
    } catch (error) {
      console.error("Error updating contract:", error)
      throw error
    }
  }

  const deleteContract = async (contractId: string): Promise<boolean> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      await deleteContractRTDB(basePath, contractId)
      // Remove from state
      const currentContracts = state.contracts || []
      const updatedContracts = currentContracts.filter(c => c.id !== contractId)
      dispatch({ type: "SET_CONTRACTS", payload: updatedContracts })
      return true
    } catch (error) {
      console.error("Error deleting contract:", error)
      throw error
    }
  }

  const initializeDefaultContractTemplates = async (): Promise<void> => {
    const basePath = getBasePath("hr")
    if (!basePath) throw new Error("Base path not set")
    
    try {
      // Check if templates already exist
      const existingTemplates = await fetchContractTemplatesRTDB(basePath)
      if (existingTemplates.length > 0) {
        return // Templates already exist
      }
      
      // Create default templates
      const defaultTemplates: Omit<ContractTemplate, "id">[] = [
        {
          name: "Full-Time Employment Contract",
          bodyHtml: "<h2>Full-Time Employment Contract</h2><p>This contract outlines the terms of full-time employment...</p>",
          defaultType: "permanent",
          terms: ["40 hours per week", "Health insurance", "Paid time off"],
          active: true,
          createdBy: "system",
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          name: "Part-Time Employment Contract",
          bodyHtml: "<h2>Part-Time Employment Contract</h2><p>This contract outlines the terms of part-time employment...</p>",
          defaultType: "casual",
          terms: ["20 hours per week", "Pro-rated benefits"],
          active: true,
          createdBy: "system",
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          name: "Fixed-Term Contract",
          bodyHtml: "<h2>Fixed-Term Contract</h2><p>This contract outlines the terms for fixed-term employment...</p>",
          defaultType: "fixed_term",
          terms: ["Project-based work", "End date specified", "Renewal possible"],
          active: true,
          createdBy: "system",
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ]
      
      // Create each template
      for (const template of defaultTemplates) {
        await createContractTemplateRTDB(basePath, template)
      }
      
      // Refresh templates in state
      const templates = await fetchContractTemplatesRTDB(basePath)
      dispatch({ type: "SET_CONTRACT_TEMPLATES", payload: templates })
    } catch (error) {
      console.error("Error initializing default contract templates:", error)
      throw error
    }
  }

  // Event management functions
  const refreshEvents = async (): Promise<void> => {
    await safeRefresh("events", async () => {
      const paths = getHRPaths()
      const allEvents: any[] = []
      
      for (const path of paths) {
        try {
          // TODO: Implement actual event fetching from database
          // For now, return empty array
          allEvents.push(...[])
        } catch (error) {
          console.error(`Error fetching events from ${path}:`, error)
        }
      }
      
      return allEvents
    }, "SET_EVENTS")
  }

  const createEvent = async (event: Omit<any, "id">): Promise<any> => {
    // TODO: Implement actual event creation
    console.log("Creating event:", event)
    return event
  }

  const updateEvent = async (eventId: string, updates: Partial<any>): Promise<void> => {
    // TODO: Implement actual event update
    console.log("Updating event:", eventId, updates)
  }

  const deleteEvent = async (eventId: string): Promise<void> => {
    // TODO: Implement actual event deletion
    console.log("Deleting event:", eventId)
  }

  const fetchEventRSVPs = async (eventId: string): Promise<any[]> => {
    // TODO: Implement actual RSVP fetching
    console.log("Fetching RSVPs for event:", eventId)
    return []
  }

  const createEventRSVP = async (rsvp: Omit<any, "id">): Promise<any> => {
    // TODO: Implement actual RSVP creation
    console.log("Creating RSVP:", rsvp)
    return rsvp
  }

  const updateEventRSVP = async (rsvpId: string, updates: Partial<any>): Promise<void> => {
    // TODO: Implement actual RSVP update
    console.log("Updating RSVP:", rsvpId, updates)
  }

  // Expense management functions
  const refreshExpenseReports = async (): Promise<void> => {
    await safeRefresh("expenseReports", async () => {
      const paths = getHRPaths()
      const allReports: any[] = []
      
      for (const path of paths) {
        try {
          // TODO: Implement actual expense report fetching from database
          allReports.push(...[])
        } catch (error) {
          console.error(`Error fetching expense reports from ${path}:`, error)
        }
      }
      
      return allReports
    }, "SET_EXPENSE_REPORTS")
  }

  const createExpenseReport = async (report: Omit<any, "id">): Promise<any> => {
    // TODO: Implement actual expense report creation
    console.log("Creating expense report:", report)
    return report
  }

  const updateExpenseReport = async (reportId: string, updates: Partial<any>): Promise<void> => {
    // TODO: Implement actual expense report update
    console.log("Updating expense report:", reportId, updates)
  }

  const deleteExpenseReport = async (reportId: string): Promise<void> => {
    // TODO: Implement actual expense report deletion
    console.log("Deleting expense report:", reportId)
  }

  // Diversity and inclusion functions
  const refreshDiversityInitiatives = async (): Promise<void> => {
    await safeRefresh("diversityInitiatives", async () => {
      // TODO: Implement actual diversity initiative fetching
      return []
    }, "SET_DIVERSITY_INITIATIVES")
  }

  const createDiversityInitiative = async (initiative: Omit<any, "id">): Promise<any> => {
    // TODO: Implement actual diversity initiative creation
    console.log("Creating diversity initiative:", initiative)
    return initiative
  }

  const updateDiversityInitiative = async (initiativeId: string, updates: Partial<any>): Promise<void> => {
    // TODO: Implement actual diversity initiative update
    console.log("Updating diversity initiative:", initiativeId, updates)
  }

  const deleteDiversityInitiative = async (initiativeId: string): Promise<void> => {
    // TODO: Implement actual diversity initiative deletion
    console.log("Deleting diversity initiative:", initiativeId)
  }

  const refreshDiversitySurveys = async (): Promise<void> => {
    await safeRefresh("diversitySurveys", async () => {
      // TODO: Implement actual diversity survey fetching
      return []
    }, "SET_DIVERSITY_SURVEYS")
  }

  const createDiversitySurvey = async (survey: Omit<any, "id">): Promise<any> => {
    // TODO: Implement actual diversity survey creation
    console.log("Creating diversity survey:", survey)
    return survey
  }

  const updateDiversitySurvey = async (surveyId: string, updates: Partial<any>): Promise<void> => {
    // TODO: Implement actual diversity survey update
    console.log("Updating diversity survey:", surveyId, updates)
  }

  const deleteDiversitySurvey = async (surveyId: string): Promise<void> => {
    // TODO: Implement actual diversity survey deletion
    console.log("Deleting diversity survey:", surveyId)
  }

  // Starter checklist functions
  const refreshStarterChecklists = async (): Promise<void> => {
    await safeRefresh("starterChecklists", async () => {
      // TODO: Implement actual starter checklist fetching
      return []
    }, "SET_STARTER_CHECKLISTS")
  }

  const createStarterChecklist = async (checklist: Omit<any, "id">): Promise<any> => {
    // TODO: Implement actual starter checklist creation
    console.log("Creating starter checklist:", checklist)
    return checklist
  }

  const updateStarterChecklist = async (checklistId: string, updates: Partial<any>): Promise<void> => {
    // TODO: Implement actual starter checklist update
    console.log("Updating starter checklist:", checklistId, updates)
  }

  const deleteStarterChecklist = async (checklistId: string): Promise<void> => {
    // TODO: Implement actual starter checklist deletion
    console.log("Deleting starter checklist:", checklistId)
  }

  // Permission function
  const checkPermission = (module: string, resource: string, action: "view" | "edit" | "delete"): boolean => {
    // Use the permission system from CompanyContext
    return hasPermission(module, resource, action)
  }

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: HRContextType = useMemo(() => ({
    state,
    dispatch,
    refreshEmployees,
    refreshRoles,
    refreshDepartments,
    refreshTrainings,
    refreshTimeOffs,
    refreshWarnings,
    refreshAttendances,
    refreshComplianceTasks,
    refreshAnnouncements,
    refreshJobs,
    refreshCandidates,
    refreshInterviews,
    refreshPayrolls,
    refreshPerformanceReviews,
    refreshSchedules,
    refreshContracts,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    fetchEmployeeDetail,
    addRole,
    updateRole,
    deleteRole,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addTraining,
    updateTraining,
    deleteTraining,
    addTimeOff,
    updateTimeOff,
    deleteTimeOff,
    addWarning,
    updateWarning,
    deleteWarning,
    addAttendance,
    updateAttendance,
    deleteAttendance,
    addComplianceTask,
    updateComplianceTask,
    deleteComplianceTask,
    addJob,
    updateJob,
    deleteJob,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    addInterview,
    updateInterview,
    deleteInterview,
    getEmployeeTrainings,
    getEmployeeTimeOffs,
    getEmployeeWarnings,
    getEmployeeAttendances,
    // Employee invitation
    generateJoinCode,
    getEmployeeInvites,
    revokeInvite,
    // Benefits management
    fetchBenefits,
    createBenefit,
    updateBenefit,
    deleteBenefit,
    fetchEmployeeBenefits,
    assignBenefitToEmployee,
    updateEmployeeBenefit,
    removeEmployeeBenefit,
    addPayroll,
    updatePayroll,
    deletePayroll,
    updatePayrollRecord,
    deletePayrollRecord,
    fetchPayrollDetail,
    addPerformanceReview,
    updatePerformanceReview,
    deletePerformanceReview,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    // Contract management
    fetchContractTemplates,
    createContractTemplate,
    updateContractTemplate,
    deleteContractTemplate,
    addContract: createContract,
    createContract,
    updateContract,
    deleteContract,
    initializeDefaultContractTemplates,
    // Permission functions
    hasPermission: checkPermission,
    // Generic HR action handler for operations not yet implemented as specific functions
    handleHRAction: async (params: HRActionParams) => {
      const { companyId, siteId, action, entity, id, data } = params;
      const basePath = `companies/${companyId}/sites/${siteId}`;
      return await handleHRAction(basePath, action, entity, id, data);
    },
    // Permission functions - Owner has full access
    canViewHR: () => checkPermission("hr", "employees", "view"),
    canEditHR: () => checkPermission("hr", "employees", "edit"),
    canDeleteHR: () => checkPermission("hr", "employees", "delete"),
    isOwner: () => checkPermission("hr", "employees", "delete"), // Simplified for now
    // Event management functions
    refreshEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    fetchEventRSVPs,
    createEventRSVP,
    updateEventRSVP,
    // Expense management functions
    refreshExpenseReports,
    createExpenseReport,
    updateExpenseReport,
    deleteExpenseReport,
    // Diversity and inclusion functions
    refreshDiversityInitiatives,
    createDiversityInitiative,
    updateDiversityInitiative,
    deleteDiversityInitiative,
    refreshDiversitySurveys,
    createDiversitySurvey,
    updateDiversitySurvey,
    deleteDiversitySurvey,
    // Starter checklist functions
    refreshStarterChecklists,
    createStarterChecklist,
    updateStarterChecklist,
    deleteStarterChecklist,
    // Announcement functions
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
  }), [
    state,
    dispatch,
    refreshEmployees,
    refreshRoles,
    refreshDepartments,
    refreshTrainings,
    refreshTimeOffs,
    refreshWarnings,
    refreshAttendances,
    refreshComplianceTasks,
    refreshAnnouncements,
    refreshJobs,
    refreshCandidates,
    refreshInterviews,
    refreshPayrolls,
    refreshPerformanceReviews,
    refreshSchedules,
    refreshContracts,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    fetchEmployeeDetail,
    addRole,
    updateRole,
    deleteRole,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addTraining,
    updateTraining,
    deleteTraining,
    addTimeOff,
    updateTimeOff,
    deleteTimeOff,
    addWarning,
    updateWarning,
    deleteWarning,
    addAttendance,
    updateAttendance,
    deleteAttendance,
    addComplianceTask,
    updateComplianceTask,
    deleteComplianceTask,
    addJob,
    updateJob,
    deleteJob,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    addInterview,
    updateInterview,
    deleteInterview,
    getEmployeeTrainings,
    getEmployeeTimeOffs,
    getEmployeeWarnings,
    getEmployeeAttendances,
    generateJoinCode,
    getEmployeeInvites,
    revokeInvite,
    fetchBenefits,
    createBenefit,
    updateBenefit,
    deleteBenefit,
    fetchEmployeeBenefits,
    assignBenefitToEmployee,
    updateEmployeeBenefit,
    removeEmployeeBenefit,
    addPayroll,
    updatePayroll,
    deletePayroll,
    updatePayrollRecord,
    deletePayrollRecord,
    fetchPayrollDetail,
    addPerformanceReview,
    updatePerformanceReview,
    deletePerformanceReview,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    fetchContractTemplates,
    createContractTemplate,
    createContract,
    updateContract,
    initializeDefaultContractTemplates,
    checkPermission,
    refreshEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    fetchEventRSVPs,
    createEventRSVP,
    updateEventRSVP,
    refreshExpenseReports,
    createExpenseReport,
    updateExpenseReport,
    deleteExpenseReport,
    refreshDiversityInitiatives,
    createDiversityInitiative,
    updateDiversityInitiative,
    deleteDiversityInitiative,
    refreshDiversitySurveys,
    createDiversitySurvey,
    updateDiversitySurvey,
    deleteDiversitySurvey,
    refreshStarterChecklists,
    createStarterChecklist,
    updateStarterChecklist,
    deleteStarterChecklist,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
  ])

  // Reset warning flag when provider mounts (so real issues can be detected)
  React.useEffect(() => {
    hrWarningShown = false
  }, [])

  return (
    <HRContext.Provider value={contextValue}>
      {children}
    </HRContext.Provider>
  )
}

// Custom hook to use the HR context - graceful handling when not loaded
// Track warnings to avoid spam during initial load
let hrWarningShown = false

export const useHR = (): HRContextType => {
  const context = useContext(HRContext)
  if (context === undefined) {
    // Return a safe default context instead of throwing error
    // This allows components to render even when HR module isn't loaded yet
    // Only warn once in development mode to reduce console noise
    if (process.env.NODE_ENV === 'development' && !hrWarningShown) {
      hrWarningShown = true
      // Only warn if it's not expected (i.e., not during initial navigation)
      console.warn("useHR called outside HRProvider - returning empty context (this is normal during initial load)")
    }
    
    // Return a safe default context with proper structure
    const emptyState: HRState = {
      employees: [],
      roles: [],
      departments: [],
      trainings: [],
      timeOffs: [],
      warnings: [],
      attendances: [],
      attendanceRecords: [],
      complianceTasks: [],
      announcements: [],
      jobs: [],
      jobPostings: [],
      candidates: [],
      interviews: [],
      payrollRecords: [],
      performanceReviews: [],
      trainingPrograms: [],
      schedules: [],
      contracts: [],
      contractTemplates: [],
      benefits: [],
      events: [],
      employeeBenefits: [],
      expenseReports: [],
      starterChecklists: [],
      incentives: [],
      venueBattles: [],
      diversityInitiatives: [],
      diversitySurveys: [],
      isLoading: false,
      error: null,
      initialized: false,
    }
    
    const emptyContext: HRContextType = {
      state: emptyState,
      dispatch: () => {},
      canViewHR: () => false,
      canEditHR: () => false,
      canDeleteHR: () => false,
      isOwner: () => false,
      refreshEmployees: async () => {},
      refreshRoles: async () => {},
      refreshDepartments: async () => {},
      refreshTrainings: async () => {},
      refreshTimeOffs: async () => {},
      refreshWarnings: async () => {},
      refreshAttendances: async () => {},
      refreshComplianceTasks: async () => {},
      refreshAnnouncements: async () => {},
      refreshJobs: async () => {},
      refreshCandidates: async () => {},
      refreshInterviews: async () => {},
      refreshPayrolls: async () => {},
      refreshPerformanceReviews: async () => {},
      refreshSchedules: async () => {},
      refreshContracts: async () => {},
      addEmployee: async () => null,
      updateEmployee: async () => null,
      deleteEmployee: async () => false,
      fetchEmployeeDetail: async () => null,
      addRole: async () => null,
      updateRole: async () => null,
      deleteRole: async () => false,
      addDepartment: async () => null,
      updateDepartment: async () => null,
      deleteDepartment: async () => false,
      addTraining: async () => null,
      updateTraining: async () => null,
      deleteTraining: async () => false,
      addTimeOff: async () => null,
      updateTimeOff: async () => null,
      deleteTimeOff: async () => false,
      addWarning: async () => null,
      updateWarning: async () => null,
      deleteWarning: async () => false,
      addAttendance: async () => null,
      updateAttendance: async () => null,
      deleteAttendance: async () => false,
      addComplianceTask: async () => null,
      updateComplianceTask: async () => null,
      deleteComplianceTask: async () => false,
      addAnnouncement: async () => null,
      updateAnnouncement: async () => null,
      deleteAnnouncement: async () => false,
      addJob: async () => null,
      updateJob: async () => null,
      deleteJob: async () => false,
      addCandidate: async () => null,
      updateCandidate: async () => null,
      deleteCandidate: async () => false,
      addInterview: async () => null,
      updateInterview: async () => null,
      deleteInterview: async () => false,
      addPayroll: async () => null,
      updatePayroll: async () => null,
      deletePayroll: async () => false,
      updatePayrollRecord: async () => null,
      deletePayrollRecord: async () => false,
      fetchPayrollDetail: async () => null,
      addPerformanceReview: async () => null,
      updatePerformanceReview: async () => null,
      deletePerformanceReview: async () => false,
      addSchedule: async () => null,
      updateSchedule: async () => null,
      deleteSchedule: async () => false,
      addContract: async () => null,
      createContract: async () => null,
      updateContract: async () => null,
      createContractTemplate: async () => null,
      fetchContractTemplates: async () => [],
      initializeDefaultContractTemplates: async () => {},
      createBenefit: async () => null,
      updateBenefit: async () => null,
      deleteBenefit: async () => false,
      fetchBenefits: async () => [],
      fetchEmployeeBenefits: async () => [],
      getEmployeeTrainings: async () => [],
      getEmployeeTimeOffs: async () => [],
      getEmployeeWarnings: async () => [],
      getEmployeeAttendances: async () => [],
      generateJoinCode: async () => "",
      getEmployeeInvites: async () => null,
      revokeInvite: async () => {},
      hasPermission: () => false,
      handleHRAction: async () => null,
      refreshEvents: async () => {},
      fetchEventRSVPs: async () => [],
      createEventRSVP: async () => null,
      updateEventRSVP: async () => {},
      refreshExpenseReports: async () => {},
      refreshDiversityInitiatives: async () => {},
      createDiversityInitiative: async () => null,
      updateDiversityInitiative: async () => {},
      deleteDiversityInitiative: async () => {},
      refreshDiversitySurveys: async () => {},
      createDiversitySurvey: async () => null,
      updateDiversitySurvey: async () => {},
      deleteDiversitySurvey: async () => {},
      refreshStarterChecklists: async () => {},
      createEvent: async () => null,
      updateEvent: async () => { return; },
      deleteEvent: async () => { return; },
      assignBenefitToEmployee: async () => null,
      updateEmployeeBenefit: async () => null,
      removeEmployeeBenefit: async () => false,
      createExpenseReport: async () => null,
      updateExpenseReport: async () => {},
      deleteExpenseReport: async () => {},
      createStarterChecklist: async () => null,
      updateStarterChecklist: async () => {},
      deleteStarterChecklist: async () => {},
    }
    
    return emptyContext
  }
  return context
}

// Export alias for frontend compatibility
export const useHRContext = useHR
