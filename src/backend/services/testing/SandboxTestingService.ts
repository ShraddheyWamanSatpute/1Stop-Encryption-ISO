/**
 * Sandbox Testing Service
 *
 * Manages automated testing against HMRC sandbox environment.
 * Runs weekly tests to ensure API compatibility and catch issues early.
 *
 * HMRC DevOps Best Practices:
 * - Run automated tests regularly in sandbox
 * - Test all API endpoints
 * - Validate fraud prevention headers
 * - Test OAuth flows
 * - Verify data validation
 *
 * Reference: https://developer.service.hmrc.gov.uk/api-documentation/docs/testing
 */

import { ref, push, set, get, update, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from '../Firebase';

/**
 * Test Types
 */
export type TestType =
  | 'api_endpoint'          // Individual API endpoint test
  | 'oauth_flow'            // OAuth authorization flow
  | 'fraud_prevention'      // Fraud prevention headers
  | 'data_validation'       // Request/response validation
  | 'error_handling'        // Error response handling
  | 'integration'           // End-to-end integration test
  | 'performance'           // Response time and throughput
  | 'regression';           // Regression test suite

/**
 * Test Status
 */
export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'error';

/**
 * Test Schedule Frequency
 */
export type TestFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual';

/**
 * Test Case Definition
 */
export interface TestCase {
  id: string;
  name: string;
  description: string;
  type: TestType;
  apiEndpoint?: string;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';

  // Test configuration
  enabled: boolean;
  frequency: TestFrequency;
  timeout: number; // milliseconds

  // Test data
  testPayload?: object;
  expectedStatusCode?: number;
  expectedResponseFields?: string[];

  // Assertions
  assertions: {
    type: 'status_code' | 'response_time' | 'response_body' | 'header' | 'schema';
    expected: string | number | boolean;
    operator?: 'equals' | 'contains' | 'less_than' | 'greater_than' | 'matches';
  }[];

  // Dependencies
  requiresAuth: boolean;
  dependsOn?: string[]; // Other test IDs that must pass first

  // Metadata
  createdAt: number;
  updatedAt?: number;
  lastRunAt?: number;
  lastStatus?: TestStatus;
}

/**
 * Test Run Result
 */
export interface TestRunResult {
  id: string;
  testCaseId: string;
  testCaseName: string;
  runId: string; // Groups tests in same run

  // Execution
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  status: TestStatus;

  // Request/Response
  request?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: string;
  };
  response?: {
    statusCode: number;
    headers?: Record<string, string>;
    body?: string;
    responseTimeMs: number;
  };

  // Results
  assertions: {
    name: string;
    passed: boolean;
    expected: string;
    actual: string;
    message?: string;
  }[];

  // Error details
  error?: {
    code: string;
    message: string;
    stack?: string;
  };

  // Environment
  environment: 'sandbox';
}

/**
 * Test Run Summary
 */
export interface TestRunSummary {
  id: string;
  companyId: string;
  environment: 'sandbox';

  // Timing
  startedAt: number;
  completedAt?: number;
  durationMs?: number;

  // Results
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  errors: number;

  // Status
  status: 'running' | 'completed' | 'failed' | 'aborted';

  // Trigger
  trigger: 'scheduled' | 'manual' | 'ci_cd' | 'pre_deployment';
  triggeredBy?: string;

  // Details
  failedTests?: string[];
  errorMessages?: string[];
}

/**
 * Test Schedule
 */
export interface TestSchedule {
  id: string;
  companyId: string;
  name: string;
  description: string;

  // Schedule
  frequency: TestFrequency;
  cronExpression?: string; // e.g., "0 2 * * 0" for weekly on Sunday at 2am
  timezone: string;
  enabled: boolean;

  // Test selection
  testTypes?: TestType[];
  specificTestIds?: string[];
  runAllTests: boolean;

  // Notification
  notifyOnFailure: boolean;
  notifyEmails?: string[];

