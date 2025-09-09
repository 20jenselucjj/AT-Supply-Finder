export interface StarterKitTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  estimatedCost?: number;
}

export interface ProductOption {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl?: string;
  price?: number;
}

export interface TemplateForm {
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  estimatedCost: number;
}

export interface TemplateListProps {
  templates: StarterKitTemplate[];
  loading: boolean;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  viewMode: 'grid' | 'list';
  onEditTemplate: (template: StarterKitTemplate) => void;
  onDeleteTemplate: (template: StarterKitTemplate) => void;
  onDuplicateTemplate: (template: StarterKitTemplate) => void;
}

export interface TemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  templateForm: TemplateForm;
  setTemplateForm: React.Dispatch<React.SetStateAction<TemplateForm>>;
  isEditing: boolean;
}

export interface TemplateFiltersProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  categories: string[];
  onSearch: () => void;
  onResetFilters: () => void;
}

export interface TemplateTableProps {
  templates: StarterKitTemplate[];
  onEditTemplate: (template: StarterKitTemplate) => void;
  onDeleteTemplate: (template: StarterKitTemplate) => void;
  onDuplicateTemplate: (template: StarterKitTemplate) => void;
  loading: boolean;
}

export interface TemplateGridProps {
  templates: StarterKitTemplate[];
  onEditTemplate: (template: StarterKitTemplate) => void;
  onDeleteTemplate: (template: StarterKitTemplate) => void;
  onDuplicateTemplate: (template: StarterKitTemplate) => void;
  loading: boolean;
}