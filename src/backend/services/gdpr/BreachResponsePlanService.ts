/**
 * Breach Response Plan Service
 *
 * Manages the breach response plan with assigned roles and responsibilities.
 * Ensures a structured approach to handling personal data breaches.
 *
 * UK GDPR Requirements:
 * - Must have procedures in place to detect, report, and investigate breaches
 * - Must notify ICO within 72 hours (for notifiable breaches)
 * - Must notify affected individuals without undue delay (for high risk)
 * - Must document all breaches regardless of whether notifiable
 *
 * References:
 * - ICO Personal Data Breaches Guide
 * - NCSC Incident Response Framework
 */

import { ref, push, set, get, update } from 'firebase/database';
import { db } from '../Firebase';

/**
 * Breach response team roles
 */
export type BreachResponseRole =
  | 'incident_coordinator'      // Overall breach management
  | 'data_protection_officer'   // DPO - regulatory liaison
  | 'technical_lead'            // Technical investigation
  | 'communications_lead'       // Internal/external communications
  | 'legal_counsel'             // Legal advice
  | 'hr_representative'         // Employee breaches
  | 'senior_management'         // Executive decisions
  | 'it_security'               // Security response
  | 'business_continuity';      // Operations continuity

/**
 * Response phase
 */
export type ResponsePhase =
  | 'detection'      // Breach detected
  | 'containment'    // Immediate containment actions
  | 'assessment'     // Risk and impact assessment
  | 'notification'   // Regulatory and individual notification
  | 'investigation'  // Root cause investigation
  | 'remediation'    // Fix and prevent recurrence
  | 'review';        // Post-incident review

/**
 * Team member with role
 */
export interface BreachResponseTeamMember {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: BreachResponseRole;
  backupUserId?: string;
  responsibilities: string[];
  notificationPriority: 1 | 2 | 3; // 1 = immediate, 2 = within 1 hour, 3 = within 4 hours
  lastTrainingDate?: number;
  trainingCertified: boolean;
}

/**
 * Response plan phase details
 */
export interface ResponsePhaseDetails {
  phase: ResponsePhase;
  description: string;
  responsibleRoles: BreachResponseRole[];
  targetDuration: string;  // e.g., "1 hour", "24 hours"
  tasks: string[];
  escalationTriggers?: string[];
  checklistItems: string[];
}

/**
 * Breach Response Plan
 */
export interface BreachResponsePlan {
  id: string;
  companyId: string;
  version: string;
  status: 'draft' | 'active' | 'under_review' | 'archived';

  // Team
  teamMembers: BreachResponseTeamMember[];

  // Phases
  phases: ResponsePhaseDetails[];

  // Escalation matrix
  escalationMatrix: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    notifyRoles: BreachResponseRole[];
    maxResponseTime: string;
    notifyExternal: boolean;
  }[];

  // Contact information
  icoContact: {
    phone: string;
    email: string;
    webForm: string;
  };
  hmrcContact?: {
    phone: string;
    email: string;
  };

  // Document references
  privacyPolicyVersion: string;
  lastTestedDate?: number;
  nextReviewDate: number;

  // Metadata
  createdAt: number;
  createdBy: string;
  updatedAt?: number;
  updatedBy?: string;
  approvedAt?: number;
  approvedBy?: string;
}

/**
 * Breach Response Task
 */
export interface BreachResponseTask {
  id: string;
  breachId: string;
  phase: ResponsePhase;
  task: string;
  assignedRole: BreachResponseRole;
  assignedUserId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate?: number;
  completedAt?: number;
  completedBy?: string;
  notes?: string;
  createdAt: number;
}

/**
 * Training Record
 */
export interface BreachTrainingRecord {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  trainingType: 'initial' | 'refresher' | 'simulation' | 'tabletop_exercise';
  trainingDate: number;
  completedSuccessfully: boolean;
  score?: number;
  validUntil: number;
  certificateRef?: string;
  topics: string[];
  trainedBy?: string;
  notes?: string;
}

/**
 * Default response phases
 */
