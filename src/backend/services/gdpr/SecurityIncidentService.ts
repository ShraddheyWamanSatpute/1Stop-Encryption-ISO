/**
 * Security Incident Reporting Service
 *
 * Provides a channel for customers and users to report security incidents,
 * as required by HMRC and NCSC guidelines.
 *
 * Reference:
 * - NCSC Incident Management Guidance
 * - HMRC Security Requirements
 * - ICO Data Breach Reporting
 *
 * Features:
 * - Security incident reporting channel
 * - Incident triage and classification
 * - Response tracking
 * - Notification to relevant parties
 * - Integration with DataBreachService for personal data breaches
 */

import { ref, push, set, get, update, query, orderByChild } from 'firebase/database';
import { db } from '../Firebase';
import { auditTrailService } from './AuditTrailService';
import { dataBreachService } from './DataBreachService';

/**
 * Security incident types
 */
export type SecurityIncidentType =
  | 'unauthorized_access'       // Unauthorized access to systems/data
  | 'data_breach'              // Personal data breach
  | 'malware'                  // Malware/ransomware detection
  | 'phishing'                 // Phishing attempt
  | 'denial_of_service'        // DoS/DDoS attack
  | 'account_compromise'       // Account takeover
  | 'insider_threat'           // Internal threat
  | 'physical_security'        // Physical security breach
  | 'vulnerability'            // Security vulnerability discovered
  | 'policy_violation'         // Security policy violation
  | 'suspicious_activity'      // Suspicious activity
  | 'system_compromise'        // System compromise
  | 'data_loss'               // Data loss (not breach)
  | 'other';                   // Other security incident

/**
 * Incident severity
 */
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

/**
 * Incident status
 */
export type IncidentStatus =
  | 'reported'      // Initial report received
  | 'triaged'       // Assessed and prioritized
  | 'investigating' // Under investigation
  | 'contained'     // Threat contained
  | 'eradicating'   // Removing threat
  | 'recovering'    // Restoring systems
  | 'resolved'      // Incident resolved
  | 'closed'        // Case closed
  | 'false_positive'; // Determined to be false positive

/**
 * Security incident report
 */
export interface SecurityIncidentReport {
  id: string;
  companyId: string;

  // Reporter information
  reporterId?: string;
  reporterEmail: string;
  reporterName?: string;
  reporterRole?: string;
  reporterType: 'employee' | 'customer' | 'external' | 'automated';

  // Incident details
  title: string;
  description: string;
  incidentType: SecurityIncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;

  // Timeline
  reportedAt: number;
  occurredAt?: number;
  detectedAt?: number;
  containedAt?: number;
  resolvedAt?: number;
  closedAt?: number;

  // Impact assessment
  affectedSystems?: string[];
  affectedUsers?: number;
  dataInvolved?: boolean;
  personalDataInvolved?: boolean;
  financialImpact?: number;
  reputationalImpact?: 'none' | 'low' | 'medium' | 'high';

  // Investigation
  assignedTo?: string;
  investigationNotes?: string[];
  rootCause?: string;
  attackVector?: string;
  indicators?: string[]; // IOCs

  // Response actions
  immediateActions?: string[];
  containmentActions?: string[];
  eradicationActions?: string[];
  recoveryActions?: string[];
  lessonsLearned?: string[];

  // Notifications
  hmrcNotified?: boolean;
  hmrcNotifiedAt?: number;
  icoNotified?: boolean;
  icoNotifiedAt?: number;
  managementNotified?: boolean;
  managementNotifiedAt?: number;
  usersNotified?: boolean;
  usersNotifiedAt?: number;

  // Related records
  dataBreachId?: string; // If this became a data breach
  auditLogIds: string[];
  attachments?: string[];

  // Metadata
  createdAt: number;
  updatedAt?: number;
  createdBy: string;
  updatedBy?: string;
}

/**
 * Incident response action
 */
