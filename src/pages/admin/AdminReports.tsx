import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportsOverview } from '@/components/admin/ReportsOverview';

export const AdminReports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">View and generate detailed reports</p>
      </div>
      
      <ReportsOverview />
    </div>
  );
};

export default AdminReports;