export interface VendorOffer {
  name: string;
  url: string;
  price: number;
  lastUpdated: string; // ISO date format
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  rating?: number;
  price?: number;
  features?: string[];
  offers: VendorOffer[];
  imageUrl?: string;
  asin?: string;
  affiliateLink?: string;
  compatibleWith?: string[];
  dimensions?: string;
  weight?: string;
  material?: string;
  isFavorite?: boolean;
}