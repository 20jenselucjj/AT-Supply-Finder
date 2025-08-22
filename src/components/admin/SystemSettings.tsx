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
import { useTheme } from '@/context/theme-context';
import { toast } from 'sonner';
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
  Save
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
}

interface AppearanceSettings {
  defaultTheme: 'light' | 'dark' | 'system';
  accentColor: string;
  sidebarCollapsed: boolean;
  densityMode: 'compact' | 'comfortable' | 'spacious';
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

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireSpecialChars: true,
    ipWhitelist: []
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
    }
  });

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    defaultTheme: 'system',
    accentColor: 'blue',
    sidebarCollapsed: false,
    densityMode: 'comfortable'
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey] = useState('sk_test_1234567890abcdef...');

  const { theme, setTheme, contrastMode, setContrastMode, colorScheme, setColorScheme } = useTheme();

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
      toast.success('Settings saved successfully');
    } catch (error) {
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

      <Tabs defaultValue="health" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Health
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
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
      </Tabs>
    </div>
  );
};

export default SystemSettings;