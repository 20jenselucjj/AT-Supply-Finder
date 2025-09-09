import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  User,
  UserPlus, 
  UserX, 
  Shield, 
  Download, 
  Upload,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  UserCog,
  ChevronRight
} from 'lucide-react';
import { BulkOperation } from './types';
import { toast } from 'sonner';

interface BulkActionsProps {
  selectedUsers: string[];
  onBulkOperation: (operation: BulkOperation) => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({ selectedUsers, onBulkOperation }) => {
  const [isRoleChangeOpen, setIsRoleChangeOpen] = useState(false);
  const [isStatusChangeOpen, setIsStatusChangeOpen] = useState(false);

  const handleRoleChange = (role: string) => {
    onBulkOperation({ type: 'role_change', value: role });
    setIsRoleChangeOpen(false);
  };

  const handleStatusChange = (status: string) => {
    onBulkOperation({ type: 'status_change', value: status });
    setIsStatusChangeOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
        </span>
        <Badge variant="secondary">{selectedUsers.length}</Badge>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {/* Role Change Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={selectedUsers.length === 0}>
              <UserCog className="h-4 w-4 mr-2" />
              Change Role
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => handleRoleChange('admin')}>
                <Shield className="h-4 w-4 mr-2" />
                Make Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleChange('editor')}>
                <UserCog className="h-4 w-4 mr-2" />
                Make Editor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleChange('user')}>
                <User className="h-4 w-4 mr-2" />
                Make User
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Main Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={selectedUsers.length === 0}>
              <MoreHorizontal className="h-4 w-4 mr-2" />
              More Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuItem 
                onClick={() => onBulkOperation({ type: 'delete' })}
                className="text-destructive focus:text-destructive"
              >
                <UserX className="h-4 w-4 mr-2" />
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              <DropdownMenuItem 
                onClick={() => onBulkOperation({ type: 'export' })}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Import functionality would be implemented here')}>
                <Upload className="h-4 w-4 mr-2" />
                Import Users
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};