import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SystemSettingsRefactored } from '@/components/pages/admin/system-settings';

const AdminSettings = () => {
  return (
    <>
      <Helmet>
        <title>System Settings | Admin Dashboard</title>
        <meta name="description" content="Configure system settings and preferences" />
      </Helmet>
      
      <SystemSettingsRefactored />
    </>
  );
};

export default AdminSettings;