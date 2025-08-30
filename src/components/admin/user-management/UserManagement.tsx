import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { databases, account } from '@/lib/appwrite';
import { toast } from 'sonner';
import { 
  User, 
  RefreshCw, 
  Filter,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  FileText,
  Search,
  SlidersHorizontal,
  Download,
  Upload,
  Shield
} from 'lucide-react';
import { 
  UserData, 
  FilterOptions, 
  BulkOperation, 
  UserManagementProps 
} from './types';
import { UserGrid } from './UserGrid';
import { UserFilters } from './UserFilters';
import { BulkActions } from './BulkActions';
import { CreateUserForm } from './CreateUserForm';
import { SearchAndFilters } from './SearchAndFilters';
import { ImportUsersDialog } from './ImportUsersDialog';
import { Pagination } from './Pagination';
import { EnhancedUserDetailView } from './EnhancedUserDetailView';
import { ID, Query } from 'appwrite';

const usersPerPage = 10;

export const UserManagement: React.FC<UserManagementProps> = ({ 
  totalUsers, 
  onUserCountChange 
}) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterOptions>({
    role: 'all',
    status: 'all',
    dateRange: 'all',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'$createdAt' | '$lastSignInAt' | 'email'>('$createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'editor' | 'admin'>('user');
  const [inviteMode, setInviteMode] = useState<'invite' | 'create'>('invite');
  const [isImportUsersOpen, setIsImportUsersOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isUserDetailViewOpen, setIsUserDetailViewOpen] = useState(false);
  const [newUserPassword, setNewUserPassword] = useState('');
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate user statistics
  const activeUsers = users.filter(user => user.is_active).length;
  const pendingUsers = users.filter(user => !user.emailVerified).length;
  const adminUsers = users.filter(user => user.role === 'admin').length;

  const fetchUsers = async (page = 1, filterOptions = filters) => {
    try {
      setLoading(true);
      
      const params = {
        search: filterOptions.search || '',
        page: page.toString(),
        limit: usersPerPage.toString()
      };
      
      console.log('Calling Appwrite function with params:', params);
      
      // Import the functions object from appwrite.ts
      const { functions } = await import('@/lib/appwrite');
      
      // Get the function ID from environment variables
      const functionId = import.meta.env.VITE_APPWRITE_LIST_USERS_FUNCTION_ID;
      
      if (!functionId) {
        throw new Error('Missing Appwrite function ID in environment variables');
      }
      
      // Execute the Appwrite function
      const execution = await functions.createExecution(
        functionId,
        JSON.stringify(params),
        false // synchronous execution
      );
      
      if (execution.status !== 'completed') {
        throw new Error(`Function execution failed: ${execution.status}`);
      }
      
      // Parse the response
      const responseData = execution.responseBody ? JSON.parse(execution.responseBody) : {};
      console.log('Server response data:', responseData);
      
      // Handle both success and error responses
      if (responseData.success === false) {
        throw new Error(responseData.error || 'Function execution failed');
      }
      
      // Properly handle the response structure from the Appwrite function
      if (responseData.data && responseData.data.users) {
        console.log('Raw user data from server:', responseData.data.users);
        
        const transformedUsers = responseData.data.users
          .filter((user: any) => user.id) // Filter out users without IDs
          .map((user: any) => ({
            id: user.id || '',
            email: user.email || 'No email',
            $createdAt: user.createdAt || new Date().toISOString(),
            $lastSignInAt: user.lastSignInAt || user.accessedAt,
            role: user.role || 'user',
            emailVerified: user.emailVerification ? true : false,
            is_active: user.lastSignInAt || user.accessedAt ? 
              new Date(user.lastSignInAt || user.accessedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : 
              false
          }));

        console.log('Transformed users:', transformedUsers);
        
        // Apply role filter
        let filteredUsers = transformedUsers;
        if (filterOptions.role && filterOptions.role !== 'all') {
          filteredUsers = filteredUsers.filter(user => user.role === filterOptions.role);
        }

        // Apply status filter
        if (filterOptions.status === 'active') {
          filteredUsers = filteredUsers.filter(user => user.is_active);
        } else if (filterOptions.status === 'inactive') {
          filteredUsers = filteredUsers.filter(user => !user.is_active);
        } else if (filterOptions.status === 'pending') {
          filteredUsers = filteredUsers.filter(user => !user.emailVerified);
        }

        console.log('Filtered users:', filteredUsers);
        
        setUsers(filteredUsers);
        setTotalPages(Math.ceil((responseData.data.total || filteredUsers.length) / usersPerPage));
        onUserCountChange(responseData.data.total || filteredUsers.length);
      } else {
        console.error('Invalid response format:', responseData);
        setUsers([]);
        setTotalPages(1);
        onUserCountChange(0);
      }
    } catch (error) {
      console.error('Error fetching users from server:', error);
      toast.error('Failed to fetch users from server.');
      
      // Set empty state
      setUsers([]);
      setTotalPages(1);
      onUserCountChange(0);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkOperation = async (operation: BulkOperation) => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected');
      return;
    }

    try {
      switch (operation.type) {
        case 'role_change':
          if (!operation.value) return;
          
          for (const userId of selectedUsers) {
            // Update user role in Appwrite userRoles collection
            try {
              // First, check if user role exists
              const existingRoles = await databases.listDocuments(
                import.meta.env.VITE_APPWRITE_DATABASE_ID,
                'userRoles',
                [Query.equal('userId', userId)]
              );

              if (existingRoles.total > 0) {
                // Update existing role
                await databases.updateDocument(
                  import.meta.env.VITE_APPWRITE_DATABASE_ID,
                  'userRoles',
                  existingRoles.documents[0].$id,
                  { role: operation.value }
                );
              } else {
                // Create new role entry
                await databases.createDocument(
                  import.meta.env.VITE_APPWRITE_DATABASE_ID,
                  'userRoles',
                  ID.unique(),
                  {
                    userId: userId,
                    role: operation.value
                  }
                );
              }
            } catch (error: any) {
              console.error('Error updating role:', error);
              toast.error(`Failed to update role for user ${userId}: ${error.message || 'Unknown error'}`);
            }
          }
          toast.success(`Updated roles for ${selectedUsers.length} users`);
          break;

        case 'delete':
          for (const userId of selectedUsers) {
            try {
              await deleteUser(userId);
            } catch (error: any) {
              console.error('Error deleting user:', error);
              toast.error(`Failed to delete user ${userId}: ${error.message || 'Unknown error'}`);
            }
          }
          toast.success(`Deleted ${selectedUsers.length} users`);
          break;

        case 'export':
          // Export functionality would be implemented here
          const exportData = users
            .filter(user => selectedUsers.includes(user.id))
            .map(user => ({
              id: user.id,
              email: user.email,
              role: user.role,
              createdAt: user.$createdAt,
              lastSignInAt: user.$lastSignInAt,
              isActive: user.is_active
            }));
          
          const dataStr = JSON.stringify(exportData, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
          
          const exportFileDefaultName = `users-export-${new Date().toISOString().split('T')[0]}.json`;
          
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', exportFileDefaultName);
          linkElement.click();
          
          toast.success(`Exported ${selectedUsers.length} users`);
          break;
      }
      
      // Refresh the user list
      fetchUsers(currentPage, filters);
      setSelectedUsers([]);
    } catch (error: any) {
      console.error('Error performing bulk operation:', error);
      toast.error(`Failed to perform bulk operation: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUserEmail) {
        toast.error('Email is required');
        return;
      }

      if (inviteMode === 'create' && !newUserPassword) {
        toast.error('Password is required for direct user creation');
        return;
      }

      // Create user using Appwrite function
      const { functions } = await import('@/lib/appwrite');
      
      const execution = await functions.createExecution(
        '68b211da003bfec2ae74', // user-management function ID
        JSON.stringify({
          action: 'createUser',
          email: newUserEmail,
          password: newUserPassword,
          name: newUserName,
          role: newUserRole
        }),
        false // synchronous execution
      );
      
      if (execution.status !== 'completed') {
        throw new Error(`Function execution failed: ${execution.status}`);
      }
      
      const responseData = execution.responseBody ? JSON.parse(execution.responseBody) : {};
      
      if (responseData.success === false) {
        throw new Error(responseData.error || 'Failed to create user');
      }
      toast.success('User created successfully!');

      setIsCreateUserOpen(false);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      setNewUserRole('user');
      
      // Refresh the user list
      fetchUsers(currentPage, filters);
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleImportUsers = (importedUsers: any[]) => {
    // Import functionality would be implemented here
    console.log('Importing users:', importedUsers);
    toast.info(`Would import ${importedUsers.length} users`);
    setIsImportUsersOpen(false);
    fetchUsers(currentPage, filters);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete.id);
      toast.success('User deleted successfully');
      
      // Refresh the user list
      fetchUsers(currentPage, filters);
      setUserToDelete(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error.message || 'Unknown error'}`);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const params = {
        action: 'delete',
        userId: userId
      };
      
      console.log('Deleting user with params:', params);
      
      // Import the functions object from appwrite.ts
      const { functions } = await import('@/lib/appwrite');
      
      // Get the function ID from environment variables
      const functionId = import.meta.env.VITE_APPWRITE_LIST_USERS_FUNCTION_ID;
      
      if (!functionId) {
        throw new Error('Missing Appwrite function ID in environment variables');
      }
      
      // Execute the Appwrite function
      const execution = await functions.createExecution(
        functionId,
        JSON.stringify(params),
        false // synchronous execution
      );
      
      if (execution.status !== 'completed') {
        throw new Error(`Function execution failed: ${execution.status}`);
      }
      
      // Parse the response
      const responseData = execution.responseBody ? JSON.parse(execution.responseBody) : {};
      console.log('Delete user response:', responseData);
      
      // Handle both success and error responses
      if (responseData.success === false) {
        throw new Error(responseData.error || responseData.message || 'Function execution failed');
      }
      
      return responseData;
    } catch (error) {
      console.error('Error in deleteUser:', error);
      throw error;
    }
  };

  const updateUser = async (userId: string, updates: Partial<UserData>) => {
    try {
      const params = {
        action: 'update',
        userId: userId,
        email: updates.email,
        // Remove name property since it doesn't exist in UserData type
        role: updates.role,
        status: updates.is_active !== undefined ? (updates.is_active ? 'active' : 'inactive') : undefined
      };
      
      console.log('Updating user with params:', params);
      
      // Import the functions object from appwrite.ts
      const { functions } = await import('@/lib/appwrite');
      
      // Get the function ID from environment variables
      const functionId = import.meta.env.VITE_APPWRITE_LIST_USERS_FUNCTION_ID;
      
      if (!functionId) {
        throw new Error('Missing Appwrite function ID in environment variables');
      }
      
      // Execute the Appwrite function
      const execution = await functions.createExecution(
        functionId,
        JSON.stringify(params),
        false // synchronous execution
      );
      
      if (execution.status !== 'completed') {
        throw new Error(`Function execution failed: ${execution.status}`);
      }
      
      // Parse the response
      const responseData = execution.responseBody ? JSON.parse(execution.responseBody) : {};
      console.log('Update user response:', responseData);
      
      // Handle both success and error responses
      if (responseData.success === false) {
        throw new Error(responseData.error || responseData.message || 'Function execution failed');
      }
      
      return responseData;
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  };

  const changeUserPassword = async (userId: string, newPassword: string) => {
    try {
      const params = {
        action: 'changePassword',
        userId: userId,
        newPassword: newPassword
      };
      
      console.log('Changing user password with params:', params);
      
      // Import the functions object from appwrite.ts
      const { functions } = await import('@/lib/appwrite');
      
      // Get the function ID from environment variables
      const functionId = import.meta.env.VITE_APPWRITE_LIST_USERS_FUNCTION_ID;
      
      if (!functionId) {
        throw new Error('Missing Appwrite function ID in environment variables');
      }
      
      // Execute the Appwrite function
      const execution = await functions.createExecution(
        functionId,
        JSON.stringify(params),
        false // synchronous execution
      );
      
      if (execution.status !== 'completed') {
        throw new Error(`Function execution failed: ${execution.status}`);
      }
      
      // Parse the response
      const responseData = execution.responseBody ? JSON.parse(execution.responseBody) : {};
      console.log('Change password response:', responseData);
      
      // Handle both success and error responses
      if (responseData.success === false) {
        throw new Error(responseData.error || responseData.message || 'Function execution failed');
      }
      
      return responseData;
    } catch (error) {
      console.error('Error in changeUserPassword:', error);
      throw error;
    }
  };

  // Add this new function to handle individual user role changes
  const handleUserRoleChange = async (userId: string, newRole: string) => {
    try {
      // Immediately update the UI to show the new role
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      
      await updateUser(userId, { role: newRole });
      toast.success('User role updated successfully');
    } catch (error: any) {
      // Revert the UI change if the update fails
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: users.find(u => u.id === userId)?.role || 'user' } : user
        )
      );
      console.error('Error updating user role:', error);
      toast.error(`Failed to update user role: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setIsUserDetailViewOpen(true);
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setIsUserDetailViewOpen(true);
  };

  const handleDeleteUserClick = (user: UserData) => {
    setUserToDelete(user);
  };

  const handleSort = (field: '$createdAt' | '$lastSignInAt' | 'email') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    
    // Refresh with new sort
    fetchUsers(currentPage, filters);
  };

  const handleSearch = () => {
    const newFilters = { ...filters, search: searchTerm };
    setFilters(newFilters);
    setCurrentPage(1);
    fetchUsers(1, newFilters);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchUsers(1, filters);
  };

  const handleResetFilters = () => {
    setFilters({
      role: 'all',
      status: 'all',
      dateRange: 'all',
      search: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
    fetchUsers(1, {
      role: 'all',
      status: 'all',
      dateRange: 'all',
      search: ''
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchUsers(page, filters);
  };

  useEffect(() => {
    fetchUsers(currentPage, filters);
  }, []);

  const hasActiveFilters = filters.role !== 'all' || filters.status !== 'all' || filters.dateRange !== 'all' || filters.search !== '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* User Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{activeUsers}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Users</p>
                <p className="text-2xl font-bold">{pendingUsers}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admin Users</p>
                <p className="text-2xl font-bold">{adminUsers}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Users className="h-6 w-6" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage users, roles, and permissions
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setIsImportUsersOpen(true)} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button onClick={() => handleBulkOperation({ type: 'export' })} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => fetchUsers(currentPage, filters)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setIsCreateUserOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Search users by email..."
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowFilters(!showFilters)}
                  className={hasActiveFilters ? "border-primary" : ""}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 h-2 w-2 rounded-full bg-primary"></span>
                  )}
                </Button>
              </div>
            </div>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <UserFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    onApplyFilters={handleApplyFilters}
                    onResetFilters={handleResetFilters}
                    showFilters={showFilters}
                    onToggleFilters={() => setShowFilters(!showFilters)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <BulkActions 
                selectedUsers={selectedUsers} 
                onBulkOperation={handleBulkOperation} 
              />
            </motion.div>
          )}
          
          {/* User Grid */}
          <UserGrid
            users={users}
            selectedUsers={selectedUsers}
            onUserSelect={handleSelectUser}
            onSelectAll={handleSelectAll}
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUserClick}
            onUserRoleChange={handleUserRoleChange}
            loading={loading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Dialogs and Forms */}
      <CreateUserForm
        isOpen={isCreateUserOpen}
        onClose={() => {
          setIsCreateUserOpen(false);
          setNewUserEmail('');
          setNewUserName('');
          setNewUserPassword('');
          setNewUserRole('user');
          setInviteMode('invite');
        }}
        onSubmit={handleCreateUser}
        newUserEmail={newUserEmail}
        setNewUserEmail={setNewUserEmail}
        newUserPassword={newUserPassword}
        setNewUserPassword={setNewUserPassword}
        newUserName={newUserName}
        setNewUserName={setNewUserName}
        newUserRole={newUserRole}
        setNewUserRole={setNewUserRole}
        inviteMode={inviteMode}
        setInviteMode={setInviteMode}
      />
      
      <ImportUsersDialog
        isOpen={isImportUsersOpen}
        onClose={() => setIsImportUsersOpen(false)}
        onImport={handleImportUsers}
      />
      
      <EnhancedUserDetailView
        user={selectedUser}
        isOpen={isUserDetailViewOpen}
        onClose={() => setIsUserDetailViewOpen(false)}
        onUpdateUser={updateUser}
        onDeleteUser={deleteUser}
        onChangePassword={changeUserPassword}
      />
      
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user 
              {userToDelete?.email && ` (${userToDelete.email})`} from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};