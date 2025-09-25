export interface ProductData {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number | null;
  dimensions: string | null;
  weight: string | null;
  material: string | null;
  features: string[];
  imageUrl: string | null;
  asin: string | null;
  affiliateLink: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductManagementProps {
  totalProducts: number;
  onProductCountChange: (count: number) => void;
}

export interface AdvancedFilters {
  minPrice?: number;
  maxPrice?: number;
  brand: string;
  material: string;
  weight: string;
}