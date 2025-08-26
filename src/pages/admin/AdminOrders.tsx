import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const AdminOrders: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders Overview</CardTitle>
        <CardDescription>
          View and manage customer orders
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Orders management functionality will be implemented here.</p>
      </CardContent>
    </Card>
  );
};

export default AdminOrders;