export interface IncidentResponseAction {
  id: string;
  incidentId: string;
  actionType: 'immediate' | 'containment' | 'eradication' | 'recovery' | 'preventive';
  description: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate?: number;
  completedAt?: number;
  completedBy?: string;
  notes?: string;
  createdAt: number;
}

/**
 * Security Incident Service
 */
export class SecurityIncidentService {
  private basePath: string;
  private actionsPath: string;

  constructor() {
    this.basePath = 'security/incidents';
    this.actionsPath = 'security/actions';
  }

  /**
   * Report a security incident
   */
  async reportIncident(
    companyId: string,
    reporter: {
      userId?: string;
      email: string;
      name?: string;
      role?: string;
      type: 'employee' | 'customer' | 'external' | 'automated';
    },
    incident: {
      title: string;
      description: string;
      incidentType: SecurityIncidentType;
      severity?: IncidentSeverity;
      occurredAt?: number;
      affectedSystems?: string[];
      dataInvolved?: boolean;
      attachments?: string[];
    }
  ): Promise<SecurityIncidentReport> {
    const incidentRef = push(ref(db, `${this.basePath}/${companyId}`));
    const now = Date.now();

    // Auto-classify severity if not provided
    const severity = incident.severity || this.classifySeverity(incident.incidentType, incident.dataInvolved);

    const report: SecurityIncidentReport = {
      id: incidentRef.key!,
      companyId,
      reporterId: reporter.userId,
      reporterEmail: reporter.email,
      reporterName: reporter.name,
      reporterRole: reporter.role,
      reporterType: reporter.type,
      title: incident.title,
      description: incident.description,
      incidentType: incident.incidentType,
      severity,
      status: 'reported',
      reportedAt: now,
      occurredAt: incident.occurredAt,
      detectedAt: now,
      affectedSystems: incident.affectedSystems,
      dataInvolved: incident.dataInvolved,
      personalDataInvolved: incident.dataInvolved && this.isPersonalDataIncident(incident.incidentType),
      attachments: incident.attachments,
      auditLogIds: [],
      createdAt: now,
      createdBy: reporter.userId || 'anonymous',
    };

    await set(incidentRef, report);

    // Log the incident report
    const auditLog = await auditTrailService.logSecurityEvent(
      reporter.userId || 'anonymous',
      companyId,
      'login_failure', // Using available type - should extend for security incidents
      {
        success: true,
        description: `Security incident reported: ${incident.title}`,
        metadata: {
          incidentId: report.id,
          incidentType: incident.incidentType,
          severity,
        },
      }
    );

    // Update with audit log ID
    await update(incidentRef, { auditLogIds: [auditLog.id] });

    // Alert for critical/high severity incidents
    if (severity === 'critical' || severity === 'high') {
      console.warn(
        `[SECURITY INCIDENT] ${severity.toUpperCase()} severity incident reported (ID: ${report.id}): ${incident.title}`
      );
    }

    // Auto-escalate to data breach if personal data involved
    if (report.personalDataInvolved && incident.incidentType === 'data_breach') {
      await this.escalateToDataBreach(companyId, report);
    }

    return report;
  }

  /**
   * Triage an incident
   */
  async triageIncident(
    companyId: string,
    incidentId: string,
    handlerId: string,
    triage: {
      severity: IncidentSeverity;
      assignedTo: string;
      affectedUsers?: number;
      financialImpact?: number;
      reputationalImpact?: 'none' | 'low' | 'medium' | 'high';
      notes?: string;
    }
  ): Promise<void> {
    const incidentRef = ref(db, `${this.basePath}/${companyId}/${incidentId}`);
    const snapshot = await get(incidentRef);

    if (!snapshot.exists()) {
      throw new Error('Incident not found');
    }

    const now = Date.now();
    const updates: Partial<SecurityIncidentReport> = {
      severity: triage.severity,
      status: 'triaged',
      assignedTo: triage.assignedTo,
      affectedUsers: triage.affectedUsers,
      financialImpact: triage.financialImpact,
      reputationalImpact: triage.reputationalImpact,
      updatedAt: now,
      updatedBy: handlerId,
    };

    if (triage.notes) {
      const incident = snapshot.val() as SecurityIncidentReport;
      updates.investigationNotes = [...(incident.investigationNotes || []), `[${new Date(now).toISOString()}] Triage: ${triage.notes}`];
    }

    await update(incidentRef, updates);
    await this.addAuditLog(companyId, incidentId, handlerId, `Incident triaged: Severity ${triage.severity}`);
  }

