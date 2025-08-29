import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Activity,
  Clock,
  Save,
  Key,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  UserCog
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { UserData } from './types';

interface EnhancedUserDetailViewProps {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (userId: string, updates: Partial<UserData>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onChangePassword: (userId: string, newPassword: string) => Promise<void>;
}

export const EnhancedUserDetailView: React.FC<EnhancedUserDetailViewProps> = ({ 
  user, 
  isOpen, 
  onClose,
  onUpdateUser,
  onDeleteUser,
  onChangePassword
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  React.useEffect(() => {
    if (user) {
      setEditedUser({ ...user });
    }
  }, [user]);

  const handleSave = async () => {
    if (!editedUser) return;
    
    try {
      await onUpdateUser(editedUser.id, editedUser);
      toast.success('User updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    
    try {
      await onDeleteUser(user.id);
      toast.success('User deleted successfully');
      onClose();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleChangePassword = async () => {
    if (!user || !newPassword) return;
    
    try {
      await onChangePassword(user.id, newPassword);
      toast.success('Password changed successfully');
      setNewPassword('');
      setIsChangingPassword(false);
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    }
  };

  if (!user || !editedUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="bg-muted rounded-full p-2">
              <User className="h-6 w-6" />
            </div>
            User Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about {user.email}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Header Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="bg-muted rounded-full p-4 w-16 h-16 flex items-center justify-center">
                    <User className="h-8 w-8" />
                  </div>
                </div>
                
                <div className="flex-grow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold">{user.email}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge 
                          variant={user.role === 'admin' ? 'default' : user.role === 'editor' ? 'secondary' : 'outline'}
                          className="capitalize"
                        >
                          {user.role || 'user'}
                        </Badge>
                        {user.is_active ? (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-500/90">
                            <Activity className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">
                            <Clock className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                        {user.emailVerified ? (
                          <Badge variant="outline" className="border-green-500 text-green-500">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                            <UserX className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {!isEditing && (
                      <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
                        <UserCog className="h-4 w-4 mr-2" />
                        Edit User
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Basic user information and account status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    value={editedUser.email}
                    onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <span className="font-medium">{user.email}</span>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                {isEditing ? (
                  <Select
                    value={editedUser.role}
                    onValueChange={(value) => setEditedUser({ ...editedUser, role: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>Role</span>
                    </div>
                    <Badge variant={user.role === 'admin' ? 'default' : user.role === 'editor' ? 'secondary' : 'outline'}>
                      {user.role || 'user'}
                    </Badge>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                {isEditing ? (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <span>Active</span>
                    <Switch
                      id="status"
                      checked={editedUser.is_active}
                      onCheckedChange={(checked) => setEditedUser({ ...editedUser, is_active: checked })}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      <span>Status</span>
                    </div>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                )}
              </div>
              
              {isEditing && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update user's password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isChangingPassword ? (
                <Button onClick={() => setIsChangingPassword(true)} variant="outline" className="w-full">
                  Change Password
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsChangingPassword(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleChangePassword} disabled={!newPassword}>
                      Update Password
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Account Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Account Timeline
              </CardTitle>
              <CardDescription>
                Important dates and account activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {(() => {
                      try {
                        return format(new Date(user.$createdAt), 'MMM d, yyyy h:mm a');
                      } catch (e) {
                        return 'Invalid date';
                      }
                    })()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(() => {
                      try {
                        return formatDistanceToNow(new Date(user.$createdAt), { addSuffix: true });
                      } catch (e) {
                        return 'Invalid date';
                      }
                    })()}
                  </div>
                </div>
              </div>
              
              {user.$lastSignInAt && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Last Sign In</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {(() => {
                          try {
                            return format(new Date(user.$lastSignInAt), 'MMM d, yyyy h:mm a');
                          } catch (e) {
                            return 'Invalid date';
                          }
                        })()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(() => {
                          try {
                            return formatDistanceToNow(new Date(user.$lastSignInAt), { addSuffix: true });
                          } catch (e) {
                            return 'Invalid date';
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <Button variant="destructive" onClick={handleDeleteUser} className="w-full sm:w-auto">
              Delete User
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};