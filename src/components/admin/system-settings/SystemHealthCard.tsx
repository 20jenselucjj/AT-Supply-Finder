import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Monitor, Cpu, Activity, HardDrive, Wifi, RefreshCw, Download } from 'lucide-react';
import { SystemHealth } from './types';

interface SystemHealthCardProps {
  systemHealth: SystemHealth;
  onRunDiagnostics: () => void;
  onBackupSystem: () => void;
  loading: boolean;
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({
  systemHealth,
  onRunDiagnostics,
  onBackupSystem,
  loading
}) => {
  const getHealthStatus = (value: number) => {
    if (value >= 90) return { color: 'text-red-600 bg-red-100', icon: 'XCircle' };
    if (value >= 75) return { color: 'text-yellow-600 bg-yellow-100', icon: 'AlertTriangle' };
    return { color: 'text-green-600 bg-green-100', icon: 'CheckCircle2' };
  };

  return (
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
            onClick={onRunDiagnostics} 
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Run Diagnostics
          </Button>
          <Button 
            onClick={onBackupSystem} 
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
};