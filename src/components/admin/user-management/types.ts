export interface UserData {
  id: string;
  email: string;
  $createdAt: string;
  $lastSignInAt?: string;
  role?: string;
  emailVerified?: boolean;
  raw_user_meta_data?: any;
  is_active?: boolean;
}

export interface FilterOptions {
  role: string;
  status: string;
  dateRange: string;
  search: string;
}

export interface BulkOperation {
  type: 'role_change' | 'status_change' | 'delete' | 'export';
  value?: string;
}

export interface UserManagementProps {
  totalUsers: number;
  onUserCountChange: (count: number) => void;
}

export interface UserGridProps {
  users: UserData[];
  selectedUsers: string[];
  onUserSelect: (userId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onViewUser: (user: UserData) => void;
  onEditUser: (user: UserData) => void;
  onDeleteUser: (user: UserData) => void;
  onUserRoleChange: (userId: string, newRole: string) => void;
  loading: boolean;
  sortBy: '$createdAt' | '$lastSignInAt' | 'email';
  sortOrder: 'asc' | 'desc';
  onSort: (field: '$createdAt' | '$lastSignInAt' | 'email') => void;
}

export interface UserFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export interface UserActionsProps {
  selectedUsers: string[];
  onBulkOperation: (operation: BulkOperation) => void;
  onCreateUser: () => void;
  onImportUsers: () => void;
  onExportUsers: () => void;
}

export interface UserDetailProps {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface CreateUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  newUserEmail: string;
  setNewUserEmail: React.Dispatch<React.SetStateAction<string>>;
  newUserPassword: string;
  setNewUserPassword: React.Dispatch<React.SetStateAction<string>>;
  newUserName: string;
  setNewUserName: React.Dispatch<React.SetStateAction<string>>;
  newUserRole: 'user' | 'editor' | 'admin';
  setNewUserRole: React.Dispatch<React.SetStateAction<'user' | 'editor' | 'admin'>>;
  inviteMode: 'invite' | 'create';
  setInviteMode: React.Dispatch<React.SetStateAction<'invite' | 'create'>>;
}