import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = 3001;

// Enable CORS with specific origins
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'http://localhost:3000', // Alternative local development port
  'https://wrap-wizard-finder-bmxeumvee-20jenselucjjs-projects.vercel.app', // Your Vercel deployment
  // Add any other domains you want to allow
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

// Import and use the Amazon API functions
import amazonAuth from './functions/amazon-auth.js';
import amazonCatalogSearch from './functions/amazon-catalog-search.js';
import amazonProductDetails from './functions/amazon-product-details.js';
import amazonPricing from './functions/amazon-pricing.js';
import scrapeAmazonProduct from './functions/scrape-amazon-product.js';

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

// Amazon Product Scraping endpoint
app.post('/api/scrape-amazon-product', scrapeAmazonProduct);

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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
