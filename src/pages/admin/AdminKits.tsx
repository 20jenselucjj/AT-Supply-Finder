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
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Starter Kit Management</h1>
          <p className="text-muted-foreground">Create and manage starter kit templates for users</p>
        </div>
        
        <StarterKitBuilder />
      </div>
    </>
  );
};

export default AdminKits;