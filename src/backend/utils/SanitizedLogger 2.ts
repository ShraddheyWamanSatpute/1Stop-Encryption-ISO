/**
 * Sanitized Logger
 *
 * Provides logging utilities that automatically sanitize PII
 * to comply with UK GDPR and HMRC requirements.
 *
 * Features:
 * - Automatic PII detection and masking
 * - Structured logging format
 * - Log levels (debug, info, warn, error)
 * - Context tagging for filtering
 *
 * Reference: ICO GDPR Guidance - Avoid storing PII unnecessarily
 */

// PII patterns to detect and mask
const PII_PATTERNS = {
  // UK National Insurance Number (e.g., AB123456C)
  niNumber: /\b[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]\b/gi,

  // PAYE Reference (e.g., 123/AB45678)
  payeRef: /\b\d{3}\/[A-Z]{1,2}\d{4,6}\b/gi,

  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // UK Phone numbers
  phone: /\b(?:(?:\+44\s?|0)(?:\d\s?){9,10})\b/g,

  // UK Postcode
  postcode: /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/gi,

  // Credit/Debit card numbers (13-19 digits)
  cardNumber: /\b(?:\d[ -]*?){13,19}\b/g,

  // UK Sort code
  sortCode: /\b\d{2}[-\s]?\d{2}[-\s]?\d{2}\b/g,

  // Bank account number (8 digits)
  bankAccount: /\b\d{8}\b/g,

  // Date of birth patterns (various formats)
  dob: /\b(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\b/g,

  // IP addresses
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,

  // UTR (Unique Taxpayer Reference) - 10 digits
  utr: /\b\d{10}\b/g,

  // VAT number
  vatNumber: /\bGB\s?\d{9}(?:\d{3})?\b/gi,

  // Access tokens / Bearer tokens
  accessToken: /Bearer\s+[A-Za-z0-9\-_]+\.?[A-Za-z0-9\-_]*\.?[A-Za-z0-9\-_]*/gi,

  // Generic token patterns
  genericToken: /\b(?:token|key|secret|password|credential)[=:]\s*[^\s,}]+/gi,
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  module?: string
  action?: string
  userId?: string
  companyId?: string
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  sanitized: boolean
}

/**
 * Sanitized Logger Class
 */
