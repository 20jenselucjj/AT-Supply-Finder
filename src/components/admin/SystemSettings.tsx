import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from '@/context/theme-context';
import { toast } from 'sonner';
import { databases, account } from '@/lib/appwrite';
import { useRBAC } from '@/hooks/use-rbac';
import { logger } from '@/lib/logger';
import {
  Settings,
  Database,
  Shield,
  Bell,
  Palette,
  Monitor,
  Server,
  Key,
  Mail,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Save,
  Clock,
  Users,
  FileText,
  Zap,
  Calendar,
  MapPin,
  Phone,
  Building,
  CreditCard,
  Cloud,
  GitBranch,
  HardDriveIcon
} from 'lucide-react';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  uptime: string;
  lastBackup: string;
}

interface SecuritySettings {
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

interface NotificationSettings {
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

interface AppearanceSettings {
  defaultTheme: 'light' | 'dark' | 'system';
  accentColor: string;
  sidebarCollapsed: boolean;
  densityMode: 'compact' | 'comfortable' | 'spacious';
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  animationSpeed: 'slow' | 'normal' | 'fast';
}

interface SystemConfiguration {
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

interface DatabaseSettings {
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

export const SystemSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    cpu: 45,
    memory: 62,
    storage: 78,
    network: 98,
    uptime: '15 days, 6 hours',
    lastBackup: '2 hours ago'
  });
  const { isAdmin } = useRBAC();

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireSpecialChars: true,
    ipWhitelist: [],
    enableSSO: false,
    ssoProvider: 'google',
    enforcePasswordHistory: 5,
    lockoutDuration: 30
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    slackEnabled: false,
    webhookUrl: '',
    alertThresholds: {
      cpu: 80,
      memory: 85,
      storage: 90,
      errorRate: 5
    },
    emailRecipients: [],
    notificationSchedule: {
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'UTC'
    },
    enableDigest: false,
    digestFrequency: 'daily'
  });

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    defaultTheme: 'system',
    accentColor: 'blue',
    sidebarCollapsed: false,
    densityMode: 'comfortable',
    fontFamily: 'Inter',
    fontSize: 'medium',
    borderRadius: 'medium',
    animationSpeed: 'normal'
  });

  const [systemConfiguration, setSystemConfiguration] = useState<SystemConfiguration>({
    companyName: 'AT Supply Finder',
    companyAddress: '',
    companyPhone: '',
    timezone: 'UTC',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    currency: 'USD',
    language: 'en',
    enableAuditLogs: true,
    retentionPeriod: 90,
    enableAutoUpdates: true,
    updateChannel: 'stable'
  });

  const [databaseSettings, setDatabaseSettings] = useState<DatabaseSettings>({
    maxConnections: 100,
    connectionTimeout: 30,
    queryTimeout: 30,
    backupSchedule: '0 2 * * *',
    enableReplication: false,
    replicationMode: 'async',
    enableCompression: true,
    maintenanceWindow: {
      day: 'Sunday',
      startTime: '02:00',
      endTime: '04:00'
    }
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey] = useState('sk_test_1234567890abcdef...');
  const [activeTab, setActiveTab] = useState('health');

  const { theme, setTheme, contrastMode, setContrastMode, colorScheme, setColorScheme } = useTheme();

  useEffect(() => {
    // In Appwrite, we don't have the same realtime subscription capabilities as Supabase
    // We'll just clean up any potential subscriptions on unmount
    return () => {
      // Cleanup function if needed
    };
  }, []);

  const getHealthStatus = (value: number) => {
    if (value >= 90) return { color: 'text-red-600 bg-red-100', icon: XCircle };
    if (value >= 75) return { color: 'text-yellow-600 bg-yellow-100', icon: AlertTriangle };
    return { color: 'text-green-600 bg-green-100', icon: CheckCircle2 };
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log successful settings save
      await logger.auditLog({
        action: 'SAVE_SYSTEM_SETTINGS',
        entity_type: 'SYSTEM',
        details: {
          security: {
            twoFactorEnabled: securitySettings.twoFactorEnabled,
            sessionTimeout: securitySettings.sessionTimeout,
            maxLoginAttempts: securitySettings.maxLoginAttempts,
            enableSSO: securitySettings.enableSSO
          },
          notifications: {
            emailEnabled: notificationSettings.emailEnabled,
            slackEnabled: notificationSettings.slackEnabled
          },
          appearance: {
            defaultTheme: appearanceSettings.defaultTheme,
            densityMode: appearanceSettings.densityMode
          },
          system: {
            enableAuditLogs: systemConfiguration.enableAuditLogs,
            enableAutoUpdates: systemConfiguration.enableAutoUpdates
          }
        }
      });
      
      toast.success('Settings saved successfully');
    } catch (error) {
      await logger.auditLog({
        action: 'SAVE_SYSTEM_SETTINGS_FAILED',
        entity_type: 'SYSTEM',
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      });
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBackupSystem = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('System backup completed');
      setSystemHealth(prev => ({ ...prev, lastBackup: 'Just now' }));
    } catch (error) {
      toast.error('Backup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate diagnostic results
      setSystemHealth(prev => ({
        ...prev,
        cpu: Math.floor(Math.random() * 30) + 30,
        memory: Math.floor(Math.random() * 40) + 40,
        storage: Math.floor(Math.random() * 50) + 50,
        network: Math.floor(Math.random() * 10) + 90
      }));
      
      toast.success('System diagnostics completed');
    } catch (error) {
      toast.error('Diagnostics failed');
    } finally {
      setLoading(false);
    }
  };

  const SystemHealthCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          System Health
        </CardTitle>
        <CardDescription>
          Real-time system performance and health metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <Label>CPU Usage</Label>
              </div>
              <Badge className={getHealthStatus(systemHealth.cpu).color}>
                {systemHealth.cpu}%
              </Badge>
            </div>
            <Progress value={systemHealth.cpu} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <Label>Memory Usage</Label>
              </div>
              <Badge className={getHealthStatus(systemHealth.memory).color}>
                {systemHealth.memory}%
              </Badge>
            </div>
            <Progress value={systemHealth.memory} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <Label>Storage Usage</Label>
              </div>
              <Badge className={getHealthStatus(systemHealth.storage).color}>
                {systemHealth.storage}%
              </Badge>
            </div>
            <Progress value={systemHealth.storage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-muted-foreground" />
                <Label>Network</Label>
              </div>
              <Badge className={getHealthStatus(100 - systemHealth.network).color}>
                {systemHealth.network}%
              </Badge>
            </div>
            <Progress value={systemHealth.network} className="h-2" />
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-sm font-medium">System Uptime</Label>
            <p className="text-2xl font-bold">{systemHealth.uptime}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Last Backup</Label>
            <p className="text-2xl font-bold">{systemHealth.lastBackup}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleRunDiagnostics} 
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Run Diagnostics
          </Button>
          <Button 
            onClick={handleBackupSystem} 
            disabled={loading}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Backup System
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const SecuritySettingsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Settings
        </CardTitle>
        <CardDescription>
          Configure authentication, access control, and security policies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="2fa">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require 2FA for all admin accounts
              </p>
            </div>
            <Switch
              id="2fa"
              checked={securitySettings.twoFactorEnabled}
              onCheckedChange={(checked) =>
                setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: checked }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={securitySettings.sessionTimeout}
                onChange={(e) =>
                  setSecuritySettings(prev => ({ 
                    ...prev, 
                    sessionTimeout: parseInt(e.target.value) || 30 
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="max-attempts">Max Login Attempts</Label>
              <Input
                id="max-attempts"
                type="number"
                value={securitySettings.maxLoginAttempts}
                onChange={(e) =>
                  setSecuritySettings(prev => ({ 
                    ...prev, 
                    maxLoginAttempts: parseInt(e.target.value) || 5 
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="password-length">Minimum Password Length</Label>
              <Input
                id="password-length"
                type="number"
                value={securitySettings.passwordMinLength}
                onChange={(e) =>
                  setSecuritySettings(prev => ({ 
                    ...prev, 
                    passwordMinLength: parseInt(e.target.value) || 8 
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="password-history">Password History (count)</Label>
              <Input
                id="password-history"
                type="number"
                value={securitySettings.enforcePasswordHistory}
                onChange={(e) =>
                  setSecuritySettings(prev => ({ 
                    ...prev, 
                    enforcePasswordHistory: parseInt(e.target.value) || 5 
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="special-chars">Require Special Characters</Label>
              <p className="text-sm text-muted-foreground">
                Passwords must include special characters
              </p>
            </div>
            <Switch
              id="special-chars"
              checked={securitySettings.requireSpecialChars}
              onCheckedChange={(checked) =>
                setSecuritySettings(prev => ({ ...prev, requireSpecialChars: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sso">Single Sign-On (SSO)</Label>
              <p className="text-sm text-muted-foreground">
                Enable SSO authentication
              </p>
            </div>
            <Switch
              id="sso"
              checked={securitySettings.enableSSO}
              onCheckedChange={(checked) =>
                setSecuritySettings(prev => ({ ...prev, enableSSO: checked }))
              }
            />
          </div>

          {securitySettings.enableSSO && (
            <div>
              <Label htmlFor="sso-provider">SSO Provider</Label>
              <Select 
                value={securitySettings.ssoProvider} 
                onValueChange={(value) =>
                  setSecuritySettings(prev => ({ ...prev, ssoProvider: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="microsoft">Microsoft</SelectItem>
                  <SelectItem value="okta">Okta</SelectItem>
                  <SelectItem value="auth0">Auth0</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="lockout-duration">Lockout Duration (minutes)</Label>
            <Input
              id="lockout-duration"
              type="number"
              value={securitySettings.lockoutDuration}
              onChange={(e) =>
                setSecuritySettings(prev => ({ 
                  ...prev, 
                  lockoutDuration: parseInt(e.target.value) || 30 
                }))
              }
            />
          </div>

          <div>
            <Label>IP Whitelist (one per line)</Label>
            <Textarea
              value={securitySettings.ipWhitelist.join('\n')}
              onChange={(e) =>
                setSecuritySettings(prev => ({ 
                  ...prev, 
                  ipWhitelist: e.target.value.split('\n').filter(ip => ip.trim() !== '') 
                }))
              }
              placeholder="192.168.1.1&#10;10.0.0.0/8"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const NotificationSettingsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Configure alerts and notification channels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send system alerts via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={notificationSettings.emailEnabled}
              onCheckedChange={(checked) =>
                setNotificationSettings(prev => ({ ...prev, emailEnabled: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="slack-notifications">Slack Integration</Label>
              <p className="text-sm text-muted-foreground">
                Send alerts to Slack channel
              </p>
            </div>
            <Switch
              id="slack-notifications"
              checked={notificationSettings.slackEnabled}
              onCheckedChange={(checked) =>
                setNotificationSettings(prev => ({ ...prev, slackEnabled: checked }))
              }
            />
          </div>

          {notificationSettings.slackEnabled && (
            <div>
              <Label htmlFor="webhook-url">Slack Webhook URL</Label>
              <Input
                id="webhook-url"
                value={notificationSettings.webhookUrl}
                onChange={(e) =>
                  setNotificationSettings(prev => ({ ...prev, webhookUrl: e.target.value }))
                }
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>
          )}

          <div>
            <Label>Email Recipients (one per line)</Label>
            <Textarea
              value={notificationSettings.emailRecipients.join('\n')}
              onChange={(e) =>
                setNotificationSettings(prev => ({ 
                  ...prev, 
                  emailRecipients: e.target.value.split('\n').filter(email => email.trim() !== '') 
                }))
              }
              placeholder="admin@example.com&#10;alerts@company.com"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-base font-medium">Alert Thresholds</Label>
            <div className="grid gap-4 sm:grid-cols-2 mt-2">
              <div>
                <Label htmlFor="cpu-threshold">CPU Usage (%)</Label>
                <Input
                  id="cpu-threshold"
                  type="number"
                  value={notificationSettings.alertThresholds.cpu}
                  onChange={(e) =>
                    setNotificationSettings(prev => ({ 
                      ...prev, 
                      alertThresholds: { 
                        ...prev.alertThresholds, 
                        cpu: parseInt(e.target.value) || 80 
                      }
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="memory-threshold">Memory Usage (%)</Label>
                <Input
                  id="memory-threshold"
                  type="number"
                  value={notificationSettings.alertThresholds.memory}
                  onChange={(e) =>
                    setNotificationSettings(prev => ({ 
                      ...prev, 
                      alertThresholds: { 
                        ...prev.alertThresholds, 
                        memory: parseInt(e.target.value) || 85 
                      }
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="storage-threshold">Storage Usage (%)</Label>
                <Input
                  id="storage-threshold"
                  type="number"
                  value={notificationSettings.alertThresholds.storage}
                  onChange={(e) =>
                    setNotificationSettings(prev => ({ 
                      ...prev, 
                      alertThresholds: { 
                        ...prev.alertThresholds, 
                        storage: parseInt(e.target.value) || 90 
                      }
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="error-threshold">Error Rate (%)</Label>
                <Input
                  id="error-threshold"
                  type="number"
                  value={notificationSettings.alertThresholds.errorRate}
                  onChange={(e) =>
                    setNotificationSettings(prev => ({ 
                      ...prev, 
                      alertThresholds: { 
                        ...prev.alertThresholds, 
                        errorRate: parseInt(e.target.value) || 5 
                      }
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="digest">Enable Digest Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send periodic summary reports
              </p>
            </div>
            <Switch
              id="digest"
              checked={notificationSettings.enableDigest}
              onCheckedChange={(checked) =>
                setNotificationSettings(prev => ({ ...prev, enableDigest: checked }))
              }
            />
          </div>

          {notificationSettings.enableDigest && (
            <div>
              <Label htmlFor="digest-frequency">Digest Frequency</Label>
              <Select 
                value={notificationSettings.digestFrequency} 
                onValueChange={(value: any) =>
                  setNotificationSettings(prev => ({ ...prev, digestFrequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-base font-medium">Notification Schedule</Label>
            <div className="grid gap-4 sm:grid-cols-3 mt-2">
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={notificationSettings.notificationSchedule.startTime}
                  onChange={(e) =>
                    setNotificationSettings(prev => ({ 
                      ...prev, 
                      notificationSchedule: { 
                        ...prev.notificationSchedule, 
                        startTime: e.target.value 
                      }
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={notificationSettings.notificationSchedule.endTime}
                  onChange={(e) =>
                    setNotificationSettings(prev => ({ 
                      ...prev, 
                      notificationSchedule: { 
                        ...prev.notificationSchedule, 
                        endTime: e.target.value 
                      }
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select 
                  value={notificationSettings.notificationSchedule.timezone} 
                  onValueChange={(value) =>
                    setNotificationSettings(prev => ({ 
                      ...prev, 
                      notificationSchedule: { 
                        ...prev.notificationSchedule, 
                        timezone: value 
                      }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AppearanceSettingsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Appearance Settings
        </CardTitle>
        <CardDescription>
          Customize the look and feel of the admin interface
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="theme-select">Theme</Label>
            <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contrast-select">Contrast Mode</Label>
            <Select value={contrastMode} onValueChange={(value: any) => setContrastMode(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High Contrast</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="color-scheme">Color Scheme</Label>
            <Select value={colorScheme} onValueChange={(value: any) => setColorScheme(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="density-select">Density Mode</Label>
            <Select 
              value={appearanceSettings.densityMode} 
              onValueChange={(value: any) => 
                setAppearanceSettings(prev => ({ ...prev, densityMode: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="spacious">Spacious</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="font-family">Font Family</Label>
            <Select 
              value={appearanceSettings.fontFamily} 
              onValueChange={(value) => 
                setAppearanceSettings(prev => ({ ...prev, fontFamily: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Open Sans">Open Sans</SelectItem>
                <SelectItem value="Lato">Lato</SelectItem>
                <SelectItem value="Montserrat">Montserrat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="font-size">Font Size</Label>
              <Select 
                value={appearanceSettings.fontSize} 
                onValueChange={(value: any) => 
                  setAppearanceSettings(prev => ({ ...prev, fontSize: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="border-radius">Border Radius</Label>
              <Select 
                value={appearanceSettings.borderRadius} 
                onValueChange={(value: any) => 
                  setAppearanceSettings(prev => ({ ...prev, borderRadius: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="animation-speed">Animation Speed</Label>
            <Select 
              value={appearanceSettings.animationSpeed} 
              onValueChange={(value: any) => 
                setAppearanceSettings(prev => ({ ...prev, animationSpeed: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="fast">Fast</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SystemConfigurationCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          System Configuration
        </CardTitle>
        <CardDescription>
          Configure general system settings and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={systemConfiguration.companyName}
                onChange={(e) =>
                  setSystemConfiguration(prev => ({ ...prev, companyName: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="company-phone">Company Phone</Label>
              <Input
                id="company-phone"
                value={systemConfiguration.companyPhone}
                onChange={(e) =>
                  setSystemConfiguration(prev => ({ ...prev, companyPhone: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="company-address">Company Address</Label>
            <Textarea
              id="company-address"
              value={systemConfiguration.companyAddress}
              onChange={(e) =>
                setSystemConfiguration(prev => ({ ...prev, companyAddress: e.target.value }))
              }
              placeholder="123 Main Street, City, State, ZIP"
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select 
                value={systemConfiguration.timezone} 
                onValueChange={(value) =>
                  setSystemConfiguration(prev => ({ ...prev, timezone: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <Select 
                value={systemConfiguration.language} 
                onValueChange={(value) =>
                  setSystemConfiguration(prev => ({ ...prev, language: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="date-format">Date Format</Label>
              <Select 
                value={systemConfiguration.dateFormat} 
                onValueChange={(value) =>
                  setSystemConfiguration(prev => ({ ...prev, dateFormat: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
                  <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
                  <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
                  <SelectItem value="MMMM d, yyyy">MMMM d, yyyy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="time-format">Time Format</Label>
              <Select 
                value={systemConfiguration.timeFormat} 
                onValueChange={(value) =>
                  setSystemConfiguration(prev => ({ ...prev, timeFormat: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour</SelectItem>
                  <SelectItem value="24h">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={systemConfiguration.currency} 
                onValueChange={(value) =>
                  setSystemConfiguration(prev => ({ ...prev, currency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="retention-period">Log Retention (days)</Label>
              <Input
                id="retention-period"
                type="number"
                value={systemConfiguration.retentionPeriod}
                onChange={(e) =>
                  setSystemConfiguration(prev => ({ 
                    ...prev, 
                    retentionPeriod: parseInt(e.target.value) || 90 
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="audit-logs">Enable Audit Logs</Label>
              <p className="text-sm text-muted-foreground">
                Track all system activities
              </p>
            </div>
            <Switch
              id="audit-logs"
              checked={systemConfiguration.enableAuditLogs}
              onCheckedChange={(checked) =>
                setSystemConfiguration(prev => ({ ...prev, enableAuditLogs: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-updates">Enable Auto Updates</Label>
              <p className="text-sm text-muted-foreground">
                Automatically update the system
              </p>
            </div>
            <Switch
              id="auto-updates"
              checked={systemConfiguration.enableAutoUpdates}
              onCheckedChange={(checked) =>
                setSystemConfiguration(prev => ({ ...prev, enableAutoUpdates: checked }))
              }
            />
          </div>

          {systemConfiguration.enableAutoUpdates && (
            <div>
              <Label htmlFor="update-channel">Update Channel</Label>
              <Select 
                value={systemConfiguration.updateChannel} 
                onValueChange={(value: any) =>
                  setSystemConfiguration(prev => ({ ...prev, updateChannel: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="nightly">Nightly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const DatabaseSettingsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Settings
        </CardTitle>
        <CardDescription>
          Configure database connection and performance settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="max-connections">Max Connections</Label>
              <Input
                id="max-connections"
                type="number"
                value={databaseSettings.maxConnections}
                onChange={(e) =>
                  setDatabaseSettings(prev => ({ 
                    ...prev, 
                    maxConnections: parseInt(e.target.value) || 100 
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="connection-timeout">Connection Timeout (seconds)</Label>
              <Input
                id="connection-timeout"
                type="number"
                value={databaseSettings.connectionTimeout}
                onChange={(e) =>
                  setDatabaseSettings(prev => ({ 
                    ...prev, 
                    connectionTimeout: parseInt(e.target.value) || 30 
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="query-timeout">Query Timeout (seconds)</Label>
              <Input
                id="query-timeout"
                type="number"
                value={databaseSettings.queryTimeout}
                onChange={(e) =>
                  setDatabaseSettings(prev => ({ 
                    ...prev, 
                    queryTimeout: parseInt(e.target.value) || 30 
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="backup-schedule">Backup Schedule (Cron)</Label>
              <Input
                id="backup-schedule"
                value={databaseSettings.backupSchedule}
                onChange={(e) =>
                  setDatabaseSettings(prev => ({ ...prev, backupSchedule: e.target.value }))
                }
                placeholder="0 2 * * *"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="replication">Enable Replication</Label>
              <p className="text-sm text-muted-foreground">
                Enable database replication
              </p>
            </div>
            <Switch
              id="replication"
              checked={databaseSettings.enableReplication}
              onCheckedChange={(checked) =>
                setDatabaseSettings(prev => ({ ...prev, enableReplication: checked }))
              }
            />
          </div>

          {databaseSettings.enableReplication && (
            <div>
              <Label htmlFor="replication-mode">Replication Mode</Label>
              <Select 
                value={databaseSettings.replicationMode} 
                onValueChange={(value: any) =>
                  setDatabaseSettings(prev => ({ ...prev, replicationMode: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sync">Synchronous</SelectItem>
                  <SelectItem value="async">Asynchronous</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="compression">Enable Compression</Label>
              <p className="text-sm text-muted-foreground">
                Compress database connections
              </p>
            </div>
            <Switch
              id="compression"
              checked={databaseSettings.enableCompression}
              onCheckedChange={(checked) =>
                setDatabaseSettings(prev => ({ ...prev, enableCompression: checked }))
              }
            />
          </div>

          <div>
            <Label className="text-base font-medium">Maintenance Window</Label>
            <div className="grid gap-4 sm:grid-cols-3 mt-2">
              <div>
                <Label htmlFor="maintenance-day">Day</Label>
                <Select 
                  value={databaseSettings.maintenanceWindow.day} 
                  onValueChange={(value) =>
                    setDatabaseSettings(prev => ({ 
                      ...prev, 
                      maintenanceWindow: { 
                        ...prev.maintenanceWindow, 
                        day: value 
                      }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sunday">Sunday</SelectItem>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Tuesday">Tuesday</SelectItem>
                    <SelectItem value="Wednesday">Wednesday</SelectItem>
                    <SelectItem value="Thursday">Thursday</SelectItem>
                    <SelectItem value="Friday">Friday</SelectItem>
                    <SelectItem value="Saturday">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="maintenance-start">Start Time</Label>
                <Input
                  id="maintenance-start"
                  type="time"
                  value={databaseSettings.maintenanceWindow.startTime}
                  onChange={(e) =>
                    setDatabaseSettings(prev => ({ 
                      ...prev, 
                      maintenanceWindow: { 
                        ...prev.maintenanceWindow, 
                        startTime: e.target.value 
                      }
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="maintenance-end">End Time</Label>
                <Input
                  id="maintenance-end"
                  type="time"
                  value={databaseSettings.maintenanceWindow.endTime}
                  onChange={(e) =>
                    setDatabaseSettings(prev => ({ 
                      ...prev, 
                      maintenanceWindow: { 
                        ...prev.maintenanceWindow, 
                        endTime: e.target.value 
                      }
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving}>
          <Save className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
          Save All Settings
        </Button>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Changes to security settings may require all users to re-authenticate. 
          Please ensure you have backup access before making critical changes.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Health</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Database</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <SystemHealthCard />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettingsCard />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettingsCard />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettingsCard />
        </TabsContent>

        <TabsContent value="system">
          <SystemConfigurationCard />
        </TabsContent>

        <TabsContent value="database">
          <DatabaseSettingsCard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettings;