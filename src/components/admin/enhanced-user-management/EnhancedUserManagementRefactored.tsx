import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase, supabaseAdmin } from '@/lib/supabase';
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
  const [sortBy, setSortBy] = useState<'created_at' | 'last_sign_in_at' | 'email'>('created_at');
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

      // Check admin permissions
      const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin');
      if (adminError || !isAdminResult) {
        toast.error('You must be an admin to view users.');
        return;
      }

      // Build query with filters
      let query = supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filterOptions.role !== 'all') {
        query = query.eq('role', filterOptions.role);
      }

      if (filterOptions.search) {
        query = query.ilike('email', `%${filterOptions.search}%`);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      query = query.range((page - 1) * usersPerPage, page * usersPerPage - 1);

      const { data: usersData, error: usersError, count } = await query;

      if (usersError) {
        console.error('Error fetching users:', usersError);
        toast.error('Failed to fetch users');
        return;
      }

      const transformedUsers = usersData?.map((user: any) => ({
        id: user.id,
        email: user.email || 'No email',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        role: user.role || 'user',
        email_confirmed_at: user.email_confirmed_at,
        is_active: user.last_sign_in_at ? 
          new Date(user.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : 
          false
      })) || [];

      setUsers(transformedUsers);
      setTotalPages(Math.ceil((count || 0) / usersPerPage));
      onUserCountChange(count || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users. Please try again.');
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
            const { error } = await supabaseAdmin
              .from('user_roles')
              .upsert({ user_id: userId, role: operation.value });
            
            if (error) {
              console.error('Error updating role:', error);
              toast.error(`Failed to update role for user ${userId}`);
            }
          }
          toast.success(`Updated roles for ${selectedUsers.length} users`);
          break;

        case 'delete':
          for (const userId of selectedUsers) {
            const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (error) {
              console.error('Error deleting user:', error);
              toast.error(`Failed to delete user ${userId}`);
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
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      toast.error('Failed to perform bulk operation');
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

      // Check if current user is admin
      const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin');
      if (adminError || !isAdminResult) {
        toast.error('You must be an admin to create users.');
        return;
      }

      if (inviteMode === 'invite') {
        // Send invite email using Supabase Admin API
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          newUserEmail,
          {
            redirectTo: `${window.location.origin}/set-password`,
            data: {
              role: newUserRole
            }
          }
        );

        if (inviteError) {
          toast.error(`Failed to send invite: ${inviteError.message}`);
          return;
        }

        // Assign role in user_roles table if it's not the default 'user' role
        if (newUserRole !== 'user' && inviteData.user) {
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: inviteData.user.id,
              role: newUserRole
            });

          if (roleError) {
            console.error('Error assigning role:', roleError);
            toast.error('Invite sent but role assignment failed');
          }
        }

        toast.success('Invitation sent successfully! User will receive an email to set their password.');
      } else {
        // Create user directly with password
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: newUserEmail,
          password: newUserPassword,
          email_confirm: true
        });

        if (createError) {
          toast.error(`Failed to create user: ${createError.message}`);
          return;
        }

        // Assign role to the new user if not 'user' (default)
        if (newUserRole !== 'user' && newUser.user) {
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: newUser.user.id, role: newUserRole });

          if (roleError) {
            console.warn('Failed to assign role, but user was created:', roleError.message);
          }
        }

        toast.success('User created successfully');
      }

      setIsCreateUserOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      fetchUsers(currentPage, filters);
    } catch (error) {
      console.error('Error creating/inviting user:', error);
      toast.error('Failed to create/invite user');
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
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);
      if (error) {
        toast.error(`Failed to delete user: ${error.message}`);
        return;
      }

      toast.success('User deleted successfully');
      fetchUsers(currentPage, filters);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
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

  const handleSort = (field: 'created_at' | 'last_sign_in_at' | 'email') => {
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
        isOpen={isUserDetailViewOpen}
        onClose={() => setIsUserDetailViewOpen(false)}
      />
    </motion.div>
  );
};