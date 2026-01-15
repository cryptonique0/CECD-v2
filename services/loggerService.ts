/**
 * Logger Service - Structured logging with context
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  service: string;
  message: string;
  context?: Record<string, any>;
  stack?: string;
}

class LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private enableConsole = true;

  log(level: LogLevel, service: string, message: string, context?: Record<string, any>, stack?: string) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      service,
      message,
      context,
      stack
    };

    // Store log
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with colors
    if (this.enableConsole) {
      const prefix = `[${entry.timestamp}] [${service}] [${level}]`;
      const color = this.getLevelColor(level);
      
      if (context || stack) {
        console[this.getConsoleMethod(level)](
          `%c${prefix}%c ${message}`,
          `color: ${color}; font-weight: bold;`,
          'color: inherit;',
          context,
          stack ? '\nStack:\n' + stack : ''
        );
      } else {
        console[this.getConsoleMethod(level)](
          `%c${prefix}%c ${message}`,
          `color: ${color}; font-weight: bold;`,
          'color: inherit;'
        );
      }
    }

    // Send to server for critical errors
    if (level === LogLevel.ERROR) {
      this.sendToServer(entry);
    }
  }

  debug(service: string, message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, service, message, context);
  }

  info(service: string, message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, service, message, context);
  }

  warn(service: string, message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, service, message, context);
  }

  error(service: string, message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, service, message, context, error?.stack);
  }

  getLogs(level?: LogLevel, service?: string, limit = 100): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter(l => l.level === level);
    }

    if (service) {
      filtered = filtered.filter(l => l.service === service);
    }

    return filtered.slice(-limit);
  }

  clearLogs() {
    this.logs = [];
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '#888888';
      case LogLevel.INFO: return '#0066cc';
      case LogLevel.WARN: return '#ff9900';
      case LogLevel.ERROR: return '#cc0000';
      default: return '#000000';
    }
  }

  private getConsoleMethod(level: LogLevel): keyof typeof console {
    switch (level) {
      case LogLevel.DEBUG: return 'log';
      case LogLevel.INFO: return 'info';
      case LogLevel.WARN: return 'warn';
      case LogLevel.ERROR: return 'error';
      default: return 'log';
    }
  }

  private sendToServer(entry: LogEntry) {
    // For production, send to error tracking service (Sentry, etc.)
    // This is a stub
    try {
      if (typeof window !== 'undefined' && window.__errorTracker) {
        window.__errorTracker(entry);
      }
    } catch (e) {
      console.error('Failed to send error to tracking service', e);
    }
  }
}

export const loggerService = new LoggerService();
