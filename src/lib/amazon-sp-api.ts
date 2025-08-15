import axios from 'axios';
import CryptoJS from 'crypto-js';

interface AmazonProduct {
  asin: string;
  title: string;
  brand?: string;
  category?: string;
  price?: number;
  rating?: number;
  imageUrl?: string;
  features?: string[];
  dimensions?: string;
  weight?: string;
  material?: string;
}

interface SearchProductsParams {
  keywords: string;
  category?: string;
  maxResults?: number;
}

class AmazonSPAPI {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private marketplaceId: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = import.meta.env.VITE_AMZN_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_AMZN_CLIENT_SECRET || '';
    this.refreshToken = import.meta.env.VITE_AMZN_SANDBOX_REFRESH_TOKEN || '';
    this.marketplaceId = import.meta.env.VITE_AMZN_MARKETPLACE_ID || 'ATVPDKIKX0DER';
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post('/api/amazon-auth', {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to authenticate with Amazon SP-API');
    }
  }

  async searchProducts({ keywords, category, maxResults = 20 }: SearchProductsParams): Promise<AmazonProduct[]> {
    try {
      const accessToken = await this.getAccessToken();
      
      // Use the Catalog Items API to search for products
      const response = await axios.get('/api/amazon-catalog-search', {
        params: {
          keywords,
          category,
          maxResults,
          marketplaceIds: this.marketplaceId
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return this.transformCatalogItems(response.data.items || []);
    } catch (error) {
      console.error('Error searching products:', error);
      throw new Error('Failed to search Amazon products');
    }
  }

  async getProductDetails(asin: string): Promise<AmazonProduct | null> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.get(`/api/amazon-product-details/${asin}`, {
        params: {
          marketplaceIds: this.marketplaceId,
          includedData: 'attributes,dimensions,identifiers,images,productTypes,relationships,salesRanks'
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.data && response.data.asin) {
        return this.transformProductDetails(response.data);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting product details:', error);
      return null;
    }
  }

  async getProductPricing(asins: string[]): Promise<Record<string, number>> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.get('/api/amazon-pricing', {
        params: {
          asins: asins.join(','),
          marketplaceId: this.marketplaceId
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const pricing: Record<string, number> = {};
      
      if (response.data && response.data.payload) {
        response.data.payload.forEach((item: any) => {
          if (item.ASIN && item.Product && item.Product.Offers) {
            const offers = item.Product.Offers;
            if (offers.length > 0 && offers[0].BuyingPrice) {
              pricing[item.ASIN] = parseFloat(offers[0].BuyingPrice.Amount);
            }
          }
        });
      }

      return pricing;
    } catch (error) {
      console.error('Error getting product pricing:', error);
      return {};
    }
  }

  private transformCatalogItems(items: any[]): AmazonProduct[] {
    return items.map(item => {
      const attributes = item.attributes || {};
      const images = item.images || [];
      
      return {
        asin: item.asin,
        title: attributes.item_name?.[0]?.value || 'Unknown Product',
        brand: attributes.brand?.[0]?.value,
        category: attributes.item_type_name?.[0]?.value,
        imageUrl: images[0]?.images?.[0]?.link,
        features: attributes.feature_bullets?.map((f: any) => f.value) || [],
        dimensions: attributes.item_dimensions?.[0]?.value,
        weight: attributes.item_weight?.[0]?.value,
        material: attributes.material_type?.[0]?.value
      };
    });
  }

  private transformProductDetails(product: any): AmazonProduct {
    const attributes = product.attributes || {};
    const images = product.images || [];
    
    return {
      asin: product.asin,
      title: attributes.item_name?.[0]?.value || 'Unknown Product',
      brand: attributes.brand?.[0]?.value,
      category: attributes.item_type_name?.[0]?.value,
      imageUrl: images[0]?.images?.[0]?.link,
      features: attributes.feature_bullets?.map((f: any) => f.value) || [],
      dimensions: attributes.item_dimensions?.[0]?.value,
      weight: attributes.item_weight?.[0]?.value,
      material: attributes.material_type?.[0]?.value
    };
  }

  // Helper method to search for athletic training products specifically
  async searchAthleticProducts(keywords: string = 'medical equipment supplies'): Promise<AmazonProduct[]> {
    const categories = [
      'Sports & Outdoors',
      'Health & Personal Care',
      'Industrial & Scientific'
    ];

    const allProducts: AmazonProduct[] = [];
    
    for (const category of categories) {
      try {
        const products = await this.searchProducts({
          keywords: `${keywords} tape bandage wrap`,
          category,
          maxResults: 10
        });
        allProducts.push(...products);
      } catch (error) {
        console.warn(`Failed to search in category ${category}:`, error);
      }
    }

    // Remove duplicates based on ASIN
    const uniqueProducts = allProducts.filter((product, index, self) => 
      index === self.findIndex(p => p.asin === product.asin)
    );

    return uniqueProducts.slice(0, 50); // Limit to 50 products
  }
}

export const amazonAPI = new AmazonSPAPI();
export type { AmazonProduct, SearchProductsParams };