  // Execution
  lastRunAt?: number;
  nextRunAt?: number;
  lastRunStatus?: 'passed' | 'failed';

  // Metadata
  createdAt: number;
  updatedAt?: number;
}

/**
 * Standard HMRC Sandbox Test Cases
 */
export const STANDARD_HMRC_TEST_CASES: Omit<TestCase, 'id' | 'createdAt'>[] = [
  // OAuth Tests
  {
    name: 'OAuth Token Request',
    description: 'Test OAuth 2.0 token acquisition flow',
    type: 'oauth_flow',
    apiEndpoint: '/oauth/token',
    httpMethod: 'POST',
    enabled: true,
    frequency: 'weekly',
    timeout: 30000,
    assertions: [
      { type: 'status_code', expected: 200, operator: 'equals' },
      { type: 'response_body', expected: 'access_token', operator: 'contains' },
      { type: 'response_time', expected: 5000, operator: 'less_than' },
    ],
    requiresAuth: false,
  },
  {
    name: 'OAuth Token Refresh',
    description: 'Test OAuth token refresh flow',
    type: 'oauth_flow',
    apiEndpoint: '/oauth/token',
    httpMethod: 'POST',
    enabled: true,
    frequency: 'weekly',
    timeout: 30000,
    assertions: [
      { type: 'status_code', expected: 200, operator: 'equals' },
      { type: 'response_body', expected: 'refresh_token', operator: 'contains' },
    ],
    requiresAuth: false,
  },

  // Fraud Prevention Header Tests
  {
    name: 'Fraud Prevention Headers Validation',
    description: 'Verify fraud prevention headers are accepted',
    type: 'fraud_prevention',
    apiEndpoint: '/test/fraud-prevention-headers/validate',
    httpMethod: 'POST',
    enabled: true,
    frequency: 'weekly',
    timeout: 10000,
    assertions: [
      { type: 'status_code', expected: 200, operator: 'equals' },
      { type: 'response_body', expected: 'valid', operator: 'contains' },
    ],
    requiresAuth: true,
  },

  // RTI API Tests
  {
    name: 'FPS Submission (Test)',
    description: 'Test Full Payment Submission to sandbox',
    type: 'api_endpoint',
    apiEndpoint: '/organisations/paye/{empRef}/fps',
    httpMethod: 'POST',
    enabled: true,
    frequency: 'weekly',
    timeout: 60000,
    expectedStatusCode: 200,
    assertions: [
      { type: 'status_code', expected: 200, operator: 'equals' },
      { type: 'response_body', expected: 'correlationId', operator: 'contains' },
    ],
    requiresAuth: true,
  },
  {
    name: 'EPS Submission (Test)',
    description: 'Test Employer Payment Summary to sandbox',
    type: 'api_endpoint',
    apiEndpoint: '/organisations/paye/{empRef}/eps',
    httpMethod: 'POST',
    enabled: true,
    frequency: 'weekly',
    timeout: 60000,
    expectedStatusCode: 200,
    assertions: [
      { type: 'status_code', expected: 200, operator: 'equals' },
    ],
    requiresAuth: true,
  },

  // Error Handling Tests
  {
    name: 'Invalid Request Handling',
    description: 'Test error response for invalid request',
    type: 'error_handling',
    apiEndpoint: '/organisations/paye/{empRef}/fps',
    httpMethod: 'POST',
    enabled: true,
    frequency: 'weekly',
    timeout: 10000,
    testPayload: { invalid: 'data' },
    expectedStatusCode: 400,
    assertions: [
      { type: 'status_code', expected: 400, operator: 'equals' },
      { type: 'response_body', expected: 'code', operator: 'contains' },
    ],
    requiresAuth: true,
  },
  {
    name: 'Unauthorized Request Handling',
    description: 'Test error response for missing authorization',
    type: 'error_handling',
    apiEndpoint: '/organisations/paye/{empRef}/fps',
    httpMethod: 'POST',
    enabled: true,
    frequency: 'weekly',
    timeout: 10000,
    expectedStatusCode: 401,
    assertions: [
      { type: 'status_code', expected: 401, operator: 'equals' },
    ],
    requiresAuth: false, // Intentionally no auth to test 401
  },

  // Data Validation Tests
  {
    name: 'NI Number Validation',
    description: 'Test National Insurance number validation',
    type: 'data_validation',
    apiEndpoint: '/test/validate/ni-number',
    httpMethod: 'POST',
    enabled: true,
    frequency: 'weekly',
    timeout: 10000,
    testPayload: { niNumber: 'AB123456C' },
    assertions: [
      { type: 'status_code', expected: 200, operator: 'equals' },
    ],
    requiresAuth: true,
  },

  // Performance Tests
  {
    name: 'API Response Time',
    description: 'Test API responds within acceptable time',
    type: 'performance',
    apiEndpoint: '/organisations/paye/{empRef}',
    httpMethod: 'GET',
    enabled: true,
    frequency: 'weekly',
    timeout: 10000,
    assertions: [
      { type: 'response_time', expected: 3000, operator: 'less_than' },
    ],
    requiresAuth: true,
  },
];

/**
 * Sandbox Testing Service
 */
export class SandboxTestingService {
  private testCasesPath: string;
  private resultsPath: string;
  private runsPath: string;
  private schedulesPath: string;

  constructor() {
    this.testCasesPath = 'testing/test_cases';
    this.resultsPath = 'testing/results';
    this.runsPath = 'testing/runs';
    this.schedulesPath = 'testing/schedules';
  }

  /**
   * Initialize standard test cases
   */
  async initializeStandardTests(companyId: string): Promise<TestCase[]> {
    const testCases: TestCase[] = [];
    const now = Date.now();

    for (const testDef of STANDARD_HMRC_TEST_CASES) {
      const testRef = push(ref(db, `${this.testCasesPath}/${companyId}`));
      const testCase: TestCase = {
        ...testDef,
        id: testRef.key!,
        createdAt: now,
      };

      await set(testRef, testCase);
      testCases.push(testCase);
    }

    return testCases;
  }

  /**
   * Get all test cases
   */
  async getTestCases(companyId: string): Promise<TestCase[]> {
    const testsRef = ref(db, `${this.testCasesPath}/${companyId}`);
    const snapshot = await get(testsRef);

    if (!snapshot.exists()) return [];

    const tests: TestCase[] = [];
    snapshot.forEach(child => {
      tests.push(child.val() as TestCase);
    });

    return tests;
  }

  /**
   * Create a custom test case
   */
  async createTestCase(
    companyId: string,
    testCase: Omit<TestCase, 'id' | 'createdAt'>
  ): Promise<TestCase> {
    const testRef = push(ref(db, `${this.testCasesPath}/${companyId}`));
    const now = Date.now();

    const newTest: TestCase = {
      ...testCase,
      id: testRef.key!,
      createdAt: now,
    };

    await set(testRef, newTest);
    return newTest;
  }

  /**
   * Update test case
   */
  async updateTestCase(
    companyId: string,
    testId: string,
    updates: Partial<TestCase>
  ): Promise<void> {
    const testRef = ref(db, `${this.testCasesPath}/${companyId}/${testId}`);
    await update(testRef, {
      ...updates,
      updatedAt: Date.now(),
    });
  }

