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
import { databases, account } from '@/lib/appwrite';
import { toast } from 'sonner';
import { useRBAC } from '@/hooks/use-rbac';
import { User, UserPlus, Trash2, Edit, Shield, Mail, Calendar, UserX, Upload, Download, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import { Query } from 'appwrite';

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

const usersPerPage = 10;

export const UserManagement: React.FC<UserManagementProps> = ({ totalUsers, onUserCountChange }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'$createdAt' | '$lastSignInAt' | 'email'>('$createdAt');
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

      // Build query with filters for Appwrite
      let queries: any[] = [];

      // Apply search filter
      if (search) {
        queries.push(Query.search('email', search));
      }

      // Apply role filter
      if (role !== 'all') {
        queries.push(Query.equal('role', role));
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
      const offset = (page - 1) * usersPerPage;
      queries.push(Query.limit(usersPerPage));
      queries.push(Query.offset(offset));

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
        [Query.limit(1000)]
      );

      // Transform the data to match our UserData interface
      const usersWithRoles = response.documents?.map((user: any) => ({
        id: user.$id,
        email: user.email || 'No email',
        created_at: user.$createdAt,
        last_sign_in_at: user.$lastSignInAt,
        role: user.role || 'user',
        email_confirmed_at: user.emailVerified ? new Date().toISOString() : undefined,
        is_active: user.$lastSignInAt ? 
          new Date(user.$lastSignInAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : 
          false
      })) || [];
      
      setTotalPages(Math.ceil((countResponse.total || 0) / usersPerPage));
      onUserCountChange(countResponse.total || 0);

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
          await logger.auditLog({
            action: 'CREATE_USER_FAILED',
            entity_type: 'USER',
            details: {
              email: newUserEmail,
              error: error.message
            }
          });
          toast.error(`Failed to create user: ${error.message}`);
          return;
        }
      }

      await logger.auditLog({
        action: 'CREATE_USER',
        entity_type: 'USER',
        details: {
          email: newUserEmail,
          role: newUserRole
        }
      });

      // Reset form
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setIsCreateUserOpen(false);

      // Refresh user list
      fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const handleUpdateUserRole = async () => {
    if (!editingUser) return;

    try {
      // In Appwrite, we'll assume the user has admin access if they can access this page
      // The route protection should be handled at the routing level

      // Update user role in Appwrite userRoles collection
      try {
        // First, check if user role exists
        const roleResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'userRoles',
          [Query.equal('userId', editingUser.id)]
        );
        
        if (roleResponse.documents && roleResponse.documents.length > 0) {
          // Update existing role with proper permissions
          await databases.updateDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'userRoles',
            roleResponse.documents[0].$id,
            {
              userId: editingUser.id,
              role: editUserRole
            },
            [
              `read("user:${editingUser.id}")`,
              `update("user:${editingUser.id}")`,
              `delete("user:${editingUser.id}")`
            ]
          );
        } else {
          // Create new role with proper permissions
          await databases.createDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'userRoles',
            'unique()',
            {
              userId: editingUser.id,
              role: editUserRole
            },
            [
              `read("user:${editingUser.id}")`,
              `update("user:${editingUser.id}")`,
              `delete("user:${editingUser.id}")`
            ]
          );
        }
      } catch (error) {
        await logger.auditLog({
          action: 'UPDATE_ROLE_FAILED',
          entity_type: 'USER',
          entity_id: editingUser.id,
          details: {
            old_role: editingUser.role,
            new_role: editUserRole,
            error: error instanceof Error ? error.message : String(error)
          }
        });
        toast.error(`Failed to update role: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
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
      fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
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
      // In Appwrite, we'll assume the user has admin access if they can access this page
      // The route protection should be handled at the routing level

      // Note: In Appwrite, we typically don't delete user accounts directly
      // Instead, we might mark them as inactive or delete related data
      // For now, we'll just show a message that this is not implemented
      
      toast.error('User deletion is not implemented in this version');
      
      // If we were to implement user deletion, it would look something like this:
      /*
      try {
        // Delete user document from users collection
        await databases.deleteDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'users',
          userId
        );
        
        // Also remove from userRoles collection
        const roleResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'userRoles',
          [Query.equal('userId', userId)]
        );
        
        if (roleResponse.documents && roleResponse.documents.length > 0) {
          await databases.deleteDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'userRoles',
            roleResponse.documents[0].$id
          );
        }
        
        await logger.auditLog({
          action: 'DELETE_USER',
          entity_type: 'USER',
          entity_id: userId,
          details: {
            message: 'User deleted successfully'
          }
        });
        toast.success('User deleted successfully');
        fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
      } catch (error) {
        await logger.auditLog({
          action: 'DELETE_USER_FAILED',
          entity_type: 'USER',
          entity_id: userId,
          details: {
            error: error instanceof Error ? error.message : String(error)
          }
        });
        toast.error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      */
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
      // In Appwrite, we'll assume the user has admin access if they can access this page
      // The route protection should be handled at the routing level

      // In Appwrite, we would typically update a user's status in our custom users collection
      // rather than directly modifying auth data
      
      toast.error('User deactivation is not implemented in this version');
      
      // If we were to implement user deactivation, it would look something like this:
      /*
      try {
        // Update user document to mark as inactive
        await databases.updateDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'users',
          userId,
          {
            isActive: false
          }
        );
        
        await logger.auditLog({
          action: 'DEACTIVATE_USER',
          entity_type: 'USER',
          entity_id: userId,
          details: {
            message: 'User deactivated successfully'
          }
        });
        toast.success('User deactivated successfully');
        fetchUsers(currentPage, searchTerm, selectedRole, selectedStatus);
      } catch (error) {
        await logger.auditLog({
          action: 'DEACTIVATE_USER_FAILED',
          entity_type: 'USER',
          entity_id: userId,
          details: {
            error: error instanceof Error ? error.message : String(error)
          }
        });
        toast.error(`Failed to deactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      */
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
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'users',
        [Query.limit(1000)]
      );

      if (!response.documents) {
        toast.error('Failed to fetch users for export');
        return;
      }

      // Convert to CSV
      const csvHeaders = ['Email', 'Role', 'Created At', 'Last Sign In', 'Status'];
      const csvRows = response.documents.map((user: any) => {
        const isActive = user.$lastSignInAt ? 
          new Date(user.$lastSignInAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : 
          false;
        const status = user.$lastSignInAt ? 
          (isActive ? 'Active' : 'Inactive') : 
          'Pending';
          
        return [
          user.email || '',
          user.role || 'user',
          user.$createdAt ? format(new Date(user.$createdAt), 'yyyy-MM-dd HH:mm:ss') : '',
          user.$lastSignInAt ? format(new Date(user.$lastSignInAt), 'yyyy-MM-dd HH:mm:ss') : '',
          status
        ];
      });

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
            // Appwrite doesn't have a direct equivalent to inviteUserByEmail
            // We'll need to implement our own invitation system
            toast.error('User import is not implemented in this version');
            errorCount++;
            // If we were to implement user import, it would look something like this:
            /*
            await account.create('unique()', email, 'temporaryPassword', email);
            successCount++;
            */
          } catch (error) {
            console.error(`Failed to process ${email}:`, error);
            errorCount++;
          }
        }
      }

      toast.success(`Processed ${successCount} users successfully. ${errorCount} failed.`);
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
    
    // In Appwrite, we don't have real-time subscriptions like Supabase
    // We'll rely on manual refreshes for now
    // TODO: Implement Appwrite real-time functionality if needed
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
                    <SelectItem value="$createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="$createdAt-asc">Oldest First</SelectItem>
                    <SelectItem value="email-asc">Email A-Z</SelectItem>
                    <SelectItem value="email-desc">Email Z-A</SelectItem>
                    <SelectItem value="$lastSignInAt-desc">Recently Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

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
                            if (el) (el as HTMLInputElement).indeterminate = isIndeterminate;
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
                                // In Appwrite, we'll use the databases service to manage user roles
                                // First, check if user role exists
                                const roleResponse = await databases.listDocuments(
                                  import.meta.env.VITE_APPWRITE_DATABASE_ID,
                                  'userRoles',
                                  [Query.equal('userId', user.id)]
                                );
                                
                                if (newRole === 'user' && roleResponse.documents && roleResponse.documents.length > 0) {
                                  // Delete role document for 'user' role
                                  await databases.deleteDocument(
                                    import.meta.env.VITE_APPWRITE_DATABASE_ID,
                                    'userRoles',
                                    roleResponse.documents[0].$id
                                  );
                                } else if (roleResponse.documents && roleResponse.documents.length > 0) {
                                  // Update existing role
                                  await databases.updateDocument(
                                    import.meta.env.VITE_APPWRITE_DATABASE_ID,
                                    'userRoles',
                                    roleResponse.documents[0].$id,
                                    { userId: user.id, role: newRole }
                                  );
                                } else if (newRole !== 'user') {
                                  // Create new role
                                  await databases.createDocument(
                                    import.meta.env.VITE_APPWRITE_DATABASE_ID,
                                    'userRoles',
                                    'unique()',
                                    { userId: user.id, role: newRole }
                                  );
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
                                // In Appwrite, we'll use the databases service to manage user roles
                                // First, check if user role exists
                                const roleResponse = await databases.listDocuments(
                                  import.meta.env.VITE_APPWRITE_DATABASE_ID,
                                  'userRoles',
                                  [Query.equal('userId', user.id)]
                                );
                                
                                if (newRole === 'user' && roleResponse.documents && roleResponse.documents.length > 0) {
                                  // Delete role document for 'user' role
                                  await databases.deleteDocument(
                                    import.meta.env.VITE_APPWRITE_DATABASE_ID,
                                    'userRoles',
                                    roleResponse.documents[0].$id
                                  );
                                } else if (roleResponse.documents && roleResponse.documents.length > 0) {
                                  // Update existing role
                                  await databases.updateDocument(
                                    import.meta.env.VITE_APPWRITE_DATABASE_ID,
                                    'userRoles',
                                    roleResponse.documents[0].$id,
                                    { userId: user.id, role: newRole }
                                  );
                                } else if (newRole !== 'user') {
                                  // Create new role
                                  await databases.createDocument(
                                    import.meta.env.VITE_APPWRITE_DATABASE_ID,
                                    'userRoles',
                                    'unique()',
                                    { userId: user.id, role: newRole }
                                  );
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