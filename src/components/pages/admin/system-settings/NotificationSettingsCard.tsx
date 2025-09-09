import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell } from 'lucide-react';
import { NotificationSettings } from './types';

interface NotificationSettingsCardProps {
  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
}

export const NotificationSettingsCard: React.FC<NotificationSettingsCardProps> = ({
  notificationSettings,
  setNotificationSettings
}) => {
  return (
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
};