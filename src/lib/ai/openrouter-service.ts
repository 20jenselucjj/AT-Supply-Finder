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
  groupSize?: number;
  duration?: string;
  specialNeeds?: string[];
  onProgress?: (stage: string, progress: number, message: string) => void;
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
  private userPreferences: Map<string, number> = new Map(); // Track user preferences
  private cache: Map<string, { data: any; timestamp: number }> = new Map(); // Add cache
  private cacheExpiry: number = 30 * 60 * 1000; // 30 minutes cache expiry

  constructor(config: OpenRouterConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'deepseek/deepseek-chat-v3.1:free';
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
    this.loadUserPreferences();
    this.cleanupCache(); // Clean up expired cache entries periodically
  }

  // Load user preferences from localStorage
  private loadUserPreferences(): void {
    try {
      const preferences = localStorage.getItem('openrouter-user-preferences');
      if (preferences) {
        const parsed = JSON.parse(preferences);
        Object.entries(parsed).forEach(([key, value]) => {
          this.userPreferences.set(key, value as number);
        });
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
  }

  // Save user preferences to localStorage
  private saveUserPreferences(): void {
    try {
      const preferencesObj: Record<string, number> = {};
      this.userPreferences.forEach((value, key) => {
        preferencesObj[key] = value;
      });
      localStorage.setItem('openrouter-user-preferences', JSON.stringify(preferencesObj));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
    }
  }

  // Update user preferences based on feedback
  public updateUserPreferences(feedback: { productId: string; rating: number }): void {
    const currentRating = this.userPreferences.get(feedback.productId) || 0;
    const newRating = (currentRating + feedback.rating) / 2; // Simple averaging
    this.userPreferences.set(feedback.productId, newRating);
    this.saveUserPreferences();
  }

  // Get user preference score for a product
  private getProductPreferenceScore(productId: string): number {
    return this.userPreferences.get(productId) || 0;
  }

  private isComprehensiveRequest(query: string): boolean {
    const queryLower = query.toLowerCase();
    const allRequestPatterns = [
      // Direct requests
      'all categories', 'all products', 'every category', 'every product', 'all types', 'everything',
      'all items', 'all supplies', 'all equipment', 'all materials', 'all options', 'all available',
      
      // Complete/comprehensive requests
      'complete kit', 'comprehensive kit', 'complete set', 'comprehensive set', 'full kit',
      'full set', 'complete package', 'comprehensive package', 'total package', 'entire kit',
      'entire set', 'whole kit', 'whole set', 'complete collection', 'full collection',
      'comprehensive collection', 'entire collection', 'complete range', 'full range',
      'comprehensive range', 'entire range', 'complete selection', 'full selection',
      'comprehensive selection', 'entire selection', 'complete assortment', 'full assortment',
      
      // Maximum/ultimate requests
      'maximum coverage', 'ultimate kit', 'ultimate set', 'maximum kit', 'maximum set',
      'best of everything', 'top of the line', 'premium complete', 'deluxe kit', 'deluxe set',
      'professional complete', 'master kit', 'master set', 'supreme kit', 'supreme set',
      
      // Variety/diverse requests
      'wide variety', 'broad selection', 'diverse selection', 'varied selection', 'mixed selection',
      'assorted items', 'variety pack', 'sample of everything', 'bit of everything',
      'one of each', 'representative sample', 'cross-section', 'broad spectrum',
      
      // Inclusive requests
      'include everything', 'cover all bases', 'all-inclusive', 'leave nothing out',
      'dont miss anything', "don't miss anything", 'cover everything', 'include all',
      'nothing left out', 'comprehensive coverage', 'total coverage', 'complete coverage',
      
      // Preparedness requests
      'be prepared for anything', 'ready for everything', 'prepared for all situations',
      'handle any situation', 'cover all scenarios', 'all-purpose', 'multi-purpose',
      'versatile kit', 'universal kit', 'general purpose', 'catch-all',
      
      // Quantity-based requests
      'as much as possible', 'as many as possible', 'maximum quantity', 'bulk selection',
      'large selection', 'extensive selection', 'wide selection', 'huge selection',
      'massive selection', 'enormous selection', 'vast selection',
      
      // Superlative requests
      'best possible', 'most comprehensive', 'most complete', 'most thorough',
      'most extensive', 'biggest selection', 'largest selection', 'widest selection',
      'broadest selection', 'fullest selection', 'richest selection',
      
      // Casual/informal requests
      'throw in everything', 'give me everything', 'all you got', 'all you have',
      'the works', 'kitchen sink', 'whole nine yards', 'whole shebang',
      'lock stock and barrel', 'soup to nuts', 'a to z', 'alpha to omega'
    ];
    
    return allRequestPatterns.some(pattern => queryLower.includes(pattern));
  }

  private extractQuantityContext(query: string): string {
    const lowerQuery = query.toLowerCase();
    const quantityIndicators = {
      large: ['large', 'big', 'bulk', 'massive', 'huge', 'enormous', 'extensive', 'major', 'substantial', 'heavy-duty', 'industrial', 'commercial'],
      small: ['small', 'mini', 'compact', 'minimal', 'basic', 'light', 'portable', 'travel-size', 'pocket', 'tiny'],
      multiple: ['multiple', 'several', 'many', 'numerous', 'various', 'assorted', 'different', 'diverse'],
      specific: ['dozen', 'pack', 'box', 'case', 'bundle', 'set'],
      family: ['family', 'household', 'home', 'kids', 'children', 'adults', 'everyone'],
      workplace: ['office', 'workplace', 'work', 'business', 'corporate', 'team', 'staff'],
      travel: ['travel', 'trip', 'vacation', 'portable', 'mobile', 'on-the-go', 'backpack'],
      emergency: ['emergency', 'disaster', 'crisis', 'urgent', 'critical', 'severe']
    };

    const contexts = [];
    
    // Check for size indicators
    if (quantityIndicators.large.some(term => lowerQuery.includes(term))) {
      contexts.push('Large quantity request - suggest higher quantities for essential items');
    }
    if (quantityIndicators.small.some(term => lowerQuery.includes(term))) {
      contexts.push('Small/minimal request - focus on essential items with single quantities');
    }
    
    // Check for multiple item indicators
    if (quantityIndicators.multiple.some(term => lowerQuery.includes(term))) {
      contexts.push('Multiple items requested - include varied quantities across categories');
    }
    
    // Check for specific quantity terms
    if (quantityIndicators.specific.some(term => lowerQuery.includes(term))) {
      contexts.push('Specific packaging mentioned - consider multi-packs or bundled quantities');
    }
    
    // Check for context-based quantity needs
    if (quantityIndicators.family.some(term => lowerQuery.includes(term))) {
      contexts.push('Family/household use - include larger quantities for multiple people');
    }
    if (quantityIndicators.workplace.some(term => lowerQuery.includes(term))) {
      contexts.push('Workplace use - moderate quantities suitable for office/team environment');
    }
    if (quantityIndicators.travel.some(term => lowerQuery.includes(term))) {
      contexts.push('Travel use - prioritize compact, lightweight items in smaller quantities');
    }
    if (quantityIndicators.emergency.some(term => lowerQuery.includes(term))) {
      contexts.push('Emergency preparedness - include sufficient quantities for extended use');
    }
    
    // Extract specific numbers if mentioned
    const numberMatch = lowerQuery.match(/\b(\d+)\s*(people|person|individuals?|users?|members?)\b/);
    if (numberMatch) {
      const count = parseInt(numberMatch[1]);
      contexts.push(`For ${count} people - scale quantities accordingly`);
    }
    
    return contexts.length > 0 ? contexts.join('; ') : '';
  }

  async generateTrainingKit(request: KitGenerationRequest): Promise<GeneratedKit> {
    const { userQuery, availableProducts, budget, groupSize, duration, specialNeeds, onProgress } = request;
    const sportType = (request as any).sportType;
    const skillLevel = (request as any).skillLevel;

    // Stage 1: Searching products
    onProgress?.('searching', 20, 'Analyzing your training needs and searching for equipment...');

    // Use RAG to filter relevant products first
    const relevantProducts = await this.searchProducts(userQuery, availableProducts);
    
    if (relevantProducts.length === 0) {
      throw new Error('No relevant products found for your request. Please try a different query.');
    }

    // Stage 2: Building prompt
    onProgress?.('preparing', 40, 'Found suitable equipment, preparing training analysis...');

    // Create a structured prompt for kit generation
    const prompt = this.buildTrainingKitPrompt(userQuery, relevantProducts, sportType, skillLevel, budget, groupSize, duration, specialNeeds);

    try {
      // Stage 3: AI generation
      onProgress?.('generating', 70, '');
      
      // Call OpenRouter API instead of using mock response
      const responseText = await this.callOpenRouter(prompt);
      
      // Stage 4: Finalizing
      onProgress?.('finalizing', 95, '');
      await new Promise(resolve => setTimeout(resolve, 400)); // Simulate delay
      
      const result = this.parseKitResponse(responseText, relevantProducts);
      
      onProgress?.('complete', 100, 'Complete!');
      await new Promise(resolve => setTimeout(resolve, 200)); // Brief delay
      
      return result;
    } catch (error) {
      console.error('Error generating training kit with OpenRouter:', error);
      throw new Error('Failed to generate training kit. Please try again.');
    }
  }

  async generateFirstAidKit(request: KitGenerationRequest): Promise<GeneratedKit> {
    const { userQuery, availableProducts, kitType, scenario, budget, groupSize, duration, specialNeeds, onProgress } = request;

    // Stage 1: Searching products
    onProgress?.('searching', 25, 'Searching products...');
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
    
    // Use RAG to filter relevant products first
    const relevantProducts = await this.searchProducts(userQuery, availableProducts);
    
    if (relevantProducts.length === 0) {
      throw new Error('No relevant first aid products found for your request. Please try a different query.');
    }

    // Stage 2: Building prompt
    onProgress?.('preparing', 50, '');
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate delay
    
    // Create a structured prompt for kit generation
    const prompt = this.buildFirstAidKitPrompt(userQuery, relevantProducts, kitType, scenario, budget, groupSize, duration, specialNeeds);

    try {
      // Stage 3: AI generation
      onProgress?.('generating', 75, 'Creating kit...');
      
      // Call OpenRouter API instead of using mock response
      const responseText = await this.callOpenRouter(prompt);
      
      // Stage 4: Finalizing
      onProgress?.('finalizing', 95, '');
      await new Promise(resolve => setTimeout(resolve, 400)); // Simulate delay
      
      const result = this.parseKitResponse(responseText, relevantProducts);
      
      onProgress?.('complete', 100, 'Complete!');
      await new Promise(resolve => setTimeout(resolve, 200)); // Brief delay
      
      return result;
    } catch (error) {
      console.error('Error generating first aid kit with OpenRouter:', error);
      throw new Error('Failed to generate first aid kit. Please try again.');
    }
  }

  // Rule-based fallback generation for when AI services are unavailable
  public generateFallbackKit(request: KitGenerationRequest): GeneratedKit {
    const { userQuery, availableProducts, kitType, scenario, budget, groupSize } = request;
    
    // Filter products by category relevance
    const relevantProducts = this.filterProductsByContext(availableProducts, kitType, scenario);
    
    // Select products based on rules
    const selectedProducts = this.selectProductsByRules(relevantProducts, kitType, groupSize, budget);
    
    // Calculate total price
    const totalPrice = selectedProducts.reduce((sum, item) => {
      const product = availableProducts.find(p => p.id === item.product_id);
      const price = product ? (product.price || product.offers?.[0]?.price || 0) : 0;
      return sum + (price * item.quantity);
    }, 0);
    
    // Generate kit name and description based on context
    const kitName = this.generateKitName(kitType, scenario);
    const kitDescription = this.generateKitDescription(kitType, scenario);
    const reasoning = this.generateKitReasoning(kitType, scenario, groupSize);
    
    return {
      name: kitName,
      description: kitDescription,
      items: selectedProducts,
      totalPrice,
      reasoning
    };
  }

  private filterProductsByContext(products: Product[], kitType?: string, scenario?: string): Product[] {
    // Filter products based on kit type and scenario
    if (!kitType && !scenario) {
      return products;
    }
    
    const filtered = products.filter(product => {
      const category = product.category?.toLowerCase() || '';
      const name = product.name?.toLowerCase() || '';
      
      // Kit type filtering
      if (kitType) {
        switch (kitType.toLowerCase()) {
          case 'travel':
            return category.includes('travel') || name.includes('travel') || 
                   category.includes('portable') || name.includes('portable');
          case 'workplace':
            return category.includes('office') || name.includes('office') ||
                   category.includes('work') || name.includes('work');
          case 'outdoor':
            return category.includes('outdoor') || name.includes('outdoor') ||
                   category.includes('camping') || name.includes('camping') ||
                   category.includes('hiking') || name.includes('hiking');
          case 'pediatric':
            return category.includes('child') || name.includes('child') ||
                   category.includes('baby') || name.includes('baby') ||
                   category.includes('kids') || name.includes('kids');
          case 'basic':
            return category.includes('basic') || category.includes('essential');
        }
      }
      
      // Scenario filtering
      if (scenario) {
        switch (scenario.toLowerCase()) {
          case 'emergency':
            return category.includes('emergency') || name.includes('emergency') ||
                   category.includes('critical') || name.includes('critical');
          case 'sports':
            return category.includes('sports') || name.includes('sports') ||
                   category.includes('athletic') || name.includes('athletic');
          case 'car travel':
            return category.includes('car') || name.includes('car') ||
                   category.includes('vehicle') || name.includes('vehicle');
          case 'outdoor adventure':
            return category.includes('outdoor') || name.includes('outdoor') ||
                   category.includes('adventure') || name.includes('adventure');
        }
      }
      
      return true; // Include all products if no specific filtering applies
    });
    
    // Return filtered products or all products if filtering resulted in too few items
    return filtered.length > 5 ? filtered : products;
  }

  private selectProductsByRules(products: Product[], kitType?: string, groupSize?: number, budget?: number): KitItem[] {
    // Define essential categories that should always be included
    const essentialCategories = [
      'wound-care-dressings',
      'antiseptics-ointments',
      'pain-relief',
      'instruments-tools'
    ];
    
    // Determine quantity multiplier based on group size
    const quantityMultiplier = groupSize && groupSize > 1 ? 
      Math.min(Math.ceil(groupSize / 2), 5) : 1;
    
    // Select products from each essential category
    const selectedItems: KitItem[] = [];
    
    essentialCategories.forEach(categoryId => {
      // Find products in this category
      const categoryProducts = products.filter(p => 
        p.category === categoryId || 
        this.getCategoryRelevance(categoryId, p.category || '') > 0
      );
      
      // Select 1-2 products from this category
      const numToSelect = Math.min(2, Math.max(1, Math.floor(categoryProducts.length / 2)));
      const selected = categoryProducts.slice(0, numToSelect);
      
      // Convert to KitItem format
      selected.forEach(product => {
        // Determine base quantity based on category and group size
        let baseQuantity = 1;
        switch (categoryId) {
          case 'wound-care-dressings':
            baseQuantity = 3; // More bandages are typically needed
            break;
          case 'antiseptics-ointments':
            baseQuantity = 2;
            break;
          case 'pain-relief':
            baseQuantity = 1;
            break;
          case 'instruments-tools':
            baseQuantity = 1;
            break;
        }
        
        const quantity = baseQuantity * quantityMultiplier;
        
        selectedItems.push({
          id: `kit-item-${Date.now()}-${Math.random()}`,
          product_id: product.id,
          product_name: product.name,
          product_brand: product.brand || '',
          product_category: product.category || '',
          product_image_url: product.imageUrl || product.image_url || '/placeholder.svg',
          name: product.name,
          category: product.category || '',
          brand: product.brand || '',
          imageUrl: product.imageUrl || product.image_url || '/placeholder.svg',
          quantity,
          price: product.price || product.offers?.[0]?.price || 0,
          notes: `Essential item for ${categoryId.replace('-', ' ')}`,
          reasoning: `Selected as essential item for ${categoryId.replace('-', ' ')}`,
          asin: product.asin,
          offers: product.offers || []
        });
      });
    });
    
    // Add additional items based on kit type
    if (kitType) {
      this.addKitTypeSpecificItems(products, selectedItems, kitType, quantityMultiplier);
    }
    
    // Apply budget constraints if specified
    if (budget) {
      this.applyBudgetConstraints(selectedItems, budget);
    }
    
    return selectedItems;
  }

  private addKitTypeSpecificItems(products: Product[], selectedItems: KitItem[], kitType: string, quantityMultiplier: number): void {
    let additionalProducts: Product[] = [];
    
    switch (kitType.toLowerCase()) {
      case 'travel':
        // Add travel-specific items
        additionalProducts = products.filter(p => 
          (p.category?.includes('travel') || p.name?.toLowerCase().includes('travel')) &&
          !selectedItems.some(item => item.product_id === p.id)
        ).slice(0, 2);
        break;
        
      case 'workplace':
        // Add workplace-specific items
        additionalProducts = products.filter(p => 
          (p.category?.includes('work') || p.name?.toLowerCase().includes('work')) &&
          !selectedItems.some(item => item.product_id === p.id)
        ).slice(0, 2);
        break;
        
      case 'outdoor':
        // Add outdoor-specific items
        additionalProducts = products.filter(p => 
          (p.category?.includes('outdoor') || p.name?.toLowerCase().includes('outdoor')) &&
          !selectedItems.some(item => item.product_id === p.id)
        ).slice(0, 3);
        break;
        
      case 'pediatric':
        // Add child-specific items
        additionalProducts = products.filter(p => 
          (p.category?.includes('child') || p.name?.toLowerCase().includes('child')) &&
          !selectedItems.some(item => item.product_id === p.id)
        ).slice(0, 2);
        break;
    }
    
    // Convert additional products to KitItems
    additionalProducts.forEach(product => {
      selectedItems.push({
        id: `kit-item-${Date.now()}-${Math.random()}`,
        product_id: product.id,
        product_name: product.name,
        product_brand: product.brand || '',
        product_category: product.category || '',
        product_image_url: product.imageUrl || product.image_url || '/placeholder.svg',
        name: product.name,
        category: product.category || '',
        brand: product.brand || '',
        imageUrl: product.imageUrl || product.image_url || '/placeholder.svg',
        quantity: 1 * quantityMultiplier,
        price: product.price || product.offers?.[0]?.price || 0,
        notes: `Added for ${kitType} kit type`,
        reasoning: `Selected based on ${kitType} kit type requirements`,
        asin: product.asin,
        offers: product.offers || []
      });
    });
  }

  private applyBudgetConstraints(items: KitItem[], budget: number): void {
    // Calculate current total
    let currentTotal = items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0);
    
    // If we're over budget, reduce quantities proportionally
    if (currentTotal > budget) {
      const reductionFactor = budget / currentTotal;
      
      items.forEach(item => {
        // Reduce quantity proportionally, but keep at least 1
        item.quantity = Math.max(1, Math.floor(item.quantity * reductionFactor));
        
        // Recalculate price based on new quantity
        const unitPrice = item.price || item.offers?.[0]?.price || 0;
        item.price = unitPrice * item.quantity;
      });
    }
  }

  private generateKitName(kitType?: string, scenario?: string): string {
    if (kitType && scenario) {
      return `${kitType.charAt(0).toUpperCase() + kitType.slice(1)} ${scenario.charAt(0).toUpperCase() + scenario.slice(1)} Kit`;
    } else if (kitType) {
      return `${kitType.charAt(0).toUpperCase() + kitType.slice(1)} First Aid Kit`;
    } else if (scenario) {
      return `${scenario.charAt(0).toUpperCase() + scenario.slice(1)} First Aid Kit`;
    }
    return "Basic First Aid Kit";
  }

  private generateKitDescription(kitType?: string, scenario?: string): string {
    if (kitType && scenario) {
      return `A comprehensive first aid kit designed for ${kitType} use in ${scenario} situations.`;
    } else if (kitType) {
      return `A well-balanced first aid kit tailored for ${kitType} environments.`;
    } else if (scenario) {
      return `A first aid kit specifically designed for ${scenario} scenarios.`;
    }
    return "A basic first aid kit with essential supplies for common injuries.";
  }

  private generateKitReasoning(kitType?: string, scenario?: string, groupSize?: number): string {
    const sizeText = groupSize && groupSize > 1 ? ` for a group of ${groupSize} people` : '';
    
    if (kitType && scenario) {
      return `This kit was generated using rule-based selection to provide comprehensive coverage for ${kitType} use in ${scenario} situations${sizeText}. It includes essential items from all major first aid categories.`;
    } else if (kitType) {
      return `This kit was generated using rule-based selection to provide balanced coverage for ${kitType} environments${sizeText}. It includes essential items from all major first aid categories.`;
    } else if (scenario) {
      return `This kit was generated using rule-based selection to provide appropriate coverage for ${scenario} scenarios${sizeText}. It includes essential items from all major first aid categories.`;
    }
    return `This kit was generated using rule-based selection to provide basic first aid coverage${sizeText}. It includes essential items from all major first aid categories.`;
  }

  private getCategoryRelevance(targetCategory: string, productCategory: string): number {
    // Simple category relevance scoring
    if (targetCategory === productCategory) {
      return 1.0;
    }
    
    // Check for partial matches
    if (targetCategory.includes(productCategory) || productCategory.includes(targetCategory)) {
      return 0.5;
    }
    
    return 0;
  }

  private async callOpenRouter(prompt: string): Promise<string> {
    const cacheKey = this.getCacheKey('callOpenRouter', prompt);
    const cachedResult = this.getCachedData<string>(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    try {
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
      const content = data.choices[0]?.message?.content || '';
      
      if (!content) {
        throw new Error('Empty response from OpenRouter API');
      }
      
      // Cache the result
      this.setCachedData(cacheKey, content);
      
      return content;
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      // Re-throw the error for the calling function to handle
      throw error;
    }
  }

  private buildTrainingKitPrompt(
    userQuery: string,
    products: Product[],
    sportType?: string,
    skillLevel?: string,
    budget?: number,
    groupSize?: number,
    duration?: string,
    specialNeeds?: string[]
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

    const quantityContext = this.extractQuantityContext(userQuery);

    return `You are an expert athletic trainer and sports equipment specialist. Your task is to create a personalized training kit based on the user's request.

User Request: "${userQuery}"
Sport Type: ${sportType || 'Not specified'}
Skill Level: ${skillLevel || 'Not specified'}
Budget: ${budget ? `$${budget}` : 'Not specified'}
Group Size: ${groupSize ? `${groupSize} people` : 'Not specified'}
Duration: ${duration || 'Not specified'}
Special Needs: ${specialNeeds && specialNeeds.length > 0 ? specialNeeds.join(', ') : 'None specified'}
${quantityContext ? `\nQuantity Context: ${quantityContext}` : ''}

IMPORTANT QUANTITY GUIDELINES:
- Pay attention to quantity-related terms in the user's request (e.g., "large", "small", "bulk", "few", "many", "multiple")
- For "large" or "bulk" requests: increase quantities of consumable items (water bottles, energy bars, towels, etc.)
- For "small" or "minimal" requests: focus on essential items with quantity of 1 each
- For team/group requests: multiply quantities based on estimated team size
- For family requests: consider multiple sizes or quantities for different family members
- Always specify appropriate quantities in the selectedProducts array

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
- Only select products from the provided catalog
- Include a mix of equipment, apparel, and accessories as appropriate
- Consider safety equipment for high-risk sports
- Include recovery and hydration products
- Ensure quantities are appropriate for the user's needs
- Always include at least one item for each major aspect of training (equipment, safety, recovery)`;
  }

  private buildFirstAidKitPrompt(
    userQuery: string,
    products: Product[],
    kitType?: string,
    scenario?: string,
    budget?: number,
    groupSize?: number,
    duration?: string,
    specialNeeds?: string[]
  ): string {
    const productCatalog = products.map(product => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.vendor_offers?.[0]?.price || 0,
      description: product.description,
      specifications: product.specifications,
      imageUrl: product.imageUrl || product.image_url || '/placeholder.svg' // Add image URL to the catalog
    }));

    // Extract quantity indicators from user query
    const quantityContext = this.extractQuantityContext(userQuery);

    // Enhanced prompt with structured context and explicit category guidelines
    return `You are an expert first aid specialist and medical supply specialist. Your task is to create a personalized first aid kit based on the user's request.

User Request: "${userQuery}"
Kit Type: ${kitType || 'Not specified'}
First Aid Scenario: ${scenario || 'Not specified'}
Budget: ${budget ? `$${budget}` : 'Not specified'}
Group Size: ${groupSize ? `${groupSize} people` : 'Not specified'}
Duration: ${duration || 'Not specified'}
Special Needs: ${specialNeeds && specialNeeds.length > 0 ? specialNeeds.join(', ') : 'None specified'}
${quantityContext ? `\nQuantity Context: ${quantityContext}` : ''}

IMPORTANT QUANTITY GUIDELINES:
- Pay close attention to quantity-related words in the user request (e.g., "large", "small", "bulk", "few", "many", "several", "multiple", "single", "dozen", "pack")
- For "large" or "bulk" requests: Include higher quantities (2-5+ of essential items like bandages, antiseptic wipes)
- For "small" or "minimal" requests: Include single quantities of only the most essential items
- For "travel" or "portable" requests: Focus on compact, lightweight items in smaller quantities
- For "workplace" or "office" requests: Include moderate quantities suitable for multiple people
- For "family" or "home" requests: Include larger quantities to serve multiple family members
- Default to quantity 1 unless the context suggests otherwise

IMPORTANT CATEGORY GUIDELINES:
- "Antiseptics & Ointments" includes antibiotic ointments, antiseptic wipes, burn gels, and other topical treatments for wounds and skin conditions
- "Pain & Symptom Relief" includes oral pain relievers (ibuprofen, acetaminophen), antihistamines, antacids, and other medications taken internally
- "Wound Care & Dressings" includes bandages, gauze, dressings, and wound cleaning supplies
- "Tapes & Wraps" includes medical tapes, elastic bandages, and athletic tape
- "Instruments & Tools" includes scissors, tweezers, thermometers, and other medical tools
- "Hydration & Nutrition" includes electrolyte powder packets, energy gels, emergency water tablets, and glucose tablets for dehydration and energy needs
- "Hot & Cold Therapy" includes instant cold packs, reusable gel packs, and topical analgesic creams
- "Trauma & Emergency" includes emergency blankets, tourniquets, splints, and supplies for serious injuries

Available Products:
${JSON.stringify(productCatalog, null, 2)}

Please create a comprehensive first aid kit that includes:
1. A descriptive name for the kit (keep it concise, under 50 characters)
2. A brief description explaining the kit's purpose for first aid situations (under 100 characters)
3. Selected products from the catalog that best match the user's needs
4. Appropriate quantities based on the user's request context
5. Clear reasoning for each product selection in a first aid context (be concise)
6. Total estimated price

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
- For antibiotic ointments, always categorize them under "Antiseptics & Ointments" not "Wound Care & Dressings"
- Always include at least one item from each of these essential categories: "Wound Care & Dressings", "Antiseptics & Ointments", "Pain & Symptom Relief"
- Ensure quantities are appropriate for the context (e.g., more bandages for larger groups, compact items for travel)
- Include specific product names and brands when possible for better user experience
}`;
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

        // Update user preferences for selected products
        this.updateUserPreferences({ productId: product.id, rating: 1.0 });

        return {
          id: `kit-item-${Date.now()}-${Math.random()}`,
          product_id: product.id,
          product_name: product.name,
          product_brand: product.brand,
          product_category: product.category,
          product_image_url: product.imageUrl || product.image_url || '/placeholder.svg',
          name: product.name, // Required by KitItem interface
          category: product.category, // Required by KitItem interface
          brand: product.brand, // Required by KitItem interface
          imageUrl: product.imageUrl || product.image_url || '/placeholder.svg', // Required by KitItem interface
          quantity: item.quantity || 1,
          price: product.price || product.offers?.[0]?.price || 0,
          notes: item.reason || '',
          reasoning: item.reason || '',
          asin: product.asin,
          offers: product.offers || [] // This is crucial for pricing calculations
        };
      });

      // Calculate total price from actual item prices
      const calculatedTotalPrice = kitItems.reduce((total, item) => {
        const itemPrice = item.price || item.offers?.[0]?.price || 0;
        return total + (itemPrice * (item.quantity || 1));
      }, 0);

      const generatedKit: GeneratedKit = {
        name: parsed.name,
        description: parsed.description,
        items: kitItems,
        totalPrice: calculatedTotalPrice,
        reasoning: parsed.reasoning
      };
      
      // Validate the final kit
      this.validateGeneratedKit(generatedKit);
      
      return generatedKit;
    } catch (error) {
      console.error('Error parsing OpenRouter response:', error);
      // Provide more detailed error information
      if (error instanceof SyntaxError) {
        throw new Error('Failed to parse AI response: Invalid JSON format');
      } else if (error instanceof TypeError) {
        throw new Error('Failed to parse AI response: Response format is incorrect');
      } else {
        throw new Error(`Failed to parse AI response: ${error.message}`);
      }
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
    
    // Validate category consistency - accept both display names and IDs
    const validCategoryNames = [
      'Antiseptics & Ointments',
      'Pain & Symptom Relief',
      'Wound Care & Dressings',
      'Tapes & Wraps',
      'Instruments & Tools'
    ];
    
    const validCategoryIds = [
      'antiseptics-ointments',
      'pain-relief',
      'wound-care-dressings',
      'tapes-wraps',
      'instruments-tools'
    ];
    
    const allValidCategories = [...validCategoryNames, ...validCategoryIds];
    
    for (const item of kit.items) {
      if (item.product_category && !allValidCategories.includes(item.product_category)) {
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
    const cacheKey = this.getCacheKey('searchProducts', query, products.length);
    const cachedResult = this.getCachedData<Product[]>(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    // Enhanced RAG system with multi-pass filtering and improved relevance scoring
    
    // Pass 1: Initial keyword filtering
    const keywordFiltered = this.initialKeywordFilter(query, products);
    
    // Fallback: if no products match keywords, use all products for semantic scoring
    const productsForScoring = keywordFiltered.length > 0 ? keywordFiltered : products;
    
    // Pass 2: Semantic similarity scoring with improved algorithm
    const semanticallyScored = await this.enhancedSemanticSimilarityScoring(query, productsForScoring);
    
    // Pass 3: Category relevance boosting
    const categoryBoosted = this.categoryRelevanceBoosting(query, semanticallyScored);
    
    // Pass 4: User preference weighting (if available)
    const finalScored = this.userPreferenceWeighting(categoryBoosted);
    
    // Final ranking and limiting
    const result = finalScored
      .sort((a, b) => b.finalScore - a.finalScore)
      .map(item => item.product)
      .slice(0, 50); // Limit to top 50 most relevant products

    // Cache the result
    this.setCachedData(cacheKey, result);
    
    return result;
  }

  private initialKeywordFilter(query: string, products: Product[]): Product[] {
    // Check if user is requesting all categories/products - comprehensive pattern matching
    if (this.isComprehensiveRequest(query)) {
      // Return all products when user explicitly requests everything
      return products;
    }
    
    const queryLower = query.toLowerCase();
    
    const searchTerms = queryLower.split(' ').filter(term => term.length > 1);
    
    return products.filter(product => {
      const searchableFields = [
        product.name || '',
        product.brand || '',
        product.category || '',
        product.description || '',
        Array.isArray(product.specifications?.['features']) ? product.specifications['features'].join(' ') : '',
        Array.isArray(product.specifications?.materials) ? product.specifications.materials.join(' ') : ''
      ].join(' ').toLowerCase();
      
      // More flexible matching: check if any search term is found in the searchable fields
      return searchTerms.some(term => searchableFields.includes(term));
    });
  }

  private async enhancedSemanticSimilarityScoring(query: string, products: Product[]): Promise<Array<{product: Product, score: number}>> {
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

      // Weight different fields differently with enhanced weights
      const fieldWeights = {
        name: 4.0,        // Increased weight for product name
        brand: 2.5,       // Increased weight for brand
        category: 3.0,    // Increased weight for category
        description: 2.0, // Increased weight for description
        features: 2.2,    // Increased weight for features
        materials: 1.5    // Slightly increased weight for materials
      };

      // Calculate relevance score with improved algorithm
      Object.entries(searchableFields).forEach(([field, text]) => {
        const fieldText = text.toLowerCase();
        const weight = fieldWeights[field as keyof typeof fieldWeights];
        
        searchTerms.forEach(term => {
          // Exact match bonus (increased from 3x to 4x)
          if (fieldText.includes(term)) {
            score += weight * 4;
          }
          
          // Partial match bonus (increased from 1x to 1.5x)
          const words = fieldText.split(' ');
          words.forEach(word => {
            if (word.includes(term) || term.includes(word)) {
              score += weight * 1.5;
            }
          });
          
          // Prefix/suffix match bonus
          if (fieldText.startsWith(term) || fieldText.endsWith(term)) {
            score += weight * 1.2;
          }
        });
      });

      return { product, score };
    });
  }

  private categoryRelevanceBoosting(query: string, scoredProducts: Array<{product: Product, score: number}>): Array<{product: Product, score: number, categoryBoost: number}> {
    return scoredProducts.map(item => {
      const categoryRelevance = this.getEnhancedCategoryRelevance(query, item.product.category);
      const categoryBoost = categoryRelevance * 3; // Increased from 2x to 3x impact
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
          finalScore += 2.0; // Increased from 1.5 to 2.0 for reputable brands
        }
      }
      
      // Previous purchase history boosting (simulated)
      // In a real implementation, this would check the user's purchase history
      const popularProducts = ['adhesive bandages', 'gauze pads', 'antiseptic wipes', 'pain relievers'];
      if (popularProducts.some(product => item.product.name?.toLowerCase().includes(product))) {
        finalScore += 1.0;
      }
      
      // User preference boosting
      const preferenceScore = this.getProductPreferenceScore(item.product.id);
      finalScore += preferenceScore * 2; // Weight user preferences
      
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
      'pain': ['pain', 'ache', 'hurt', 'discomfort'],
      'hydration': ['electrolyte', 'electrolytes', 'hydration', 'dehydration', 'rehydration', 'fluid', 'water', 'salt'],
      'nutrition': ['nutrition', 'energy', 'glucose', 'sugar', 'food', 'supplement'],
      'sports': ['sports', 'athletic', 'exercise', 'workout', 'training', 'performance']
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
      // Database category names (with hyphens)
      'instruments-tools': ['scissors', 'tweezers', 'thermometer', 'gloves', 'tool', 'instrument', 'medical tools', 'surgical'],
      'wound-care-dressings': ['bandage', 'gauze', 'dressing', 'wound', 'cut', 'scrape', 'laceration', 'first aid kit'],
      'tapes-wraps': ['tape', 'wrap', 'elastic', 'adhesive', 'bandage', 'medical tape', 'waterproof'],
      'antiseptics-ointments': ['antibiotic', 'ointment', 'antiseptic', 'gel', 'cream', 'burn', 'wound treatment', 'prep pad', 'alcohol', 'bzk'],
      'pain-relief': ['pain', 'relief', 'medication', 'pill', 'tablet', 'fever', 'headache', 'allergy', 'antihistamine', 'antacid', 'tums', 'benadryl'],
      'hydration-nutrition': ['electrolyte', 'electrolytes', 'hydration', 'dehydration', 'rehydration', 'fluid', 'water', 'salt', 'nutrition', 'energy', 'glucose', 'sugar', 'supplement', 'lmnt'],
      // Legacy category names (with spaces and ampersands) for backward compatibility
      'antiseptics & ointments': ['antibiotic', 'ointment', 'antiseptic', 'gel', 'cream', 'burn', 'wound treatment'],
      'pain & symptom relief': ['pain', 'relief', 'medication', 'pill', 'tablet', 'fever', 'headache', 'allergy'],
      'wound care & dressings': ['bandage', 'gauze', 'dressing', 'wound', 'cut', 'scrape', 'laceration'],
      'tapes & wraps': ['tape', 'wrap', 'elastic', 'adhesive', 'bandage'],
      'instruments & tools': ['scissors', 'tweezers', 'thermometer', 'gloves', 'tool', 'instrument'],
      'first aid': ['first aid', 'medical', 'emergency', 'treatment', 'health'],
      'ppe': ['protection', 'gloves', 'mask', 'safety', 'ppe'],
      'emergency': ['emergency', 'urgent', 'critical', 'severe', 'rescue'],
      'hydration & nutrition': ['electrolyte', 'electrolytes', 'hydration', 'dehydration', 'rehydration', 'fluid', 'water', 'salt', 'nutrition', 'energy', 'glucose', 'sugar', 'supplement'],
      'hot & cold therapy': ['cold', 'hot', 'ice', 'heat', 'therapy', 'compress', 'pack'],
      'trauma & emergency': ['trauma', 'emergency', 'severe', 'critical', 'tourniquet', 'splint', 'blanket']
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

}

export { OpenRouterService, type OpenRouterConfig, type KitGenerationRequest, type GeneratedKit };