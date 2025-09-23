import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Product, KitItem } from '../types/types';

interface GeminiConfig {
  apiKey: string;
  model?: string;
}

interface KitGenerationRequest {
  userQuery: string;
  availableProducts: Product[];
  kitType?: 'basic' | 'travel' | 'workplace' | 'outdoor' | 'pediatric';
  scenario?: string;
  budget?: number;
  sportType?: string;
  skillLevel?: string;
}

interface GeneratedKit {
  name: string;
  description: string;
  items: KitItem[];
  totalPrice: number;
  reasoning: string;
}

class GeminiService {
  private client: GoogleGenerativeAI;
  private model: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map(); // Add cache
  private cacheExpiry: number = 30 * 60 * 1000; // 30 minutes cache expiry

  constructor(config: GeminiConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model || 'gemini-2.5-flash';
    this.cleanupCache(); // Clean up expired cache entries periodically
  }

  // Add cache cleanup method
  private cleanupCache(): void {
    setInterval(() => {
      const now = Date.now();
      this.cache.forEach((value, key) => {
        if (now - value.timestamp > this.cacheExpiry) {
          this.cache.delete(key);
        }
      });
    }, 5 * 60 * 1000); // Run cleanup every 5 minutes
  }

  // Cache helper methods
  private getCacheKey(prefix: string, ...args: any[]): string {
    return `${prefix}:${JSON.stringify(args)}`;
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data as T;
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async generateTrainingKit(request: KitGenerationRequest): Promise<GeneratedKit> {
    const { userQuery, availableProducts, sportType, skillLevel, budget } = request;

    // Use RAG to filter relevant products first
    const relevantProducts = await this.searchProducts(userQuery, availableProducts);
    
    if (relevantProducts.length === 0) {
      throw new Error('No relevant products found for your request. Please try a different query.');
    }

    // Create a structured prompt for kit generation
    const prompt = this.buildKitGenerationPrompt(userQuery, relevantProducts, sportType, skillLevel, budget);

    try {
      const model = this.client.getGenerativeModel({ model: this.model });
      
      const cacheKey = this.getCacheKey('generateContent', prompt);
      let generatedText = this.getCachedData<string>(cacheKey);
      
      if (!generatedText) {
        const result = await model.generateContent(prompt);
        generatedText = result.response.text();
        // Cache the result
        this.setCachedData(cacheKey, generatedText);
      }
      
      return this.parseKitResponse(generatedText, relevantProducts);
    } catch (error) {
      console.error('Error generating kit with Gemini:', error);
      throw new Error('Failed to generate training kit. Please try again.');
    }
  }

  async generateFirstAidKit(request: KitGenerationRequest): Promise<GeneratedKit> {
    const { userQuery, availableProducts, kitType, scenario, budget } = request;

    // Use RAG to filter relevant products first
    const relevantProducts = await this.searchProducts(userQuery, availableProducts);
    
    if (relevantProducts.length === 0) {
      throw new Error('No relevant first aid products found for your request. Please try a different query.');
    }

    // Create a structured prompt for kit generation
    const prompt = this.buildFirstAidKitGenerationPrompt(userQuery, relevantProducts, kitType, scenario, budget);

    try {
      const model = this.client.getGenerativeModel({ model: this.model });
      
      const cacheKey = this.getCacheKey('generateContent', prompt);
      let generatedText = this.getCachedData<string>(cacheKey);
      
      if (!generatedText) {
        const result = await model.generateContent(prompt);
        generatedText = result.response.text();
        // Cache the result
        this.setCachedData(cacheKey, generatedText);
      }
      
      return this.parseKitResponse(generatedText, relevantProducts);
    } catch (error) {
      console.error('Error generating first aid kit with Gemini:', error);
      throw new Error('Failed to generate first aid kit. Please try again.');
    }
  }

  private buildKitGenerationPrompt(
    userQuery: string,
    products: Product[],
    sportType?: string,
    skillLevel?: string,
    budget?: number
  ): string {
    const productCatalog = products.map(product => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.vendor_offers?.[0]?.price || 0,
      description: product.description,
      specifications: product.specifications
    }));

