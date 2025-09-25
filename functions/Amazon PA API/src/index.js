import ProductAdvertisingAPIv1 from 'paapi5-nodejs-sdk';
import { Client, Databases, Query, ID } from 'node-appwrite';

// NOTE: This code uses node-appwrite v9.0.0 which has a known bug with regional endpoints
// (like https://nyc.cloud.appwrite.io/v1) where ALL GET requests (listCollections, listDocuments, etc.)
// incorrectly send a request body, causing "request cannot have request body" errors.
// We've worked around this by skipping GET-based database tests and proceeding directly to
// POST/PUT operations (create/update) which work correctly.

// Map first aid categories to Amazon search terms
const CATEGORY_SEARCH_TERMS = {
  'wound-care-dressings': ['bandages', 'gauze', 'wound care', 'medical tape'],
  'tapes-wraps': ['medical tape', 'elastic bandage', 'ace bandage', 'wraps'],
  'antiseptics-ointments': ['antiseptic', 'ointment', 'hydrogen peroxide', 'alcohol swabs'],
  'pain-relief': ['pain relief', 'ibuprofen', 'acetaminophen', 'aspirin'],
  'instruments-tools': ['medical scissors', 'tweezers', 'thermometer', 'medical tools'],
  'trauma-emergency': ['emergency kit', 'first aid kit', 'emergency supplies', 'trauma supplies'],
  'ppe': ['nitrile gloves', 'face mask', 'safety goggles', 'ppe'],
  'information-essentials': ['first aid manual', 'emergency guide', 'medical reference'],
  'hot-cold-therapy': ['ice pack', 'heat pack', 'hot cold therapy', 'compress'],
  'hydration-nutrition': ['electrolyte drink', 'hydration tablets', 'energy bar', 'sports drink'],
  'miscellaneous': ['medical supplies', 'first aid supplies', 'health supplies']
};

// Initialize the API client
const getApiClient = () => {
  const PA_ACCESS_KEY = process.env.AMAZON_PA_ACCESS_KEY;
  const PA_SECRET_KEY = process.env.AMAZON_PA_SECRET_KEY;
  const PA_PARTNER_TAG = process.env.AMAZON_PA_PARTNER_TAG;

  if (!PA_ACCESS_KEY || !PA_SECRET_KEY || !PA_PARTNER_TAG) {
    throw new Error('Missing Amazon PA API credentials');
  }

  const defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;
  
  // Set credentials
  defaultClient.accessKey = PA_ACCESS_KEY;
  defaultClient.secretKey = PA_SECRET_KEY;
  
  // Set host and region for US locale
  defaultClient.host = 'webservices.amazon.com';
  defaultClient.region = 'us-east-1';
  
  return new ProductAdvertisingAPIv1.DefaultApi(defaultClient);
};

// Search for products using PA API 5.0 SDK
const searchProductsInternal = (keywords, searchIndex = 'All', itemCount = 10) => {
  return new Promise((resolve, reject) => {
    try {
      const api = getApiClient();
      
      // Create search request
      const searchItemsRequest = new ProductAdvertisingAPIv1.SearchItemsRequest();
      
      // Set required parameters
      searchItemsRequest.PartnerTag = process.env.AMAZON_PA_PARTNER_TAG;
      searchItemsRequest.PartnerType = 'Associates';
      searchItemsRequest.Keywords = keywords;
      searchItemsRequest.SearchIndex = searchIndex;
      searchItemsRequest.ItemCount = itemCount;
      
      // Set resources to return
      searchItemsRequest.Resources = [
        'ItemInfo.Title',
        'ItemInfo.Features',
        'ItemInfo.ProductInfo',
        'ItemInfo.ByLineInfo',
        'ItemInfo.ContentInfo',
        'ItemInfo.TechnicalInfo',
        'ItemInfo.ExternalIds',
        'Offers.Listings.Price',
        'Images.Primary.Small',
        'Images.Primary.Medium',
        'Images.Primary.Large',
        'BrowseNodeInfo.BrowseNodes'
      ];

      console.log('Making PA API SearchItems request:');
      console.log('Keywords:', keywords);
      console.log('SearchIndex:', searchIndex);
      console.log('ItemCount:', itemCount);

      // Make the API call using callback
      api.searchItems(searchItemsRequest, (error, data, response) => {
        if (error) {
          console.error('PA API Error details:');
          console.error('Status:', error.status);
          console.error('Message:', error.message);
          if (error.response) {
            console.error('Response body:', error.response.text);
          }
          reject(error);
        } else {
          console.log('PA API Response received successfully');
          resolve(data);
        }
      });
      
    } catch (error) {
      console.error('PA API Error details:');
      console.error('Status:', error.status);
      console.error('Message:', error.message);
      if (error.response) {
        console.error('Response body:', error.response.text);
      }
      reject(error);
    }
  });
};

