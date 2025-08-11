export interface VendorOffer {
  name: string;
  url: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  features?: string[];
  offers: VendorOffer[];
  imageUrl?: string;
  asin?: string;
}