  /**
   * Start a test run
   */
  async startTestRun(
    companyId: string,
    options: {
      trigger: TestRunSummary['trigger'];
      triggeredBy?: string;
      testTypes?: TestType[];
      specificTestIds?: string[];
    }
  ): Promise<TestRunSummary> {
    const runRef = push(ref(db, `${this.runsPath}/${companyId}`));
    const now = Date.now();

    // Get applicable tests
    let testCases = await this.getTestCases(companyId);

    // Filter by type if specified
    if (options.testTypes && options.testTypes.length > 0) {
      testCases = testCases.filter(t => options.testTypes!.includes(t.type));
    }

    // Filter by specific IDs if specified
    if (options.specificTestIds && options.specificTestIds.length > 0) {
      testCases = testCases.filter(t => options.specificTestIds!.includes(t.id));
    }

    // Filter to only enabled tests
    testCases = testCases.filter(t => t.enabled);

    const run: TestRunSummary = {
      id: runRef.key!,
      companyId,
      environment: 'sandbox',
      startedAt: now,
      totalTests: testCases.length,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: 0,
      status: 'running',
      trigger: options.trigger,
      triggeredBy: options.triggeredBy,
    };

    await set(runRef, run);
    return run;
  }

  /**
   * Record test result
   */
  async recordTestResult(
    companyId: string,
    runId: string,
    result: Omit<TestRunResult, 'id'>
  ): Promise<TestRunResult> {
    const resultRef = push(ref(db, `${this.resultsPath}/${companyId}/${runId}`));

    const testResult: TestRunResult = {
      ...result,
      id: resultRef.key!,
    };

    await set(resultRef, testResult);

    // Update test case last run
    await this.updateTestCase(companyId, result.testCaseId, {
      lastRunAt: result.completedAt || result.startedAt,
      lastStatus: result.status,
    });

    // Update run summary
    await this.updateRunSummary(companyId, runId, result.status);

    return testResult;
  }

  /**
   * Update run summary with result
   */
  private async updateRunSummary(
    companyId: string,
    runId: string,
    status: TestStatus
  ): Promise<void> {
    const runRef = ref(db, `${this.runsPath}/${companyId}/${runId}`);
    const snapshot = await get(runRef);

    if (!snapshot.exists()) return;

    const run = snapshot.val() as TestRunSummary;
    const updates: Partial<TestRunSummary> = {};

    switch (status) {
      case 'passed':
        updates.passed = (run.passed || 0) + 1;
        break;
      case 'failed':
        updates.failed = (run.failed || 0) + 1;
        break;
      case 'skipped':
        updates.skipped = (run.skipped || 0) + 1;
        break;
      case 'error':
        updates.errors = (run.errors || 0) + 1;
        break;
    }

    await update(runRef, updates);
  }

  /**
   * Complete a test run
   */
  async completeTestRun(
    companyId: string,
    runId: string,
    failedTests?: string[],
    errorMessages?: string[]
  ): Promise<void> {
    const runRef = ref(db, `${this.runsPath}/${companyId}/${runId}`);
    const snapshot = await get(runRef);

    if (!snapshot.exists()) return;

    const run = snapshot.val() as TestRunSummary;
    const now = Date.now();

    await update(runRef, {
      completedAt: now,
      durationMs: now - run.startedAt,
      status: (run.failed || 0) > 0 || (run.errors || 0) > 0 ? 'failed' : 'completed',
      failedTests,
      errorMessages,
    });
  }

  /**
   * Get test run summary
   */
  async getTestRun(companyId: string, runId: string): Promise<TestRunSummary | null> {
    const runRef = ref(db, `${this.runsPath}/${companyId}/${runId}`);
    const snapshot = await get(runRef);

    if (!snapshot.exists()) return null;
    return snapshot.val() as TestRunSummary;
  }

  /**
   * Get test run results
   */
  async getTestRunResults(companyId: string, runId: string): Promise<TestRunResult[]> {
    const resultsRef = ref(db, `${this.resultsPath}/${companyId}/${runId}`);
    const snapshot = await get(resultsRef);

    if (!snapshot.exists()) return [];

    const results: TestRunResult[] = [];
    snapshot.forEach(child => {
      results.push(child.val() as TestRunResult);
    });

    return results;
  }

