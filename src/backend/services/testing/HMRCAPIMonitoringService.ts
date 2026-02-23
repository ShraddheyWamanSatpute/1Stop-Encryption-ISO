/**
 * HMRC API Monitoring Service
 *
 * Monitors HMRC API changes and deprecation notices.
 * HMRC provides 6 months notice before breaking changes.
 *
 * Features:
 * - Track API versions and deprecation dates
 * - Monitor HMRC Developer Hub announcements
 * - Alert on upcoming breaking changes
 * - Track API health and availability
 *
 * Reference: https://developer.service.hmrc.gov.uk/api-documentation
 */

import { ref, push, set, get, update, query, orderByChild } from 'firebase/database';
import { db } from '../Firebase';

/**
 * API Status Types
 */
export type APIStatus =
  | 'stable'       // Current production version
  | 'beta'         // Beta testing
  | 'deprecated'   // Marked for removal
  | 'retired'      // No longer available
  | 'maintenance'; // Temporarily unavailable

/**
 * Change Type
 */
export type ChangeType =
  | 'breaking'         // Breaking change requiring code updates
  | 'deprecation'      // Feature being deprecated
  | 'new_feature'      // New functionality added
  | 'security_update'  // Security-related change
  | 'bug_fix'          // Bug fix
  | 'documentation';   // Documentation update only

/**
 * HMRC API Definition
 */
export interface HMRCAPIDefinition {
  id: string;
  name: string;
  description: string;
  currentVersion: string;
  status: APIStatus;

  // Endpoints
  sandboxBaseUrl: string;
  productionBaseUrl: string;

  // Version history
  versions: {
    version: string;
    status: APIStatus;
    releaseDate: number;
    deprecationDate?: number;
    retirementDate?: number;
    changes?: string;
  }[];

  // Scopes required
  requiredScopes: string[];

  // Documentation
  documentationUrl: string;
  changelogUrl?: string;

  // Monitoring
  lastChecked: number;
  lastHealthCheck?: {
    timestamp: number;
    healthy: boolean;
    responseTimeMs?: number;
    error?: string;
  };
}

/**
 * API Change Notice
 */
export interface APIChangeNotice {
  id: string;
  apiId: string;
  apiName: string;

  // Change details
  changeType: ChangeType;
  title: string;
  description: string;

  // Timeline
  announcedDate: number;
  effectiveDate: number;

  // Impact
  breakingChange: boolean;
  affectedVersions: string[];
  affectedEndpoints?: string[];

  // Required actions
  requiredActions: string[];
  migrationGuideUrl?: string;

  // Status
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;

  // Resolution
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
  resolutionNotes?: string;

  // Metadata
  createdAt: number;
  source: 'manual' | 'automated' | 'hmrc_announcement';
}

/**
 * Health Check Result
 */
export interface APIHealthCheckResult {
  apiId: string;
  apiName: string;
  environment: 'sandbox' | 'production';
  timestamp: number;
  healthy: boolean;
  responseTimeMs?: number;
  statusCode?: number;
  error?: string;
}

/**
 * Monitoring Alert
 */
export interface MonitoringAlert {
  id: string;
  type: 'deprecation_warning' | 'breaking_change' | 'health_issue' | 'version_update';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  apiId?: string;
  changeNoticeId?: string;
  daysUntilDeadline?: number;
  createdAt: number;
  dismissed: boolean;
  dismissedAt?: number;
  dismissedBy?: string;
}

/**
 * Standard HMRC APIs used in payroll
 */
