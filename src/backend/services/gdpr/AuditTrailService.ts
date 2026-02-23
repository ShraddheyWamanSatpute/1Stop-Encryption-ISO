/**
 * Audit Trail Service
 *
 * Tracks all sensitive data operations for GDPR and HMRC compliance.
 * - Records data access, modifications, and exports
 * - Tracks HMRC submissions
 * - Maintains security event logs
 * - Supports compliance reporting
 *
 * Reference: ICO Accountability, HMRC Record Keeping Requirements
 */

import { ref, push, set, get, query, orderByChild, startAt, endAt, limitToLast } from 'firebase/database';
import { db } from '../Firebase';
import { AuditLogEntry, AuditAction } from './types';

// Retention periods (ISO 27001 A.12, SOC 2 CC7)
const DEFAULT_RETENTION_DAYS = 6 * 365; // HMRC/Financial: 6 years
export const ADMIN_AUDIT_RETENTION_DAYS = 24 * 30; // Admin actions: 24 months
export const SENSITIVE_ACCESS_RETENTION_DAYS = 24 * 30; // Sensitive access: 24 months

export class AuditTrailService {
  private basePath: string;

  constructor() {
    this.basePath = 'auditLogs';
  }

  /**
   * Log an audit event
   */
  async log(
    action: AuditAction,
    userId: string,
    companyId: string,
    options: {
      resourceType: string;
      resourceId?: string;
      resourceName?: string;
      description: string;
      siteId?: string;
      subsiteId?: string;
      previousValue?: unknown;
      newValue?: unknown;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
      requestId?: string;
      success?: boolean;
      errorCode?: string;
      errorMessage?: string;
      userEmail?: string;
      userRole?: string;
      retentionPeriod?: number;
    }
  ): Promise<AuditLogEntry> {
    const logRef = push(ref(db, `${this.basePath}/${companyId}`));
    const now = Date.now();
    const retentionDays = options.retentionPeriod || DEFAULT_RETENTION_DAYS;

    const entry: AuditLogEntry = {
      id: logRef.key!,
      timestamp: now,
      action,
      userId,
      userEmail: options.userEmail ? this.maskEmail(options.userEmail) : undefined,
      userRole: options.userRole,
      companyId,
      siteId: options.siteId,
      subsiteId: options.subsiteId,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      resourceName: options.resourceName,
      description: options.description,
      previousValue: options.previousValue ? this.sanitizeValue(options.previousValue) : undefined,
      newValue: options.newValue ? this.sanitizeValue(options.newValue) : undefined,
      metadata: options.metadata,
      ipAddress: options.ipAddress ? this.maskIpAddress(options.ipAddress) : undefined,
      userAgent: options.userAgent?.substring(0, 100),
      requestId: options.requestId,
      success: options.success !== false,
      errorCode: options.errorCode,
      errorMessage: options.errorMessage,
      retentionPeriod: retentionDays,
      expiresAt: now + retentionDays * 24 * 60 * 60 * 1000,
    };

    await set(logRef, entry);
    return entry;
  }

