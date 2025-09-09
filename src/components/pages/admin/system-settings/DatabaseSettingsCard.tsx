import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Database } from 'lucide-react';
import { DatabaseSettings } from './types';

interface DatabaseSettingsCardProps {
  databaseSettings: DatabaseSettings;
  setDatabaseSettings: React.Dispatch<React.SetStateAction<DatabaseSettings>>;
}

export const DatabaseSettingsCard: React.FC<DatabaseSettingsCardProps> = ({
  databaseSettings,
  setDatabaseSettings
}) => {
  return (
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
                Enable database replication for high availability
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
                Compress data for storage efficiency
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
};