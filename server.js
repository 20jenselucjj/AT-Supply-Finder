import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });
console.log('Environment variables loaded, found:', Object.keys(process.env).filter(key => key.startsWith('AMAZON_')).length, 'Amazon keys');

const app = express();
const PORT = 3001;

// Enable CORS with specific origins
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'http://localhost:3000', // Alternative local development port
  'http://localhost:3001', // Server port
  'https://wrap-wizard-finder-bmxeumvee-20jenselucjjs-projects.vercel.app', // Your Vercel deployment
  'https://at-supply-finder.appwrite.network', // Appwrite network deployment
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app build directory with proper cache headers
const buildPath = path.join(__dirname, 'dist');
app.use(express.static(buildPath, {
  setHeaders: (res, path) => {
    // Ensure JavaScript and CSS files are served with the correct MIME types
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
    
    // Add cache control headers for static assets
    if (path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.svg')) {
      // Assets with hashes can be cached for a long time
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      // HTML and other files should not be cached
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Import and use the Amazon API functions
import amazonAuth from './functions/amazon/amazon-auth.js';
import amazonCatalogSearch from './functions/amazon/amazon-catalog-search.js';
import amazonProductDetails from './functions/amazon/amazon-product-details.js';
import amazonPricing from './functions/amazon/amazon-pricing.js';
import scrapeAmazonProduct from './functions/amazon/scrape-amazon-product.js';
import amazonPASearch from './functions/amazon/amazon-pa-search.js';
import validateRole from './functions/auth/validate-role.js';

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }

    // For now, we'll just log the contact form submission
    // In a production environment, you would send an email or store in a database
    console.log('Contact form submission:', { name, email, subject, message });
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Respond with success
    res.status(200).json({ 
      success: true, 
      message: 'Message received successfully! We will get back to you soon.' 
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process your message. Please try again later.' 
    });
  }
});

// Add this new endpoint for listing users - implementing directly instead of using dynamic import
app.get('/api/list-users', async (req, res) => {
  try {
    console.log('Received request for list-users with query:', req.query);
    
    // Import the Appwrite SDK
    const { Client, Users, Databases, Query, ID } = await import('node-appwrite');
    
    // Initialize the Appwrite SDK
    const client = new Client();
    client
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
      .setKey(process.env.VITE_APPWRITE_API_KEY);

    const users = new Users(client);
    const databases = new Databases(client);
    
    // Parse query parameters
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    
    console.log('Search parameters:', { search, page, limit, offset });
    
    // Get all users (without search filter to avoid fulltext index requirement)
    // We'll filter in memory instead
    const userList = await users.list([
      Query.limit(100) // Get more users to filter in memory
    ]);
    
    // Get user roles from the userRoles collection
    const rolesResponse = await databases.listDocuments(
      process.env.VITE_APPWRITE_DATABASE_ID,
      'userRoles'
    );
    
    // Create a map of user roles for easy lookup
    const userRolesMap = {};
    rolesResponse.documents.forEach(roleDoc => {
      userRolesMap[roleDoc.userId] = roleDoc.role;
    });
    
    // Transform user data and apply search filter if needed
    let transformedUsers = userList.users
      .filter(user => user.$id) // Filter out users without IDs
      .map(user => ({
        $id: user.$id,
        email: user.email || 'No email',
        phone: user.phone,
        name: user.name,
        registration: user.registration,
        status: user.status,
        emailVerification: user.emailVerification,
        phoneVerification: user.phoneVerification,
        role: userRolesMap[user.$id] || 'user', // Default to 'user' if no role found
        labels: user.labels,
        passwordUpdate: user.passwordUpdate,
        $createdAt: user.$createdAt,
        $updatedAt: user.$updatedAt,
        accessedAt: user.accessedAt
      }));
    
    // Apply search filter in memory if search term is provided
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      transformedUsers = transformedUsers.filter(user => 
        user.email && user.email.toLowerCase().includes(searchLower)
      );
      console.log(`Filtered users by email containing '${search}'. Found ${transformedUsers.length} matches.`);
    }
    
    // Apply pagination after filtering
    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedUsers = transformedUsers.slice(startIndex, endIndex);
    
    // Return the enhanced user data
    res.json({
      success: true,
      data: {
        users: paginatedUsers,
        total: transformedUsers.length, // Total count after filtering
        page: page,
        limit: limit
      }
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to list users',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      data: {
        users: [],
        total: 0
      }
    });
  }
});

