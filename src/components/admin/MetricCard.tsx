import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const isPositiveChange = metric.changeType === 'increase';
  const changeIcon = isPositiveChange ? 'ArrowUp' : 'ArrowDown';
  const changeColor = isPositiveChange ? 'text-green-600' : 'text-red-600';

  return (
    <motion.div
      key={metric.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <Card className="relative overflow-hidden border-l-4 border-l-transparent hover:border-l-primary transition-all duration-300 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {metric.title}
          </CardTitle>
          <div className={cn("p-2 rounded-full", metric.color)}>
            <metric.icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {metric.isLoading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  <>
                    {metric.prefix}{typeof metric.value === 'number' ? metric.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : metric.value}{metric.suffix}
                  </>
                )}
              </div>
              {metric.change !== undefined && (
                <div className={cn("flex items-center text-sm", changeColor)}>
                  {changeIcon === 'ArrowUp' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1">
                      <line x1="12" y1="19" x2="12" y2="5"></line>
                      <polyline points="5 12 12 5 19 12"></polyline>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <polyline points="19 12 12 19 5 12"></polyline>
                    </svg>
                  )}
                  +{typeof metric.change === 'number' ? metric.change.toLocaleString(undefined, { maximumFractionDigits: 2 }) : metric.change}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{metric.description}</p>
            
            {/* Mini trend chart placeholder */}
            {metric.trend && (
              <div className="flex items-end gap-1 h-8 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                {metric.trend.map((value, i) => (
                  <div
                    key={i}
                    className="bg-primary/30 rounded-sm flex-1 transition-all duration-300"
                    style={{ height: `${(value / Math.max(...metric.trend!)) * 100}%` }}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MetricCard;