export interface VendorOffer {
  id: string;
  vendorName: string;
  url: string;
  price: number;
  lastUpdated: string;
}

export interface ProductData {
  id: string;
  name: string;
  category: string;
  brand: string;
  price?: number;
  dimensions?: string;
  weight?: string;
  material?: string;
  features?: string[];
  imageUrl?: string;
  asin?: string;
  affiliateLink?: string;
  createdAt: string;
  updatedAt: string;
  vendor_offers?: VendorOffer[];
}

export interface ProductManagementProps {
  totalProducts: number;
  onProductCountChange: (count: number) => void;
}

// New interface for advanced filters
export interface AdvancedFilters {
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  material?: string;
  weight?: string;
}