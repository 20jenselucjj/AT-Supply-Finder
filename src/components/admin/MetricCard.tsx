import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  metric: {
    id: string;
    title: string;
    value: string | number;
    previousValue?: string | number;
    change?: number;
    changeType?: 'increase' | 'decrease' | 'neutral';
    icon: React.ElementType;
    color: string;
    description: string;
    trend?: number[];
    isLoading?: boolean;
    prefix?: string;
    suffix?: string;
  };
  index: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric, index }) => {
  const Icon = metric.icon;
  
  const getChangeIcon = () => {
    if (metric.changeType === 'increase') return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (metric.changeType === 'decrease') return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
          <Icon className={cn("h-4 w-4", metric.color)} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metric.prefix}{metric.value}{metric.suffix}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
          {metric.change !== undefined && (
            <div className="flex items-center mt-2">
              {getChangeIcon()}
              <span className="text-xs font-medium ml-1">
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">from last month</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};