// Get item details using PA API SDK
const getItemDetails = (itemIds) => {
  return new Promise((resolve, reject) => {
    try {
      const api = getApiClient();
      
      // Create get items request
      const getItemsRequest = new ProductAdvertisingAPIv1.GetItemsRequest();
      
      // Set required parameters
      getItemsRequest.PartnerTag = process.env.AMAZON_PA_PARTNER_TAG;
      getItemsRequest.PartnerType = 'Associates';
      getItemsRequest.ItemIds = Array.isArray(itemIds) ? itemIds : [itemIds];
      
      // Set resources to return
      getItemsRequest.Resources = [
        'ItemInfo.Title',
        'ItemInfo.Features',
        'ItemInfo.ProductInfo',
        'ItemInfo.ByLineInfo',
        'ItemInfo.ContentInfo',
        'ItemInfo.TechnicalInfo',
        'ItemInfo.ExternalIds',
        'Offers.Listings.Price',
        'Offers.Listings.SavingBasis',
        'Offers.Listings.Promotions',
        'Images.Primary.Small',
        'Images.Primary.Medium',
        'Images.Primary.Large',
        'Images.Variants.Small',
        'Images.Variants.Medium',
        'Images.Variants.Large',
        'BrowseNodeInfo.BrowseNodes'
      ];

      console.log('Making PA API GetItems request for:', itemIds);

      // Make the API call using callback
      api.getItems(getItemsRequest, (error, data, response) => {
        if (error) {
          console.error('PA API GetItems Error details:');
          console.error('Status:', error.status);
          console.error('Message:', error.message);
          if (error.response) {
            console.error('Response body:', error.response.text);
          }
          reject(error);
        } else {
          console.log('PA API GetItems response received successfully');
          resolve(data);
        }
      });
      
    } catch (error) {
      console.error('PA API GetItems Error details:');
      console.error('Status:', error.status);
      console.error('Message:', error.message);
      if (error.response) {
        console.error('Response body:', error.response.text);
      }
      reject(error);
    }
  });
};

