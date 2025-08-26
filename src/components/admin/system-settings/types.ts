export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  uptime: string;
  lastBackup: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireSpecialChars: boolean;
  ipWhitelist: string[];
  enableSSO: boolean;
  ssoProvider: string;
  enforcePasswordHistory: number;
  lockoutDuration: number;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  slackEnabled: boolean;
  webhookUrl: string;
  alertThresholds: {
    cpu: number;
    memory: number;
    storage: number;
    errorRate: number;
  };
  emailRecipients: string[];
  notificationSchedule: {
    startTime: string;
    endTime: string;
    timezone: string;
  };
  enableDigest: boolean;
  digestFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface AppearanceSettings {
  defaultTheme: 'light' | 'dark' | 'system';
  accentColor: string;
  sidebarCollapsed: boolean;
  densityMode: 'compact' | 'comfortable' | 'spacious';
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  animationSpeed: 'slow' | 'normal' | 'fast';
}

export interface SystemConfiguration {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  language: string;
  enableAuditLogs: boolean;
  retentionPeriod: number;
  enableAutoUpdates: boolean;
  updateChannel: 'stable' | 'beta' | 'nightly';
}

export interface DatabaseSettings {
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
  backupSchedule: string;
  enableReplication: boolean;
  replicationMode: 'sync' | 'async';
  enableCompression: boolean;
  maintenanceWindow: {
    day: string;
    startTime: string;
    endTime: string;
  };
}