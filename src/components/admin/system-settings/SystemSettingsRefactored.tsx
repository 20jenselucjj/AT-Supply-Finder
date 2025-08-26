import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/context/theme-context';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useRBAC } from '@/hooks/use-rbac';
import { logger } from '@/lib/logger';
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
    // Set up real-time subscription for system settings changes
    const channel = supabase
      .channel('system-settings-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'system_config' },
        (payload) => {
          console.log('System settings updated:', payload.new);
          // In a real implementation, we would update the local state with the new settings
          // For now, we'll just log the change
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  return (
    <div className="space-y-6">
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
    </div>
  );
};