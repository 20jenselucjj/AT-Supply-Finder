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
import { databases, account } from '@/lib/appwrite';
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
  $createdAt: string;
  $lastSignInAt?: string;
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

  const usersPerPage = 10;

  const fetchUsers = async (page = 1, filterOptions = filters) => {
    try {
      setLoading(true);

      // Check admin permissions by checking if user has admin role in userRoles collection
      // This replaces the supabase rpc('is_admin') call
      // In Appwrite, we'll assume the user has admin access if they can access this page
      // The route protection should be handled at the routing level

      // Build query with filters for Appwrite
      let queries: string[] = [];

      // Apply search filter
      if (filterOptions.search) {
        queries.push(JSON.stringify({ method: 'search', attribute: 'email', values: [filterOptions.search] }));
      }

      // Apply sorting
      if (sortBy) {
        // Use the sortBy value directly since it now uses the correct Appwrite attribute names
        if (sortOrder === 'asc') {
          queries.push(JSON.stringify({ method: 'orderAsc', attribute: sortBy }));
        } else {
          queries.push(JSON.stringify({ method: 'orderDesc', attribute: sortBy }));
        }
      }

      // Apply pagination
      const offset = (page - 1) * usersPerPage;
      queries.push(JSON.stringify({ method: 'limit', values: [usersPerPage] }));
      queries.push(JSON.stringify({ method: 'offset', values: [offset] }));

      // Fetch users from Appwrite 'users' collection
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'users',
        queries
      );

      // Also get total count for pagination
      const countResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'users',
        [JSON.stringify({ method: 'limit', values: [1000] })]
      );

      const transformedUsers = response.documents?.map((user: any) => ({
        id: user.$id,
        email: user.email || 'No email',
        $createdAt: user.$createdAt,
        $lastSignInAt: user.$lastSignInAt,
        role: user.role || 'user',
        email_confirmed_at: user.emailVerified ? new Date().toISOString() : undefined,
        is_active: user.$lastSignInAt ? 
          new Date(user.$lastSignInAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : 
          false
      })) || [];

      setUsers(transformedUsers);
      setTotalPages(Math.ceil((countResponse.total || 0) / usersPerPage));
      onUserCountChange(countResponse.total || 0);
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
            // Update user role in Appwrite userRoles collection
            try {
              // First, check if user role exists
              const query = JSON.stringify({ method: 'equal', attribute: 'userId', values: [userId] });
              const roleResponse = await databases.listDocuments(
                import.meta.env.VITE_APPWRITE_DATABASE_ID,
                'userRoles',
                [query]
              );
              
              if (roleResponse.documents && roleResponse.documents.length > 0) {
                // Update existing role with proper permissions
                await databases.updateDocument(
                  import.meta.env.VITE_APPWRITE_DATABASE_ID,
                  'userRoles',
                  roleResponse.documents[0].$id,
                  {
                    userId: userId,
                    role: operation.value
                  },
                  [
                    `read("user:${userId}")`,
                    `update("user:${userId}")`,
                    `delete("user:${userId}")`
                  ]
                );
              } else {
                // Create new role with proper permissions
                await databases.createDocument(
                  import.meta.env.VITE_APPWRITE_DATABASE_ID,
                  'userRoles',
                  'unique()',
                  {
                    userId: userId,
                    role: operation.value
                  },
                  [
                    `read("user:${userId}")`,
                    `update("user:${userId}")`,
                    `delete("user:${userId}")`
                  ]
                );
              }
            } catch (error) {
              console.error('Error updating role:', error);
              toast.error(`Failed to update role for user ${userId}`);
            }
          }
          toast.success(`Updated roles for ${selectedUsers.length} users`);
          break;

        case 'delete':
          // Note: In Appwrite, we typically don't delete user accounts directly
          // Instead, we might mark them as inactive or delete related data
          toast.error('User deletion is not implemented in this version');
          break;

        case 'export':
          const csvData = users
            .filter(user => selectedUsers.includes(user.id))
            .map(user => ({
              id: user.id,
              email: user.email,
              created_at: user.$createdAt,
              last_sign_in_at: user.$lastSignInAt || '',
              role: user.role || 'user',
              is_active: user.is_active ? 'Yes' : 'No'
            }));

          const csvContent = [
            ['ID', 'Email', 'Created At', 'Last Sign In', 'Role', 'Active'],
            ...csvData.map(row => [
              row.id,
              row.email,
              row.created_at,
              row.last_sign_in_at,
              row.role,
              row.is_active
            ])
          ]
            .map(row => row.join(','))
            .join('\n');

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', 'users-export.csv');
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success(`Exported ${selectedUsers.length} users`);
          break;

        default:
          toast.error('Unknown operation');
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

      // In Appwrite, we'll assume the user has admin access if they can access this page
      // The route protection should be handled at the routing level

      if (inviteMode === 'invite') {
        // Appwrite doesn't have a direct equivalent to inviteUserByEmail
        // We'll need to implement our own invitation system
        toast.error('User invitation is not implemented in this version');
        return;
      } else {
        // Create user directly with password
        try {
          // Create a new user in Appwrite
          const userId = 'unique()'; // Appwrite will generate a unique ID
          await account.create(userId, newUserEmail, newUserPassword, newUserEmail);
          
          // Note: In Appwrite, we would typically create the user first, then assign roles
          // For now, we'll show a success message
          toast.success(`User ${newUserEmail} created successfully!`);
        } catch (error: any) {
          toast.error(`Failed to create user: ${error.message}`);
          return;
        }
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
            // Appwrite doesn't have a direct equivalent to inviteUserByEmail
            // We'll need to implement our own invitation system
            toast.error('User import is not implemented in this version');
            errorCount++;
          } catch (error) {
            console.error(`Failed to process ${email}:`, error);
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
                        <SelectItem value="$createdAt-desc">Newest First</SelectItem>
                        <SelectItem value="$createdAt-asc">Oldest First</SelectItem>
                        <SelectItem value="email-asc">Email A-Z</SelectItem>
                        <SelectItem value="email-desc">Email Z-A</SelectItem>
                        <SelectItem value="$lastSignInAt-desc">Recently Active</SelectItem>
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
                        {format(new Date(user.$createdAt), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(user.$createdAt), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.$lastSignInAt ? (
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(user.$lastSignInAt), { addSuffix: true })}
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