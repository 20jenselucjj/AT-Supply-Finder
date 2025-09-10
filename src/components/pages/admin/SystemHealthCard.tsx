import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Server, Database, Wifi } from 'lucide-react';

interface SystemHealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  value: string;
  icon: React.ReactNode;
}

const SystemHealthCard: React.FC = () => {
  const healthMetrics: SystemHealthMetric[] = [
    {
      name: 'Server Status',
      status: 'healthy',
      value: 'Online',
      icon: <Server className="h-4 w-4" />
    },
    {
      name: 'Database',
      status: 'healthy',
      value: '99.9% uptime',
      icon: <Database className="h-4 w-4" />
    },
    {
      name: 'API Response',
      status: 'healthy',
      value: '< 200ms',
      icon: <Activity className="h-4 w-4" />
    },
    {
      name: 'Network',
      status: 'healthy',
      value: 'Stable',
      icon: <Wifi className="h-4 w-4" />
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {healthMetrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="text-gray-600">
                  {metric.icon}
                </div>
                <div>
                  <p className="font-medium text-sm">{metric.name}</p>
                  <p className="text-xs text-gray-500">{metric.value}</p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={getStatusColor(metric.status)}
              >
                {metric.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthCard;