import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useRBAC } from '@/hooks/use-rbac';
import { fetchAllSettings, updateAllSettings } from '@/lib/appwrite-system-settings';
import { SystemHealth, SecuritySettings, NotificationSettings, AppearanceSettings, SystemConfiguration, DatabaseSettings } from './system-settings/types';
import { SystemHealthCard } from './SystemHealthCard';

export const SystemSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
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
  const hasShownAuthError = useRef(false);
  
  // Settings state
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

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await fetchAllSettings();
      
      if (settings) {
        setSecuritySettings(settings.securitySettings);
        setNotificationSettings(settings.notificationSettings);
        setAppearanceSettings(settings.appearanceSettings);
        setSystemConfiguration(settings.systemConfiguration);
        setDatabaseSettings(settings.databaseSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    if (!rbacLoading && userRole === 'admin') {
      loadSettings();
    } else if (!rbacLoading && userRole !== 'admin') {
      // User is not admin
      if (isMounted && !hasShownAuthError.current) {
        toast.error('Access denied. Administrator privileges required.');
        hasShownAuthError.current = true;
      }
      if (isMounted) setLoading(false);
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [userRole, rbacLoading]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      const allSettings = {
        securitySettings,
        notificationSettings,
        appearanceSettings,
        systemConfiguration,
        databaseSettings
      };
      
      const success = await updateAllSettings(allSettings);
      
      if (success) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('An error occurred while saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (rbacLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Manage your system configuration and preferences</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <SystemHealthCard health={systemHealth} />

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>
        
        {/* Security Settings Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security policies and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={(checked) => 
                    setSecuritySettings({...securitySettings, twoFactorEnabled: checked})
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => 
                    setSecuritySettings({
                      ...securitySettings, 
                      sessionTimeout: parseInt(e.target.value) || 30
                    })
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label>Max Login Attempts</Label>
                <Input
                  type="number"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => 
                    setSecuritySettings({
                      ...securitySettings, 
                      maxLoginAttempts: parseInt(e.target.value) || 5
                    })
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label>Password Minimum Length</Label>
                <Input
                  type="number"
                  value={securitySettings.passwordMinLength}
                  onChange={(e) => 
                    setSecuritySettings({
                      ...securitySettings, 
                      passwordMinLength: parseInt(e.target.value) || 8
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notification Settings Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how and when you receive system notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Enable email notifications</p>
                </div>
                <Switch
                  checked={notificationSettings.emailEnabled}
                  onCheckedChange={(checked) => 
                    setNotificationSettings({...notificationSettings, emailEnabled: checked})
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value={notificationSettings.webhookUrl}
                  onChange={(e) => 
                    setNotificationSettings({
                      ...notificationSettings, 
                      webhookUrl: e.target.value
                    })
                  }
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CPU Alert Threshold (%)</Label>
                  <Input
                    type="number"
                    value={notificationSettings.alertThresholds.cpu}
                    onChange={(e) => 
                      setNotificationSettings({
                        ...notificationSettings, 
                        alertThresholds: {
                          ...notificationSettings.alertThresholds,
                          cpu: parseInt(e.target.value) || 80
                        }
                      })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Memory Alert Threshold (%)</Label>
                  <Input
                    type="number"
                    value={notificationSettings.alertThresholds.memory}
                    onChange={(e) => 
                      setNotificationSettings({
                        ...notificationSettings, 
                        alertThresholds: {
                          ...notificationSettings.alertThresholds,
                          memory: parseInt(e.target.value) || 85
                        }
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appearance Settings Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of your admin panel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Theme</Label>
                <Select 
                  value={appearanceSettings.defaultTheme}
                  onValueChange={(value: 'light' | 'dark' | 'system') => 
                    setAppearanceSettings({...appearanceSettings, defaultTheme: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Accent Color</Label>
                <Select 
                  value={appearanceSettings.accentColor}
                  onValueChange={(value: string) => 
                    setAppearanceSettings({...appearanceSettings, accentColor: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select 
                  value={appearanceSettings.fontFamily}
                  onValueChange={(value: string) => 
                    setAppearanceSettings({...appearanceSettings, fontFamily: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* System Configuration Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Configure general system settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={systemConfiguration.companyName}
                  onChange={(e) => 
                    setSystemConfiguration({
                      ...systemConfiguration, 
                      companyName: e.target.value
                    })
                  }
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select 
                    value={systemConfiguration.timezone}
                    onValueChange={(value: string) => 
                      setSystemConfiguration({...systemConfiguration, timezone: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
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
                
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select 
                    value={systemConfiguration.currency}
                    onValueChange={(value: string) => 
                      setSystemConfiguration({...systemConfiguration, currency: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Audit Logs</Label>
                  <p className="text-sm text-muted-foreground">Enable system audit logging</p>
                </div>
                <Switch
                  checked={systemConfiguration.enableAuditLogs}
                  onCheckedChange={(checked) => 
                    setSystemConfiguration({...systemConfiguration, enableAuditLogs: checked})
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Database Settings Tab */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Database Settings</CardTitle>
              <CardDescription>Configure database connection and performance settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Connections</Label>
                  <Input
                    type="number"
                    value={databaseSettings.maxConnections}
                    onChange={(e) => 
                      setDatabaseSettings({
                        ...databaseSettings, 
                        maxConnections: parseInt(e.target.value) || 100
                      })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Connection Timeout (seconds)</Label>
                  <Input
                    type="number"
                    value={databaseSettings.connectionTimeout}
                    onChange={(e) => 
                      setDatabaseSettings({
                        ...databaseSettings, 
                        connectionTimeout: parseInt(e.target.value) || 30
                      })
                    }
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Backup Schedule (Cron)</Label>
                <Input
                  value={databaseSettings.backupSchedule}
                  onChange={(e) => 
                    setDatabaseSettings({
                      ...databaseSettings, 
                      backupSchedule: e.target.value
                    })
                  }
                  placeholder="0 2 * * *"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Replication</Label>
                  <p className="text-sm text-muted-foreground">Enable database replication</p>
                </div>
                <Switch
                  checked={databaseSettings.enableReplication}
                  onCheckedChange={(checked) => 
                    setDatabaseSettings({...databaseSettings, enableReplication: checked})
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};