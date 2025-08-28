import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import EnhancedUserManagement from '@/components/admin/EnhancedUserManagement';
import { databases } from '@/lib/appwrite';

const AdminUsers = () => {
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    // Fetch initial user count
    const fetchUserCount = async () => {
      try {
        // Use Appwrite instead of Supabase
        const response = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'users',
          [JSON.stringify({ method: 'limit', values: [1000] })]
        );
        setUserCount(response.total || 0);
      } catch (error) {
        console.error('Error fetching user count:', error);
      }
    };

    fetchUserCount();
  }, []);

  return (
    <>
      <Helmet>
        <title>User Management | Admin Dashboard</title>
        <meta name="description" content="Manage users and permissions" />
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and access permissions</p>
        </div>
        
        <EnhancedUserManagement
          totalUsers={userCount}
          onUserCountChange={setUserCount}
        />
      </div>
    </>
  );
};

export default AdminUsers;