export const DEFAULT_RESPONSE_PHASES: ResponsePhaseDetails[] = [
  {
    phase: 'detection',
    description: 'Identify and confirm the breach has occurred',
    responsibleRoles: ['it_security', 'technical_lead'],
    targetDuration: '1 hour',
    tasks: [
      'Confirm the breach has occurred',
      'Identify initial scope (systems, data types affected)',
      'Preserve evidence',
      'Alert incident coordinator',
    ],
    escalationTriggers: [
      'Personal data confirmed affected',
      'Multiple systems compromised',
      'Active attack ongoing',
    ],
    checklistItems: [
      'Breach confirmed (not false positive)',
      'Initial scope documented',
      'Evidence preserved (logs, screenshots)',
      'Incident coordinator notified',
      'Initial timeline established',
    ],
  },
  {
    phase: 'containment',
    description: 'Stop the breach and limit damage',
    responsibleRoles: ['it_security', 'technical_lead', 'incident_coordinator'],
    targetDuration: '4 hours',
    tasks: [
      'Isolate affected systems',
      'Block unauthorized access',
      'Change compromised credentials',
      'Implement emergency access controls',
      'Document all containment actions',
    ],
    escalationTriggers: [
      'Cannot contain breach',
      'Breach is spreading',
      'External systems affected',
    ],
    checklistItems: [
      'Affected systems isolated',
      'Unauthorized access blocked',
      'Credentials changed (if applicable)',
      'Containment verified',
      'No ongoing data loss',
    ],
  },
  {
    phase: 'assessment',
    description: 'Assess risk to individuals and determine notification requirements',
    responsibleRoles: ['data_protection_officer', 'incident_coordinator', 'legal_counsel'],
    targetDuration: '24 hours',
    tasks: [
      'Identify categories of personal data affected',
      'Determine number of individuals affected',
      'Assess risk to individuals (identity theft, financial, etc.)',
      'Determine if ICO notification required',
      'Determine if individual notification required',
      'Prepare notification content',
    ],
    checklistItems: [
      'Data categories identified',
      'Number of affected individuals estimated',
      'Risk assessment completed',
      'ICO notification decision made',
      'Individual notification decision made',
      'Notification content drafted (if required)',
    ],
  },
  {
    phase: 'notification',
    description: 'Notify ICO and affected individuals as required',
    responsibleRoles: ['data_protection_officer', 'communications_lead', 'senior_management'],
    targetDuration: '72 hours from detection',
    tasks: [
      'Submit ICO notification (if required)',
      'Notify HMRC (if payroll/tax data involved)',
      'Notify affected individuals (if high risk)',
      'Prepare internal communications',
      'Brief senior management',
    ],
    escalationTriggers: [
      'Approaching 72-hour deadline',
      'Media enquiries received',
      'Legal threats received',
    ],
    checklistItems: [
      'ICO notified (if required) within 72 hours',
      'HMRC notified (if required) within 72 hours',
      'Individuals notified (if required) without undue delay',
      'Internal stakeholders briefed',
      'All notifications logged',
    ],
  },
  {
    phase: 'investigation',
    description: 'Conduct root cause analysis',
    responsibleRoles: ['technical_lead', 'it_security', 'data_protection_officer'],
    targetDuration: '2 weeks',
    tasks: [
      'Conduct forensic analysis',
      'Identify root cause',
      'Identify attack vector (if applicable)',
      'Document timeline of events',
      'Identify control failures',
    ],
    checklistItems: [
      'Root cause identified',
      'Attack vector documented (if applicable)',
      'Timeline of events completed',
      'Control failures identified',
      'Evidence preserved for potential legal action',
    ],
  },
  {
    phase: 'remediation',
    description: 'Fix vulnerabilities and prevent recurrence',
    responsibleRoles: ['technical_lead', 'it_security', 'data_protection_officer'],
    targetDuration: '4 weeks',
    tasks: [
      'Implement technical fixes',
      'Update security controls',
      'Update policies/procedures',
      'Provide additional training',
      'Test remediation effectiveness',
    ],
    checklistItems: [
      'Technical vulnerabilities fixed',
      'Security controls enhanced',
      'Policies updated (if needed)',
      'Staff retrained (if needed)',
      'Remediation tested and verified',
    ],
  },
  {
    phase: 'review',
    description: 'Post-incident review and lessons learned',
    responsibleRoles: ['incident_coordinator', 'data_protection_officer', 'senior_management'],
    targetDuration: '1 week after remediation',
    tasks: [
      'Conduct post-incident review meeting',
      'Document lessons learned',
      'Update breach response plan',
      'Report to board (if required)',
      'Close breach record',
    ],
    checklistItems: [
      'Post-incident review completed',
      'Lessons learned documented',
      'Response plan updated',
      'Board report submitted (if required)',
      'Breach record closed',
      'ICO follow-up completed (if applicable)',
    ],
  },
];

