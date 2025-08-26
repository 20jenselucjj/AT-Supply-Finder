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
      
      <DashboardOverview />
    </>
  );
};

export default AdminDashboard;