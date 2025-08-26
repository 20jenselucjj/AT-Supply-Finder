import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { Eye, Edit, Trash2, Mail, Calendar, Activity, AlertCircle } from 'lucide-react';
import { UserData, UserGridProps } from './types';

export const UserGrid: React.FC<UserGridProps> = ({
  users,
  selectedUsers,
  onUserSelect,
  onSelectAll,
  onViewUser,
  onEditUser,
  onDeleteUser,
  loading,
  sortBy,
  sortOrder,
  onSort
}) => {
  const isAllSelected = users.length > 0 && selectedUsers.length === users.length;
  const isIndeterminate = selectedUsers.length > 0 && selectedUsers.length < users.length;

  const handleSort = (field: 'created_at' | 'last_sign_in_at' | 'email') => {
    onSort(field);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                className="translate-y-0.5"
              />
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('email')}
            >
              Email {getSortIcon('email')}
            </TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('last_sign_in_at')}
            >
              Last Sign In {getSortIcon('last_sign_in_at')}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('created_at')}
            >
              Created {getSortIcon('created_at')}
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/50">
              <TableCell>
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={() => onUserSelect(user.id)}
                  className="translate-y-0.5"
                />
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {user.email}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'default' : user.role === 'editor' ? 'secondary' : 'outline'}>
                  {user.role || 'user'}
                </Badge>
              </TableCell>
              <TableCell>
                {user.email_confirmed_at ? (
                  <div className="flex items-center gap-1">
                    {user.is_active ? (
                      <>
                        <Activity className="h-4 w-4 text-green-500" />
                        <Badge variant="default">Active</Badge>
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 text-yellow-500" />
                        <Badge variant="secondary">Inactive</Badge>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">Pending</Badge>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {user.last_sign_in_at ? (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span>{format(new Date(user.last_sign_in_at), 'MMM d, yyyy')}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })})
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Never</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(user.created_at), 'MMM d, yyyy')}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewUser(user)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditUser(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteUser(user)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {users.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          No users found. Try adjusting your filters.
        </div>
      )}
    </div>
  );
};