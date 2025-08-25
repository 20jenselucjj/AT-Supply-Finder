import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const AdminOrders: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders and transactions</p>
      </div>
      
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
    </div>
  );
};

export default AdminOrders;