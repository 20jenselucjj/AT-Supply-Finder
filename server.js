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

// User Management Endpoints
// Create User endpoint
app.post('/api/users', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
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
      undefined, // phone
      password,
      name
    );
    
    // Assign role in userRoles collection if it's not the default 'user' role
    if (role && role !== 'user') {
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

// Update User endpoint
app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, name, role, status } = req.body;
    
    // Import the Appwrite SDK
    const { Client, Users, Databases, Query } = await import('node-appwrite');
    
    // Initialize the Appwrite SDK
    const client = new Client();
    client
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
      .setKey(process.env.VITE_APPWRITE_API_KEY);

    const users = new Users(client);
    const databases = new Databases(client);
    
    // Update user in Appwrite Auth
    let updatedUser;
    if (email || name) {
      updatedUser = await users.update(userId, email, name);
    } else {
      // If no auth updates, get current user
      updatedUser = await users.get(userId);
    }
    
    // Update user status if provided
    if (status !== undefined) {
      await users.updateStatus(userId, status === 'active');
    }
    
    // Update role in userRoles collection if provided
    if (role) {
      try {
        // First, check if user role exists
        const existingRoles = await databases.listDocuments(
          process.env.VITE_APPWRITE_DATABASE_ID,
          'userRoles',
          [Query.equal('userId', userId)]
        );

        if (existingRoles.total > 0) {
          // Update existing role
          await databases.updateDocument(
            process.env.VITE_APPWRITE_DATABASE_ID,
            'userRoles',
            existingRoles.documents[0].$id,
            { role: role }
          );
        } else {
          // Create new role entry
          await databases.createDocument(
            process.env.VITE_APPWRITE_DATABASE_ID,
            'userRoles',
            ID.unique(),
            {
              userId: userId,
              role: role
            }
          );
        }
      } catch (roleError) {
        console.error('Error updating role:', roleError);
        // Don't fail the whole operation if role update fails
      }
    }
    
    res.json({
      success: true,
      user: {
        id: updatedUser.$id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: role || 'user'
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update user',
      message: error.message 
    });
  }
});

// Update User Password endpoint
app.put('/api/users/:userId/password', async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false,
        error: 'Password is required' 
      });
    }
    
    // Import the Appwrite SDK
    const { Client, Users } = await import('node-appwrite');
    
    // Initialize the Appwrite SDK
    const client = new Client();
    client
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
      .setKey(process.env.VITE_APPWRITE_API_KEY);

    const users = new Users(client);
    
    // Update user password
    await users.updatePassword(userId, password);
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating user password:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update password',
      message: error.message 
    });
  }
});

// Delete User endpoint
app.delete('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Import the Appwrite SDK
    const { Client, Users, Databases, Query } = await import('node-appwrite');
    
    // Initialize the Appwrite SDK
    const client = new Client();
    client
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
      .setKey(process.env.VITE_APPWRITE_API_KEY);

    const users = new Users(client);
    const databases = new Databases(client);
    
    // Delete user role from userRoles collection if it exists
    try {
      const existingRoles = await databases.listDocuments(
        process.env.VITE_APPWRITE_DATABASE_ID,
        'userRoles',
        [Query.equal('userId', userId)]
      );

      if (existingRoles.total > 0) {
        await databases.deleteDocument(
          process.env.VITE_APPWRITE_DATABASE_ID,
          'userRoles',
          existingRoles.documents[0].$id
        );
      }
    } catch (roleError) {
      console.error('Error deleting user role:', roleError);
      // Continue with user deletion even if role deletion fails
    }
    
    // Delete user from Appwrite Auth
    await users.delete(userId);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete user',
      message: error.message 
    });
  }
});

// Amazon Auth endpoint
app.post('/api/amazon-auth', amazonAuth);

// Amazon Catalog Search endpoint
app.get('/api/amazon-catalog-search', amazonCatalogSearch);

// Amazon Product Details endpoint
app.get('/api/amazon-product-details/:asin', amazonProductDetails);

// Amazon Pricing endpoint
app.get('/api/amazon-pricing', amazonPricing);

// Amazon Product Scraping endpoint
app.post('/api/scrape-amazon-product', scrapeAmazonProduct);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Amazon SP-API server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({ error: 'CORS not allowed' });
  } else {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Amazon SP-API server running on http://localhost:${PORT}`);
  console.log('📦 Available endpoints:');
  console.log('  POST /api/amazon-auth');
  console.log('  GET  /api/amazon-catalog-search');
  console.log('  GET  /api/amazon-product-details/:asin');
  console.log('  GET  /api/amazon-pricing');
  console.log('  POST /api/scrape-amazon-product');
  console.log('  GET  /api/list-users');
  console.log('  POST /api/users');
  console.log('  PUT  /api/users/:userId');
  console.log('  PUT  /api/users/:userId/password');
  console.log('  DELETE /api/users/:userId');
  console.log('  GET  /api/health');
});

export default app;