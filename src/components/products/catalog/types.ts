import { Product } from "@/lib/types";

export interface CatalogProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  retryCount: number;
  isRetrying: boolean;
  q: string;
  cat: string;
  sort: string;
  categories: string[];
  viewMode: 'grid' | 'list' | 'mobile';
  setViewMode: (mode: 'grid' | 'list' | 'mobile') => void;
  onSearch: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: string) => void;
  onRetry: () => void;
  onProductSelect: (product: Product) => void;
  selectedProduct: Product | null;
  isQuickViewOpen: boolean;
  setIsQuickViewOpen: (open: boolean) => void;
}

export interface ProductFiltersProps {
  q: string;
  cat: string;
  sort: string;
  categories: string[];
  onSearch: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: string) => void;
}

export interface ProductViewToggleProps {
  viewMode: 'grid' | 'list' | 'mobile';
  setViewMode: (mode: 'grid' | 'list' | 'mobile') => void;
}

export interface ProductListProps {
  products: Product[];
  viewMode: 'grid' | 'list' | 'mobile';
  onProductSelect: (product: Product) => void;
  loading: boolean;
}

export interface ErrorMessageProps {
  error: string | null;
  retryCount: number;
  isRetrying: boolean;
  onRetry: () => void;
}