import axios from 'axios';

// Function to enhance product data using OpenRouter AI
export async function enhanceProductWithAI(productData, openRouterApiKey) {
  if (!openRouterApiKey) {
    console.warn('OpenRouter API key not provided, skipping AI enhancement');
    return productData;
  }

  try {
    // Create a more detailed prompt for OpenRouter to enhance the product data
    const prompt = `
You are an expert product data analyst specializing in medical and first aid supplies. 
Your task is to enhance the product data by:
1. Creating a concise, descriptive product name (max 50 characters) - make it appealing to medical professionals, never use "..." or other truncation symbols
2. Improving the feature descriptions to be more informative and professional while preserving ALL factual information, technical specifications, sizing details (like "1-inch by 10 yard-roll"), and measurements from the original listing - focus on benefits for medical use
3. Classifying the product into the most appropriate category from these options: First Aid & Wound Care, Taping & Bandaging, Over-the-Counter Medication, Instruments & Tools, Emergency Care, Personal Protection Equipment (PPE), Documentation & Communication, Hot & Cold Therapy, Hydration & Nutrition, Miscellaneous & General
4. Extracting quantity information when available (e.g., "100 ct", "12 pack", "50 sheets") - look in title, features, dimensions
5. Identifying the main material when relevant (e.g., "sterile gauze", "nitrile", "latex-free", "adhesive", "foam", "plastic") - look in title, features, description

Product Data:
- Title: ${productData.title}
- Brand: ${productData.brand || 'Not specified'}
- Features: ${Array.isArray(productData.features) ? productData.features.join(', ') : 'Not specified'}
- Category: ${productData.category || 'Not specified'}
- Dimensions: ${productData.dimensions || 'Not specified'}
- Weight: ${productData.weight || 'Not specified'}

Please respond in the following JSON format:
{
  "name": "Enhanced product name (max 50 characters, no truncation symbols like ..., complete words only)",
  "features": ["Professional feature description 1. Preserves all original facts, technical details, and sizing information like 1-inch by 10 yard-roll.", "Professional feature description 2. Maintains all specifications, measurements, and product dimensions.", "Professional feature description 3. Highlights medical benefits, applications, and includes all sizing details."],
  "category": "Most appropriate category",
  "quantity": "Quantity information if available (e.g., '100 ct', '12 pack')",
  "material": "Main material if identifiable (e.g., 'adhesive', 'foam', 'latex-free', 'sterile gauze')"
}

Guidelines:
- Keep product names concise but descriptive (max 50 characters)
- Never use "..." or other truncation symbols in product names
- Complete words only, no partial words
- For features, focus on medical benefits and use cases while preserving ALL original facts and technical details:
  * Highlight sterility, safety, and medical compliance
  * Emphasize ease of use for medical professionals
  * Mention specific applications in medical settings
  * Focus on quality, durability, and performance
  * Preserve ALL technical specifications, measurements, materials, sizing information (e.g., "1-inch by 10 yard-roll"), and factual information from the original listing
  * Never omit, summarize away, or lose important details including specific measurements and sizing
  * Present facts in a more professional and readable format without losing any information
  * Convert technical jargon into clear, professional language while keeping all specifications
  * Ensure all sizing, dimensions, and measurement details are explicitly included in the features
  * Features can be longer if needed to include every aspect of the product
- Use standard first aid/medical supply categories
- Extract quantity from title, features, or dimensions when possible
- Identify materials by looking for terms like: adhesive, foam, latex-free, sterile gauze, plastic, fabric, metal, cotton, polyester, silicone, rubber, vinyl, etc.
- Look for material terms in the product title and features
- If no clear material is identifiable, leave this field empty
- Only include fields that can be meaningfully enhanced
- If quantity is found, prefer it over weight in the response
- Make sure features are clear, benefit-focused, and concise
- Product names should be suitable for catalog listings but still informative
`;

    // Call OpenRouter API
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'deepseek/deepseek-chat-v3.1:free',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001', // Adjust as needed
        'X-Title': 'AT Supply Finder'
      }
    });

    // Parse the response
    const aiResponse = response.data.choices[0]?.message?.content || '{}';
    
    // Extract JSON from the response (in case there's additional text)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Clean up the product name to remove any truncation symbols
      let cleanedName = parsed.name || productData.name;
      if (cleanedName) {
        // Remove any truncation symbols like "..." or "…"
        cleanedName = cleanedName.replace(/\.{3,}/g, '').trim();
        // Ensure we don't end with a punctuation mark
        cleanedName = cleanedName.replace(/[.,;:]$/g, '').trim();
      }
      
      // Process features to ensure they are professional while preserving all facts
      let processedFeatures = productData.features;
      if (parsed.features && Array.isArray(parsed.features)) {
        // Join features with periods for better readability
        // Filter out any empty features and ensure we have content
        const validFeatures = parsed.features.filter(f => f && f.trim().length > 0);
        if (validFeatures.length > 0) {
          processedFeatures = validFeatures.join('. ') + '.';
        }
      }
      
      // Merge AI-enhanced data with original product data
      return {
        ...productData,
        name: cleanedName,
        features: processedFeatures,
        category: parsed.category || productData.category,
        material: parsed.material || productData.material,
        // If quantity is found, we might want to use it instead of weight
        ...(parsed.quantity && { 
          weight: parsed.quantity, // Replace weight with quantity when available
          quantity: parsed.quantity 
        })
      };
    }
    
    // If parsing fails, return original data
    return productData;
  } catch (error) {
    console.error('Error enhancing product with AI:', error.message);
    // Return original data if AI enhancement fails
    return productData;
  }
}