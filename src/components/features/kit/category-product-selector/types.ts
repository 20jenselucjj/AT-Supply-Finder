import { Product } from "@/lib/types/types";
import { FirstAidCategory } from "../FirstAidCategories";

export interface CategoryProductSelectorProps {
  categoryId: string;
  onBack: () => void;
}

export interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  brandFilter: string;
  setBrandFilter: (brand: string) => void;
  priceRange: { min: string; max: string };
  setPriceRange: (range: { min: string; max: string }) => void;
  ratingFilter: string;
  setRatingFilter: (rating: string) => void;
  sortBy: "name" | "price" | "rating" | "brand";
  setSortBy: (sort: "name" | "price" | "rating" | "brand") => void;
  sortDirection: "asc" | "desc";
  setSortDirection: (direction: "asc" | "desc") => void;
  availableBrands: string[];
  clearAllFilters: () => void;
  products: Product[];
  filteredProducts: Product[];
  filtersExpanded: boolean;
  setFiltersExpanded: (expanded: boolean) => void;
}

export interface ProductGridViewProps {
  products: Product[];
  isProductInKit: (productId: string) => boolean;
  getProductQuantity: (productId: string) => number;
  handleProductToggle: (product: Product) => void;
  handleQuantityChange: (product: Product, change: number) => void;
  formatCurrency: (price: number) => string;
  setSelectedProduct: (product: Product | null) => void;
}

export interface ProductTableViewProps {
  products: Product[];
  isProductInKit: (productId: string) => boolean;
  getProductQuantity: (product: Product) => number;
  handleProductToggle: (product: Product) => void;
  handleQuantityChange: (product: Product, change: number) => void;
  formatCurrency: (price: number) => string;
  setSelectedProduct: (product: Product | null) => void;
  sortBy: "name" | "price" | "rating" | "brand";
  sortDirection: "asc" | "desc";
  handleSort: (field: "name" | "price" | "rating" | "brand") => void;
  getSortIcon: (field: "name" | "price" | "rating" | "brand") => JSX.Element | null;
}

export interface ProductCardProps {
  product: Product;
  isInKit: boolean;
  bestOffer: any;
  formatCurrency: (price: number) => string;
  setSelectedProduct: (product: Product | null) => void;
  handleProductToggle: (product: Product) => void;
  handleQuantityChange: (product: Product, change: number) => void;
  getProductQuantity: (productId: string) => number;
}

export interface ProductRowProps {
  product: Product;
  inKit: boolean;
  bestOffer: any;
  formatCurrency: (price: number) => string;
  setSelectedProduct: (product: Product | null) => void;
  handleProductToggle: (product: Product) => void;
  handleQuantityChange: (product: Product, change: number) => void;
  getProductQuantity: (productId: string) => number;
}

export interface ViewToggleProps {
  viewMode: "grid" | "table";
  setViewMode: (mode: "grid" | "table") => void;
}

export interface SortSelectProps {
  sortBy: "name" | "price" | "rating" | "brand";
  setSortBy: (sort: "name" | "price" | "rating" | "brand") => void;
}

export interface HeaderProps {
  category: FirstAidCategory;
  onBack: () => void;
  viewMode: "grid" | "table";
  setViewMode: (mode: "grid" | "table") => void;
}

export interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: "name" | "price" | "rating" | "brand";
  setSortBy: (sort: "name" | "price" | "rating" | "brand") => void;
}