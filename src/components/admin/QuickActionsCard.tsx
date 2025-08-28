import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  color: string;
}

interface QuickActionsCardProps {
  actions: QuickAction[];
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({ actions }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common administrative tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto p-4"
              onClick={action.action}
            >
              <div className={cn("p-2 rounded-full text-white", action.color)}>
                <action.icon className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Button>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;