  /**
   * Get recent test runs
   */
  async getRecentRuns(companyId: string, limit: number = 10): Promise<TestRunSummary[]> {
    const runsRef = ref(db, `${this.runsPath}/${companyId}`);
    const runsQuery = query(runsRef, orderByChild('startedAt'), limitToLast(limit));
    const snapshot = await get(runsQuery);

    if (!snapshot.exists()) return [];

    const runs: TestRunSummary[] = [];
    snapshot.forEach(child => {
      runs.push(child.val() as TestRunSummary);
    });

    return runs.sort((a, b) => b.startedAt - a.startedAt);
  }

  /**
   * Create test schedule
   */
  async createSchedule(
    companyId: string,
    schedule: Omit<TestSchedule, 'id' | 'createdAt'>
  ): Promise<TestSchedule> {
    const scheduleRef = push(ref(db, `${this.schedulesPath}/${companyId}`));
    const now = Date.now();

    const newSchedule: TestSchedule = {
      ...schedule,
      id: scheduleRef.key!,
      companyId,
      createdAt: now,
      nextRunAt: this.calculateNextRun(schedule.frequency, schedule.cronExpression),
    };

    await set(scheduleRef, newSchedule);
    return newSchedule;
  }

  /**
   * Get all schedules
   */
  async getSchedules(companyId: string): Promise<TestSchedule[]> {
    const schedulesRef = ref(db, `${this.schedulesPath}/${companyId}`);
    const snapshot = await get(schedulesRef);

    if (!snapshot.exists()) return [];

    const schedules: TestSchedule[] = [];
    snapshot.forEach(child => {
      schedules.push(child.val() as TestSchedule);
    });

    return schedules;
  }

  /**
   * Create default weekly schedule
   */
  async createDefaultWeeklySchedule(companyId: string): Promise<TestSchedule> {
    return this.createSchedule(companyId, {
      companyId,
      name: 'Weekly HMRC Sandbox Tests',
      description: 'Automated weekly tests against HMRC sandbox environment',
      frequency: 'weekly',
      cronExpression: '0 2 * * 0', // Sunday at 2am
      timezone: 'Europe/London',
      enabled: true,
      runAllTests: true,
      notifyOnFailure: true,
    });
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(frequency: TestFrequency, cronExpression?: string): number {
    const now = Date.now();
    const hour = 2 * 60 * 60 * 1000; // 2am
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;
    const month = 30 * day;

    // Simple calculation based on frequency
    switch (frequency) {
      case 'hourly':
        return now + (60 * 60 * 1000);
      case 'daily':
        return now + day;
      case 'weekly':
        return now + week;
      case 'monthly':
        return now + month;
      case 'manual':
      default:
        return 0; // No scheduled run
    }
  }

  /**
   * Generate test report
   */
  async generateTestReport(companyId: string, runId: string): Promise<{
    summary: TestRunSummary;
    results: TestRunResult[];
    passRate: number;
    averageResponseTime: number;
    failuresByType: Record<string, number>;
  }> {
    const [summary, results] = await Promise.all([
      this.getTestRun(companyId, runId),
      this.getTestRunResults(companyId, runId),
    ]);

    if (!summary) {
      throw new Error('Test run not found');
    }

    const passRate = summary.totalTests > 0
      ? (summary.passed / summary.totalTests) * 100
      : 0;

    const responseTimes = results
      .filter(r => r.response?.responseTimeMs)
      .map(r => r.response!.responseTimeMs);
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const failuresByType: Record<string, number> = {};
    const failedResults = results.filter(r => r.status === 'failed');
    for (const result of failedResults) {
      const testCase = await this.getTestCases(companyId)
        .then(cases => cases.find(c => c.id === result.testCaseId));
      if (testCase) {
        failuresByType[testCase.type] = (failuresByType[testCase.type] || 0) + 1;
      }
    }

    return {
      summary,
      results,
      passRate,
      averageResponseTime,
      failuresByType,
    };
  }
}

// Export singleton instance
export const sandboxTestingService = new SandboxTestingService();