/**
 * Default escalation matrix
 */
export const DEFAULT_ESCALATION_MATRIX = [
  {
    severity: 'critical' as const,
    notifyRoles: [
      'incident_coordinator',
      'data_protection_officer',
      'senior_management',
      'legal_counsel',
    ] as BreachResponseRole[],
    maxResponseTime: '1 hour',
    notifyExternal: true,
  },
  {
    severity: 'high' as const,
    notifyRoles: [
      'incident_coordinator',
      'data_protection_officer',
      'technical_lead',
    ] as BreachResponseRole[],
    maxResponseTime: '4 hours',
    notifyExternal: true,
  },
  {
    severity: 'medium' as const,
    notifyRoles: ['incident_coordinator', 'technical_lead'] as BreachResponseRole[],
    maxResponseTime: '24 hours',
    notifyExternal: false,
  },
  {
    severity: 'low' as const,
    notifyRoles: ['incident_coordinator'] as BreachResponseRole[],
    maxResponseTime: '72 hours',
    notifyExternal: false,
  },
];

/**
 * Breach Response Plan Service
 */
export class BreachResponsePlanService {
  private planPath: string;
  private tasksPath: string;
  private trainingPath: string;

  constructor() {
    this.planPath = 'compliance/breach_response_plan';
    this.tasksPath = 'compliance/breach_response_tasks';
    this.trainingPath = 'compliance/breach_training';
  }

  /**
   * Create or update breach response plan
   */
  async createOrUpdatePlan(
    companyId: string,
    userId: string,
    planData: {
      teamMembers: BreachResponseTeamMember[];
      icoContact?: Partial<BreachResponsePlan['icoContact']>;
      hmrcContact?: BreachResponsePlan['hmrcContact'];
      privacyPolicyVersion: string;
    }
  ): Promise<BreachResponsePlan> {
    const planRef = ref(db, `${this.planPath}/${companyId}`);
    const existingSnapshot = await get(planRef);
    const now = Date.now();

    const icoContact = {
      phone: planData.icoContact?.phone || '0303 123 1113',
      email: planData.icoContact?.email || 'casework@ico.org.uk',
      webForm: planData.icoContact?.webForm || 'https://ico.org.uk/make-a-complaint/data-protection-complaints/data-protection-complaints/',
    };

    if (existingSnapshot.exists()) {
      // Update existing plan
      const existing = existingSnapshot.val() as BreachResponsePlan;
      const versionParts = existing.version.split('.').map(Number);
      versionParts[1]++; // Increment minor version

      const updates: Partial<BreachResponsePlan> = {
        version: versionParts.join('.'),
        teamMembers: planData.teamMembers,
        icoContact,
        hmrcContact: planData.hmrcContact,
        privacyPolicyVersion: planData.privacyPolicyVersion,
        status: 'under_review',
        updatedAt: now,
        updatedBy: userId,
      };

      await update(planRef, updates);
      return { ...existing, ...updates } as BreachResponsePlan;
    }

    // Create new plan
    const plan: BreachResponsePlan = {
      id: companyId, // One plan per company
      companyId,
      version: '1.0.0',
      status: 'draft',
      teamMembers: planData.teamMembers,
      phases: DEFAULT_RESPONSE_PHASES,
      escalationMatrix: DEFAULT_ESCALATION_MATRIX,
      icoContact,
      hmrcContact: planData.hmrcContact,
      privacyPolicyVersion: planData.privacyPolicyVersion,
      nextReviewDate: now + (365 * 24 * 60 * 60 * 1000), // 1 year
      createdAt: now,
      createdBy: userId,
    };

    await set(planRef, plan);
    return plan;
  }

