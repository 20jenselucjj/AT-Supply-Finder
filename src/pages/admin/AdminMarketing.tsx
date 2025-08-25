import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MarketingOverview } from '@/components/admin/MarketingOverview';

export const AdminMarketing: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing</h1>
        <p className="text-muted-foreground">Manage marketing campaigns and promotions</p>
      </div>
      
      <MarketingOverview />
    </div>
  );
};

export default AdminMarketing;