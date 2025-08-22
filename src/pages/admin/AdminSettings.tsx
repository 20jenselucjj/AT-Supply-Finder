import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SystemSettings } from '@/components/admin/SystemSettings';

const AdminSettings = () => {
  return (
    <>
      <Helmet>
        <title>System Settings | Admin Dashboard</title>
        <meta name="description" content="Configure system settings and preferences" />
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
        </div>
        
        <SystemSettings />
      </div>
    </>
  );
};

export default AdminSettings;