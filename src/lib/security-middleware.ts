// @ts-nocheck
import { z } from 'zod';
import { validateAndSanitize } from '@/lib/validation';

// Security headers and validation middleware
export class SecurityMiddleware {
  // Rate limiting tracker (in production, use Redis or similar)
  private static rateLimitTracker = new Map<string, { count: number; resetTime: number }>();
  
  // Blocked IPs or patterns (in production, use proper security service)
  private static blockedPatterns = [
    /script/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload/gi,
    /onerror/gi,
    /<script/gi,
    /eval\(/gi,
    /document\.cookie/gi,
    /document\.write/gi,
    /window\.location/gi,
    /document\.location/gi,
  ];

  // SQL injection patterns
  private static sqlInjectionPatterns = [
    /('|(\\')|(;)|(\\;)|(\\|)|(\\*)|(,)|(drop)|(create)|(alter)|(exec)|(execute)|(sp_)|(xp_)|(union)|(select)|(insert)|(delete)|(update)|(or 1=1)|(and 1=1)|(or '1'='1')|(and '1'='1')/gi,
    /(\bOR\b|\bAND\b).*['"=]/gi,
    /UNION.*SELECT/gi,
    /SELECT.*FROM/gi,
    /(INSERT|UPDATE|DELETE).*WHERE/gi,
  ];

  /**
   * Validate and sanitize input against XSS and injection attacks
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Check for blocked patterns
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(input)) {
        console.warn('[Security] Blocked potentially malicious input:', input.substring(0, 100));
        throw new SecurityError('Input contains potentially malicious content');
      }
    }

    // Check for SQL injection patterns
    for (const pattern of this.sqlInjectionPatterns) {
      if (pattern.test(input)) {
        console.warn('[Security] Blocked potential SQL injection:', input.substring(0, 100));
        throw new SecurityError('Input contains potential SQL injection patterns');
      }
    }

    // Basic sanitization
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/&lt;/g, '')
      .replace(/&gt;/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&amp;/g, '&');
  }

  /**
   * Rate limiting check (basic implementation)
   */
  static checkRateLimit(identifier: string, maxRequests = 100, windowMs = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    const record = this.rateLimitTracker.get(identifier);

    if (!record || record.resetTime < windowStart) {
      this.rateLimitTracker.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      console.warn(`[Security] Rate limit exceeded for ${identifier}`);
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Validate request headers for security
   */
  static validateHeaders(headers: Record<string, string>): boolean {
    // Check for required security headers in responses
    const requiredHeaders = ['content-type'];
    
    // Validate Content-Type
    const contentType = headers['content-type'];
    if (contentType && !this.isValidContentType(contentType)) {
      console.warn('[Security] Invalid content type detected:', contentType);
      return false;
    }

    // Check for suspicious user agents
    const userAgent = headers['user-agent'];
    if (userAgent && this.isSuspiciousUserAgent(userAgent)) {
      console.warn('[Security] Suspicious user agent detected:', userAgent);
      return false;
    }

    return true;
  }

  private static isValidContentType(contentType: string): boolean {
    const validTypes = [
      'application/json',
      'text/html',
      'text/plain',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf'
    ];

    return validTypes.some(type => contentType.toLowerCase().includes(type));
  }

  private static isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /hack/i,
      /inject/i,
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /masscan/i,
    ];

    // Allow legitimate bots (Google, Bing, etc.)
    const legitimateBots = [
      /googlebot/i,
      /bingbot/i,
      /slurp/i, // Yahoo
      /duckduckbot/i,
    ];

    if (legitimateBots.some(pattern => pattern.test(userAgent))) {
      return false;
    }

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Validate medical data against healthcare-specific security requirements
   */
  static validateMedicalData(data: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Basic structure validation
      if (typeof data !== 'object' || data === null) {
        errors.push('Medical data must be a valid object');
        return { isValid: false, errors };
      }

      const medicalData = data as Record<string, unknown>;

      // Check for required medical data fields
      const requiredFields = ['patient_id', 'visit_id'];
      for (const field of requiredFields) {
        if (!medicalData[field]) {
          errors.push(`Required field missing: ${field}`);
        }
      }

      // Validate patient ID format (must be UUID)
      if (medicalData.patient_id && typeof medicalData.patient_id === 'string') {
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidPattern.test(medicalData.patient_id)) {
          errors.push('Invalid patient ID format');
        }
      }

      // Check for sensitive data that shouldn't be logged
      const sensitiveFields = ['ssn', 'social_security', 'credit_card', 'password', 'token'];
      for (const field of sensitiveFields) {
        if (medicalData[field]) {
          errors.push(`Sensitive field detected: ${field}`);
        }
      }

      // Validate text fields for length and content
      const textFields = ['diagnosis', 'notes', 'medication', 'procedure'];
      for (const field of textFields) {
        if (medicalData[field] && typeof medicalData[field] === 'string') {
          const value = medicalData[field] as string;
          
          if (value.length > 5000) {
            errors.push(`Field ${field} exceeds maximum length`);
          }

          // Check for potentially malicious content
          try {
            this.sanitizeInput(value);
          } catch (error) {
            errors.push(`Field ${field} contains potentially malicious content`);
          }
        }
      }

      return { isValid: errors.length === 0, errors };

    } catch (error) {
      console.error('[Security] Error validating medical data:', error);
      return { isValid: false, errors: ['Validation error occurred'] };
    }
  }

  /**
   * Log security events for monitoring
   */
  static logSecurityEvent(event: {
    type: 'validation_failed' | 'rate_limit_exceeded' | 'suspicious_activity' | 'blocked_request';
    identifier: string;
    details: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, unknown>;
  }): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: event.type,
      identifier: event.identifier,
      details: event.details,
      severity: event.severity,
      metadata: event.metadata,
    };

    // In production, send to proper logging service (e.g., Sentry, LogRocket, etc.)
    console.warn('[Security Event]', logEntry);

    // For critical events, consider additional alerting
    if (event.severity === 'critical') {
      console.error('[CRITICAL SECURITY ALERT]', logEntry);
      // In production: Send alert to security team, block IP, etc.
    }
  }

  /**
   * Create security response headers
   */
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };
  }
}

// Custom Security Error class
export class SecurityError extends Error {
  constructor(message: string, public readonly code: string = 'SECURITY_VIOLATION') {
    super(message);
    this.name = 'SecurityError';
  }
}

// Validation decorator for functions
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return function (target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      try {
        // Validate first argument (usually the data)
        if (args.length > 0) {
          validateAndSanitize(schema, args[0]);
        }
        return method.apply(this, args);
      } catch (error) {
        SecurityMiddleware.logSecurityEvent({
          type: 'validation_failed',
          identifier: propertyName,
          details: error instanceof Error ? error.message : 'Unknown validation error',
          severity: 'medium',
          metadata: { args: args.length }
        });
        throw error;
      }
    };
  };
}

// Rate limiting decorator
export function rateLimit(maxRequests = 100, windowMs = 60000) {
  return function (target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      const identifier = `${target?.constructor.name || 'unknown'}.${propertyName}`;
      
      if (!SecurityMiddleware.checkRateLimit(identifier, maxRequests, windowMs)) {
        SecurityMiddleware.logSecurityEvent({
          type: 'rate_limit_exceeded',
          identifier,
          details: `Rate limit exceeded: ${maxRequests} requests per ${windowMs}ms`,
          severity: 'high'
        });
        throw new SecurityError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
      }

      return method.apply(this, args);
    };
  };
}