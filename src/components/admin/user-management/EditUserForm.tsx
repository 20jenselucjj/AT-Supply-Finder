import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Edit, Mail, Shield } from 'lucide-react';
import { EditUserFormProps } from './types';

export const EditUserForm: React.FC<EditUserFormProps> = ({
  user,
  isOpen,
  onClose,
  onSubmit,
  editUserRole,
  setEditUserRole
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit User Role
          </DialogTitle>
          <DialogDescription>
            Update the role for {user?.email}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right flex items-center gap-1">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <div className="col-span-3">
              <div className="text-sm font-medium py-2">{user?.email}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Role
            </Label>
            <div className="col-span-3">
              <Select value={editUserRole} onValueChange={(value) => setEditUserRole(value)}>
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
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            Update Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};