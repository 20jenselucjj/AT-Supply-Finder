import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { databases, account } from '@/lib/appwrite';
import { toast } from 'sonner';
import { useRBAC } from '@/hooks/use-rbac';
import { logger } from '@/lib/logger';
import { 
  UserData, 
  UserManagementProps 
} from './types';
import { UserTable } from './UserTable';
import { UserForm } from './UserForm';
import { EditUserForm } from './EditUserForm';
import { Filters } from './Filters';
import { SearchAndActions } from './SearchAndActions';

const usersPerPage = 10;

export const UserManagementRefactored: React.FC<UserManagementProps> = ({ totalUsers, onUserCountChange }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'last_sign_in_at' | 'email'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'editor' | 'admin'>('user');
  const [inviteMode, setInviteMode] = useState<'invite' | 'create'>('invite');
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editUserRole, setEditUserRole] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const { isAdmin } = useRBAC();

  const fetchUsers = async (page = 1, search = '', role = 'all', status = 'all') => {
    try {
      setLoading(true);

      // Check if current user is admin
      const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin');
      if (adminError || !isAdminResult) {
        toast.error('You must be an admin to view users.');
        setLoading(false);
        return;
      }

      // Build query with filters
      let query = supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .range((page - 1) * usersPerPage, page * usersPerPage - 1);

      // Apply search filter
      if (search) {
        query = query.ilike('email', `%${search}%`);
      }

      // Apply role filter
      if (role !== 'all') {
        query = query.eq('role', role);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data: usersData, error: usersError, count: profilesCount } = await query;

      if (usersError) {
        console.error('Error fetching user profiles:', usersError);
        toast.error('Failed to fetch users. Please ensure the user_profiles view is set up correctly.');
        return;
      }

      // Transform the data to match our UserData interface
      const usersWithRoles = usersData?.map((user: any) => ({
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
      
      setTotalPages(Math.ceil((profilesCount || 0) / usersPerPage));
      onUserCountChange(profilesCount || 0);

      // Apply status filter
      let filteredUsers = usersWithRoles;
      if (status === 'active') {
        filteredUsers = usersWithRoles.filter(user => user.is_active);
      } else if (status === 'inactive') {
        filteredUsers = usersWithRoles.filter(user => !user.is_active);
      } else if (status === 'pending') {
        filteredUsers = usersWithRoles.filter(user => !user.email_confirmed_at);
      }

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
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
          await logger.auditLog({
            action: 'INVITE_USER_FAILED',
            entity_type: 'USER',
            details: {
              email: newUserEmail,
              role: newUserRole,
              error: inviteError.message
            }
          });
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
            await logger.auditLog({
              action: 'ASSIGN_ROLE_FAILED',
              entity_type: 'USER',
              entity_id: inviteData.user.id,
              details: {
                email: newUserEmail,
                role: newUserRole,
                error: roleError.message
              }
            });
            toast.error('Invite sent but role assignment failed');
          }
        }

        await logger.auditLog({
          action: 'INVITE_USER',
          entity_type: 'USER',
          entity_id: inviteData.user?.id,
          details: {
            email: newUserEmail,
            role: newUserRole
          }
        });
        toast.success('Invitation sent successfully! User will receive an email to set their password.');
      } else {
        // Create user directly with password
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: newUserEmail,
          password: newUserPassword,
          email_confirm: true
        });

        if (createError) {
          await logger.auditLog({
            action: 'CREATE_USER_FAILED',
            entity_type: 'USER',
            details: {
              email: newUserEmail,
              error: createError.message
            }
          });
          toast.error(`Failed to create user: ${createError.message}`);
          return;
        }

        // Assign role to the new user if not 'user' (default)
        if (newUserRole !== 'user' && newUser.user) {
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: newUser.user.id, role: newUserRole });

          if (roleError) {
            await logger.auditLog({
              action: 'ASSIGN_ROLE_FAILED',
              entity_type: 'USER',
              entity_id: newUser.user.id,
              details: {
                email: newUserEmail,
                role: newUserRole,
                error: roleError.message
              }
            });
            console.warn('Failed to assign role, but user was created:', roleError.message);
          }
        }

        await logger.auditLog({
          action: 'CREATE_USER',
          entity_type: 'USER',
          entity_id: newUser.user?.id,
          details: {
            email: newUserEmail,
            role: newUserRole
          }
        });
        toast.success('User created successfully');
      }

      setIsCreateUserOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      fetchUsers(currentPage, searchTerm);
    } catch (error) {
      console.error('Error creating/inviting user:', error);
      await logger.auditLog({
        action: 'CREATE_USER_EXCEPTION',
        entity_type: 'USER',
        details: {
          email: newUserEmail,
          error: error instanceof Error ? error.message : String(error)
        }
      });
      toast.error('Failed to create/invite user');
    }
  };

  const handleUpdateUserRole = async () => {
    if (!editingUser) return;

    try {
      // Check if current user is admin
      const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin');
      if (adminError || !isAdminResult) {
        toast.error('You must be an admin to update user roles.');
        return;
      }

      if (editUserRole === 'user') {
        // Remove from user_roles table
        const { error: deleteError } = await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', editingUser.id);

        if (deleteError) {
          await logger.auditLog({
            action: 'REMOVE_ROLE_FAILED',
            entity_type: 'USER',
            entity_id: editingUser.id,
            details: {
              old_role: editingUser.role,
              error: deleteError.message
            }
          });
          toast.error(`Failed to remove role: ${deleteError.message}`);
          return;
        }
      } else {
        // Insert or update role
        const { error: upsertError } = await supabaseAdmin
          .from('user_roles')
          .upsert({ user_id: editingUser.id, role: editUserRole });

        if (upsertError) {
          await logger.auditLog({
            action: 'UPDATE_ROLE_FAILED',
            entity_type: 'USER',
            entity_id: editingUser.id,
            details: {
              old_role: editingUser.role,
              new_role: editUserRole,
              error: upsertError.message
            }
          });
          toast.error(`Failed to update role: ${upsertError.message}`);
          return;
        }
      }

      await logger.auditLog({
        action: 'UPDATE_ROLE',
        entity_type: 'USER',
        entity_id: editingUser.id,
        details: {
          old_role: editingUser.role,
          new_role: editUserRole
        }
      });
      toast.success('User role updated successfully');
      setEditingUser(null);
      fetchUsers(currentPage, searchTerm);
    } catch (error) {
      console.error('Error updating user role:', error);
      await logger.auditLog({
        action: 'UPDATE_ROLE_EXCEPTION',
        entity_type: 'USER',
        entity_id: editingUser?.id,
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      });
      toast.error('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Check if current user is admin
      const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin');
      if (adminError || !isAdminResult) {
        toast.error('You must be an admin to delete users.');
        return;
      }

      // Delete user from auth.users using admin client
      const { data: userData, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (fetchError) {
        await logger.auditLog({
          action: 'FETCH_USER_FOR_DELETE_FAILED',
          entity_type: 'USER',
          entity_id: userId,
          details: {
            error: fetchError.message
          }
        });
        toast.error(`Failed to fetch user data: ${fetchError.message}`);
        return;
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        await logger.auditLog({
          action: 'DELETE_USER_FAILED',
          entity_type: 'USER',
          entity_id: userId,
          details: {
            email: userData.user?.email,
            error: deleteError.message
          }
        });
        toast.error(`Failed to delete user: ${deleteError.message}`);
        return;
      }

      await logger.auditLog({
        action: 'DELETE_USER',
        entity_type: 'USER',
        entity_id: userId,
        details: {
          email: userData.user?.email
        }
      });
      toast.success('User deleted successfully');
      fetchUsers(currentPage, searchTerm);
    } catch (error) {
      console.error('Error deleting user:', error);
      await logger.auditLog({
        action: 'DELETE_USER_EXCEPTION',
        entity_type: 'USER',
        entity_id: userToDelete?.id,
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      });
      toast.error('Failed to delete user');
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const openEditDialog = (user: UserData) => {
    setEditingUser(user);
    setEditUserRole(user.role || 'user');
  };

  const openDeleteDialog = (user: UserData) => {
    setUserToDelete(user);
  };

  const closeDeleteDialog = () => {
    setUserToDelete(null);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      handleDeleteUser(userToDelete.id);
      closeDeleteDialog();
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers(1, searchTerm, selectedRole, selectedStatus);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchUsers(1, searchTerm, selectedRole, selectedStatus);
  };

  const handleResetFilters = () => {
    setSelectedRole('all');
    setSelectedStatus('all');
    setSearchTerm('');
    setCurrentPage(1);
    fetchUsers(1, '', 'all', 'all');
  };

  const hasActiveFilters = () => {
    return selectedRole !== 'all' || selectedStatus !== 'all' || searchTerm !== '';
  };

  const handleImportUsers = () => {
    toast.info('User import functionality would be implemented here');
  };

  const handleExportUsers = () => {
    toast.info('User export functionality would be implemented here');
  };

  useEffect(() => {
    fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
  }, [currentPage]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage users, roles, and permissions</CardDescription>
      </CardHeader>
      <CardContent>
        <SearchAndActions
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearch={handleSearch}
          onCreateUser={() => setIsCreateUserOpen(true)}
          onImportUsers={handleImportUsers}
          onExportUsers={handleExportUsers}
          hasActiveFilters={hasActiveFilters()}
          onResetFilters={handleResetFilters}
        />
        
        <Filters
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
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
        
        <UserTable
          users={users}
          selectedUsers={selectedUsers}
          handleSelectUser={handleSelectUser}
          handleSelectAll={handleSelectAll}
          openEditDialog={openEditDialog}
          openDeleteDialog={openDeleteDialog}
          loading={loading}
        />
        
        <div className="flex items-center justify-between mt-4">
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
      
      <UserForm
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
      
      <EditUserForm
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={handleUpdateUserRole}
        editUserRole={editUserRole}
        setEditUserRole={setEditUserRole}
      />
      
      <AlertDialog open={!!userToDelete} onOpenChange={closeDeleteDialog}>
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
    </Card>
  );
};