import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Analytics } from '@/components/admin/Analytics';

const AdminAnalytics = () => {
  return (
    <>
      <Helmet>
        <title>Analytics | Admin Dashboard</title>
        <meta name="description" content="View analytics and system reports" />
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">View system performance metrics and user analytics</p>
        </div>
        
        <Analytics />
      </div>
    </>
  );
};

export default AdminAnalytics;