export interface VendorOffer {
  name: string;
  url: string;
  price: number;
  lastUpdated: string; // ISO date format
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number; // 1-5 stars
  title: string;
  comment: string;
  date: string; // ISO date format
  verified: boolean;
  helpfulVotes: number;
  totalVotes: number;
}

export interface ProductSpecifications {
  dimensions?: string;
  weight?: string;
  quantity?: string;
  material?: string;
  materials?: string;
  color?: string;
  size?: string;
  capacity?: string;
  resistance?: string;
  durability?: string;
  warranty?: string;
  certifications?: string[];
  ageRange?: string;
  skillLevel?: string;
  maxLoad?: string;
  powerSource?: string;
  batteryLife?: string;
  waterResistance?: string;
  temperature?: string;
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
  image_url?: string;
  asin?: string;
  affiliateLink?: string;
  compatibleWith?: string[];
  dimensions?: string;
  weight?: string;
  material?: string;
  materials?: string;
  isFavorite?: boolean;
  specifications?: ProductSpecifications;
  description?: string;
  reviews?: Review[];
  subcategory?: string;
  lastUpdated?: string;
  vendor_offers?: VendorOffer[];
}

export interface KitItem {
  id: string;
  product_id?: string;
  product_name?: string;
  product_brand?: string;
  product_category?: string;
  product_image_url?: string;
  name: string;
  category: string;
  brand: string;
  quantity: number;
  price?: number;
  imageUrl?: string;
  offers: VendorOffer[];
  reasoning?: string;
}

export interface StarterKitTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  products: {
    productId: string;
    quantity: number;
    isRequired: boolean;
    notes?: string;
  }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  isPublished: boolean;
  featuredImage?: string;
  readTime?: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}