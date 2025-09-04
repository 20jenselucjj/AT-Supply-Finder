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

  constructor(config: OpenRouterConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'deepseek/deepseek-chat-v3.1:free';
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
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
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
      
      // For testing, create a mock response instead of calling OpenRouter
      const isAllCategoriesRequest = this.isComprehensiveRequest(userQuery);
      
      // Select more products for comprehensive requests
      let selectedProducts;
      if (isAllCategoriesRequest) {
        // For comprehensive requests, try to get products from different categories
        const productsByCategory = new Map<string, Product[]>();
        relevantProducts.forEach(product => {
          const category = product.category || 'other';
          if (!productsByCategory.has(category)) {
            productsByCategory.set(category, []);
          }
          productsByCategory.get(category)!.push(product);
        });
        
        // Select 1-2 products from each category, up to 12 total
        selectedProducts = [];
        const categories = Array.from(productsByCategory.keys());
        const productsPerCategory = Math.max(1, Math.floor(12 / categories.length));
        
        categories.forEach(category => {
          const categoryProducts = productsByCategory.get(category)!;
          selectedProducts.push(...categoryProducts.slice(0, productsPerCategory));
        });
        
        // If we still have room, add more products
        if (selectedProducts.length < 12) {
          const remaining = relevantProducts.filter(p => !selectedProducts.includes(p));
          selectedProducts.push(...remaining.slice(0, 12 - selectedProducts.length));
        }
        
        selectedProducts = selectedProducts.slice(0, 12);
      } else {
        selectedProducts = relevantProducts.slice(0, 5);
      }
      
      const mockResponse = JSON.stringify({
        name: isAllCategoriesRequest ? "Comprehensive Training Kit" : "Basic Training Kit",
        description: isAllCategoriesRequest 
          ? "A complete training kit covering all essential equipment categories for comprehensive athletic development"
          : "A focused training kit for your specific needs",
        selectedProducts: selectedProducts.map(product => ({
          productId: product.id,
          quantity: 1,
          reason: `Essential for ${sportType || 'athletic'} training and skill development`
        })),
        totalPrice: selectedProducts.reduce((sum, p) => sum + (p.vendor_offers?.[0]?.price || 0), 0),
        reasoning: isAllCategoriesRequest 
          ? "This comprehensive kit includes equipment from all major training categories to support complete athletic development and performance enhancement."
          : "This kit includes essential items for your specific training requirements."
      });
      
      // Stage 4: Finalizing
      onProgress?.('finalizing', 95, '');
      await new Promise(resolve => setTimeout(resolve, 400)); // Simulate delay
      
      const result = this.parseKitResponse(mockResponse, relevantProducts);
      
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
      await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate delay
      
      // For testing, create a mock response instead of calling OpenRouter
      const isAllCategoriesRequest = this.isComprehensiveRequest(userQuery);
      
      // Select more products for comprehensive requests
       let selectedProducts;
       if (isAllCategoriesRequest) {
         // For comprehensive requests, try to get products from different categories
         const productsByCategory = new Map<string, Product[]>();
         relevantProducts.forEach(product => {
           const category = product.category || 'other';
           if (!productsByCategory.has(category)) {
             productsByCategory.set(category, []);
           }
           productsByCategory.get(category)!.push(product);
         });
         
         // Select 1-2 products from each category, up to 12 total
         selectedProducts = [];
         const categories = Array.from(productsByCategory.keys());
         const productsPerCategory = Math.max(1, Math.floor(12 / categories.length));
         
         categories.forEach(category => {
           const categoryProducts = productsByCategory.get(category)!;
           selectedProducts.push(...categoryProducts.slice(0, productsPerCategory));
         });
         
         // If we still have room, add more products
         if (selectedProducts.length < 12) {
           const remaining = relevantProducts.filter(p => !selectedProducts.includes(p));
           selectedProducts.push(...remaining.slice(0, 12 - selectedProducts.length));
         }
         
         selectedProducts = selectedProducts.slice(0, 12);
       } else {
         selectedProducts = relevantProducts.slice(0, 5);
       }
      
      const mockResponse = JSON.stringify({
        name: isAllCategoriesRequest ? "Comprehensive First Aid Kit" : "Basic First Aid Kit",
        description: isAllCategoriesRequest 
          ? "A complete first aid kit covering all essential categories and situations"
          : "A comprehensive first aid kit for home use",
        selectedProducts: selectedProducts.map(product => ({
          productId: product.id,
          quantity: 1,
          reason: `Essential for ${kitType} first aid situations`
        })),
        totalPrice: selectedProducts.reduce((sum, p) => sum + (p.vendor_offers?.[0]?.price || 0), 0),
        reasoning: isAllCategoriesRequest 
          ? "This comprehensive kit includes items from all major first aid categories to handle a wide range of medical situations and emergencies."
          : "This kit includes essential items for basic first aid care at home."
      });
      
      // Stage 4: Finalizing
      onProgress?.('finalizing', 95, '');
      await new Promise(resolve => setTimeout(resolve, 400)); // Simulate delay
      
      const result = this.parseKitResponse(mockResponse, relevantProducts);
      
      onProgress?.('complete', 100, 'Complete!');
      await new Promise(resolve => setTimeout(resolve, 200)); // Brief delay
      
      return result;
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

Available Products:
${JSON.stringify(productCatalog, null, 2)}

IMPORTANT QUANTITY GUIDELINES:
- Pay attention to quantity-related terms in the user's request (e.g., "large", "small", "bulk", "few", "many", "multiple")
- For "large" or "bulk" requests: increase quantities of consumable items (water bottles, energy bars, towels, etc.)
- For "small" or "minimal" requests: focus on essential items with quantity of 1 each
- For team/group requests: multiply quantities based on estimated team size
- For family requests: consider multiple sizes or quantities for different family members
- Always specify appropriate quantities in the selectedProducts array

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
    // Enhanced RAG system with multi-pass filtering and improved relevance scoring
    
    // Pass 1: Initial keyword filtering
    const keywordFiltered = this.initialKeywordFilter(query, products);
    
    // Fallback: if no products match keywords, use all products for semantic scoring
    const productsForScoring = keywordFiltered.length > 0 ? keywordFiltered : products;
    
    // Pass 2: Semantic similarity scoring
    const semanticallyScored = await this.semanticSimilarityScoring(query, productsForScoring);
    
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
}

export { OpenRouterService, type OpenRouterConfig, type KitGenerationRequest, type GeneratedKit };