    return `You are an expert athletic trainer and sports equipment specialist. Your task is to create a personalized training kit based on the user's request.

User Request: "${userQuery}"
Sport Type: ${sportType || 'Not specified'}
Skill Level: ${skillLevel || 'Not specified'}
Budget: ${budget ? `$${budget}` : 'Not specified'}

Available Products:
${JSON.stringify(productCatalog, null, 2)}

Please create a comprehensive training kit that includes:
1. A descriptive name for the kit
2. A detailed description explaining the kit's purpose
3. Selected products from the catalog that best match the user's needs
4. Clear reasoning for each product selection
5. Total estimated price

Respond in the following JSON format:
{
  "name": "Kit Name",
  "description": "Detailed description of the kit and its benefits",
  "selectedProducts": [
    {
      "productId": "product_id_from_catalog",
      "quantity": 1,
      "reason": "Why this product was selected"
    }
  ],
  "totalPrice": 0,
  "reasoning": "Overall explanation of the kit composition and how it addresses the user's needs"
}

Guidelines:
- Select 3-8 products that work well together
- Consider the user's skill level and sport type
- Stay within budget if specified
- Prioritize quality and functionality
- Ensure products complement each other
- Only select products from the provided catalog`;
  }

  private buildFirstAidKitGenerationPrompt(
    userQuery: string,
    products: Product[],
    kitType?: string,
    scenario?: string,
    budget?: number
  ): string {
    const productCatalog = products.map(product => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.vendor_offers?.[0]?.price || 0,
      description: product.description,
      specifications: product.specifications
    }));

    return `You are an expert first aid specialist and medical supply specialist. Your task is to create a personalized first aid kit based on the user's request.

User Request: "${userQuery}"
Kit Type: ${kitType || 'Not specified'}
First Aid Scenario: ${scenario || 'Not specified'}
Budget: ${budget ? `$${budget}` : 'Not specified'}

Available Products:
${JSON.stringify(productCatalog, null, 2)}

Please create a comprehensive first aid kit that includes:
1. A descriptive name for the kit (keep it concise, under 50 characters)
2. A brief description explaining the kit's purpose for first aid situations (under 100 characters)
3. Selected products from the catalog that best match the user's needs
4. Clear reasoning for each product selection in a first aid context (be concise)
5. Total estimated price

Respond in the following JSON format:
{
  "name": "Kit Name",
  "description": "Brief description of the first aid kit",
  "selectedProducts": [
    {
      "productId": "product_id_from_catalog",
      "quantity": 1,
      "reason": "Why this product was selected for first aid purposes"
    }
  ],
  "totalPrice": 0,
  "reasoning": "Brief explanation of the kit composition (under 200 characters)"
}

Guidelines:
- Select 5-12 products that work well together for first aid situations
- Consider the kit type and scenario (e.g., basic home, travel, workplace, outdoor, pediatric)
- Stay within budget if specified
- Prioritize essential first aid supplies and quality medical equipment
- Ensure products complement each other for comprehensive first aid coverage
- Only select products from the provided catalog that are appropriate for first aid
- Keep all text concise and focused
- Focus on medical supplies, wound care, medications, instruments, and emergency equipment`;
  }

  private parseKitResponse(response: string, availableProducts: Product[]): GeneratedKit {
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Convert selected products to KitItem format
      const kitItems: KitItem[] = parsed.selectedProducts.map((item: any) => {
        const product = availableProducts.find(p => p.id === item.productId);
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        return {
          id: `kit-item-${Date.now()}-${Math.random()}`,
          product_id: product.id,
          product_name: product.name,
          product_brand: product.brand,
          product_category: product.category,
          product_image_url: product.image_url || product.imageUrl,
          name: product.name,
          category: product.category,
          brand: product.brand,
          quantity: item.quantity || 1,
          price: product.vendor_offers?.[0]?.price || product.price || 0,
          imageUrl: product.image_url || product.imageUrl,
          offers: product.vendor_offers || product.offers || [],
          reasoning: item.reason || ''
        };
      });

      return {
        name: parsed.name,
        description: parsed.description,
        items: kitItems,
        totalPrice: parsed.totalPrice,
        reasoning: parsed.reasoning
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error('Failed to parse AI response. Please try again.');
    }
  }

  async searchProducts(query: string, products: Product[]): Promise<Product[]> {
    const cacheKey = this.getCacheKey('searchProducts', query, products.length);
    const cachedResult = this.getCachedData<Product[]>(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    // Enhanced RAG system with semantic search and relevance scoring
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    // Score products based on relevance
    const scoredProducts = products.map(product => {
      let score = 0;
      const searchableFields = {
        name: product.name || '',
        brand: product.brand || '',
        category: product.category || '',
        description: product.description || '',
        features: Array.isArray(product.specifications?.['features']) ? product.specifications['features'].join(' ') : '',
        materials: Array.isArray(product.specifications?.materials) ? product.specifications.materials.join(' ') : ''
      };

      // Weight different fields differently
      const fieldWeights = {
        name: 3.0,
        brand: 2.0,
        category: 2.5,
        description: 1.5,
        features: 1.8,
        materials: 1.2
      };

      // Calculate relevance score
      Object.entries(searchableFields).forEach(([field, text]) => {
        const fieldText = text.toLowerCase();
        const weight = fieldWeights[field as keyof typeof fieldWeights];
        
        searchTerms.forEach(term => {
          // Exact match bonus
          if (fieldText.includes(term)) {
            score += weight * 2;
          }
          
          // Partial match bonus
          const words = fieldText.split(' ');
          words.forEach(word => {
            if (word.includes(term) || term.includes(word)) {
              score += weight * 0.5;
            }
          });
        });
      });

      // First aid keyword boosting
      const firstAidKeywords = this.extractFirstAidKeywords(query);
      firstAidKeywords.forEach(keyword => {
        Object.values(searchableFields).forEach(text => {
          if (text.toLowerCase().includes(keyword.toLowerCase())) {
            score += 2.0; // Increased boost for first aid keywords
          }
        });
      });

      // Category relevance boosting
      const categoryRelevance = this.getCategoryRelevance(query, product.category);
      score += categoryRelevance;

      return { product, score };
    });

    // Filter products with score > 0 and sort by relevance
    const result = scoredProducts
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.product)
      .slice(0, 50); // Limit to top 50 most relevant products

    // Cache the result
    this.setCachedData(cacheKey, result);
    
    return result;
  }

  private extractSportKeywords(query: string): string[] {
    const sportMappings: Record<string, string[]> = {
      'football': ['football', 'tackle', 'helmet', 'pads', 'cleats'],
      'basketball': ['basketball', 'hoop', 'court', 'sneakers', 'ball'],
      'soccer': ['soccer', 'football', 'cleats', 'shin guards', 'goal'],
      'baseball': ['baseball', 'bat', 'glove', 'helmet', 'cleats'],
      'tennis': ['tennis', 'racket', 'court', 'ball', 'shoes'],
      'running': ['running', 'marathon', 'track', 'shoes', 'gear'],
      'swimming': ['swimming', 'pool', 'goggles', 'swimsuit', 'cap'],
      'cycling': ['cycling', 'bike', 'bicycle', 'helmet', 'gear'],
      'fitness': ['fitness', 'gym', 'workout', 'training', 'exercise'],
      'rehabilitation': ['rehab', 'therapy', 'recovery', 'injury', 'physical'],
      'strength': ['strength', 'weight', 'lifting', 'muscle', 'power']
    };

    const keywords: string[] = [];
    const queryLower = query.toLowerCase();
    
    Object.entries(sportMappings).forEach(([sport, terms]) => {
      if (terms.some(term => queryLower.includes(term))) {
        keywords.push(...terms);
      }
    });

    return [...new Set(keywords)];
  }

  private extractFirstAidKeywords(query: string): string[] {
    const firstAidMappings: Record<string, string[]> = {
      'basic': ['basic', 'home', 'simple', 'essential', 'fundamental'],
      'travel': ['travel', 'trip', 'journey', 'portable', 'compact'],
      'workplace': ['work', 'office', 'job', 'employment', 'professional'],
      'outdoor': ['outdoor', 'camping', 'hiking', 'adventure', 'wilderness'],
      'pediatric': ['child', 'children', 'baby', 'pediatric', 'kids'],
      'emergency': ['emergency', 'urgent', 'critical', 'severe', 'serious'],
      'wound': ['wound', 'cut', 'scrape', 'laceration', 'abrasion'],
      'burn': ['burn', 'scald', 'heat', 'fire'],
      'allergy': ['allergy', 'allergic', 'antihistamine', 'reaction'],
      'pain': ['pain', 'ache', 'hurt', 'discomfort']
    };

    const keywords: string[] = [];
    const queryLower = query.toLowerCase();
    
    Object.entries(firstAidMappings).forEach(([type, terms]) => {
      if (terms.some(term => queryLower.includes(term))) {
        keywords.push(...terms);
      }
    });

    return [...new Set(keywords)];
  }

  private getCategoryRelevance(query: string, category: string): number {
    const queryLower = query.toLowerCase();
    const categoryLower = category.toLowerCase();
    
    // Direct category match
    if (queryLower.includes(categoryLower) || categoryLower.includes(queryLower)) {
      return 2.0;
    }

    // First aid category synonym matching
    const categorySynonyms: Record<string, string[]> = {
      'first aid': ['first aid', 'medical', 'emergency', 'treatment'],
      'wound care': ['wound', 'bandage', 'gauze', 'dressing'],
      'medication': ['medicine', 'drug', 'pill', 'tablet', 'ointment'],
      'instruments': ['tool', 'scissors', 'tweezers', 'thermometer'],
      'ppe': ['protection', 'gloves', 'mask', 'safety'],
      'emergency': ['emergency', 'urgent', 'critical', 'severe']
    };

    const synonyms = categorySynonyms[categoryLower] || [];
    if (synonyms.some(synonym => queryLower.includes(synonym))) {
      return 1.5;
    }

    return 0;
  }
}

export { GeminiService, type GeminiConfig, type KitGenerationRequest, type GeneratedKit };