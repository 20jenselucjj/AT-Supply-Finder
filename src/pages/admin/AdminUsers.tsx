import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { UserManagement } from '@/components/admin/user-management';
import { databases, functions } from '@/lib/appwrite';

const AdminUsers = () => {
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    // Fetch initial user count using the API endpoint as the primary method
    const fetchUserCount = async () => {
      try {
        // Use the working API endpoint directly as the primary method
        const response = await fetch('/api/list-users?page=1&limit=1');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setUserCount(data.data.total || 0);
            return;
          }
        }
      } catch (apiError) {
        console.error('Error fetching user count from API endpoint:', apiError);
        // Fallback to Appwrite Function
        try {
          const functionId = import.meta.env.VITE_APPWRITE_LIST_USERS_FUNCTION_ID;
          if (functionId) {
            // Execute the Appwrite Function to get user data
            const execution = await functions.createExecution(
              functionId,
              JSON.stringify({ page: 1, limit: 1 }), // We only need the total count
              false
            );
            
            if (execution.status === 'completed') {
              const data = JSON.parse(execution.responseBody || '{"users":[], "total": 0}');
              setUserCount(data.total || 0);
              return;
            }
          }
        } catch (functionError) {
          console.error('Error fetching user count from Appwrite function:', functionError);
          // Fallback to direct Appwrite query
          try {
            const response = await databases.listDocuments(
              import.meta.env.VITE_APPWRITE_DATABASE_ID,
              'users'
            );
            setUserCount(response.total || 0);
          } catch (fallbackError) {
            console.error('Error fetching user count from Appwrite:', fallbackError);
          }
        }
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage users, roles, and permissions</p>
          </div>
        </div>
        
        <UserManagement
          totalUsers={userCount}
          onUserCountChange={setUserCount}
        />
      </div>
    </>
  );
};

export default AdminUsers;