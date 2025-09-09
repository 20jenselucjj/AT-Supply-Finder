import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Activity,
  Clock
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { UserData } from './types';

interface UserDetailViewProps {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserDetailView: React.FC<UserDetailViewProps> = ({ user, isOpen, onClose }) => {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about {user.email}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
                <span className="font-medium">{user.email}</span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Role</span>
                </div>
                <Badge variant={user.role === 'admin' ? 'default' : user.role === 'editor' ? 'secondary' : 'outline'}>
                  {user.role || 'user'}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span>Status</span>
                </div>
                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created</span>
                </div>
                <div className="text-right">
                  <div>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Last Sign In</span>
                    </div>
                    <div className="text-right">
                      <div>
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
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};