import { Product, VendorOffer } from './types';
import { supabase } from './supabase';

interface ProductCache {
  products: Product[];
  lastUpdated: number;
  searchTerm: string;
}

class AmazonProductService {
  private cache: Map<string, ProductCache> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  // Search for athletic training products
  async searchAthleticProducts(searchTerm: string = 'athletic training supplies', forceRefresh: boolean = false): Promise<Product[]> {
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

  // Get product by ASIN/ID
  async getProductById(id: string): Promise<Product | null> {
    try {
      // Get from database by ID or ASIN
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor_offers (
            id,
            vendor_name,
            url,
            price,
            last_updated
          )
        `)
        .or(`id.eq.${id},asin.eq.${id}`)
        .single();

      if (error || !data) {
        return null;
      }

      return this.transformDatabaseProduct(data);
    } catch (error) {
      console.error('Error getting product by ID:', error);
      return null;
    }
  }

  // Get popular athletic training categories
  async getPopularCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);
      
      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))];
      return uniqueCategories;
    } catch (error) {
      console.error('Error getting categories from database:', error);
      return [];
    }
  }

  // Get products from database
  private async getProductsFromDatabase(searchTerm?: string, category?: string, maxResults: number = 50): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          vendor_offers (
            id,
            vendor_name,
            url,
            price,
            last_updated
          )
        `);

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query.limit(maxResults);

      if (error) {
        console.error('Error fetching products from database:', error);
        return [];
      }

      return (data || []).map(this.transformDatabaseProduct);
    } catch (error) {
      console.error('Error getting products from database:', error);
      return [];
    }
  }

  // Transform database product to our Product interface
  private transformDatabaseProduct(dbProduct: any): Product {
    const offers: VendorOffer[] = (dbProduct.vendor_offers || []).map((offer: any) => ({
      name: offer.vendor_name,
      url: offer.url,
      price: offer.price,
      lastUpdated: offer.last_updated
    }));

    return {
      id: dbProduct.id,
      name: dbProduct.name,
      category: dbProduct.category,
      brand: dbProduct.brand,
      rating: dbProduct.rating,
      price: dbProduct.price,
      features: dbProduct.features || [],
      offers: offers,
      imageUrl: dbProduct.image_url,
      asin: dbProduct.asin,
      affiliateLink: dbProduct.affiliate_link,
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