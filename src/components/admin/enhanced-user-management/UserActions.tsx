import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Upload, Download, Trash2, Shield } from 'lucide-react';
import { BulkOperation, UserActionsProps } from './types';

export const UserActions: React.FC<UserActionsProps> = ({
  selectedUsers,
  onBulkOperation,
  onCreateUser,
  onImportUsers,
  onExportUsers
}) => {
  const handleBulkRoleChange = (role: string) => {
    onBulkOperation({ type: 'role_change', value: role });
  };

  const handleBulkDelete = () => {
    onBulkOperation({ type: 'delete' });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1 flex flex-wrap gap-2">
        <Button onClick={onCreateUser} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
        
        <Button variant="outline" onClick={onImportUsers} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Import
        </Button>
        
        <Button variant="outline" onClick={onExportUsers} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
        
        {selectedUsers.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <Select onValueChange={handleBulkRoleChange}>
                <SelectTrigger className="w-32">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Change Role</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete ({selectedUsers.length})
            </Button>
          </>
        )}
      </div>
    </div>
  );
};