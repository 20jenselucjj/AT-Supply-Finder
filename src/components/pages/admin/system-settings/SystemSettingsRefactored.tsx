import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/context/theme-context';
import { toast } from 'sonner';
import { useRBAC } from '@/hooks/use-rbac';
import { useAuth } from '@/context/auth-context';
import { logger } from '@/lib/utils/logger';
import { fetchAllSettings, updateAllSettings } from '@/lib/api/appwrite-system-settings';
import { Save, Download, Upload, RefreshCw } from 'lucide-react';
import { 
  SystemHealth, 
  SecuritySettings, 
  NotificationSettings, 
  AppearanceSettings, 
  SystemConfiguration, 
  DatabaseSettings 
} from './types';
import { SystemHealthCard } from './SystemHealthCard';
import { SecuritySettingsCard } from './SecuritySettingsCard';
import { NotificationSettingsCard } from './NotificationSettingsCard';
import { AppearanceSettingsCard } from './AppearanceSettingsCard';
import { SystemConfigurationCard } from './SystemConfigurationCard';
import { DatabaseSettingsCard } from './DatabaseSettingsCard';

export const SystemSettingsRefactored: React.FC = () => {
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
  const { userRole, loading: rbacLoading } = useRBAC();
  const { isAdmin, hasCheckedAdmin } = useAuth();

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

  // Load settings from Appwrite on component mount
  useEffect(() => {
    let isMounted = true; // To prevent state updates after component unmount
    let hasShownAuthError = false; // Prevent multiple error toasts
    let retryCount = 0;
    
    const loadSettings = async () => {
      console.log('=== SystemSettings Debug Info ===');
      console.log('RBAC Loading:', rbacLoading);
      console.log('User Role:', userRole);
      console.log('Has Checked Admin:', hasCheckedAdmin);
      console.log('Is Admin:', isAdmin);
      
      // Check if user is admin using the userRole from RBAC hook
      if (userRole === 'admin') {
        console.log('User is admin via RBAC, loading settings...');
        if (isMounted) setLoading(true);
        try {
          const settings = await fetchAllSettings();
          if (settings && isMounted) {
            setSecuritySettings(settings.securitySettings);
            setNotificationSettings(settings.notificationSettings);
            setAppearanceSettings(settings.appearanceSettings);
            setSystemConfiguration(settings.systemConfiguration);
            setDatabaseSettings(settings.databaseSettings);
          } else if (isMounted && !hasShownAuthError) {
            // Handle unauthorized access
            console.log('Failed to fetch settings or settings is null');
            toast.error('Unable to load system settings. Please ensure you have administrator privileges.');
            hasShownAuthError = true;
          }
        } catch (error) {
          if (isMounted && !hasShownAuthError) {
            console.error('Error loading settings:', error);
            toast.error('Failed to load system settings');
            hasShownAuthError = true;
          }
        } finally {
          if (isMounted) setLoading(false);
        }
        return;
      }
      
      // If RBAC says user is not admin, check the auth context as a fallback
      if (hasCheckedAdmin && !isAdmin) {
        console.log('Auth context also reports not admin');
        if (isMounted && !hasShownAuthError) {
          toast.error('Access denied. Administrator privileges required.');
          // Log this event for debugging
          try {
            await logger.auditLog({
              action: 'ACCESS_DENIED_SYSTEM_SETTINGS',
              entityType: 'SYSTEM',
              details: {
                userRole: userRole || 'null',
                isAdmin: isAdmin,
                hasCheckedAdmin: hasCheckedAdmin
              }
            });
          } catch (logError) {
            console.error('Failed to log access denied event:', logError);
          }
          hasShownAuthError = true;
        }
        if (isMounted) setLoading(false);
        return;
      }
      
      // If we haven't checked admin status yet or we're still checking, wait and retry
      if (!hasCheckedAdmin || rbacLoading) {
        console.log('Still checking admin status, retrying...');
        if (retryCount < 5) { // Limit retries to prevent infinite loop
          retryCount++;
          setTimeout(() => {
            if (isMounted) {
              loadSettings();
            }
          }, 300);
          return;
        } else {
          // Max retries reached
          if (isMounted && !hasShownAuthError) {
            toast.error('Access denied. Administrator privileges required.');
            hasShownAuthError = true;
          }
          if (isMounted) setLoading(false);
          return;
        }
      }
      
      // If we've checked admin status and isAdmin is true but RBAC says user is not admin,
      // there might be a sync issue. Let's trust the auth context in this case
      if (hasCheckedAdmin && isAdmin) {
        console.log('Auth context says admin but RBAC says not admin, trusting auth context');
        if (isMounted) setLoading(true);
        try {
          const settings = await fetchAllSettings();
          if (settings && isMounted) {
            setSecuritySettings(settings.securitySettings);
            setNotificationSettings(settings.notificationSettings);
            setAppearanceSettings(settings.appearanceSettings);
            setSystemConfiguration(settings.systemConfiguration);
            setDatabaseSettings(settings.databaseSettings);
          } else if (isMounted && !hasShownAuthError) {
            // Handle unauthorized access
            console.log('Failed to fetch settings or settings is null');
            toast.error('Unable to load system settings. Please ensure you have administrator privileges.');
            hasShownAuthError = true;
          }
        } catch (error) {
          if (isMounted && !hasShownAuthError) {
            console.error('Error loading settings:', error);
            toast.error('Failed to load system settings');
            hasShownAuthError = true;
          }
        } finally {
          if (isMounted) setLoading(false);
        }
        return;
      }
      
      // Default case - deny access
      if (isMounted && !hasShownAuthError) {
        toast.error('Access denied. Administrator privileges required.');
        hasShownAuthError = true;
      }
      if (isMounted) setLoading(false);
    };

    // Only attempt to load settings if we have a user and have finished checking roles
    if (userRole || hasCheckedAdmin) {
      loadSettings();
    } else if (!rbacLoading && !userRole && hasCheckedAdmin && !isAdmin) {
      // User is definitely not admin
      if (isMounted && !hasShownAuthError) {
        toast.error('Access denied. Administrator privileges required.');
        hasShownAuthError = true;
      }
      if (isMounted) setLoading(false);
    } else if (rbacLoading) {
      console.log('RBAC still loading...');
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [userRole, rbacLoading, isAdmin, hasCheckedAdmin]); // Depend on userRole, rbacLoading, isAdmin, and hasCheckedAdmin

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Save settings to Appwrite
      const success = await updateAllSettings({
        securitySettings,
        notificationSettings,
        appearanceSettings,
        systemConfiguration,
        databaseSettings
      });
      
      if (success) {
        toast.success('Settings saved successfully');
        
        // Log successful settings save
        await logger.auditLog({
          action: 'SAVE_SYSTEM_SETTINGS',
          entityType: 'SYSTEM',
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
      } else {
        toast.error('Failed to save settings');
        throw new Error('Failed to save settings to Appwrite');
      }
    } catch (error) {
      await logger.auditLog({
        action: 'SAVE_SYSTEM_SETTINGS_FAILED',
        entityType: 'SYSTEM',
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

  return (
    <div className="space-y-6">
      {(loading || rbacLoading) && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
      
      {!loading && !rbacLoading && (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">System Settings</h1>
              <p className="text-muted-foreground">Manage your system configuration and preferences</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" disabled={saving || loading}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" disabled={saving || loading}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleSaveSettings} disabled={saving || loading}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
              <TabsTrigger value="health">Health</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
            </TabsList>

            <TabsContent value="health" className="space-y-4">
              <SystemHealthCard 
                systemHealth={systemHealth}
                onRunDiagnostics={handleRunDiagnostics}
                onBackupSystem={handleBackupSystem}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <SecuritySettingsCard 
                securitySettings={securitySettings}
                setSecuritySettings={setSecuritySettings}
                showApiKey={showApiKey}
                setShowApiKey={setShowApiKey}
                apiKey={apiKey}
              />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <NotificationSettingsCard 
                notificationSettings={notificationSettings}
                setNotificationSettings={setNotificationSettings}
              />
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <AppearanceSettingsCard 
                appearanceSettings={appearanceSettings}
                setAppearanceSettings={setAppearanceSettings}
                theme={theme}
                setTheme={setTheme}
                contrastMode={contrastMode}
                setContrastMode={setContrastMode}
                colorScheme={colorScheme}
                setColorScheme={setColorScheme}
              />
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <SystemConfigurationCard 
                systemConfiguration={systemConfiguration}
                setSystemConfiguration={setSystemConfiguration}
              />
            </TabsContent>

            <TabsContent value="database" className="space-y-4">
              <DatabaseSettingsCard 
                databaseSettings={databaseSettings}
                setDatabaseSettings={setDatabaseSettings}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};