import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Analytics } from '@/components/pages/admin/Analytics';

const AdminAnalytics = () => {
  return (
    <>
      <Helmet>
        <title>Analytics | Admin Dashboard</title>
        <meta name="description" content="View analytics and system reports" />
      </Helmet>
      
      <Analytics />
    </>
  );
};

export default AdminAnalytics;