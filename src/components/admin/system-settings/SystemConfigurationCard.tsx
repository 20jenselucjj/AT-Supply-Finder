import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Settings } from 'lucide-react';
import { SystemConfiguration } from './types';

interface SystemConfigurationCardProps {
  systemConfiguration: SystemConfiguration;
  setSystemConfiguration: React.Dispatch<React.SetStateAction<SystemConfiguration>>;
}

export const SystemConfigurationCard: React.FC<SystemConfigurationCardProps> = ({
  systemConfiguration,
  setSystemConfiguration
}) => {
  return (
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
};