export class SanitizedLogger {
  private module: string
  private enabled: boolean
  private minLevel: LogLevel

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  }

  constructor(module: string, options?: { enabled?: boolean; minLevel?: LogLevel }) {
    this.module = module
    this.enabled = options?.enabled ?? true
    this.minLevel = options?.minLevel ?? 'info'
  }

  /**
   * Debug level log
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  /**
   * Info level log
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  /**
   * Warning level log
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  /**
   * Error level log
   */
  error(message: string, context?: LogContext, error?: Error): void {
    const contextWithError = {
      ...context,
      errorMessage: error?.message ? this.sanitize(error.message) : undefined,
      errorName: error?.name,
      // Don't include stack traces in production as they may contain PII
      // errorStack: error?.stack ? this.sanitize(error.stack) : undefined,
    }
    this.log('error', message, contextWithError)
  }

  /**
   * Main log method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.enabled) return
    if (this.levelPriority[level] < this.levelPriority[this.minLevel]) return

    const sanitizedMessage = this.sanitize(message)
    const sanitizedContext = context ? this.sanitizeContext(context) : undefined

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: sanitizedMessage,
      context: {
        module: this.module,
        ...sanitizedContext,
      },
      sanitized: true,
    }

    // Output to console based on level
    const logFn = level === 'error' ? console.error :
      level === 'warn' ? console.warn :
        level === 'debug' ? console.debug : console.log

    // Structured log format: [TIMESTAMP] [LEVEL] [MODULE] Message {context}
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${this.module}]`

    if (sanitizedContext && Object.keys(sanitizedContext).length > 0) {
      logFn(`${prefix} ${sanitizedMessage}`, sanitizedContext)
    } else {
      logFn(`${prefix} ${sanitizedMessage}`)
    }
  }

  /**
   * Sanitize a string by masking PII
   */
  sanitize(text: string): string {
    if (!text) return text

    let sanitized = text

    // Apply all PII patterns
    for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
      sanitized = sanitized.replace(pattern, (match) => {
        return this.maskValue(match, type)
      })
    }

    return sanitized
  }

  /**
   * Sanitize an object/context by masking PII in all string values
   */
  sanitizeContext(context: LogContext): LogContext {
    const sanitized: LogContext = {}

    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'string') {
        // Check if key indicates sensitive data
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]'
        } else {
          sanitized[key] = this.sanitize(value)
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeContext(value as LogContext)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  /**
   * Mask a value based on its type
   */
  private maskValue(value: string, type: string): string {
    switch (type) {
      case 'niNumber':
        // Show first 2 chars: AB****C
        return value.substring(0, 2) + '****' + value.slice(-1)

      case 'payeRef': {
        // Show first 3 digits and last 2: 123/***78
        const slashIdx = value.indexOf('/')
        if (slashIdx >= 0) {
          return value.substring(0, slashIdx + 1) + '***' + value.slice(-2)
        }
        return '***'
      }

      case 'email': {
        // Mask local part: j***e@domain.com
        const [local, domain] = value.split('@')
        if (local && domain) {
          const maskedLocal = local.length > 2 ?
            local[0] + '***' + local[local.length - 1] : '***'
          return `${maskedLocal}@${domain}`
        }
        return '***@***.***'
      }

      case 'phone':
        // Show last 4 digits: ***6789
        return '***' + value.slice(-4)

      case 'postcode':
        // Show outward code only: SW1A ***
        return value.split(' ')[0] + ' ***'

      case 'cardNumber':
        // Show last 4 digits: ****1234
        return '****' + value.replace(/\D/g, '').slice(-4)

      case 'sortCode':
        // Mask all: **-**-**
        return '**-**-**'

      case 'bankAccount':
        // Show last 4 digits: ****5678
        return '****' + value.slice(-4)

      case 'dob': {
        // Show year only: ****/**/**
        const year = value.match(/\d{4}/)
        return year ? `${year[0]}-**-**` : '****-**-**'
      }

      case 'ipAddress': {
        // Mask last two octets: 192.168.xxx.xxx
        const parts = value.split('.')
        if (parts.length === 4) {
          return `${parts[0]}.${parts[1]}.xxx.xxx`
        }
        return 'xxx.xxx.xxx.xxx'
      }

      case 'utr':
      case 'vatNumber':
        // Show first 3 and last 2: 123****67
        return value.substring(0, 3) + '****' + value.slice(-2)

      case 'accessToken':
      case 'genericToken':
        return '[REDACTED_TOKEN]'

      default:
        return '[REDACTED]'
    }
  }

  /**
   * Check if a key name indicates sensitive data
   */
  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password',
      'secret',
      'token',
      'apiKey',
      'api_key',
      'accessToken',
      'access_token',
      'refreshToken',
      'refresh_token',
      'credential',
      'authorization',
      'auth',
      'niNumber',
      'ni_number',
      'nationalInsurance',
      'national_insurance',
      'bankAccount',
      'bank_account',
      'sortCode',
      'sort_code',
      'cardNumber',
      'card_number',
      'cvv',
      'cvc',
      'pin',
      'ssn',
      'socialSecurity',
    ]

    const lowerKey = key.toLowerCase()
    return sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive.toLowerCase()))
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalModule: string): SanitizedLogger {
    return new SanitizedLogger(`${this.module}:${additionalModule}`, {
      enabled: this.enabled,
      minLevel: this.minLevel,
    })
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level
  }
}

/**
 * Create a logger instance for a specific module
 */
export function createLogger(module: string, options?: { enabled?: boolean; minLevel?: LogLevel }): SanitizedLogger {
  return new SanitizedLogger(module, options)
}

/**
 * Pre-configured loggers for common modules
 */
export const loggers = {
  hmrc: createLogger('HMRC'),
  auth: createLogger('Auth'),
  payroll: createLogger('Payroll'),
  gdpr: createLogger('GDPR'),
  api: createLogger('API'),
  database: createLogger('Database'),
  security: createLogger('Security'),
}

/**
 * Quick sanitize function for ad-hoc use
 */
export function sanitize(text: string): string {
  const tempLogger = new SanitizedLogger('Sanitize')
  return tempLogger.sanitize(text)
}

/**
 * Sanitize an object
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const tempLogger = new SanitizedLogger('Sanitize')
  return tempLogger.sanitizeContext(obj as LogContext) as T
}