  /**
   * Update incident status
   */
  async updateStatus(
    companyId: string,
    incidentId: string,
    handlerId: string,
    newStatus: IncidentStatus,
    notes?: string
  ): Promise<void> {
    const incidentRef = ref(db, `${this.basePath}/${companyId}/${incidentId}`);
    const snapshot = await get(incidentRef);

    if (!snapshot.exists()) {
      throw new Error('Incident not found');
    }

    const incident = snapshot.val() as SecurityIncidentReport;
    const now = Date.now();
    const updates: Partial<SecurityIncidentReport> = {
      status: newStatus,
      updatedAt: now,
      updatedBy: handlerId,
    };

    // Set timeline timestamps based on status
    if (newStatus === 'contained' && !incident.containedAt) {
      updates.containedAt = now;
    } else if (newStatus === 'resolved' && !incident.resolvedAt) {
      updates.resolvedAt = now;
    } else if (newStatus === 'closed' && !incident.closedAt) {
      updates.closedAt = now;
    }

    if (notes) {
      updates.investigationNotes = [
        ...(incident.investigationNotes || []),
        `[${new Date(now).toISOString()}] Status -> ${newStatus}: ${notes}`,
      ];
    }

    await update(incidentRef, updates);
    await this.addAuditLog(companyId, incidentId, handlerId, `Status updated to ${newStatus}`);
  }

  /**
   * Add response action
   */
  async addResponseAction(
    companyId: string,
    incidentId: string,
    userId: string,
    action: {
      actionType: IncidentResponseAction['actionType'];
      description: string;
      assignedTo?: string;
      priority?: IncidentResponseAction['priority'];
      dueDate?: number;
    }
  ): Promise<IncidentResponseAction> {
    const actionRef = push(ref(db, `${this.actionsPath}/${companyId}/${incidentId}`));
    const now = Date.now();

    const responseAction: IncidentResponseAction = {
      id: actionRef.key!,
      incidentId,
      actionType: action.actionType,
      description: action.description,
      assignedTo: action.assignedTo,
      status: 'pending',
      priority: action.priority || 'medium',
      dueDate: action.dueDate,
      createdAt: now,
    };

    await set(actionRef, responseAction);

    // Update incident with action
    const incidentRef = ref(db, `${this.basePath}/${companyId}/${incidentId}`);
    const snapshot = await get(incidentRef);

    if (snapshot.exists()) {
      const incident = snapshot.val() as SecurityIncidentReport;
      const actionField = `${action.actionType}Actions` as keyof SecurityIncidentReport;
      const existingActions = (incident[actionField] as string[] | undefined) || [];

      await update(incidentRef, {
        [actionField]: [...existingActions, action.description],
        updatedAt: now,
      });
    }

    return responseAction;
  }

  /**
   * Complete response action
   */
  async completeAction(
    companyId: string,
    incidentId: string,
    actionId: string,
    userId: string,
    notes?: string
  ): Promise<void> {
    const actionRef = ref(db, `${this.actionsPath}/${companyId}/${incidentId}/${actionId}`);

    await update(actionRef, {
      status: 'completed',
      completedAt: Date.now(),
      completedBy: userId,
      notes,
    });
  }

