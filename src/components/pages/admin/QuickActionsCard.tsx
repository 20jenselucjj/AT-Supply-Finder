import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Package, 
  BarChart3, 
  Settings, 
  Wrench,
  FileBarChart,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
}

interface QuickActionsCardProps {
  actions: QuickAction[];
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({ actions }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription className="text-xs">
          Common administrative tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className="h-auto flex flex-col items-center justify-center p-3 gap-1 min-h-[100px]"
                onClick={action.action}
              >
                <Icon className={cn("h-5 w-5", action.color)} />
                <span className="text-xs font-medium text-center">{action.title}</span>
                <span className="text-xs text-muted-foreground text-center">{action.description}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;