export const HMRC_PAYROLL_APIS: Omit<HMRCAPIDefinition, 'id' | 'lastChecked'>[] = [
  {
    name: 'Real Time Information (RTI)',
    description: 'Submit payroll data to HMRC in real time',
    currentVersion: '2.0',
    status: 'stable',
    sandboxBaseUrl: 'https://test-api.service.hmrc.gov.uk',
    productionBaseUrl: 'https://api.service.hmrc.gov.uk',
    versions: [
      { version: '2.0', status: 'stable', releaseDate: Date.now() - 365 * 24 * 60 * 60 * 1000 },
      { version: '1.0', status: 'retired', releaseDate: Date.now() - 730 * 24 * 60 * 60 * 1000, retirementDate: Date.now() - 180 * 24 * 60 * 60 * 1000 },
    ],
    requiredScopes: ['write:real-time-information'],
    documentationUrl: 'https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/real-time-information/2.0',
  },
  {
    name: 'Employment PAYE',
    description: 'Access employment and PAYE data',
    currentVersion: '1.0',
    status: 'stable',
    sandboxBaseUrl: 'https://test-api.service.hmrc.gov.uk',
    productionBaseUrl: 'https://api.service.hmrc.gov.uk',
    versions: [
      { version: '1.0', status: 'stable', releaseDate: Date.now() - 365 * 24 * 60 * 60 * 1000 },
    ],
    requiredScopes: ['read:employment-paye'],
    documentationUrl: 'https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/employment-paye/1.0',
  },
  {
    name: 'National Insurance',
    description: 'Access National Insurance data',
    currentVersion: '1.0',
    status: 'stable',
    sandboxBaseUrl: 'https://test-api.service.hmrc.gov.uk',
    productionBaseUrl: 'https://api.service.hmrc.gov.uk',
    versions: [
      { version: '1.0', status: 'stable', releaseDate: Date.now() - 365 * 24 * 60 * 60 * 1000 },
    ],
    requiredScopes: ['read:national-insurance'],
    documentationUrl: 'https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/national-insurance/1.0',
  },
  {
    name: 'Create Test User',
    description: 'Create test users for sandbox testing',
    currentVersion: '1.0',
    status: 'stable',
    sandboxBaseUrl: 'https://test-api.service.hmrc.gov.uk',
    productionBaseUrl: '', // Sandbox only
    versions: [
      { version: '1.0', status: 'stable', releaseDate: Date.now() - 730 * 24 * 60 * 60 * 1000 },
    ],
    requiredScopes: ['write:api-platform-test-user'],
    documentationUrl: 'https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/api-platform-test-user/1.0',
  },
];

/**
 * HMRC API Monitoring Service
 */
export class HMRCAPIMonitoringService {
  private apisPath: string;
  private changesPath: string;
  private healthPath: string;
  private alertsPath: string;

  constructor() {
    this.apisPath = 'hmrc_monitoring/apis';
    this.changesPath = 'hmrc_monitoring/changes';
    this.healthPath = 'hmrc_monitoring/health';
    this.alertsPath = 'hmrc_monitoring/alerts';
  }

  /**
   * Initialize monitoring for standard HMRC APIs
   */
  async initializeAPIs(companyId: string): Promise<HMRCAPIDefinition[]> {
    const apis: HMRCAPIDefinition[] = [];
    const now = Date.now();

    for (const apiDef of HMRC_PAYROLL_APIS) {
      const apiRef = push(ref(db, `${this.apisPath}/${companyId}`));
      const api: HMRCAPIDefinition = {
        ...apiDef,
        id: apiRef.key!,
        lastChecked: now,
      };

      await set(apiRef, api);
      apis.push(api);
    }

    return apis;
  }

  /**
   * Get all monitored APIs
   */
  async getAPIs(companyId: string): Promise<HMRCAPIDefinition[]> {
    const apisRef = ref(db, `${this.apisPath}/${companyId}`);
    const snapshot = await get(apisRef);

    if (!snapshot.exists()) return [];

    const apis: HMRCAPIDefinition[] = [];
    snapshot.forEach(child => {
      apis.push(child.val() as HMRCAPIDefinition);
    });

    return apis;
  }

  /**
   * Record an API change notice
   */
  async recordChangeNotice(
    companyId: string,
    notice: Omit<APIChangeNotice, 'id' | 'createdAt' | 'acknowledged' | 'resolved'>
  ): Promise<APIChangeNotice> {
    const noticeRef = push(ref(db, `${this.changesPath}/${companyId}`));
    const now = Date.now();

    const changeNotice: APIChangeNotice = {
      ...notice,
      id: noticeRef.key!,
      createdAt: now,
      acknowledged: false,
      resolved: false,
    };

    await set(noticeRef, changeNotice);

    // Create alert if breaking change
    if (notice.breakingChange) {
      await this.createAlert(companyId, {
        type: 'breaking_change',
        severity: 'high',
        title: `Breaking Change: ${notice.apiName}`,
        message: notice.description,
        apiId: notice.apiId,
        changeNoticeId: changeNotice.id,
        daysUntilDeadline: Math.ceil((notice.effectiveDate - now) / (24 * 60 * 60 * 1000)),
      });
    }

    return changeNotice;
  }