// Amazon Product Import endpoint
app.post('/api/import-amazon-products', async (req, res) => {
  try {
    console.log('🔄 Starting Amazon product import process');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));

    const { selectedCategories, productsPerCategory } = req.body;

    console.log('🔍 Validating request parameters...');
    console.log('📂 Selected categories:', selectedCategories);
    console.log('🔢 Products per category:', productsPerCategory);

    // Validate request parameters
    if (!selectedCategories || !Array.isArray(selectedCategories) || selectedCategories.length === 0) {
      console.error('❌ Validation failed: No selected categories');
      return res.status(400).json({
        success: false,
        error: 'Selected categories are required'
      });
    }

    if (!productsPerCategory || productsPerCategory < 1 || productsPerCategory > 10) {
      console.error('❌ Validation failed: Invalid products per category:', productsPerCategory);
      return res.status(400).json({
        success: false,
        error: 'Products per category must be between 1 and 10'
      });
    }

    console.log('✅ Request validation passed');

    // Import required modules
    console.log('📦 Importing required modules...');
    const { Client, Databases, Query, ID } = await import('node-appwrite');
    console.log('✅ Appwrite modules imported successfully');
    
    // Initialize Appwrite client
    const client = new Client();
    client
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY);

    const databases = new Databases(client);
    
    // Import the searchProducts function directly
    const amazonModule = await import('./functions/amazon/amazon-pa-search.js');
    const searchProducts = amazonModule.searchProducts;

    // Debug: Log what we're importing
    console.log('🔍 Imported amazonModule:', Object.keys(amazonModule));
    console.log('🔍 searchProducts function:', typeof searchProducts);
    
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
    
    // Collect all products
    const allProducts = [];
    const errors = [];

    // Process each category
    for (const categoryId of selectedCategories) {
      try {
        const searchTerms = CATEGORY_SEARCH_TERMS[categoryId] || ['medical supplies'];
        const productsForCategory = [];
        
        // Try each search term for the category until we get enough products
        for (const searchTerm of searchTerms) {
          if (productsForCategory.length >= productsPerCategory) break;
          
          try {
            // Call the searchProducts function directly with parameters
            const searchResult = await searchProducts(searchTerm, 'HealthPersonalCare',
              Math.min(productsPerCategory, 10));
            
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
            console.warn(`Search failed for term "${searchTerm}":`, searchError.message);
            // Continue with next search term
          }
        }
        
        // Add category products to all products
        allProducts.push(...productsForCategory);
      } catch (categoryError) {
        console.error(`Error processing category ${categoryId}:`, categoryError);
        errors.push(`Error processing category ${categoryId}: ${categoryError.message}`);
      }
    }
    
    console.log(`Found ${allProducts.length} products from Amazon`);
    
    // Get existing products from database to check for duplicates
    // Use Appwrite function environment variable if available, otherwise fall back to VITE variable
    const databaseId = process.env.APPWRITE_FUNCTION_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID;
    
    if (!databaseId) {
      throw new Error('Database ID not found in environment variables. Please set either APPWRITE_FUNCTION_DATABASE_ID or VITE_APPWRITE_DATABASE_ID.');
    }
    
    const existingProductsResponse = await databases.listDocuments(
      databaseId,
      'products',
      [Query.limit(1000)] // Get all products to check for duplicates
    );
    
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
    
    // Map Amazon data fields to local product fields
    const productsToCreate = uniqueProducts.map(product => {
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
      
      // Extract reviews/ratings
      const rating = product.ItemInfo?.ProductInfo?.AverageRating?.DisplayValue || null;
      const reviewCount = product.ItemInfo?.ProductInfo?.Reviews?.TotalReviews?.DisplayValue || null;
      
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

      // Debug the features field
      const featuresString = productFeatures.length > 0 ? productFeatures.join('; ').substring(0, 1000) : '';
      console.log('Features debug:', {
        originalFeatures: productFeatures,
        featuresString: featuresString,
        type: typeof featuresString,
        length: featuresString.length
      });
      
      return {
        name: (product.ItemInfo?.Title?.DisplayValue || 'Unknown Product').substring(0, 255),
        category: category,
        brand: brandString,
        rating: rating || 0,
        price: price || 0,
        features: featuresString,
        imageUrl: imageUrl || '',
        asin: product.ASIN || '',
        affiliateLink: `https://www.amazon.com/dp/${product.ASIN}/ref=nosim?tag=${process.env.AMAZON_PA_PARTNER_TAG || 'your-tag-here'}`,
        // Additional fields that match the add product form
        dimensions: dimensions || '',
        weight: weight || '',
        material: material,
        qty: quantity || 1
      };
    });
    
    console.log(`Prepared ${productsToCreate.length} products for creation`);
    
    // Create products in the database
    const createdProducts = [];
    const failedProducts = [];
    
    // Process products in batches to handle rate limits
    const batchSize = 5; // Process 5 products at a time
    for (let i = 0; i < productsToCreate.length; i += batchSize) {
      const batch = productsToCreate.slice(i, i + batchSize);
      
      // Create each product in the batch
      const batchPromises = batch.map(async (product) => {
        try {
          const createdProduct = await databases.createDocument(
            databaseId,
            'products',
            ID.unique(),
            product
          );
          createdProducts.push(createdProduct);
          console.log(`Created product: ${product.name}`);
          return createdProduct;
        } catch (error) {
          console.error(`Failed to create product: ${product.name}`, error);
          failedProducts.push({ product, error: error.message });
          return null;
        }
      });
      
      // Wait for all products in the batch to be processed
      await Promise.all(batchPromises);
      
      // Add a small delay between batches to respect rate limits
      if (i + batchSize < productsToCreate.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Successfully created ${createdProducts.length} products, ${failedProducts.length} failed`);
    
    // Return success response
    res.status(200).json({
      success: true,
      message: `Successfully imported ${createdProducts.length} products from Amazon`,
      createdCount: createdProducts.length,
      failedCount: failedProducts.length,
      failedProducts: failedProducts.map(fp => ({
        productName: fp.product.name,
        error: fp.error
      })),
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error importing Amazon products:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to import Amazon products',
      message: error.message 
    });
  }
});

// Amazon Product Scraping endpoint
app.post('/api/scrape-amazon-product', scrapeAmazonProduct);

// Role validation endpoint
app.post('/api/validate-role', async (req, res) => {
  try {
    // Create Appwrite Functions compatible context
    const context = {
      req: {
        body: JSON.stringify(req.body),
        headers: req.headers
      },
      res: {
        json: (data) => res.json(data),
        send: (data) => res.send(data)
      },
      log: console.log,
      error: console.error
    };
    
    // Call the validateRole function with Appwrite Functions format
    await validateRole(context);
  } catch (error) {
    console.error('Error in validate-role endpoint:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// User Management Endpoints
// Create User endpoint
app.post('/api/users', async (req, res) => {
  const { email, password, role, name } = req.body;

  try {
    // Import the Appwrite SDK
    const { Client, Users, Databases, ID } = await import('node-appwrite');
    
    // Initialize the Appwrite SDK
    const client = new Client();
    client
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
      .setKey(process.env.VITE_APPWRITE_API_KEY);

    const users = new Users(client);
    const databases = new Databases(client);

    // Create user in Appwrite Auth
    const user = await users.create(
      ID.unique(),
      email,
      null, // phone
      password,
      name
    );

    // Assign role in a separate collection
    try {
      await databases.createDocument(
        process.env.VITE_APPWRITE_DATABASE_ID,
        'userRoles',
        ID.unique(),
        {
          userId: user.$id,
          role: role
        }
      );
    } catch (roleError) {
      console.error('Error assigning role:', roleError);
      // Don't fail the whole operation if role assignment fails
    }

    res.status(201).json({
      success: true,
      user: {
        id: user.$id,
        email: user.email,
        name: user.name,
        role: role || 'user'
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create user',
      message: error.message 
    });
  }
});

// API routes should be defined before the catch-all handler
// Catch-all handler for SPA routing - serve index.html for any non-API routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving static files from: ${buildPath}`);
});
