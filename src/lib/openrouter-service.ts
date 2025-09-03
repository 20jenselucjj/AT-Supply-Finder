import type { Product, KitItem } from './types';

interface OpenRouterConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

interface KitGenerationRequest {
  userQuery: string;
  availableProducts: Product[];
  kitType?: 'basic' | 'travel' | 'workplace' | 'outdoor' | 'pediatric';
  scenario?: string;
  budget?: number;
}

interface GeneratedKit {
  name: string;
  description: string;
  items: KitItem[];
  totalPrice: number;
  reasoning: string;
}

class OpenRouterService {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: OpenRouterConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'deepseek/deepseek-chat-v3.1:free';
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
  }

  async generateTrainingKit(request: KitGenerationRequest): Promise<GeneratedKit> {
    const { userQuery, availableProducts, budget } = request;
    const sportType = (request as any).sportType;
    const skillLevel = (request as any).skillLevel;

    // Use RAG to filter relevant products first
    const relevantProducts = await this.searchProducts(userQuery, availableProducts);
    
    if (relevantProducts.length === 0) {
      throw new Error('No relevant products found for your request. Please try a different query.');
    }

    // Create a structured prompt for kit generation
    const prompt = this.buildTrainingKitPrompt(userQuery, relevantProducts, sportType, skillLevel, budget);

    try {
      const response = await this.callOpenRouter(prompt);
      return this.parseKitResponse(response, relevantProducts);
    } catch (error) {
      console.error('Error generating kit with OpenRouter:', error);
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
    const prompt = this.buildFirstAidKitPrompt(userQuery, relevantProducts, kitType, scenario, budget);

    try {
      const response = await this.callOpenRouter(prompt);
      return this.parseKitResponse(response, relevantProducts);
    } catch (error) {
      console.error('Error generating first aid kit with OpenRouter:', error);
      throw new Error('Failed to generate first aid kit. Please try again.');
    }
  }

  private async callOpenRouter(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AT Supply Finder'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private buildTrainingKitPrompt(
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

  private buildFirstAidKitPrompt(
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

    // Enhanced prompt with structured context and explicit category guidelines
    return `You are an expert first aid specialist and medical supply specialist. Your task is to create a personalized first aid kit based on the user's request.

User Request: "${userQuery}"
Kit Type: ${kitType || 'Not specified'}
First Aid Scenario: ${scenario || 'Not specified'}
Budget: ${budget ? `$${budget}` : 'Not specified'}

IMPORTANT CATEGORY GUIDELINES:
- "Antiseptics & Ointments" includes antibiotic ointments, antiseptic wipes, burn gels, and other topical treatments for wounds and skin conditions
- "Pain & Symptom Relief" includes oral pain relievers (ibuprofen, acetaminophen), antihistamines, antacids, and other medications taken internally
- "Wound Care & Dressings" includes bandages, gauze, dressings, and wound cleaning supplies
- "Tapes & Wraps" includes medical tapes, elastic bandages, and athletic tape
- "Instruments & Tools" includes scissors, tweezers, thermometers, and other medical tools

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
- Focus on medical supplies, wound care, medications, instruments, and emergency equipment
- Use only the approved category IDs from the CATEGORY GUIDELINES above
- For antibiotic ointments, always categorize them under "Antiseptics & Ointments" not "Wound Care & Dressings"`;
  }

  private parseKitResponse(response: string, availableProducts: Product[]): GeneratedKit {
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the parsed response before processing
      this.validateKitResponse(parsed);
      
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
          product_image_url: product.image_url,
          quantity: item.quantity || 1,
          price: product.vendor_offers?.[0]?.price || 0,
          notes: item.reason || '',
          reasoning: item.reason || ''
        };
      });

      const generatedKit: GeneratedKit = {
        name: parsed.name,
        description: parsed.description,
        items: kitItems,
        totalPrice: parsed.totalPrice,
        reasoning: parsed.reasoning
      };
      
      // Validate the final kit
      this.validateGeneratedKit(generatedKit);
      
      return generatedKit;
    } catch (error) {
      console.error('Error parsing OpenRouter response:', error);
      throw new Error('Failed to parse AI response. Please try again.');
    }
  }

  private validateKitResponse(response: any): void {
    // Validate required fields
    if (!response.name || typeof response.name !== 'string') {
      throw new Error('Invalid kit name in response');
    }
    
    if (!response.description || typeof response.description !== 'string') {
      throw new Error('Invalid kit description in response');
    }
    
    if (!Array.isArray(response.selectedProducts)) {
      throw new Error('Invalid selectedProducts array in response');
    }
    
    if (typeof response.totalPrice !== 'number') {
      throw new Error('Invalid totalPrice in response');
    }
    
    if (!response.reasoning || typeof response.reasoning !== 'string') {
      throw new Error('Invalid reasoning in response');
    }
    
    // Validate each selected product
    for (const item of response.selectedProducts) {
      if (!item.productId || typeof item.productId !== 'string') {
        throw new Error('Invalid productId in selected product');
      }
      
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        throw new Error('Invalid quantity in selected product');
      }
      
      if (!item.reason || typeof item.reason !== 'string') {
        throw new Error('Invalid reason in selected product');
      }
    }
  }

  private validateGeneratedKit(kit: GeneratedKit): void {
    // Validate kit name length
    if (kit.name.length > 50) {
      kit.name = kit.name.substring(0, 50);
    }
    
    // Validate kit description length
    if (kit.description.length > 100) {
      kit.description = kit.description.substring(0, 100);
    }
    
    // Validate kit reasoning length
    if (kit.reasoning.length > 200) {
      kit.reasoning = kit.reasoning.substring(0, 200);
    }
    
    // Validate item count (5-12 items as per guidelines)
    if (kit.items.length < 5) {
      console.warn('Generated kit has fewer than 5 items');
    }
    
    if (kit.items.length > 12) {
      console.warn('Generated kit has more than 12 items, truncating to 12');
      kit.items = kit.items.slice(0, 12);
    }
    
    // Validate category consistency
    const validCategories = [
      'Antiseptics & Ointments',
      'Pain & Symptom Relief',
      'Wound Care & Dressings',
      'Tapes & Wraps',
      'Instruments & Tools'
    ];
    
    for (const item of kit.items) {
      if (item.product_category && !validCategories.includes(item.product_category)) {
        console.warn(`Product ${item.product_name} has invalid category: ${item.product_category}`);
      }
    }
    
    // Check for duplicate items
    const productIds = kit.items.map(item => item.product_id);
    const uniqueProductIds = [...new Set(productIds)];
    if (productIds.length !== uniqueProductIds.length) {
      console.warn('Generated kit contains duplicate items');
    }
  }

  async searchProducts(query: string, products: Product[]): Promise<Product[]> {
    // Enhanced RAG system with multi-pass filtering and improved relevance scoring
    
    // Pass 1: Initial keyword filtering
    const keywordFiltered = this.initialKeywordFilter(query, products);
    
    // Pass 2: Semantic similarity scoring
    const semanticallyScored = await this.semanticSimilarityScoring(query, keywordFiltered);
    
    // Pass 3: Category relevance boosting
    const categoryBoosted = this.categoryRelevanceBoosting(query, semanticallyScored);
    
    // Pass 4: User preference weighting (if available)
    const finalScored = this.userPreferenceWeighting(categoryBoosted);
    
    // Final ranking and limiting
    return finalScored
      .sort((a, b) => b.finalScore - a.finalScore)
      .map(item => item.product)
      .slice(0, 50); // Limit to top 50 most relevant products
  }

  private initialKeywordFilter(query: string, products: Product[]): Product[] {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    return products.filter(product => {
      const searchableFields = [
        product.name || '',
        product.brand || '',
        product.category || '',
        product.description || '',
        Array.isArray(product.specifications?.['features']) ? product.specifications['features'].join(' ') : '',
        Array.isArray(product.specifications?.materials) ? product.specifications.materials.join(' ') : ''
      ].join(' ').toLowerCase();
      
      return searchTerms.some(term => searchableFields.includes(term));
    });
  }

  private async semanticSimilarityScoring(query: string, products: Product[]): Promise<Array<{product: Product, score: number}>> {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    return products.map(product => {
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
            score += weight * 3;
          }
          
          // Partial match bonus
          const words = fieldText.split(' ');
          words.forEach(word => {
            if (word.includes(term) || term.includes(word)) {
              score += weight * 1.0;
            }
          });
        });
      });

      return { product, score };
    });
  }

  private categoryRelevanceBoosting(query: string, scoredProducts: Array<{product: Product, score: number}>): Array<{product: Product, score: number, categoryBoost: number}> {
    return scoredProducts.map(item => {
      const categoryRelevance = this.getEnhancedCategoryRelevance(query, item.product.category);
      const categoryBoost = categoryRelevance * 2; // Double the category relevance impact
      return { 
        product: item.product, 
        score: item.score, 
        categoryBoost 
      };
    });
  }

  private userPreferenceWeighting(scoredProducts: Array<{product: Product, score: number, categoryBoost: number}>): Array<{product: Product, finalScore: number}> {
    return scoredProducts.map(item => {
      let finalScore = item.score + item.categoryBoost;
      
      // Brand reputation boosting (if available)
      if (item.product.brand) {
        const reputableBrands = ['band-aid', 'johnson & johnson', '3m', 'cardinal health', 'mckesson', 'first aid only'];
        if (reputableBrands.some(brand => item.product.brand?.toLowerCase().includes(brand))) {
          finalScore += 1.5; // Small boost for reputable brands
        }
      }
      
      return { 
        product: item.product, 
        finalScore 
      };
    });
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

  private getEnhancedCategoryRelevance(query: string, category: string): number {
    const queryLower = query.toLowerCase();
    const categoryLower = category.toLowerCase();
    
    // Direct category match with higher weight
    if (queryLower.includes(categoryLower) || categoryLower.includes(queryLower)) {
      return 3.0;
    }

    // Enhanced category synonym matching with more comprehensive mappings
    const categorySynonyms: Record<string, string[]> = {
      'antiseptics & ointments': ['antibiotic', 'ointment', 'antiseptic', 'gel', 'cream', 'burn', 'wound treatment'],
      'pain & symptom relief': ['pain', 'relief', 'medication', 'pill', 'tablet', 'fever', 'headache', 'allergy'],
      'wound care & dressings': ['bandage', 'gauze', 'dressing', 'wound', 'cut', 'scrape', 'laceration'],
      'tapes & wraps': ['tape', 'wrap', 'elastic', 'adhesive', 'bandage'],
      'instruments & tools': ['scissors', 'tweezers', 'thermometer', 'gloves', 'tool', 'instrument'],
      'first aid': ['first aid', 'medical', 'emergency', 'treatment', 'health'],
      'ppe': ['protection', 'gloves', 'mask', 'safety', 'ppe'],
      'emergency': ['emergency', 'urgent', 'critical', 'severe', 'rescue']
    };

    // Find the best matching category
    let maxRelevance = 0;
    Object.entries(categorySynonyms).forEach(([cat, synonyms]) => {
      if (categoryLower.includes(cat) || cat.includes(categoryLower)) {
        const relevance = synonyms.some(synonym => queryLower.includes(synonym)) ? 2.5 : 0;
        maxRelevance = Math.max(maxRelevance, relevance);
      }
    });

    return maxRelevance;
  }
}

export { OpenRouterService, type OpenRouterConfig, type KitGenerationRequest, type GeneratedKit };