export interface AuditLogEntry {
  id: string;
  timestamp: number;
  eventType: AuditEventType;
  userId: string;
  contactAddress?: string;
  messageId?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress?: string;
  userAgent?: string;
}

export type AuditEventType = 
  // Message Events
  | 'message_sent'
  | 'message_received'
  | 'message_read'
  | 'message_deleted'
  | 'message_modified'
  | 'message_forwarded'
  | 'message_encrypted'
  | 'message_decrypted'
  
  // Contact Events
  | 'contact_added'
  | 'contact_removed'
  | 'contact_blocked'
  | 'contact_unblocked'
  | 'contact_verified'
  
  // Security Events
  | 'login_success'
  | 'login_failed'
  | 'encryption_key_generated'
  | 'encryption_key_rotated'
  | 'decryption_failed'
  | 'suspicious_activity'
  | 'security_breach'
  
  // Privacy Events
  | 'privacy_settings_changed'
  | 'data_exported'
  | 'data_deleted'
  | 'screenshot_detected'
  | 'screen_recording_detected'
  
  // System Events
  | 'app_launched'
  | 'app_closed'
  | 'wallet_connected'
  | 'wallet_disconnected'
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  
  // Error Events
  | 'error_occurred'
  | 'network_error'
  | 'storage_error'
  | 'encryption_error';

class AuditLogService {
  private static readonly STORAGE_KEY = 'parc3l_audit_logs';
  private static readonly MAX_LOGS = 10000; // Keep last 10k entries
  private static readonly RETENTION_DAYS = 90; // Keep logs for 90 days
  
  /**
   * Log an audit event
   */
  static logEvent(
    eventType: AuditEventType,
    userId: string,
    details: Record<string, any> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low',
    contactAddress?: string,
    messageId?: string
  ): void {
    try {
      const entry: AuditLogEntry = {
        id: this.generateLogId(),
        timestamp: Date.now(),
        eventType,
        userId,
        contactAddress,
        messageId,
        details,
        severity,
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent
      };

      const logs = this.getAuditLogs();
      logs.push(entry);
      
      // Keep only the most recent logs
      if (logs.length > this.MAX_LOGS) {
        logs.splice(0, logs.length - this.MAX_LOGS);
      }
      
      // Remove old logs
      this.cleanupOldLogs(logs);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Audit Log:', entry);
      }
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Get all audit logs
   */
  static getAuditLogs(): AuditLogEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit logs by event type
   */
  static getLogsByEventType(eventType: AuditEventType): AuditLogEntry[] {
    const logs = this.getAuditLogs();
    return logs.filter(log => log.eventType === eventType);
  }

  /**
   * Get audit logs by user
   */
  static getLogsByUser(userId: string): AuditLogEntry[] {
    const logs = this.getAuditLogs();
    return logs.filter(log => log.userId === userId);
  }

  /**
   * Get audit logs by contact
   */
  static getLogsByContact(contactAddress: string): AuditLogEntry[] {
    const logs = this.getAuditLogs();
    return logs.filter(log => log.contactAddress === contactAddress);
  }

  /**
   * Get audit logs by severity
   */
  static getLogsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): AuditLogEntry[] {
    const logs = this.getAuditLogs();
    return logs.filter(log => log.severity === severity);
  }

  /**
   * Get audit logs by date range
   */
  static getLogsByDateRange(startDate: number, endDate: number): AuditLogEntry[] {
    const logs = this.getAuditLogs();
    return logs.filter(log => log.timestamp >= startDate && log.timestamp <= endDate);
  }

  /**
   * Search audit logs
   */
  static searchLogs(query: string): AuditLogEntry[] {
    const logs = this.getAuditLogs();
    const lowercaseQuery = query.toLowerCase();
    
    return logs.filter(log => 
      log.eventType.toLowerCase().includes(lowercaseQuery) ||
      log.userId.toLowerCase().includes(lowercaseQuery) ||
      (log.contactAddress && log.contactAddress.toLowerCase().includes(lowercaseQuery)) ||
      (log.messageId && log.messageId.toLowerCase().includes(lowercaseQuery)) ||
      JSON.stringify(log.details).toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get recent audit logs (last N entries)
   */
  static getRecentLogs(count: number = 50): AuditLogEntry[] {
    const logs = this.getAuditLogs();
    return logs.slice(-count).reverse();
  }

  /**
   * Get audit statistics
   */
  static getAuditStatistics(): {
    totalLogs: number;
    logsByType: Record<string, number>;
    logsBySeverity: Record<string, number>;
    recentActivity: number; // logs in last 24 hours
    criticalEvents: number;
  } {
    const logs = this.getAuditLogs();
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const logsByType: Record<string, number> = {};
    const logsBySeverity: Record<string, number> = {};
    let recentActivity = 0;
    let criticalEvents = 0;
    
    logs.forEach(log => {
      // Count by type
      logsByType[log.eventType] = (logsByType[log.eventType] || 0) + 1;
      
      // Count by severity
      logsBySeverity[log.severity] = (logsBySeverity[log.severity] || 0) + 1;
      
      // Count recent activity
      if (log.timestamp > oneDayAgo) {
        recentActivity++;
      }
      
      // Count critical events
      if (log.severity === 'critical') {
        criticalEvents++;
      }
    });
    
    return {
      totalLogs: logs.length,
      logsByType,
      logsBySeverity,
      recentActivity,
      criticalEvents
    };
  }

  /**
   * Export audit logs
   */
  static exportLogs(format: 'json' | 'csv' = 'json'): string {
    const logs = this.getAuditLogs();
    
    if (format === 'csv') {
      const headers = ['ID', 'Timestamp', 'Event Type', 'User ID', 'Contact Address', 'Message ID', 'Severity', 'Details'];
      const csvRows = [headers.join(',')];
      
      logs.forEach(log => {
        const row = [
          log.id,
          new Date(log.timestamp).toISOString(),
          log.eventType,
          log.userId,
          log.contactAddress || '',
          log.messageId || '',
          log.severity,
          JSON.stringify(log.details)
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
    
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Clear old audit logs
   */
  static clearOldLogs(): void {
    const logs = this.getAuditLogs();
    const cutoffTime = Date.now() - (this.RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const filteredLogs = logs.filter(log => log.timestamp > cutoffTime);
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredLogs));
    console.log(`Cleared ${logs.length - filteredLogs.length} old audit logs`);
  }

  /**
   * Clear all audit logs
   */
  static clearAllLogs(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('All audit logs cleared');
  }

  /**
   * Generate a unique log ID
   */
  private static generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client IP address (simplified)
   */
  private static getClientIP(): string {
    // In a real app, you'd get this from your backend
    return 'unknown';
  }

  /**
   * Clean up old logs
   */
  private static cleanupOldLogs(logs: AuditLogEntry[]): void {
    const cutoffTime = Date.now() - (this.RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const filteredLogs = logs.filter(log => log.timestamp > cutoffTime);
    
    if (filteredLogs.length !== logs.length) {
      logs.splice(0, logs.length - filteredLogs.length);
    }
  }
}

export default AuditLogService;
