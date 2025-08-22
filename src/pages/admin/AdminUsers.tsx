import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import EnhancedUserManagement from '@/components/admin/EnhancedUserManagement';
import { supabaseAdmin } from '@/lib/supabase';

const AdminUsers = () => {
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    // Fetch initial user count
    const fetchUserCount = async () => {
      try {
        const { count } = await supabaseAdmin
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });
        setUserCount(count || 0);
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