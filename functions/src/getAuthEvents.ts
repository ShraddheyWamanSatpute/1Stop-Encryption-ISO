/**
 * getAuthEvents - Callable Cloud Function for super-admins
 * Reads authEvents from RTDB (Admin SDK only). Clients cannot read authEvents directly.
 * Requires custom claim: auth.token.superAdmin === true
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from './admin';

const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 2000;

interface GetAuthEventsParams {
  limit?: number;
  /** Optional: filter by action */
  action?: 'login_success' | 'login_failure' | 'logout';
  /** Optional: start timestamp (ms) for range query */
  startAt?: number;
  /** Optional: end timestamp (ms) for range query */
  endAt?: number;
}

export const getAuthEvents = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  const superAdmin = request.auth.token?.superAdmin === true;
  if (!superAdmin) {
    throw new HttpsError(
      'permission-denied',
      'Super-admin access required to read auth events'
    );
  }

  const params = (request.data || {}) as GetAuthEventsParams;
  const limit = Math.min(
    typeof params.limit === 'number' ? params.limit : DEFAULT_LIMIT,
    MAX_LIMIT
  );

  const authEventsRef = db.ref('authEvents');
  let query = authEventsRef.orderByChild('timestamp').limitToLast(limit);

  if (params.startAt != null || params.endAt != null) {
    const startAt = typeof params.startAt === 'number' ? params.startAt : 0;
    const endAt = typeof params.endAt === 'number' ? params.endAt : Date.now();
    query = authEventsRef.orderByChild('timestamp').startAt(startAt).endAt(endAt).limitToLast(limit);
  }

  const snapshot = await query.once('value');
  const raw: Record<string, unknown> = snapshot.val() || {};
  let events = Object.entries(raw).map(([id, v]) => ({ id, ...(v as object) }));

  if (params.action && ['login_success', 'login_failure', 'logout'].includes(params.action)) {
    events = events.filter((e) => (e as { action?: string }).action === params.action);
  }

  // Sort by timestamp descending (newest first)
  events.sort((a, b) => {
    const ta = (a as { timestamp?: number }).timestamp ?? 0;
    const tb = (b as { timestamp?: number }).timestamp ?? 0;
    return tb - ta;
  });

  return {
    events,
    count: events.length,
  };
});
