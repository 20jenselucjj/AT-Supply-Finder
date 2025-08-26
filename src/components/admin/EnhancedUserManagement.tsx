import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  User, 
  UserPlus, 
  Trash2, 
  Edit, 
  Shield, 
  Mail, 
  Calendar, 
  UserX, 
  Search,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Clock,
  Activity,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Upload,
  FileText
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { UserDetailView } from '@/components/admin/UserDetailView';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  role?: string;
  email_confirmed_at?: string;
  raw_user_meta_data?: any;
  is_active?: boolean;
}

interface FilterOptions {
  role: string;
  status: string;
  dateRange: string;
  search: string;
}

interface BulkOperation {
  type: 'role_change' | 'status_change' | 'delete' | 'export';
  value?: string;
}

interface EnhancedUserManagementProps {
  totalUsers: number;
  onUserCountChange: (count: number) => void;
}

export const EnhancedUserManagement: React.FC<EnhancedUserManagementProps> = ({ 
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

  const usersPerPage = 10;

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
          const csvData = users
            .filter(user => selectedUsers.includes(user.id))
            .map(user => ({
              Email: user.email,
              Role: user.role,
              'Created At': format(new Date(user.created_at), 'yyyy-MM-dd HH:mm:ss'),
              'Last Sign In': user.last_sign_in_at ? 
                format(new Date(user.last_sign_in_at), 'yyyy-MM-dd HH:mm:ss') : 
                'Never',
              Status: user.is_active ? 'Active' : 'Inactive'
            }));

          const csv = [
            Object.keys(csvData[0]).join(','),
            ...csvData.map(row => Object.values(row).join(','))
          ].join('\n');

          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast.success('User data exported');
          break;
      }

      setSelectedUsers([]);
      fetchUsers(currentPage);
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      toast.error('Failed to perform bulk operation. Please try again.');
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUserEmail) {
        toast.error('Email is required');
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUserEmail)) {
        toast.error('Please enter a valid email address');
        return;
      }

      // Password required for direct creation
      if (inviteMode === 'create' && !newUserPassword) {
        toast.error('Password is required for direct user creation');
        return;
      }

      const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin');
      if (adminError || !isAdminResult) {
        toast.error('You must be an admin to create users.');
        return;
      }

      if (inviteMode === 'invite') {
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          newUserEmail,
          {
            redirectTo: `${window.location.origin}/set-password`,
            data: { role: newUserRole }
          }
        );

        if (inviteError) {
          toast.error(`Failed to send invite: ${inviteError.message}`);
          return;
        }

        if (newUserRole !== 'user' && inviteData.user) {
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: inviteData.user.id, role: newUserRole });

          if (roleError) {
            console.error('Error assigning role:', roleError);
            toast.error('Invite sent but role assignment failed');
            return;
          }
        }

        toast.success(`Invitation sent successfully to ${newUserEmail}!`);
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
            toast.error('User created but role assignment failed');
            return;
          }
        }

        toast.success(`User ${newUserEmail} created successfully!`);
      }

      setIsCreateUserOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      fetchUsers(currentPage);
    } catch (error) {
      console.error('Error creating/inviting user:', error);
      toast.error('Failed to create/invite user. Please try again.');
    }
  };

  const handleImportUsers = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
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
      fetchUsers(currentPage);
      setIsImportUsersOpen(false);
    } catch (error) {
      console.error('Error importing users:', error);
      toast.error('Failed to import users');
    }
  };

  const getUserStatusBadge = (user: UserData) => {
    if (!user.email_confirmed_at) {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
    }
    if (user.is_active) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Active</Badge>;
    }
    return <Badge variant="secondary" className="text-gray-600">Inactive</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 border-red-300',
      editor: 'bg-blue-100 text-blue-800 border-blue-300',
      user: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    
    return (
      <Badge variant="outline" className={colors[role as keyof typeof colors] || colors.user}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setIsUserDetailViewOpen(true);
  };

  const handleEditUser = (user: UserData) => {
    toast.info(`Edit functionality for ${user.email} coming soon!`);
    // TODO: Implement user edit dialog
  };

  const handleUserMenu = (user: UserData) => {
    toast.info(`User menu for ${user.email} coming soon!`);
    // TODO: Implement dropdown menu with actions
  };

  useEffect(() => {
    fetchUsers(1);
  }, [filters, sortBy, sortOrder]);

  return (
    <div className="space-y-6">

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">Active in last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => !u.email_confirmed_at).length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting email confirmation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground">Administrative accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                {users.length} of {totalUsers} users
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-9 w-64"
                />
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsCreateUserOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(currentPage)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid gap-4 sm:grid-cols-3 pt-4 border-t">
                  <div>
                    <Label htmlFor="role-filter">Role</Label>
                    <Select 
                      value={filters.role} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
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
                      value={filters.status} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
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
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>

        {/* Bulk Operations */}
        <AnimatePresence>
          {selectedUsers.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t bg-muted/30 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedUsers([])}
                  >
                    Clear Selection
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Select onValueChange={(value) => handleBulkOperation({ type: 'role_change', value })}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Change Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Set as Admin</SelectItem>
                      <SelectItem value="editor">Set as Editor</SelectItem>
                      <SelectItem value="user">Set as User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkOperation({ type: 'export' })}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Users</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}? 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleBulkOperation({ type: 'delete' })}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Users
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers(users.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="group">
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers(prev => [...prev, user.id]);
                          } else {
                            setSelectedUsers(prev => prev.filter(id => id !== user.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{user.email}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role || 'user')}</TableCell>
                    <TableCell>{getUserStatusBadge(user)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(user.created_at), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in_at ? (
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewUser(user)}
                          title="View user details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleUserMenu(user)}
                          title="More actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
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
      )}
      
      <UserDetailView 
        user={selectedUser}
        open={isUserDetailViewOpen}
        onOpenChange={setIsUserDetailViewOpen}
        onUserUpdated={() => fetchUsers(currentPage)}
      />
      
      {/* Create User Dialog */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create/Invite User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. You can either invite them via email or create an account directly.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="col-span-3"
                placeholder="user@example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as any)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mode" className="text-right">
                Mode
              </Label>
              <Select value={inviteMode} onValueChange={(value) => setInviteMode(value as any)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invite">Send Invite</SelectItem>
                  <SelectItem value="create">Create Directly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteMode === 'create' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="col-span-3"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleCreateUser}>
              {inviteMode === 'invite' ? 'Send Invite' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedUserManagement;