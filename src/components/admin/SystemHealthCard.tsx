import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, AlertTriangle, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  responseTime: number;
  dbConnections: number;
  errorRate: number;
}

interface SystemHealthCardProps {
  systemHealth: SystemHealth;
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ systemHealth }) => {
  const getStatusIcon = () => {
    switch (systemHealth.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <ShieldCheck className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (systemHealth.status) {
      case 'healthy':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-blue-500';
      }
  };

  const getUptimePercentage = () => {
    // Convert uptime string to percentage (e.g., "99.9%" -> 99.9)
    const match = systemHealth.uptime.match(/(\d+\.?\d*)%/);
    return match ? parseFloat(match[1]) : 0;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {getStatusIcon()}
          System Health
        </CardTitle>
        <CardDescription className="text-xs">
          Current system status and metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uptime</span>
            <span className={getStatusColor()}>{systemHealth.uptime}</span>
          </div>
          <Progress value={getUptimePercentage()} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Response Time</div>
            <div>{systemHealth.responseTime}ms</div>
          </div>
          <div>
            <div className="text-muted-foreground">DB Connections</div>
            <div>{systemHealth.dbConnections}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Error Rate</div>
            <div>{systemHealth.errorRate}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthCard;