// Validation functions for system settings

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate security settings
 */
export const validateSecuritySettings = (settings: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (settings.sessionTimeout !== undefined && (settings.sessionTimeout < 1 || settings.sessionTimeout > 1440)) {
    errors.push({
      field: 'sessionTimeout',
      message: 'Session timeout must be between 1 and 1440 minutes'
    });
  }
  
  if (settings.maxLoginAttempts !== undefined && (settings.maxLoginAttempts < 1 || settings.maxLoginAttempts > 20)) {
    errors.push({
      field: 'maxLoginAttempts',
      message: 'Max login attempts must be between 1 and 20'
    });
  }
  
  if (settings.passwordMinLength !== undefined && (settings.passwordMinLength < 4 || settings.passwordMinLength > 128)) {
    errors.push({
      field: 'passwordMinLength',
      message: 'Password minimum length must be between 4 and 128 characters'
    });
  }
  
  if (settings.enforcePasswordHistory !== undefined && (settings.enforcePasswordHistory < 0 || settings.enforcePasswordHistory > 24)) {
    errors.push({
      field: 'enforcePasswordHistory',
      message: 'Password history must be between 0 and 24 passwords'
    });
  }
  
  if (settings.lockoutDuration !== undefined && (settings.lockoutDuration < 1 || settings.lockoutDuration > 1440)) {
    errors.push({
      field: 'lockoutDuration',
      message: 'Lockout duration must be between 1 and 1440 minutes'
    });
  }
  
  return errors;
};

/**
 * Validate notification settings
 */
export const validateNotificationSettings = (settings: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Validate alert thresholds
  const thresholds = settings.alertThresholds;
  if (thresholds) {
    if (thresholds.cpu !== undefined && (thresholds.cpu < 0 || thresholds.cpu > 100)) {
      errors.push({
        field: 'alertThresholds.cpu',
        message: 'CPU threshold must be between 0 and 100'
      });
    }
    
    if (thresholds.memory !== undefined && (thresholds.memory < 0 || thresholds.memory > 100)) {
      errors.push({
        field: 'alertThresholds.memory',
        message: 'Memory threshold must be between 0 and 100'
      });
    }
    
    if (thresholds.storage !== undefined && (thresholds.storage < 0 || thresholds.storage > 100)) {
      errors.push({
        field: 'alertThresholds.storage',
        message: 'Storage threshold must be between 0 and 100'
      });
    }
    
    if (thresholds.errorRate !== undefined && (thresholds.errorRate < 0 || thresholds.errorRate > 100)) {
      errors.push({
        field: 'alertThresholds.errorRate',
        message: 'Error rate threshold must be between 0 and 100'
      });
    }
  }
  
  return errors;
};

/**
 * Validate system configuration settings
 */
export const validateSystemConfiguration = (settings: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (settings.retentionPeriod !== undefined && (settings.retentionPeriod < 1 || settings.retentionPeriod > 3650)) {
    errors.push({
      field: 'retentionPeriod',
      message: 'Retention period must be between 1 and 3650 days'
    });
  }
  
  return errors;
};

/**
 * Validate database settings
 */
export const validateDatabaseSettings = (settings: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (settings.maxConnections !== undefined && (settings.maxConnections < 1 || settings.maxConnections > 1000)) {
    errors.push({
      field: 'maxConnections',
      message: 'Max connections must be between 1 and 1000'
    });
  }
  
  if (settings.connectionTimeout !== undefined && (settings.connectionTimeout < 1 || settings.connectionTimeout > 300)) {
    errors.push({
      field: 'connectionTimeout',
      message: 'Connection timeout must be between 1 and 300 seconds'
    });
  }
  
  if (settings.queryTimeout !== undefined && (settings.queryTimeout < 1 || settings.queryTimeout > 300)) {
    errors.push({
      field: 'queryTimeout',
      message: 'Query timeout must be between 1 and 300 seconds'
    });
  }
  
  return errors;
};

/**
 * Validate all settings
 */
export const validateAllSettings = (settings: {
  securitySettings: any;
  notificationSettings: any;
  systemConfiguration: any;
  databaseSettings: any;
}): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  errors.push(...validateSecuritySettings(settings.securitySettings));
  errors.push(...validateNotificationSettings(settings.notificationSettings));
  errors.push(...validateSystemConfiguration(settings.systemConfiguration));
  errors.push(...validateDatabaseSettings(settings.databaseSettings));
  
  return errors;
};