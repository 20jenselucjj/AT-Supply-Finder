import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { databases, account, client } from '@/lib/appwrite';
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
  FileText
} from 'lucide-react';
import { 
  UserData, 
  FilterOptions, 
  BulkOperation, 
  EnhancedUserManagementProps 
} from './types';
import { UserGrid } from './UserGrid';
import { UserFilters } from './UserFilters';
import { UserActions } from './UserActions';
import { CreateUserForm } from './CreateUserForm';
import { UserDetailView } from '@/components/admin/UserDetailView';
import { ID, Query } from 'appwrite';

const usersPerPage = 10;

export const EnhancedUserManagementRefactored: React.FC<EnhancedUserManagementProps> = ({ 
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
  const [newUserRole, setNewUserRole] = useState<'user' | 'editor' | 'admin'>('user');
  const [inviteMode, setInviteMode] = useState<'invite' | 'create'>('invite');
  const [isImportUsersOpen, setIsImportUsersOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isUserDetailViewOpen, setIsUserDetailViewOpen] = useState(false);
  const [newUserPassword, setNewUserPassword] = useState('');
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  const fetchUsers = async (page = 1, filterOptions = filters) => {
    try {
      setLoading(true);

      // Build queries for Appwrite
      let queries = [];
      
      // Apply search filter
      if (filterOptions.search) {
        queries.push(Query.search('email', filterOptions.search));
      }

      // Apply sorting
      if (sortBy) {
        if (sortOrder === 'asc') {
          queries.push(Query.orderAsc(sortBy));
        } else {
          queries.push(Query.orderDesc(sortBy));
        }
      }

      // Apply pagination
      queries.push(Query.offset((page - 1) * usersPerPage));
      queries.push(Query.limit(usersPerPage));

      // Fetch users from Appwrite users service
      const response = await account.listIdentities(queries);

      const usersData = response.identities || [];
      const count = response.total || 0;

      // Fetch user roles to combine with user data
      const rolesResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'userRoles'
      );

      const userRolesMap = rolesResponse.documents.reduce((acc: any, roleDoc: any) => {
        acc[roleDoc.userId] = roleDoc.role;
        return acc;
      }, {});

      const transformedUsers = usersData.map((user: any) => ({
        id: user.$id,
        email: user.email || 'No email',
        $createdAt: user.$createdAt,
        $lastSignInAt: user.$updatedAt, // Using updatedAt as last sign in for now
        role: userRolesMap[user.$id] || 'user',
        emailVerified: user.emailVerification ? true : false,
        is_active: true // Assuming all users are active for now
      }));

      setUsers(transformedUsers);
      setTotalPages(Math.ceil((count || 0) / usersPerPage));
      onUserCountChange(count || 0);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(`Failed to fetch users: ${error.message || 'Please try again.'}`);
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
            try {
              // Check if user role already exists
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
              await account.deleteIdentity(userId);
            } catch (error: any) {
              console.error('Error deleting user:', error);
              toast.error(`Failed to delete user ${userId}: ${error.message || 'Unknown error'}`);
            }
          }
          toast.success(`Deleted ${selectedUsers.length} users`);
          break;

        case 'export':
          // Export functionality would be implemented here
          toast.info('Export functionality would be implemented here');
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

      let userId: string;

      if (inviteMode === 'invite') {
        // For invitation, we would typically send an email with a link to create an account
        // This is a simplified version - in a real app, you would implement proper invitation logic
        toast.info('In a real implementation, you would send an invitation email here');
        return;
      } else {
        // Create user directly with password using Appwrite Account API
        try {
          const user = await account.create(
            ID.unique(),
            newUserEmail,
            newUserPassword
          );
          userId = user.$id;
          
          // Confirm email (in a real app, you would send a confirmation email)
          // await account.updateEmailVerification(userId, true); // This method doesn't exist
          // In Appwrite, email verification is typically handled through the verification flow
        } catch (error: any) {
          toast.error(`Failed to create user: ${error.message || 'Unknown error'}`);
          return;
        }
      }

      // Assign role to the new user if not 'user' (default)
      if (newUserRole !== 'user') {
        try {
          await databases.createDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'userRoles',
            ID.unique(),
            {
              userId: userId,
              role: newUserRole
            }
          );
        } catch (error: any) {
          console.warn('Failed to assign role, but user was created:', error.message);
          toast.warning(`User created but role assignment failed: ${error.message || 'Unknown error'}`);
        }
      }

      toast.success('User created successfully');
      setIsCreateUserOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      fetchUsers(currentPage, filters);
    } catch (error: any) {
      console.error('Error creating/inviting user:', error);
      toast.error(`Failed to create/invite user: ${error.message || 'Unknown error'}`);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = (checked: boolean | string) => {
    if (checked) {
      setSelectedUsers(users.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setIsUserDetailViewOpen(true);
  };

  const handleEditUser = (user: UserData) => {
    // Edit user functionality would be implemented here
    toast.info('Edit user functionality would be implemented here');
  };

  const handleDeleteUser = (user: UserData) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Delete user using Appwrite Account API
      await account.deleteIdentity(userToDelete.id);
      
      // Also delete user role if exists
      try {
        const rolesResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'userRoles',
          [Query.equal('userId', userToDelete.id)]
        );
        
        if (rolesResponse.total > 0) {
          await databases.deleteDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'userRoles',
            rolesResponse.documents[0].$id
          );
        }
      } catch (error) {
        console.warn('Failed to delete user role:', error);
      }
      
      toast.success('User deleted successfully');
      fetchUsers(currentPage, filters);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error.message || 'Unknown error'}`);
    } finally {
      setUserToDelete(null);
    }
  };

  const handleCloseDeleteDialog = () => {
    setUserToDelete(null);
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchUsers(1, filters);
  };

  const handleResetFilters = () => {
    const resetFilters: FilterOptions = {
      role: 'all',
      status: 'all',
      dateRange: 'all',
      search: ''
    };
    setFilters(resetFilters);
    setCurrentPage(1);
    fetchUsers(1, resetFilters);
  };

  const handleSort = (field: '$createdAt' | '$lastSignInAt' | 'email') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleImportUsers = () => {
    toast.info('Import users functionality would be implemented here');
  };

  const handleExportUsers = () => {
    toast.info('Export users functionality would be implemented here');
  };

  useEffect(() => {
    fetchUsers(currentPage, filters);
  }, [currentPage, sortBy, sortOrder]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Enhanced User Management
              </CardTitle>
              <CardDescription>Manage users with advanced features and analytics</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => fetchUsers(currentPage, filters)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UserActions
            selectedUsers={selectedUsers}
            onBulkOperation={handleBulkOperation}
            onCreateUser={() => setIsCreateUserOpen(true)}
            onImportUsers={handleImportUsers}
            onExportUsers={handleExportUsers}
          />
          
          <UserFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
          />
          
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              Showing {users.length} of {totalUsers} users
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
          
          <UserGrid
            users={users}
            selectedUsers={selectedUsers}
            onUserSelect={handleUserSelect}
            onSelectAll={handleSelectAll}
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            loading={loading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <CreateUserForm
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        onSubmit={handleCreateUser}
        newUserEmail={newUserEmail}
        setNewUserEmail={setNewUserEmail}
        newUserPassword={newUserPassword}
        setNewUserPassword={setNewUserPassword}
        newUserRole={newUserRole}
        setNewUserRole={setNewUserRole}
        inviteMode={inviteMode}
        setInviteMode={setInviteMode}
      />
      
      <AlertDialog open={!!userToDelete} onOpenChange={handleCloseDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.email}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <UserDetailView
        user={selectedUser}
        open={isUserDetailViewOpen}
        onOpenChange={setIsUserDetailViewOpen}
        onUserUpdated={() => {
          // Refresh user data when user is updated
          fetchUsers(currentPage, filters);
        }}
      />
    </motion.div>
  );
};