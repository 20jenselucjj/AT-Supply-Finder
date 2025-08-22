import React from 'react';
import { Helmet } from 'react-helmet-async';
import DashboardOverview from '@/components/admin/DashboardOverview';

const AdminDashboard = () => {
  return (
    <>
      <Helmet>
        <title>Admin Dashboard | AT Supply Finder</title>
        <meta name="description" content="Admin dashboard overview for AT Supply Finder Finder" />
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your system performance and key metrics</p>
        </div>
        
        <DashboardOverview />
      </div>
    </>
  );
};

export default AdminDashboard;