  /**
   * Log HMRC submission event
   */
  async logHMRCSubmission(
    userId: string,
    companyId: string,
    submissionType: 'FPS' | 'EPS' | 'EYU',
    options: {
      success: boolean;
      correlationId?: string;
      errorCode?: string;
      errorMessage?: string;
      siteId?: string;
      subsiteId?: string;
      ipAddress?: string;
      userAgent?: string;
      employerRef?: string; // Will be masked
    }
  ): Promise<AuditLogEntry> {
    const action = `hmrc_${submissionType.toLowerCase()}_submit` as AuditAction;

    return this.log(action, userId, companyId, {
      resourceType: 'hmrc_submission',
      resourceId: options.correlationId,
      description: `${submissionType} submission to HMRC ${options.success ? 'accepted' : 'rejected'}`,
      siteId: options.siteId,
      subsiteId: options.subsiteId,
      success: options.success,
      errorCode: options.errorCode,
      errorMessage: options.errorMessage,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      metadata: {
        submissionType,
        correlationId: options.correlationId,
        employerRef: options.employerRef ? this.maskPAYEReference(options.employerRef) : undefined,
      },
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    userId: string,
    companyId: string,
    resourceType: string,
    resourceId: string,
    options: {
      action?: 'data_view' | 'data_export' | 'data_download';
      resourceName?: string;
      siteId?: string;
      subsiteId?: string;
      ipAddress?: string;
      userAgent?: string;
      userEmail?: string;
      userRole?: string;
    } = {}
  ): Promise<AuditLogEntry> {
    return this.log(options.action || 'data_view', userId, companyId, {
      resourceType,
      resourceId,
      resourceName: options.resourceName,
      description: `User accessed ${resourceType} record`,
      siteId: options.siteId,
      subsiteId: options.subsiteId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      userEmail: options.userEmail,
      userRole: options.userRole,
    });
  }

  /**
   * Log data modification event
   */
  async logDataModification(
    userId: string,
    companyId: string,
    action: 'data_create' | 'data_update' | 'data_delete',
    resourceType: string,
    resourceId: string,
    options: {
      resourceName?: string;
      previousValue?: unknown;
      newValue?: unknown;
      description?: string;
      siteId?: string;
      subsiteId?: string;
      ipAddress?: string;
      userAgent?: string;
      userEmail?: string;
      userRole?: string;
    } = {}
  ): Promise<AuditLogEntry> {
    const actionVerb = action === 'data_create' ? 'created' : action === 'data_update' ? 'updated' : 'deleted';

    return this.log(action, userId, companyId, {
      resourceType,
      resourceId,
      resourceName: options.resourceName,
      description: options.description || `User ${actionVerb} ${resourceType} record`,
      previousValue: options.previousValue,
      newValue: options.newValue,
      siteId: options.siteId,
      subsiteId: options.subsiteId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      userEmail: options.userEmail,
      userRole: options.userRole,
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    userId: string,
    companyId: string,
    action: AuditAction,
    options: {
      success: boolean;
      description: string;
      ipAddress?: string;
      userAgent?: string;
      errorCode?: string;
      errorMessage?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<AuditLogEntry> {
    return this.log(action, userId, companyId, {
      resourceType: 'security',
      description: options.description,
      success: options.success,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      errorCode: options.errorCode,
      errorMessage: options.errorMessage,
      metadata: options.metadata,
      // Security events retained longer
      retentionPeriod: 7 * 365, // 7 years
    });
  }

  /**
   * Get audit logs for a company
   */
  async getLogs(
    companyId: string,
    options: {
      startDate?: number;
      endDate?: number;
      limit?: number;
      action?: AuditAction;
      userId?: string;
      resourceType?: string;
    } = {}
  ): Promise<AuditLogEntry[]> {
    const logRef = ref(db, `${this.basePath}/${companyId}`);
    let logQuery = query(logRef, orderByChild('timestamp'));

    if (options.startDate) {
      logQuery = query(logQuery, startAt(options.startDate));
    }
    if (options.endDate) {
      logQuery = query(logQuery, endAt(options.endDate));
    }
    if (options.limit) {
      logQuery = query(logQuery, limitToLast(options.limit));
    }

    const snapshot = await get(logQuery);

    if (!snapshot.exists()) return [];

    const logs: AuditLogEntry[] = [];
    snapshot.forEach((child) => {
      const log = child.val() as AuditLogEntry;

      // Apply additional filters
      if (options.action && log.action !== options.action) return;
      if (options.userId && log.userId !== options.userId) return;
      if (options.resourceType && log.resourceType !== options.resourceType) return;

      logs.push(log);
    });

    return logs.reverse(); // Most recent first
  }

  /**
   * Get HMRC submission logs
   */
  async getHMRCSubmissionLogs(
    companyId: string,
    options: {
      startDate?: number;
      endDate?: number;
      limit?: number;
    } = {}
  ): Promise<AuditLogEntry[]> {
    const allLogs = await this.getLogs(companyId, options);

    return allLogs.filter(
      (log) =>
        log.action === 'hmrc_fps_submit' ||
        log.action === 'hmrc_eps_submit' ||
        log.action === 'hmrc_eyu_submit'
    );
  }

  /**
   * Get security event logs
   */
  async getSecurityLogs(
    companyId: string,
    options: {
      startDate?: number;
      endDate?: number;
      limit?: number;
      includeFailedOnly?: boolean;
    } = {}
  ): Promise<AuditLogEntry[]> {
    const allLogs = await this.getLogs(companyId, options);

    const securityActions: AuditAction[] = [
      'login_success',
      'login_failure',
      'password_change',
      'mfa_enable',
      'mfa_disable',
      'user_invite',
      'user_remove',
      'role_change',
      'permission_change',
    ];

    return allLogs.filter((log) => {
      if (!securityActions.includes(log.action)) return false;
      if (options.includeFailedOnly && log.success) return false;
      return true;
    });
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(
    companyId: string,
    userId: string,
    options: {
      startDate?: number;
      endDate?: number;
      limit?: number;
    } = {}
  ): Promise<AuditLogEntry[]> {
    return this.getLogs(companyId, {
      ...options,
      userId,
    });
  }

  /**
   * Export audit logs for compliance reporting
   */
  async exportLogs(
    companyId: string,
    options: {
      startDate?: number;
      endDate?: number;
      format?: 'json' | 'csv';
    } = {}
  ): Promise<{ data: string; exportedAt: number; recordCount: number }> {
    const logs = await this.getLogs(companyId, {
      startDate: options.startDate,
      endDate: options.endDate,
    });

    // Log the export action
    await this.log('data_export', 'system', companyId, {
      resourceType: 'audit_logs',
      description: `Exported ${logs.length} audit log entries`,
      metadata: {
        startDate: options.startDate,
        endDate: options.endDate,
        format: options.format || 'json',
      },
    });

    if (options.format === 'csv') {
      const headers = [
        'timestamp',
        'action',
        'userId',
        'resourceType',
        'resourceId',
        'description',
        'success',
        'errorCode',
      ];

      const csvRows = [headers.join(',')];
      for (const log of logs) {
        const row = [
          new Date(log.timestamp).toISOString(),
          log.action,
          log.userId,
          log.resourceType,
          log.resourceId || '',
          `"${log.description.replace(/"/g, '""')}"`,
          log.success.toString(),
          log.errorCode || '',
        ];
        csvRows.push(row.join(','));
      }

      return {
        data: csvRows.join('\n'),
        exportedAt: Date.now(),
        recordCount: logs.length,
      };
    }

    return {
      data: JSON.stringify(logs, null, 2),
      exportedAt: Date.now(),
      recordCount: logs.length,
    };
  }

  /**
   * Mask email address for compliance
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***@***.***';

    const maskedLocal = local.length > 2 ? local[0] + '***' + local[local.length - 1] : '***';

    return `${maskedLocal}@${domain}`;
  }

  /**
   * Mask IP address for compliance
   */
  private maskIpAddress(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    return ip.substring(0, 10) + '...';
  }

  /**
   * Mask PAYE reference for logging
   */
  private maskPAYEReference(ref: string): string {
    if (!ref || ref.length < 4) return '***';
    return ref.substring(0, 3) + '/***' + ref.slice(-2);
  }

  /**
   * Sanitize value for logging (remove/mask PII)
   */
  private sanitizeValue(value: unknown): string {
    if (value === null || value === undefined) return '';

    const str = typeof value === 'string' ? value : JSON.stringify(value);

    // Truncate long values
    if (str.length > 500) {
      return str.substring(0, 500) + '... [truncated]';
    }

    // Hash if it looks like sensitive data
    const sensitivePatterns = [
      /\b[A-Z]{2}\d{6}[A-Z]\b/i, // NI number
      /\b\d{3}\/[A-Z]{2}\d{5,6}\b/i, // PAYE reference
      /\b\d{16}\b/, // Card number
      /password|secret|token/i,
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(str)) {
        return '[REDACTED - sensitive data]';
      }
    }

    return str;
  }

  /**
   * Clean up expired audit logs (should be run periodically)
   */
  async cleanupExpiredLogs(companyId: string): Promise<number> {
    const logs = await this.getLogs(companyId);
    const now = Date.now();
    let deletedCount = 0;

    for (const log of logs) {
      if (log.expiresAt && log.expiresAt < now) {
        const logRef = ref(db, `${this.basePath}/${companyId}/${log.id}`);
        await set(logRef, null);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      // Log the cleanup action
      await this.log('data_delete', 'system', companyId, {
        resourceType: 'audit_logs',
        description: `Cleaned up ${deletedCount} expired audit log entries`,
        metadata: { deletedCount },
      });
    }

    return deletedCount;
  }
}

// Export singleton instance
export const auditTrailService = new AuditTrailService();
