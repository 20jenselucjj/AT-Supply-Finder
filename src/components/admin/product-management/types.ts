export interface VendorOffer {
  id: string;
  vendor_name: string;
  url: string;
  price: number;
  last_updated: string;
}

export interface ProductData {
  id: string;
  name: string;
  category: string;
  brand: string;
  rating?: number;
  price?: number;
  dimensions?: string;
  weight?: string;
  material?: string;
  features?: string[];
  image_url?: string;
  asin?: string;
  affiliate_link?: string;
  created_at: string;
  updated_at: string;
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
  minRating?: number;
  maxRating?: number;
  brand?: string;
  material?: string;
  weight?: string;
}