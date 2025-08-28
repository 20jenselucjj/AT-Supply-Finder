import { Product, VendorOffer } from './types';
import { databases } from './appwrite';

interface ProductCache {
  products: Product[];
  lastUpdated: number;
  searchTerm: string;
}

class AmazonProductService {
  private cache: Map<string, ProductCache> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  // Search for athletic training products
  async searchAthleticProducts(searchTerm: string = 'medical equipment supplies', forceRefresh: boolean = false): Promise<Product[]> {
    const cacheKey = `athletic_${searchTerm}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached results if available and not expired
    if (!forceRefresh && cached && (Date.now() - cached.lastUpdated) < this.CACHE_DURATION) {
      return cached.products;
    }

    try {
      // Get products from database
      const products = await this.getProductsFromDatabase(searchTerm);

      // Cache the results
      this.cache.set(cacheKey, {
        products,
        lastUpdated: Date.now(),
        searchTerm
      });

      return products;
    } catch (error) {
      console.error('Error searching athletic products:', error);
      return [];
    }
  }

  // Search for specific products
  async searchProducts(keywords: string, category?: string, maxResults: number = 20): Promise<Product[]> {
    const cacheKey = `search_${keywords}_${category || 'all'}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.lastUpdated) < this.CACHE_DURATION) {
      return cached.products;
    }

    try {
      // Get products from database
      const products = await this.getProductsFromDatabase(keywords, category, maxResults);

      // Cache the results
      this.cache.set(cacheKey, {
        products,
        lastUpdated: Date.now(),
        searchTerm: keywords
      });

      return products;
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  // Get product by ID
  async getProductById(id: string): Promise<Product | null> {
    try {
      // Get from database by ID
      const response = await databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        id
      );

      if (!response) {
        return null;
      }

      return this.transformDatabaseProduct(response);
    } catch (error) {
      console.error('Error getting product by ID:', error);
      return null;
    }
  }

  // Get popular athletic training categories
  async getPopularCategories(): Promise<string[]> {
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products'
      );

      if (!response) {
        console.error('No response from database');
        return [];
      }

      const uniqueCategories = [...new Set(response.documents.map((item: any) => item.category).filter(Boolean))];
      return uniqueCategories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Get products from database
  private async getProductsFromDatabase(searchTerm?: string, category?: string, maxResults: number = 50): Promise<Product[]> {
    try {
      let queries: string[] = [];

      if (searchTerm) {
        queries.push(`search("name", "${searchTerm}")`);
      }

      if (category && category !== 'all') {
        queries.push(`equal("category", "${category}")`);
      }

      // Add limit
      queries.push(`limit(${maxResults})`);

      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        queries
      );

      if (!response) {
        console.error('No response from database');
        return [];
      }

      return (response.documents || []).map(this.transformDatabaseProduct);
    } catch (error) {
      console.error('Error getting products from database:', error);
      return [];
    }
  }

  // Transform database product to our Product interface
  private transformDatabaseProduct(dbProduct: any): Product {
    // Parse features if it's a string
    let features: string[] = [];
    if (typeof dbProduct.features === 'string') {
      // If features is a comma-separated string, split it
      features = dbProduct.features.split(',').map((f: string) => f.trim()).filter(Boolean);
    } else if (Array.isArray(dbProduct.features)) {
      features = dbProduct.features;
    }

    return {
      id: dbProduct.$id,
      name: dbProduct.name,
      category: dbProduct.category,
      brand: dbProduct.brand,
      rating: dbProduct.rating,
      price: dbProduct.price,
      features: features,
      offers: [], // Appwrite doesn't have direct relationships like Supabase, so we'll need to fetch offers separately if needed
      imageUrl: dbProduct.imageUrl,
      asin: dbProduct.asin,
      affiliateLink: dbProduct.affiliateLink,
      dimensions: dbProduct.dimensions,
      weight: dbProduct.weight,
      material: dbProduct.material
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const amazonProductService = new AmazonProductService();
export { AmazonProductService };