import { supabase } from './supabase';
import { toast } from 'sonner';

export interface AuditLogEntry {
  id?: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

export const LOG_LEVELS: LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

class Logger {
  private minLevel: keyof LogLevel = 'INFO';
  private userId: string | null = null;

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  setMinLevel(level: keyof LogLevel) {
    this.minLevel = level;
  }

  private shouldLog(level: keyof LogLevel): boolean {
    const levels: (keyof LogLevel)[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private async captureClientInfo(): Promise<{ ip_address: string; user_agent: string }> {
    // In a real implementation, you might use a service to get the client IP
    // For now, we'll use placeholder values
    return {
      ip_address: '0.0.0.0',
      user_agent: navigator.userAgent
    };
  }

  async log(level: keyof LogLevel, message: string, meta?: Record<string, any>) {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      level,
      message,
      meta,
      timestamp,
      userId: this.userId
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta || '');
    }

    // In production, you might want to send logs to a dedicated logging service
    // For now, we'll just log to console
  }

  async auditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'user_id'>) {
    try {
      const clientInfo = await this.captureClientInfo();
      
      const auditEntry: AuditLogEntry = {
        ...entry,
        user_id: this.userId || undefined,
        timestamp: new Date().toISOString(),
        ip_address: clientInfo.ip_address,
        user_agent: clientInfo.user_agent
      };

      // Insert audit log entry into database
      const { error } = await supabase
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        console.error('Failed to insert audit log:', error);
        // Don't throw error as this shouldn't break the main functionality
      }
    } catch (error) {
      console.error('Error in audit logging:', error);
    }
  }

  debug(message: string, meta?: Record<string, any>) {
    this.log('DEBUG', message, meta);
  }

  info(message: string, meta?: Record<string, any>) {
    this.log('INFO', message, meta);
  }

  warn(message: string, meta?: Record<string, any>) {
    this.log('WARN', message, meta);
  }

  error(message: string, meta?: Record<string, any>) {
    this.log('ERROR', message, meta);
  }
}

export const logger = new Logger();

// Helper function to wrap async operations with audit logging
export async function withAuditLog<T>(
  operation: () => Promise<T>,
  auditInfo: Omit<AuditLogEntry, 'id' | 'timestamp' | 'user_id'>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    
    // Log successful operation
    await logger.auditLog({
      ...auditInfo,
      details: {
        ...auditInfo.details,
        duration: Date.now() - startTime,
        status: 'success'
      }
    });
    
    return result;
  } catch (error) {
    // Log failed operation
    await logger.auditLog({
      ...auditInfo,
      details: {
        ...auditInfo.details,
        duration: Date.now() - startTime,
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      }
    });
    
    // Re-throw the error
    throw error;
  }
}

// Helper function to get client IP (in a real implementation, you might use a service)
export async function getClientIP(): Promise<string> {
  try {
    // This is a placeholder - in a real implementation you might use:
    // const response = await fetch('https://api.ipify.org?format=json');
    // const data = await response.json();
    // return data.ip;
    return '0.0.0.0'; // Placeholder
  } catch (error) {
    console.error('Failed to get client IP:', error);
    return '0.0.0.0';
  }
}