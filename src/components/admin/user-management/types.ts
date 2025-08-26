export interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  role?: string;
  email_confirmed_at?: string;
  is_active?: boolean;
}

export interface UserManagementProps {
  totalUsers: number;
  onUserCountChange: (count: number) => void;
}

export interface UserTableProps {
  users: UserData[];
  selectedUsers: Set<string>;
  handleSelectUser: (userId: string, checked: boolean) => void;
  handleSelectAll: (checked: boolean) => void;
  openEditDialog: (user: UserData) => void;
  openDeleteDialog: (user: UserData) => void;
  loading: boolean;
}

export interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  newUserEmail: string;
  setNewUserEmail: React.Dispatch<React.SetStateAction<string>>;
  newUserPassword: string;
  setNewUserPassword: React.Dispatch<React.SetStateAction<string>>;
  newUserRole: 'user' | 'editor' | 'admin';
  setNewUserRole: React.Dispatch<React.SetStateAction<'user' | 'editor' | 'admin'>>;
  inviteMode: 'invite' | 'create';
  setInviteMode: React.Dispatch<React.SetStateAction<'invite' | 'create'>>;
}

export interface EditUserFormProps {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  editUserRole: string;
  setEditUserRole: React.Dispatch<React.SetStateAction<string>>;
}

export interface FiltersProps {
  selectedRole: string;
  setSelectedRole: React.Dispatch<React.SetStateAction<string>>;
  selectedStatus: string;
  setSelectedStatus: React.Dispatch<React.SetStateAction<string>>;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

export interface SearchAndActionsProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  onSearch: () => void;
  onCreateUser: () => void;
  onImportUsers: () => void;
  onExportUsers: () => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}