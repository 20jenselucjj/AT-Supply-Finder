import React, { useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format, formatDistanceToNow } from 'date-fns';
import { Eye, Edit, Trash2, Mail, Calendar, Activity, AlertCircle, User, Shield, UserCog, MoreHorizontal } from 'lucide-react';
import { UserData, UserGridProps } from './types';

export const UserGrid: React.FC<UserGridProps> = ({
  users,
  selectedUsers,
  onUserSelect,
  onSelectAll,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onUserRoleChange,
  loading,
  sortBy,
  sortOrder,
  onSort
}) => {
  const isAllSelected = users.length > 0 && selectedUsers.length === users.length;
  const isIndeterminate = selectedUsers.length > 0 && selectedUsers.length < users.length;
  // Create refs for each dropdown to control their open/close state
  const dropdownRefs = useRef<{[key: string]: any}>({});

  const handleSort = (field: '$createdAt' | '$lastSignInAt' | 'email') => {
    onSort(field as any);
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
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                className="translate-y-0.5"
              />
            </TableHead>
            <TableHead className="w-12"></TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted"
              onClick={() => handleSort('email')}
            >
              <div className="flex items-center gap-1">
                Email {getSortIcon('email')}
              </div>
            </TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted"
              onClick={() => handleSort('$lastSignInAt')}
            >
              <div className="flex items-center gap-1">
                Last Sign In {getSortIcon('$lastSignInAt')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted"
              onClick={() => handleSort('$createdAt')}
            >
              <div className="flex items-center gap-1">
                Created {getSortIcon('$createdAt')}
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow 
              key={user.id} 
              className={`hover:bg-muted/50 ${selectedUsers.includes(user.id) ? 'bg-muted/30' : ''}`}
            >
              <TableCell>
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={() => onUserSelect(user.id)}
                  className="translate-y-0.5"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center">
                  <div className="bg-muted rounded-full p-2">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  <span className="truncate max-w-xs">{user.email}</span>
                </div>
              </TableCell>
              <TableCell>
                {/* Role Change Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Badge 
                        variant={user.role === 'admin' ? 'default' : user.role === 'editor' ? 'secondary' : 'outline'}
                        className="capitalize cursor-pointer"
                      >
                        {user.role || 'user'}
                        <MoreHorizontal className="ml-1 h-3 w-3" />
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-32">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onSelect={async () => {
                        await onUserRoleChange(user.id, 'admin');
                      }}>
                        <Shield className="h-4 w-4 mr-2" />
                        Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={async () => {
                        await onUserRoleChange(user.id, 'editor');
                      }}>
                        <UserCog className="h-4 w-4 mr-2" />
                        Editor
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={async () => {
                        await onUserRoleChange(user.id, 'user');
                      }}>
                        <User className="h-4 w-4 mr-2" />
                        User
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              <TableCell>
                {user.emailVerified ? (
                  <div className="flex items-center gap-1">
                    {user.is_active ? (
                      <>
                        <Activity className="h-4 w-4 text-green-500" />
                        <Badge variant="default" className="bg-green-500 hover:bg-green-500/90">
                          Active
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 text-yellow-500" />
                        <Badge variant="secondary" className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-700">
                          Inactive
                        </Badge>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                      Pending
                    </Badge>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {user.$lastSignInAt ? (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4 hidden sm:block" />
                      <span className="text-sm">
                        {(() => {
                          try {
                            return format(new Date(user.$lastSignInAt), 'MMM d, yyyy');
                          } catch (e) {
                            return 'Invalid date';
                          }
                        })()}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-5 sm:ml-0">
                      {(() => {
                        try {
                          return formatDistanceToNow(new Date(user.$lastSignInAt), { addSuffix: true });
                        } catch (e) {
                          return 'Invalid date';
                        }
                      })()}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Never</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4 hidden sm:block" />
                    <span className="text-sm">
                      {(() => {
                        try {
                          return format(new Date(user.$createdAt), 'MMM d, yyyy');
                        } catch (e) {
                          return 'Invalid date';
                        }
                      })()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-5 sm:ml-0">
                    {(() => {
                      try {
                        return formatDistanceToNow(new Date(user.$createdAt), { addSuffix: true });
                      } catch (e) {
                        return 'Invalid date';
                      }
                    })()}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {/* Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => onViewUser(user)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditUser(user)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuGroup>
                      <DropdownMenuItem 
                        onClick={() => onDeleteUser(user)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {users.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <User className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-medium mb-1">No users found</h3>
          <p className="text-sm">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};