  /**
   * Record notification sent
   */
  async recordNotification(
    companyId: string,
    incidentId: string,
    userId: string,
    notificationType: 'hmrc' | 'ico' | 'management' | 'users'
  ): Promise<void> {
    const incidentRef = ref(db, `${this.basePath}/${companyId}/${incidentId}`);
    const now = Date.now();

    const updates: Partial<SecurityIncidentReport> = {
      updatedAt: now,
      updatedBy: userId,
    };

    switch (notificationType) {
      case 'hmrc':
        updates.hmrcNotified = true;
        updates.hmrcNotifiedAt = now;
        break;
      case 'ico':
        updates.icoNotified = true;
        updates.icoNotifiedAt = now;
        break;
      case 'management':
        updates.managementNotified = true;
        updates.managementNotifiedAt = now;
        break;
      case 'users':
        updates.usersNotified = true;
        updates.usersNotifiedAt = now;
        break;
    }

    await update(incidentRef, updates);
    await this.addAuditLog(companyId, incidentId, userId, `Notified ${notificationType}`);
  }

  /**
   * Get incident by ID
   */
  async getIncident(companyId: string, incidentId: string): Promise<SecurityIncidentReport | null> {
    const incidentRef = ref(db, `${this.basePath}/${companyId}/${incidentId}`);
    const snapshot = await get(incidentRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val() as SecurityIncidentReport;
  }

  /**
   * Get all incidents for a company
   */
  async getIncidents(
    companyId: string,
    options: {
      status?: IncidentStatus;
      severity?: IncidentSeverity;
      incidentType?: SecurityIncidentType;
      startDate?: number;
      endDate?: number;
      limit?: number;
    } = {}
  ): Promise<SecurityIncidentReport[]> {
    const incidentsRef = ref(db, `${this.basePath}/${companyId}`);
    const incidentsQuery = query(incidentsRef, orderByChild('reportedAt'));
    const snapshot = await get(incidentsQuery);

    if (!snapshot.exists()) {
      return [];
    }

    const incidents: SecurityIncidentReport[] = [];
    snapshot.forEach((child) => {
      const incident = child.val() as SecurityIncidentReport;

      // Apply filters
      if (options.status && incident.status !== options.status) return;
      if (options.severity && incident.severity !== options.severity) return;
      if (options.incidentType && incident.incidentType !== options.incidentType) return;
      if (options.startDate && incident.reportedAt < options.startDate) return;
      if (options.endDate && incident.reportedAt > options.endDate) return;

      incidents.push(incident);
    });

    // Sort by most recent first
    incidents.sort((a, b) => b.reportedAt - a.reportedAt);

    if (options.limit) {
      return incidents.slice(0, options.limit);
    }

    return incidents;
  }

  /**
   * Get open incidents (not resolved or closed)
   */
  async getOpenIncidents(companyId: string): Promise<SecurityIncidentReport[]> {
    const incidents = await this.getIncidents(companyId);

    return incidents.filter(
      (i) => !['resolved', 'closed', 'false_positive'].includes(i.status)
    );
  }

  /**
   * Get critical/high priority incidents
   */
  async getCriticalIncidents(companyId: string): Promise<SecurityIncidentReport[]> {
    const openIncidents = await this.getOpenIncidents(companyId);

    return openIncidents.filter(
      (i) => i.severity === 'critical' || i.severity === 'high'
    );
  }

  /**
   * Get incident statistics
   */
  async getStatistics(companyId: string): Promise<{
    total: number;
    open: number;
    resolved: number;
    critical: number;
    high: number;
    averageResolutionHours: number;
    byType: Record<SecurityIncidentType, number>;
    byMonth: Record<string, number>;
  }> {
    const incidents = await this.getIncidents(companyId);

    const stats = {
      total: incidents.length,
      open: 0,
      resolved: 0,
      critical: 0,
      high: 0,
      averageResolutionHours: 0,
      byType: {} as Record<SecurityIncidentType, number>,
      byMonth: {} as Record<string, number>,
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    for (const incident of incidents) {
      // Status counts
      if (['resolved', 'closed', 'false_positive'].includes(incident.status)) {
        stats.resolved++;
        if (incident.resolvedAt && incident.reportedAt) {
          totalResolutionTime += incident.resolvedAt - incident.reportedAt;
          resolvedCount++;
        }
      } else {
        stats.open++;
      }

      // Severity counts
      if (incident.severity === 'critical') stats.critical++;
      if (incident.severity === 'high') stats.high++;

      // By type
      stats.byType[incident.incidentType] = (stats.byType[incident.incidentType] || 0) + 1;

      // By month
      const month = new Date(incident.reportedAt).toISOString().substring(0, 7);
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
    }

    if (resolvedCount > 0) {
      stats.averageResolutionHours = Math.round(totalResolutionTime / resolvedCount / (60 * 60 * 1000));
    }

    return stats;
  }

  /**
   * Escalate incident to data breach
   */
  private async escalateToDataBreach(
    companyId: string,
    incident: SecurityIncidentReport
  ): Promise<void> {
    try {
      const breach = await dataBreachService.reportBreach(
        companyId,
        incident.reporterId || 'system',
        {
          title: incident.title,
          description: incident.description,
          severity: incident.severity === 'critical' ? 'critical' : incident.severity === 'high' ? 'high' : 'medium',
          dataCategories: incident.affectedSystems || ['personal_data'],
          estimatedRecordsAffected: incident.affectedUsers || 0,
          riskToIndividuals: incident.severity === 'critical' ? 'highly_likely' : 'possible',
          potentialConsequences: ['unauthorized_access', 'data_exposure'],
        }
      );

      // Link the breach to the incident
      const incidentRef = ref(db, `${this.basePath}/${companyId}/${incident.id}`);
      await update(incidentRef, {
        dataBreachId: breach.id,
        updatedAt: Date.now(),
      });

      console.log(`[SecurityIncidentService] Escalated incident ${incident.id} to data breach ${breach.id}`);
    } catch (error) {
      console.error(`[SecurityIncidentService] Failed to escalate to data breach:`, error);
    }
  }

  /**
   * Classify severity based on incident type
   */
  private classifySeverity(incidentType: SecurityIncidentType, dataInvolved?: boolean): IncidentSeverity {
    const criticalTypes: SecurityIncidentType[] = ['data_breach', 'system_compromise', 'malware'];
    const highTypes: SecurityIncidentType[] = ['unauthorized_access', 'account_compromise', 'insider_threat'];
    const mediumTypes: SecurityIncidentType[] = ['phishing', 'denial_of_service', 'vulnerability'];

    if (criticalTypes.includes(incidentType)) return 'critical';
    if (highTypes.includes(incidentType)) return dataInvolved ? 'critical' : 'high';
    if (mediumTypes.includes(incidentType)) return dataInvolved ? 'high' : 'medium';

    return dataInvolved ? 'medium' : 'low';
  }

  /**
   * Check if incident type typically involves personal data
   */
  private isPersonalDataIncident(incidentType: SecurityIncidentType): boolean {
    const personalDataTypes: SecurityIncidentType[] = [
      'data_breach',
      'unauthorized_access',
      'account_compromise',
      'insider_threat',
      'data_loss',
    ];
    return personalDataTypes.includes(incidentType);
  }

  /**
   * Add audit log entry
   */
  private async addAuditLog(
    companyId: string,
    incidentId: string,
    userId: string,
    description: string
  ): Promise<void> {
    const auditLog = await auditTrailService.logSecurityEvent(userId, companyId, 'login_success', {
      success: true,
      description,
      metadata: { incidentId },
    });

    // Add audit log ID to incident
    const incidentRef = ref(db, `${this.basePath}/${companyId}/${incidentId}`);
    const snapshot = await get(incidentRef);

    if (snapshot.exists()) {
      const incident = snapshot.val() as SecurityIncidentReport;
      await update(incidentRef, {
        auditLogIds: [...(incident.auditLogIds || []), auditLog.id],
      });
    }
  }
}

// Export singleton instance
export const securityIncidentService = new SecurityIncidentService();