  /**
   * Get pending change notices
   */
  async getPendingChanges(companyId: string): Promise<APIChangeNotice[]> {
    const changesRef = ref(db, `${this.changesPath}/${companyId}`);
    const snapshot = await get(changesRef);

    if (!snapshot.exists()) return [];

    const changes: APIChangeNotice[] = [];
    const now = Date.now();

    snapshot.forEach(child => {
      const change = child.val() as APIChangeNotice;
      // Include if not resolved and effective date is in the future
      if (!change.resolved && change.effectiveDate > now) {
        changes.push(change);
      }
    });

    // Sort by effective date (earliest first)
    return changes.sort((a, b) => a.effectiveDate - b.effectiveDate);
  }

  /**
   * Get changes requiring action (within 30 days)
   */
  async getUrgentChanges(companyId: string): Promise<APIChangeNotice[]> {
    const pendingChanges = await this.getPendingChanges(companyId);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    return pendingChanges.filter(
      change => change.effectiveDate - now <= thirtyDaysMs && change.breakingChange
    );
  }

  /**
   * Acknowledge a change notice
   */
  async acknowledgeChange(
    companyId: string,
    changeId: string,
    userId: string
  ): Promise<void> {
    const changeRef = ref(db, `${this.changesPath}/${companyId}/${changeId}`);
    const now = Date.now();

    await update(changeRef, {
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: now,
    });
  }

  /**
   * Mark change as resolved
   */
  async resolveChange(
    companyId: string,
    changeId: string,
    userId: string,
    notes: string
  ): Promise<void> {
    const changeRef = ref(db, `${this.changesPath}/${companyId}/${changeId}`);
    const now = Date.now();

    await update(changeRef, {
      resolved: true,
      resolvedAt: now,
      resolvedBy: userId,
      resolutionNotes: notes,
    });
  }

  /**
   * Record health check result
   */
  async recordHealthCheck(
    companyId: string,
    result: Omit<APIHealthCheckResult, 'timestamp'>
  ): Promise<void> {
    const healthRef = push(ref(db, `${this.healthPath}/${companyId}/${result.apiId}`));
    const now = Date.now();

    await set(healthRef, {
      ...result,
      timestamp: now,
    });

    // Update API last health check
    const apis = await this.getAPIs(companyId);
    const api = apis.find(a => a.id === result.apiId);
    if (api) {
      const apiRef = ref(db, `${this.apisPath}/${companyId}/${result.apiId}`);
      await update(apiRef, {
        lastHealthCheck: {
          timestamp: now,
          healthy: result.healthy,
          responseTimeMs: result.responseTimeMs,
          error: result.error,
        },
        lastChecked: now,
      });
    }

    // Create alert if unhealthy
    if (!result.healthy) {
      await this.createAlert(companyId, {
        type: 'health_issue',
        severity: result.environment === 'production' ? 'critical' : 'medium',
        title: `API Health Issue: ${result.apiName}`,
        message: result.error || `${result.apiName} (${result.environment}) is not responding correctly`,
        apiId: result.apiId,
      });
    }
  }

