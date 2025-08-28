import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SystemHealthCardProps {
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: string;
    responseTime: number;
    dbConnections: number;
    errorRate: number;
  };
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ systemHealth }) => {
  const getStatusColor = (status: SystemHealthCardProps['systemHealth']['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: SystemHealthCardProps['systemHealth']['status']) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return AlertTriangle;
      default: return Clock;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          System Health
        </CardTitle>
        <CardDescription>
          Real-time system status and performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {React.createElement(getStatusIcon(systemHealth.status), {
              className: cn("h-4 w-4", getStatusColor(systemHealth.status))
            })}
            <span className="font-medium">Overall Status</span>
          </div>
          <Badge className={getStatusColor(systemHealth.status)}>
            {systemHealth.status.toUpperCase()}
          </Badge>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Uptime</p>
            <p className="text-lg font-semibold">{systemHealth.uptime}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Response Time</p>
            <p className="text-lg font-semibold">{systemHealth.responseTime}ms</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">DB Connections</p>
            <p className="text-lg font-semibold">{systemHealth.dbConnections}/100</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Error Rate</p>
            <p className="text-lg font-semibold">{systemHealth.errorRate.toFixed(2)}%</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Database Performance</span>
            <span>Good</span>
          </div>
          <Progress value={85} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthCard;