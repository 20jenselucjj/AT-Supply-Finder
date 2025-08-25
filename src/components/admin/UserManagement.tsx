import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRBAC } from '@/hooks/use-rbac';
import { User, UserPlus, Trash2, Edit, Shield, Mail, Calendar, UserX, Upload, Download, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  role?: string;
  email_confirmed_at?: string;
  is_active?: boolean;
}

interface UserManagementProps {
  totalUsers: number;
  onUserCountChange: (count: number) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ totalUsers, onUserCountChange }) => {
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

      // Also remove from user_roles table (cascade should handle this, but let's be explicit)
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

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
        entity_id: userId,
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      });
      toast.error('Failed to delete user');
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      // Check if current user is admin
      const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin');
      if (adminError || !isAdminResult) {
        toast.error('You must be an admin to deactivate users.');
        return;
      }

      // Get user data before deactivating
      const { data: userData, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (fetchError) {
        await logger.auditLog({
          action: 'FETCH_USER_FOR_DEACTIVATE_FAILED',
          entity_type: 'USER',
          entity_id: userId,
          details: {
            error: fetchError.message
          }
        });
        toast.error(`Failed to fetch user data: ${fetchError.message}`);
        return;
      }

      // Update user to set email_confirmed_at to null (effectively deactivating)
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: false
      });

      if (error) {
        await logger.auditLog({
          action: 'DEACTIVATE_USER_FAILED',
          entity_type: 'USER',
          entity_id: userId,
          details: {
            email: userData.user?.email,
            error: error.message
          }
        });
        toast.error(`Failed to deactivate user: ${error.message}`);
        return;
      }

      await logger.auditLog({
        action: 'DEACTIVATE_USER',
        entity_type: 'USER',
        entity_id: userId,
        details: {
          email: userData.user?.email
        }
      });
      toast.success('User deactivated successfully');
      fetchUsers(currentPage, searchTerm);
    } catch (error) {
      console.error('Error deactivating user:', error);
      await logger.auditLog({
        action: 'DEACTIVATE_USER_EXCEPTION',
        entity_type: 'USER',
        entity_id: userId,
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      });
      toast.error('Failed to deactivate user');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'editor': return 'secondary';
      default: return 'outline';
    }
  };

  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    fetchUsers(1, searchTerm, selectedRole, selectedStatus);
  }, [searchTerm, selectedRole, selectedStatus]);

  const handleExportUsers = async () => {
    try {
      // Fetch all users for export
      const { data: allUsers, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*');

      if (error) {
        toast.error('Failed to fetch users for export');
        return;
      }

      // Convert to CSV
      const csvHeaders = ['Email', 'Role', 'Created At', 'Last Sign In', 'Status'];
      const csvRows = allUsers.map(user => [
        user.email || '',
        user.role || 'user',
        user.created_at ? format(new Date(user.created_at), 'yyyy-MM-dd HH:mm:ss') : '',
        user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'yyyy-MM-dd HH:mm:ss') : '',
        user.last_sign_in_at ? 
          (new Date(user.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? 'Active' : 'Inactive') : 
          'Pending'
      ]);

      const csvContent = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Users exported successfully');
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    }
  };

  const handleImportUsers = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length <= 1) {
        toast.error('CSV file is empty or invalid');
        return;
      }

      // Parse CSV (simple implementation)
      const headers = lines[0].split(',').map(h => h.trim());
      const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
      
      if (emailIndex === -1) {
        toast.error('CSV must contain an email column');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const email = values[emailIndex]?.trim();
        
        if (email && email.includes('@')) {
          try {
            await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
              redirectTo: `${window.location.origin}/set-password`
            });
            successCount++;
          } catch (error) {
            console.error(`Failed to invite ${email}:`, error);
            errorCount++;
          }
        }
      }

      toast.success(`Imported ${successCount} users successfully. ${errorCount} failed.`);
      fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
    } catch (error) {
      console.error('Error importing users:', error);
      toast.error('Failed to import users');
    } finally {
      setIsImporting(false);
    }
  };

  // Bulk selection functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
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

  const isAllSelected = users.length > 0 && selectedUsers.size === users.length;
  const isIndeterminate = selectedUsers.size > 0 && selectedUsers.size < users.length;

  useEffect(() => {
    fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
    
    // Set up real-time subscription for user changes
    const channel = supabase
      .channel('user-management-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_profiles' },
        (payload) => {
          console.log('New user added:', payload.new);
          // Refresh the user list when a new user is added
          fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_profiles' },
        (payload) => {
          console.log('User updated:', payload.new);
          // Refresh the user list when a user is updated
          fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'user_profiles' },
        (payload) => {
          console.log('User deleted:', payload.old);
          // Refresh the user list when a user is deleted
          fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPage, selectedRole, selectedStatus, sortBy, sortOrder]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions. Total users: {totalUsers}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportUsers}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <div className="relative">
                <Input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id="import-users"
                  onChange={handleImportUsers}
                  disabled={isImporting}
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('import-users')?.click()}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </>
                  )}
                </Button>
              </div>
              <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-1 text-xs px-2 py-1 h-8 xs:gap-2 xs:text-sm xs:px-3 xs:py-1.5 xs:h-9 sm:px-4 sm:py-2 sm:h-10">
                    <UserPlus className="h-3 w-3 xs:h-4 xs:w-4" />
                    <span className="hidden xs:inline">Create/Invite User</span>
                    <span className="xs:hidden">Add</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create/Invite New User</DialogTitle>
                    <DialogDescription>
                      Send an invitation email or create a user account directly.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Mode</Label>
                      <Select value={inviteMode} onValueChange={(value: 'invite' | 'create') => setInviteMode(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="invite">Send Invitation Email</SelectItem>
                          <SelectItem value="create">Create User Directly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="user@example.com"
                      />
                    </div>
                    {inviteMode === 'create' && (
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          placeholder="Enter password"
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={newUserRole} onValueChange={(value: 'user' | 'editor' | 'admin') => setNewUserRole(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateUser}>
                      {inviteMode === 'invite' ? 'Send Invitation' : 'Create User'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid gap-4 mb-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="role-filter">Role</Label>
                <Select 
                  value={selectedRole} 
                  onValueChange={setSelectedRole}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select 
                  value={selectedStatus} 
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sort-filter">Sort By</Label>
                <Select 
                  value={`${sortBy}-${sortOrder}`} 
                  onValueChange={(value) => {
                    const [field, order] = value.split('-') as [typeof sortBy, typeof sortOrder];
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                    <SelectItem value="email-asc">Email A-Z</SelectItem>
                    <SelectItem value="email-desc">Email Z-A</SelectItem>
                    <SelectItem value="last_sign_in_at-desc">Recently Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          ref={(el) => {
                            if (el) el.indeterminate = isIndeterminate;
                          }}
                        />
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Sign In</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={user.role || 'user'} 
                            onValueChange={async (newRole) => {
                              try {
                                const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin');
                                if (adminError || !isAdminResult) {
                                  toast.error('You must be an admin to update user roles.');
                                  return;
                                }

                                if (newRole === 'user') {
                                  await supabaseAdmin
                                    .from('user_roles')
                                    .delete()
                                    .eq('user_id', user.id);
                                } else {
                                  await supabaseAdmin
                                    .from('user_roles')
                                    .upsert({ user_id: user.id, role: newRole });
                                }

                                toast.success('User role updated successfully');
                                fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
                              } catch (error) {
                                console.error('Error updating user role:', error);
                                toast.error('Failed to update user role');
                              }
                            }}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {user.email_confirmed_at ? (
                            user.is_active ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-gray-600">
                                Inactive
                              </Badge>
                            )
                          ) : (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(user.created_at), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.last_sign_in_at ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(user.last_sign_in_at), 'MMM dd, yyyy')}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" title="Deactivate User">
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to deactivate {user.email}? They will not be able to sign in until reactivated.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeactivateUser(user.id)}
                                    className="bg-orange-600 text-white hover:bg-orange-700"
                                  >
                                    Deactivate
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" title="Delete User">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete {user.email}? This action cannot be undone and will remove all user data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {users.map((user) => (
                  <Card key={user.id} className="p-4">
                    <div className="space-y-3">
                      {/* User Email */}
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{user.email}</span>
                      </div>
                      
                      {/* Role and Status */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <Label className="text-xs text-muted-foreground">Role</Label>
                          <Select 
                            value={user.role || 'user'} 
                            onValueChange={async (newRole) => {
                              try {
                                const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin');
                                if (adminError || !isAdminResult) {
                                  toast.error('You must be an admin to update user roles.');
                                  return;
                                }

                                if (newRole === 'user') {
                                  await supabaseAdmin
                                    .from('user_roles')
                                    .delete()
                                    .eq('user_id', user.id);
                                } else {
                                  await supabaseAdmin
                                    .from('user_roles')
                                    .upsert({ user_id: user.id, role: newRole });
                                }

                                toast.success('User role updated successfully');
                                fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
                              } catch (error) {
                                console.error('Error updating user role:', error);
                                toast.error('Failed to update user role');
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Status</Label>
                          <div className="mt-1">
                            {user.email_confirmed_at ? (
                              user.is_active ? (
                                <Badge variant="default" className="bg-green-100 text-green-800 border-green-300 text-xs">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-gray-600 text-xs">
                                  Inactive
                                </Badge>
                              )
                            ) : (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-xs">
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Created</Label>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(user.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      
                      {/* Last Sign In */}
                      <div>
                        <Label className="text-xs text-muted-foreground">Last Sign In</Label>
                        <div className="text-xs text-muted-foreground mt-1">
                          {user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMM dd, yyyy') : 'Never'}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 h-9">
                              <UserX className="h-4 w-4 mr-2" />
                              <span className="text-xs">Deactivate</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to deactivate {user.email}? They will not be able to sign in until reactivated.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeactivateUser(user.id)}
                                className="bg-orange-600 text-white hover:bg-orange-700"
                              >
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 h-9">
                              <Trash2 className="h-4 w-4 mr-2" />
                              <span className="text-xs">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to permanently delete {user.email}? This action cannot be undone and will remove all user data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};