  /**
   * Get health check history
   */
  async getHealthHistory(
    companyId: string,
    apiId: string,
    limit: number = 100
  ): Promise<APIHealthCheckResult[]> {
    const healthRef = ref(db, `${this.healthPath}/${companyId}/${apiId}`);
    const snapshot = await get(healthRef);

    if (!snapshot.exists()) return [];

    const results: APIHealthCheckResult[] = [];
    snapshot.forEach(child => {
      results.push(child.val() as APIHealthCheckResult);
    });

    return results
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Create monitoring alert
   */
  async createAlert(
    companyId: string,
    alert: Omit<MonitoringAlert, 'id' | 'createdAt' | 'dismissed'>
  ): Promise<MonitoringAlert> {
    const alertRef = push(ref(db, `${this.alertsPath}/${companyId}`));
    const now = Date.now();

    const monitoringAlert: MonitoringAlert = {
      ...alert,
      id: alertRef.key!,
      createdAt: now,
      dismissed: false,
    };

    await set(alertRef, monitoringAlert);
    return monitoringAlert;
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(companyId: string): Promise<MonitoringAlert[]> {
    const alertsRef = ref(db, `${this.alertsPath}/${companyId}`);
    const snapshot = await get(alertsRef);

    if (!snapshot.exists()) return [];

    const alerts: MonitoringAlert[] = [];
    snapshot.forEach(child => {
      const alert = child.val() as MonitoringAlert;
      if (!alert.dismissed) {
        alerts.push(alert);
      }
    });

    // Sort by severity (critical first) then by date
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.createdAt - a.createdAt;
    });
  }

  /**
   * Dismiss alert
   */
  async dismissAlert(
    companyId: string,
    alertId: string,
    userId: string
  ): Promise<void> {
    const alertRef = ref(db, `${this.alertsPath}/${companyId}/${alertId}`);
    const now = Date.now();

    await update(alertRef, {
      dismissed: true,
      dismissedAt: now,
      dismissedBy: userId,
    });
  }

  /**
   * Check for upcoming deprecations
   * Returns APIs with deprecation within specified days
   */
  async checkUpcomingDeprecations(
    companyId: string,
    daysAhead: number = 180 // HMRC gives 6 months notice
  ): Promise<{
    api: HMRCAPIDefinition;
    version: string;
    deprecationDate: number;
    daysRemaining: number;
  }[]> {
    const apis = await this.getAPIs(companyId);
    const now = Date.now();
    const cutoffDate = now + (daysAhead * 24 * 60 * 60 * 1000);
    const upcoming: {
      api: HMRCAPIDefinition;
      version: string;
      deprecationDate: number;
      daysRemaining: number;
    }[] = [];

    for (const api of apis) {
      for (const version of api.versions) {
        if (
          version.deprecationDate &&
          version.deprecationDate > now &&
          version.deprecationDate <= cutoffDate
        ) {
          upcoming.push({
            api,
            version: version.version,
            deprecationDate: version.deprecationDate,
            daysRemaining: Math.ceil((version.deprecationDate - now) / (24 * 60 * 60 * 1000)),
          });
        }
      }
    }

    return upcoming.sort((a, b) => a.deprecationDate - b.deprecationDate);
  }

  /**
   * Generate monitoring report
   */
  async generateMonitoringReport(companyId: string): Promise<{
    generatedAt: number;
    apis: {
      total: number;
      healthy: number;
      unhealthy: number;
      deprecated: number;
    };
    changes: {
      pending: number;
      urgent: number;
      breakingChanges: number;
    };
    alerts: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    upcomingDeprecations: number;
  }> {
    const [apis, pendingChanges, urgentChanges, activeAlerts, deprecations] = await Promise.all([
      this.getAPIs(companyId),
      this.getPendingChanges(companyId),
      this.getUrgentChanges(companyId),
      this.getActiveAlerts(companyId),
      this.checkUpcomingDeprecations(companyId),
    ]);

    const healthyApis = apis.filter(a => a.lastHealthCheck?.healthy !== false);
    const unhealthyApis = apis.filter(a => a.lastHealthCheck?.healthy === false);
    const deprecatedApis = apis.filter(a => a.status === 'deprecated');

    return {
      generatedAt: Date.now(),
      apis: {
        total: apis.length,
        healthy: healthyApis.length,
        unhealthy: unhealthyApis.length,
        deprecated: deprecatedApis.length,
      },
      changes: {
        pending: pendingChanges.length,
        urgent: urgentChanges.length,
        breakingChanges: pendingChanges.filter(c => c.breakingChange).length,
      },
      alerts: {
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        high: activeAlerts.filter(a => a.severity === 'high').length,
        medium: activeAlerts.filter(a => a.severity === 'medium').length,
        low: activeAlerts.filter(a => a.severity === 'low').length,
      },
      upcomingDeprecations: deprecations.length,
    };
  }
}

// Export singleton instance
export const hmrcAPIMonitoringService = new HMRCAPIMonitoringService();
