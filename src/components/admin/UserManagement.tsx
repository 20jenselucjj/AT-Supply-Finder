import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { toast } from 'sonner';
import { User, UserPlus, Trash2, Edit, Shield, Mail, Calendar, UserX } from 'lucide-react';
import { format } from 'date-fns';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  role?: string;
  email_confirmed_at?: string;
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
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'editor' | 'admin'>('user');
  const [inviteMode, setInviteMode] = useState<'invite' | 'create'>('invite');
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editUserRole, setEditUserRole] = useState('');

  const usersPerPage = 10;

  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);

      // Check if current user is admin
      const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin');
      if (adminError || !isAdminResult) {
        toast.error('You must be an admin to view users.');
        setLoading(false);
        return;
      }

      // Use the user_profiles view which includes role information
      const { data: usersData, error: usersError, count: profilesCount } = await supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .range((page - 1) * usersPerPage, page * usersPerPage - 1);

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
        role: user.role || 'user'
      })) || [];
      
      setTotalPages(Math.ceil((profilesCount || 0) / usersPerPage));
      onUserCountChange(profilesCount || 0);

      // Filter by search term if provided
      const filteredUsers = search
        ? usersWithRoles.filter(user =>
          user.email.toLowerCase().includes(search.toLowerCase())
        )
        : usersWithRoles;

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
      fetchUsers(currentPage, searchTerm);
    } catch (error) {
      console.error('Error creating/inviting user:', error);
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
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', editingUser.id);
      } else {
        // Insert or update role
        await supabaseAdmin
          .from('user_roles')
          .upsert({ user_id: editingUser.id, role: editUserRole });
      }

      toast.success('User role updated successfully');
      setEditingUser(null);
      fetchUsers(currentPage, searchTerm);
    } catch (error) {
      console.error('Error updating user role:', error);
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
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        toast.error(`Failed to delete user: ${deleteError.message}`);
        return;
      }

      // Also remove from user_roles table (cascade should handle this, but let's be explicit)
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      toast.success('User deleted successfully');
      fetchUsers(currentPage, searchTerm);
    } catch (error) {
      console.error('Error deleting user:', error);
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

      // Update user to set email_confirmed_at to null (effectively deactivating)
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: false
      });

      if (error) {
        toast.error(`Failed to deactivate user: ${error.message}`);
        return;
      }

      toast.success('User deactivated successfully');
      fetchUsers(currentPage, searchTerm);
    } catch (error) {
      console.error('Error deactivating user:', error);
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

  useEffect(() => {
    fetchUsers(currentPage, searchTerm);
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers(1, searchTerm);
  };

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
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search users by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} variant="outline">
              Search
            </Button>
          </div>

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
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Sign In</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
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
                                fetchUsers(currentPage, searchTerm);
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
                      
                      {/* Role and Dates */}
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
                                fetchUsers(currentPage, searchTerm);
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
                          <Label className="text-xs text-muted-foreground">Created</Label>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(user.created_at), 'MMM dd, yyyy')}
                          </div>
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