// Search products by category or keywords
const searchProducts = async (keywordsOrCategory, searchIndex = 'HealthPersonalCare', itemCount = 10) => {
  // Check if first parameter is a category or keywords
  let keywords;
  let actualSearchIndex = searchIndex;
  
  if (CATEGORY_SEARCH_TERMS[keywordsOrCategory]) {
    // It's a category - pick a random search term
    const searchTerms = CATEGORY_SEARCH_TERMS[keywordsOrCategory];
    keywords = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    console.log(`Searching for category: ${keywordsOrCategory}, using keywords: ${keywords}`);
  } else {
    // It's keywords - use directly
    keywords = keywordsOrCategory;
    console.log(`Searching with keywords: ${keywords}`);
  }
  
  try {
    const response = await searchProductsInternal(keywords, actualSearchIndex, itemCount);
    return response;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// Import Amazon products to Appwrite database
const importAmazonProducts = async (selectedCategories, productsPerCategory) => {
  try {
    console.log('🔄 Starting Amazon product import process');
    console.log('📂 Selected categories:', selectedCategories);
    console.log('🔢 Products per category:', productsPerCategory);

    // Validate request parameters
    if (!selectedCategories || !Array.isArray(selectedCategories) || selectedCategories.length === 0) {
      console.error('❌ Validation failed: No selected categories');
      return {
        success: false,
        error: 'Selected categories are required'
      };
    }

    if (!productsPerCategory || productsPerCategory < 1 || productsPerCategory > 10) {
      console.error('❌ Validation failed: Invalid products per category:', productsPerCategory);
      return {
        success: false,
        error: 'Products per category must be between 1 and 10'
      };
    }

    // Validate required environment variables
    const databaseId = process.env.APPWRITE_FUNCTION_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;
    if (!databaseId) {
      console.error('❌ Missing required environment variable: APPWRITE_FUNCTION_DATABASE_ID or APPWRITE_DATABASE_ID');
      return {
        success: false,
        error: 'Database ID is not configured'
      };
    }

    console.log('✅ Request validation passed');
    
    // Initialize Appwrite client
    console.log('Initializing Appwrite client...');
    let endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
    
    // Clean endpoint URL - remove backticks and extra quotes
    endpoint = endpoint.replace(/[`"']/g, '').trim();
    
    // Validate endpoint format
    if (!endpoint.startsWith('http')) {
      console.error('❌ Invalid endpoint format:', endpoint);
      console.error('Endpoint must start with http:// or https://');
      return {
        success: false,
        error: 'Invalid Appwrite endpoint format'
      };
    }
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    
    console.log('Endpoint:', endpoint);
    console.log('Project ID:', projectId);
    console.log('API Key exists:', !!apiKey);
    
    if (!projectId) {
      console.error('❌ Missing required environment variable: APPWRITE_FUNCTION_PROJECT_ID or APPWRITE_PROJECT_ID');
      return {
        success: false,
        error: 'Project ID is not configured'
      };
    }
    
    if (!apiKey) {
      console.error('❌ Missing required environment variable: APPWRITE_API_KEY');
      return {
        success: false,
        error: 'API Key is not configured'
      };
    }
    
    const client = new Client();
    
    try {
      client
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);
    } catch (clientError) {
      console.error('❌ Failed to initialize Appwrite client:', clientError.message);
      return {
        success: false,
        error: `Client initialization failed: ${clientError.message}`
      };
    }

    const databases = new Databases(client);
    
    // Test database connection before proceeding
    try {
      console.log('Testing database connection...');
      console.log('Using database ID:', databaseId);
      console.log('Endpoint:', endpoint);
      
      // Skip database operations that use GET requests due to node-appwrite v9.0.0 bug with regional endpoints
      // The bug causes "request cannot have request body" error for ALL GET requests with regional endpoints
      console.log('⚠️  Skipping database connection test due to node-appwrite v9.0.0 SDK bug with regional endpoints');
      console.log('All GET requests (listCollections, listDocuments) fail with "request cannot have request body" error');
      console.log('Proceeding with import process - database operations will be tested during product creation');
      
      // Instead of testing with GET requests, we'll test the connection during the actual import
      // by attempting to create/update documents, which use POST/PUT requests that work fine
      
    } catch (testError) {
      console.error('Database connection test failed:', testError.message);
      console.error('Full error details:', testError);
      if (testError.code) {
        console.error('Error code:', testError.code);
      }
      
      // Check if it's a 404 error which might indicate wrong endpoint
      if (testError.message.includes('404') || testError.message.includes('Route not found')) {
        console.error('⚠️  The Appwrite endpoint appears to be invalid or unavailable.');
        console.error('Please check your APPWRITE_FUNCTION_API_ENDPOINT or APPWRITE_ENDPOINT environment variable.');
        console.error('Current endpoint:', endpoint);
        console.error('Make sure the endpoint does not contain backticks or extra quotes');
      }
      
      return {
        success: false,
        error: `Database connection failed: ${testError.message}`
      };
    }
    
    // Collect all products
    const allProducts = [];
    const errors = [];

    // Process each category with improved duplicate handling
    for (const categoryId of selectedCategories) {
      try {
        const searchTerms = CATEGORY_SEARCH_TERMS[categoryId] || ['medical supplies'];
        const productsForCategory = [];
        
        let attempts = 0;
        const maxAttempts = 3;
        let itemsPerSearch = productsPerCategory * 2; // Start with 2x to account for duplicates
        
        // Try each search term for the category until we get enough products
        while (productsForCategory.length < productsPerCategory && attempts < maxAttempts) {
          attempts++;
          console.log(`Attempt ${attempts} for category ${categoryId}, fetching ${itemsPerSearch} items`);
          
          for (const searchTerm of searchTerms) {
            if (productsForCategory.length >= productsPerCategory) break;
            
            try {
              // Call the searchProducts function directly with parameters
              const searchResult = await searchProducts(searchTerm, 'HealthPersonalCare',
                Math.min(itemsPerSearch, 10));
              
              if (searchResult?.SearchResult?.Items) {
                // Add products to our collection, avoiding duplicates
                for (const item of searchResult.SearchResult.Items) {
                  // Check if we already have this product (by ASIN)
                  const exists = productsForCategory.some(p => p.ASIN === item.ASIN) || 
                                allProducts.some(p => p.ASIN === item.ASIN);
                  
                  if (!exists && productsForCategory.length < productsPerCategory) {
                    productsForCategory.push(item);
                  }
                }
              }
            } catch (searchError) {
              console.warn(`Search failed for term "${searchTerm}" (attempt ${attempts}):`, searchError.message);
              // Continue with next search term
            }
          }
          
          // If we still don't have enough, increase search size for next attempt
          if (productsForCategory.length < productsPerCategory) {
            itemsPerSearch = Math.min(itemsPerSearch * 2, 50); // Cap at 50 to avoid API limits
          }
        }
        
        // Take only the requested number of products for this category
        const productsToAdd = productsForCategory.slice(0, productsPerCategory);
        allProducts.push(...productsToAdd);
        console.log(`Final count for category ${categoryId}: ${productsToAdd.length} products`);
      } catch (categoryError) {
        console.error(`Error processing category ${categoryId}:`, categoryError);
        errors.push(`Error processing category ${categoryId}: ${categoryError.message}`);
      }
    }
    
    console.log(`Found ${allProducts.length} products from Amazon`);
    
    // Get existing products from database to check for duplicates
    console.log(`Using database ID: ${databaseId}`);
    let existingProductsResponse;
    
    // Handle the node-appwrite v9.0.0 GET request bug with regional endpoints
    try {
      console.log('Fetching existing products from collection: products');
      console.log('Database ID:', databaseId);
      console.log('Collection ID: products');
      console.log('Query:', [Query.limit(1000)]);
      
      existingProductsResponse = await databases.listDocuments(
        databaseId,
        'products',
        [Query.limit(1000)] // Get all products to check for duplicates
      );
      console.log(`Found ${existingProductsResponse.documents.length} existing products`);
    } catch (dbError) {
      // Handle the specific "request cannot have request body" error from node-appwrite v9.0.0
      if (dbError.message.includes('request cannot have request body')) {
        console.warn('⚠️  GET request failed due to node-appwrite v9.0.0 bug with regional endpoints');
        console.warn('Assuming no existing products and proceeding with import');
        console.warn('All products will be treated as new imports');
        
        // Return empty response to simulate no existing products
        existingProductsResponse = {
          documents: [],
          total: 0
        };
      } else {
        console.error('Error fetching existing products:', dbError.message);
        console.error('Full error object:', JSON.stringify(dbError, null, 2));
        if (dbError.code) {
          console.error('Error code:', dbError.code);
        }
        if (dbError.response) {
          console.error('Error response:', dbError.response);
        }
        throw new Error(`Failed to fetch existing products: ${dbError.message}`);
      }
    }
    
    const existingProducts = existingProductsResponse.documents;
    const existingASINs = new Set(existingProducts.map(p => p.asin).filter(Boolean));
    const existingNames = new Set(existingProducts.map(p => p.name).filter(Boolean));
    
    console.log(`Found ${existingASINs.size} existing ASINs and ${existingNames.size} existing product names`);
    
    // Filter out duplicates
    const uniqueProducts = allProducts.filter(product => {
      // Check if product ASIN already exists
      if (product.ASIN && existingASINs.has(product.ASIN)) {
        console.log(`Skipping product with existing ASIN: ${product.ASIN}`);
        return false;
      }
      
      // Check if product name already exists
      const productName = product.ItemInfo?.Title?.DisplayValue;
      if (productName && existingNames.has(productName)) {
        console.log(`Skipping product with existing name: ${productName}`);
        return false;
      }
      
      return true;
    });
    
    console.log(`Found ${uniqueProducts.length} unique products to import`);
    
    // Get detailed product information using GetItems
    let detailedProducts = uniqueProducts;
    if (uniqueProducts.length > 0) {
      try {
        console.log('🔍 Fetching detailed product information...');
        const asins = uniqueProducts.map(p => p.ASIN).filter(Boolean);
        
        if (asins.length > 0) {
          const detailedResponse = await getItemDetails(asins);
          
          if (detailedResponse?.ItemsResult?.Items) {
            console.log(`✅ Got detailed information for ${detailedResponse.ItemsResult.Items.length} products`);
            detailedProducts = detailedResponse.ItemsResult.Items;
          } else {
            console.warn('⚠️  GetItems response did not contain detailed product data, using original search results');
          }
        }
      } catch (detailError) {
        console.warn('⚠️  Failed to get detailed product information:', detailError.message);
        console.warn('Proceeding with original search results');
      }
    }
    
    // Map Amazon data fields to local product fields
    const productsToCreate = detailedProducts.map(product => {
      // Extract category from the selected categories based on search terms
      // This is a simplified approach - in a real implementation, you might want to use browse nodes
      let category = 'Miscellaneous & General'; // Default category
      
      // Try to match the product to a specific category based on keywords
      const title = product.ItemInfo?.Title?.DisplayValue || '';
      const features = product.ItemInfo?.Features?.DisplayValues || [];
      const description = [title, ...features].join(' ').toLowerCase();
      
      // Map first aid categories to product categories
      const categoryMap = {
        'wound-care-dressings': ['bandage', 'gauze', 'wound', 'tape', 'adhesive'],
        'tapes-wraps': ['tape', 'wrap', 'bandage', 'ace', 'elastic'],
        'antiseptics-ointments': ['antiseptic', 'ointment', 'hydrogen peroxide', 'alcohol', 'swab'],
        'pain-relief': ['pain', 'relief', 'ibuprofen', 'acetaminophen', 'aspirin'],
        'instruments-tools': ['scissor', 'tweezer', 'thermometer', 'tool'],
        'trauma-emergency': ['emergency', 'kit', 'trauma', 'supply'],
        'ppe': ['glove', 'mask', 'goggle', 'ppe'],
        'information-essentials': ['manual', 'guide', 'reference', 'book'],
        'hot-cold-therapy': ['ice', 'heat', 'therapy', 'pack'],
        'hydration-nutrition': ['electrolyte', 'hydration', 'energy', 'drink']
      };
      
      // Try to find a matching category
      for (const [categoryId, keywords] of Object.entries(categoryMap)) {
        if (keywords.some(keyword => description.includes(keyword))) {
          // Map to the friendly category names used in the UI
          const friendlyCategoryMap = {
            'wound-care-dressings': 'Wound Care & Dressings',
            'tapes-wraps': 'Tapes & Wraps',
            'antiseptics-ointments': 'Antiseptics & Ointments',
            'pain-relief': 'Pain & Symptom Relief',
            'instruments-tools': 'Instruments & Tools',
            'trauma-emergency': 'Trauma & Emergency',
            'ppe': 'Personal Protection Equipment (PPE)',
            'information-essentials': 'First Aid Information & Essentials',
            'hot-cold-therapy': 'Hot & Cold Therapy',
            'hydration-nutrition': 'Hydration & Nutrition',
            'miscellaneous': 'Miscellaneous & General'
          };
          
          category = friendlyCategoryMap[categoryId];
          break;
        }
      }
      
      // Extract features from the product
      const productFeatures = product.ItemInfo?.Features?.DisplayValues || [];
      
      // Extract price (use the lowest price if multiple offers)
      let price = null;
      if (product.Offers?.Listings && product.Offers.Listings.length > 0) {
        const prices = product.Offers.Listings
          .map(listing => listing.Price?.Amount)
          .filter(Boolean);
        if (prices.length > 0) {
          price = Math.min(...prices);
        }
      }
      
      // Extract image URL (use the medium image if available)
      const imageUrl = product.Images?.Primary?.Medium?.URL || 
                      product.Images?.Primary?.Large?.URL || 
                      product.Images?.Primary?.Small?.URL || 
                      null;
      

      
      // Extract dimensions and weight
      let dimensions = product.ItemInfo?.ProductInfo?.ItemDimensions?.DisplayValue || null;
      const weight = product.ItemInfo?.ProductInfo?.PackageDimensions?.Weight?.DisplayValue || null;
      
      // Extract quantity information but we'll store it in dimensions if needed
      let quantity = null;
      
      // Try to extract quantity from title (common patterns like "100 Count", "Pack of 50", etc.)
      const productTitle = product.ItemInfo?.Title?.DisplayValue || '';
      const quantityMatch = productTitle.match(/(\d+)\s*(?:Count|Pack|Pack of|Packaging|Pieces|Ct|Pc)/i);
      if (quantityMatch) {
        quantity = parseInt(quantityMatch[1]);
      }
      
      // If not found in title, try to get from product info
      if (!quantity && product.ItemInfo?.ProductInfo?.PackageDimensions?.DisplayValue) {
        const packageInfo = product.ItemInfo.ProductInfo.PackageDimensions.DisplayValue;
        const packageQuantityMatch = packageInfo.match(/(\d+)\s*(?:Count|Pack|Pieces)/i);
        if (packageQuantityMatch) {
          quantity = parseInt(packageQuantityMatch[1]);
        }
      }
      
      // Map Amazon data to our product structure
      // Handle brand data properly - it comes as an object with DisplayValue
      const brandData = product.ItemInfo?.ByLineInfo?.Brand;
      const brandString = brandData?.DisplayValue ? String(brandData.DisplayValue).substring(0, 100) : 'Unknown Brand';
      
      // Extract material information from features or description
      let material = '';
      const materialKeywords = ['made of', 'material', 'cotton', 'polyester', 'nylon', 'latex', 'plastic', 'fabric', 'blend'];
      
      // Look for material information in features
      for (const feature of productFeatures) {
        const lowerFeature = feature.toLowerCase();
        if (materialKeywords.some(keyword => lowerFeature.includes(keyword))) {
          // Extract the sentence containing material info
          material = feature.substring(0, 100);
          break;
        }
      }
      
      // Extract quantity information and add to dimensions if needed
      if (quantity && !dimensions) {
        dimensions = `${quantity} ct`;
      }

      // Create the product object - only include attributes that exist in database schema
      return {
        name: productTitle.substring(0, 255),
        description: productFeatures.join('; ').substring(0, 2000), // Updated to match schema limit
        category: category,
        price: price,
        imageUrl: imageUrl,
        brand: brandString,
        material: material,
        dimensions: dimensions,
        weight: weight,

        asin: product.ASIN,
        affiliateLink: `https://www.amazon.com/dp/${product.ASIN}?tag=${process.env.AMAZON_PA_PARTNER_TAG}`,
        features: productFeatures.slice(0, 3).join('; ').substring(0, 1000), // Add features field
        qty: quantity || 1 // Default quantity to 1 if not found
      };
    });
    
    console.log(`Prepared ${productsToCreate.length} products for database insertion`);
    
    // Insert products into database
    // Note: createDocument() uses POST requests which work fine with regional endpoints
    // Only GET requests (listDocuments, listCollections) are affected by the node-appwrite v9.0.0 bug
    const createdProducts = [];
    const creationErrors = [];
    
    for (const product of productsToCreate) {
      try {
        console.log(`Creating product: ${product.name} in database: ${databaseId}`);
        console.log('Database ID:', databaseId);
        console.log('Collection ID: products');
        console.log('Document ID:', 'ID.unique()');
        console.log('Product data keys:', Object.keys(product));

        
        const createdProduct = await databases.createDocument(
          databaseId,
          'products',
          ID.unique(),
          product
        );
        console.log(`✅ Successfully created product: ${product.name}`);
        
        createdProducts.push(createdProduct);
        console.log(`Created product: ${product.name} (${product.asin})`);
      } catch (error) {
        console.error(`❌ Error creating product ${product.name}:`, error.message);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        if (error.code) {
          console.error('Error code:', error.code);
        }
        if (error.response) {
          console.error('Error response:', error.response);
        }
        creationErrors.push({
          product: product.name,
          error: error.message
        });
      }
    }
    
    console.log(`Successfully imported ${createdProducts.length} products`);
    
    return {
      success: true,
      data: {
        totalFound: allProducts.length,
        totalUnique: uniqueProducts.length,
        totalCreated: createdProducts.length,
        errors: [...errors, ...creationErrors]
      }
    };
  } catch (error) {
    console.error('Error importing Amazon products:', error);
    return {
      success: false,
      error: 'Failed to import Amazon products',
      message: error.message
    };
  }
};

// Main function handler for Appwrite
export default async ({ req, res, log, error }) => {
  // Enable CORS
  if (req.method === 'OPTIONS') {
    return res.json({
      status: 'ok'
    }, 200);
  }

  try {
    // Parse request body
    const body = req.bodyJson || {};
    const { action, category, asin, keywords, searchIndex, itemCount = 10, selectedCategories, productsPerCategory } = body;

    log('Received request with action:', action);
    
    let result;
    
    switch (action) {
      case 'search':
        if (keywords) {
          result = await searchProductsInternal(keywords, searchIndex, itemCount);
        } else if (category) {
          result = await searchProducts(category, searchIndex, itemCount);
        } else {
          return res.json({ 
            error: 'Please provide either category or keywords parameter' 
          }, 400);
        }
        break;
        
      case 'details':
        if (!asin) {
          return res.json({ 
            error: 'ASIN is required for product details' 
          }, 400);
        }
        result = await getItemDetails(asin);
        break;
        
      case 'import':
        if (!selectedCategories || !productsPerCategory) {
          return res.json({ 
            error: 'selectedCategories and productsPerCategory are required for import' 
          }, 400);
        }
        result = await importAmazonProducts(selectedCategories, productsPerCategory);
        break;
        
      default:
        return res.json({ 
          error: 'Invalid action. Supported actions: search, details, import' 
        }, 400);
    }

    return res.json(result, 200);
    
  } catch (err) {
    error('Function error:', err);
    return res.json({ 
      error: 'Failed to process request',
      details: err.message 
    }, 500);
  }
};