  /**
   * Get breach response plan
   */
  async getPlan(companyId: string): Promise<BreachResponsePlan | null> {
    const planRef = ref(db, `${this.planPath}/${companyId}`);
    const snapshot = await get(planRef);

    if (!snapshot.exists()) return null;
    return snapshot.val() as BreachResponsePlan;
  }

  /**
   * Activate breach response plan
   */
  async activatePlan(
    companyId: string,
    userId: string,
    approverName: string
  ): Promise<void> {
    const planRef = ref(db, `${this.planPath}/${companyId}`);
    const now = Date.now();

    await update(planRef, {
      status: 'active',
      approvedAt: now,
      approvedBy: approverName,
      updatedAt: now,
      updatedBy: userId,
    });
  }

  /**
   * Get team member by role
   */
  async getTeamMemberByRole(
    companyId: string,
    role: BreachResponseRole
  ): Promise<BreachResponseTeamMember | null> {
    const plan = await this.getPlan(companyId);
    if (!plan) return null;

    return plan.teamMembers.find(m => m.role === role) || null;
  }

  /**
   * Get all team members for a phase
   */
  async getTeamForPhase(
    companyId: string,
    phase: ResponsePhase
  ): Promise<BreachResponseTeamMember[]> {
    const plan = await this.getPlan(companyId);
    if (!plan) return [];

    const phaseDetails = plan.phases.find(p => p.phase === phase);
    if (!phaseDetails) return [];

    return plan.teamMembers.filter(
      m => phaseDetails.responsibleRoles.includes(m.role)
    );
  }

