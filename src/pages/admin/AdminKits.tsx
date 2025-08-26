import React from 'react';
import { Helmet } from 'react-helmet-async';
import { StarterKitBuilder } from '@/components/admin/StarterKitBuilder';

const AdminKits = () => {
  return (
    <>
      <Helmet>
        <title>Starter Kits | Admin Dashboard</title>
        <meta name="description" content="Manage starter kits and templates" />
      </Helmet>
      
      <StarterKitBuilder />
    </>
  );
};

export default AdminKits;