/**
 * Data export audit helper – call after successful CSV/PDF export
 * ISO 27001 A.12, SOC 2 CC7
 */

import { auth } from '../Firebase';
import { auditTrailService } from '../gdpr/AuditTrailService';

const EXPORT_RETENTION_DAYS = 24 * 30; // 24 months

export function logDataExport(
  companyId: string,
  resourceType: string,
  description: string,
  count?: number
): void {
  const uid = auth.currentUser?.uid;
  if (!uid || !companyId) return;
  const desc = count !== undefined ? `${description} (${count} records)` : description;
  auditTrailService
    .log('data_export', uid, companyId, {
      resourceType,
      description: desc,
      retentionPeriod: EXPORT_RETENTION_DAYS,
    })
    .catch(() => {});
}