  /**
   * Create tasks for a breach based on the plan
   */
  async createBreachTasks(
    companyId: string,
    breachId: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<BreachResponseTask[]> {
    const plan = await this.getPlan(companyId);
    if (!plan) {
      throw new Error('No breach response plan found. Create a plan first.');
    }

    const tasks: BreachResponseTask[] = [];
    const now = Date.now();

    for (const phase of plan.phases) {
      for (const taskDescription of phase.tasks) {
        const taskRef = push(ref(db, `${this.tasksPath}/${companyId}/${breachId}`));

        const task: BreachResponseTask = {
          id: taskRef.key!,
          breachId,
          phase: phase.phase,
          task: taskDescription,
          assignedRole: phase.responsibleRoles[0], // Primary responsible role
          status: 'pending',
          priority: this.getPriorityForSeverity(severity, phase.phase),
          createdAt: now,
        };

        await set(taskRef, task);
        tasks.push(task);
      }
    }

    return tasks;
  }

  /**
   * Get tasks for a breach
   */
  async getBreachTasks(
    companyId: string,
    breachId: string
  ): Promise<BreachResponseTask[]> {
    const tasksRef = ref(db, `${this.tasksPath}/${companyId}/${breachId}`);
    const snapshot = await get(tasksRef);

    if (!snapshot.exists()) return [];

    const tasks: BreachResponseTask[] = [];
    snapshot.forEach(child => {
      tasks.push(child.val() as BreachResponseTask);
    });

    return tasks.sort((a, b) => a.createdAt - b.createdAt);
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    companyId: string,
    breachId: string,
    taskId: string,
    userId: string,
    status: BreachResponseTask['status'],
    notes?: string
  ): Promise<void> {
    const taskRef = ref(db, `${this.tasksPath}/${companyId}/${breachId}/${taskId}`);
    const now = Date.now();

    const updates: Partial<BreachResponseTask> = {
      status,
      notes,
    };

    if (status === 'completed') {
      updates.completedAt = now;
      updates.completedBy = userId;
    }

    await update(taskRef, updates);
  }

  /**
   * Record training completion
   */
  async recordTraining(
    companyId: string,
    training: {
      userId: string;
      userName: string;
      trainingType: BreachTrainingRecord['trainingType'];
      completedSuccessfully: boolean;
      score?: number;
      topics: string[];
      trainedBy?: string;
      notes?: string;
    }
  ): Promise<BreachTrainingRecord> {
    const trainingRef = push(ref(db, `${this.trainingPath}/${companyId}`));
    const now = Date.now();

    // Training valid for 1 year (refresher) or 2 years (initial)
    const validityPeriod = training.trainingType === 'initial'
      ? 2 * 365 * 24 * 60 * 60 * 1000
      : 365 * 24 * 60 * 60 * 1000;

    const record: BreachTrainingRecord = {
      id: trainingRef.key!,
      companyId,
      userId: training.userId,
      userName: training.userName,
      trainingType: training.trainingType,
      trainingDate: now,
      completedSuccessfully: training.completedSuccessfully,
      score: training.score,
      validUntil: now + validityPeriod,
      topics: training.topics,
      trainedBy: training.trainedBy,
      notes: training.notes,
    };

    await set(trainingRef, record);

    // Update team member training status if applicable
    await this.updateTeamMemberTraining(companyId, training.userId, now);

    return record;
  }

  /**
   * Get training records for a user
   */
  async getUserTrainingRecords(
    companyId: string,
    userId: string
  ): Promise<BreachTrainingRecord[]> {
    const allRecords = await this.getAllTrainingRecords(companyId);
    return allRecords.filter(r => r.userId === userId);
  }

  /**
   * Get all training records
   */
  async getAllTrainingRecords(companyId: string): Promise<BreachTrainingRecord[]> {
    const trainingRef = ref(db, `${this.trainingPath}/${companyId}`);
    const snapshot = await get(trainingRef);

    if (!snapshot.exists()) return [];

    const records: BreachTrainingRecord[] = [];
    snapshot.forEach(child => {
      records.push(child.val() as BreachTrainingRecord);
    });

    return records.sort((a, b) => b.trainingDate - a.trainingDate);
  }

  /**
   * Get team members with expired training
   */
  async getTeamMembersNeedingTraining(companyId: string): Promise<{
    member: BreachResponseTeamMember;
    lastTraining?: BreachTrainingRecord;
    reason: 'never_trained' | 'expired' | 'expiring_soon';
  }[]> {
    const plan = await this.getPlan(companyId);
    if (!plan) return [];

    const trainingRecords = await this.getAllTrainingRecords(companyId);
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const results: {
      member: BreachResponseTeamMember;
      lastTraining?: BreachTrainingRecord;
      reason: 'never_trained' | 'expired' | 'expiring_soon';
    }[] = [];

    for (const member of plan.teamMembers) {
      const memberTraining = trainingRecords
        .filter(r => r.userId === member.userId && r.completedSuccessfully)
        .sort((a, b) => b.trainingDate - a.trainingDate);

      if (memberTraining.length === 0) {
        results.push({ member, reason: 'never_trained' });
      } else {
        const latest = memberTraining[0];
        if (latest.validUntil < now) {
          results.push({ member, lastTraining: latest, reason: 'expired' });
        } else if (latest.validUntil < now + thirtyDays) {
          results.push({ member, lastTraining: latest, reason: 'expiring_soon' });
        }
      }
    }

    return results;
  }

  /**
   * Run a tabletop exercise
   */
  async recordTabletopExercise(
    companyId: string,
    exercise: {
      scenario: string;
      participants: { userId: string; userName: string; role: BreachResponseRole }[];
      duration: number; // minutes
      findings: string[];
      improvements: string[];
      conductedBy: string;
    }
  ): Promise<void> {
    // Record training for each participant
    for (const participant of exercise.participants) {
      await this.recordTraining(companyId, {
        userId: participant.userId,
        userName: participant.userName,
        trainingType: 'tabletop_exercise',
        completedSuccessfully: true,
        topics: [
          'Breach detection',
          'Incident response',
          'ICO notification',
          'Individual notification',
          exercise.scenario,
        ],
        trainedBy: exercise.conductedBy,
        notes: `Tabletop exercise: ${exercise.scenario}. Duration: ${exercise.duration} mins.`,
      });
    }

    // Update plan with test date
    const planRef = ref(db, `${this.planPath}/${companyId}`);
    await update(planRef, {
      lastTestedDate: Date.now(),
      updatedAt: Date.now(),
    });
  }

  /**
   * Update team member training status
   */
  private async updateTeamMemberTraining(
    companyId: string,
    userId: string,
    trainingDate: number
  ): Promise<void> {
    const plan = await this.getPlan(companyId);
    if (!plan) return;

    const memberIndex = plan.teamMembers.findIndex(m => m.userId === userId);
    if (memberIndex === -1) return;

    const updatedMembers = [...plan.teamMembers];
    updatedMembers[memberIndex] = {
      ...updatedMembers[memberIndex],
      lastTrainingDate: trainingDate,
      trainingCertified: true,
    };

    const planRef = ref(db, `${this.planPath}/${companyId}`);
    await update(planRef, {
      teamMembers: updatedMembers,
      updatedAt: Date.now(),
    });
  }

  /**
   * Get priority based on severity and phase
   */
  private getPriorityForSeverity(
    severity: 'low' | 'medium' | 'high' | 'critical',
    phase: ResponsePhase
  ): 'critical' | 'high' | 'medium' | 'low' {
    // Early phases always high priority
    if (phase === 'detection' || phase === 'containment') {
      return severity === 'critical' ? 'critical' : 'high';
    }

    // Notification phase critical for high/critical severity
    if (phase === 'notification') {
      return severity === 'critical' || severity === 'high' ? 'critical' : 'high';
    }

    // Later phases based on severity
    return severity;
  }

  /**
   * Generate default team member template
   */
  generateTeamMemberTemplate(role: BreachResponseRole): Partial<BreachResponseTeamMember> {
    const templates: Record<BreachResponseRole, { responsibilities: string[]; notificationPriority: 1 | 2 | 3 }> = {
      incident_coordinator: {
        responsibilities: [
          'Coordinate overall breach response',
          'Ensure tasks are assigned and completed',
          'Communicate with senior management',
          'Make escalation decisions',
          'Approve external communications',
        ],
        notificationPriority: 1,
      },
      data_protection_officer: {
        responsibilities: [
          'Assess data protection implications',
          'Determine ICO notification requirement',
          'Prepare ICO notification',
          'Liaise with ICO',
          'Advise on individual notifications',
          'Ensure compliance documentation',
        ],
        notificationPriority: 1,
      },
      technical_lead: {
        responsibilities: [
          'Lead technical investigation',
          'Identify root cause',
          'Implement containment measures',
          'Oversee remediation',
          'Preserve digital evidence',
        ],
        notificationPriority: 1,
      },
      communications_lead: {
        responsibilities: [
          'Draft external communications',
          'Coordinate individual notifications',
          'Handle media enquiries',
          'Prepare internal communications',
        ],
        notificationPriority: 2,
      },
      legal_counsel: {
        responsibilities: [
          'Provide legal advice',
          'Review notifications and communications',
          'Advise on regulatory obligations',
          'Handle legal threats or claims',
        ],
        notificationPriority: 2,
      },
      hr_representative: {
        responsibilities: [
          'Handle employee-related breaches',
          'Coordinate internal notifications',
          'Advise on disciplinary implications',
          'Support affected staff',
        ],
        notificationPriority: 3,
      },
      senior_management: {
        responsibilities: [
          'Approve major decisions',
          'Authorize expenditure',
          'Board reporting',
          'Strategic direction',
        ],
        notificationPriority: 2,
      },
      it_security: {
        responsibilities: [
          'Implement security containment',
          'Forensic investigation',
          'Log analysis',
          'Security monitoring',
          'Implement security fixes',
        ],
        notificationPriority: 1,
      },
      business_continuity: {
        responsibilities: [
          'Ensure business operations continue',
          'Implement workarounds',
          'Coordinate recovery activities',
          'Manage customer impact',
        ],
        notificationPriority: 2,
      },
    };

    return {
      role,
      ...templates[role],
      trainingCertified: false,
    };
  }
}

// Export singleton instance
export const breachResponsePlanService = new BreachResponsePlanService();
