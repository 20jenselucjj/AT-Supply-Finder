// Script to update product service from Supabase to Appwrite
const fs = require('fs');
const path = require('path');

// Path to the product service file
const productServicePath = path.join(__dirname, '..', 'src', 'lib', 'amazon-product-service.ts');

if (fs.existsSync(productServicePath)) {
  let productServiceContent = fs.readFileSync(productServicePath, 'utf8');
  
  // Replace Supabase imports with Appwrite imports
  productServiceContent = productServiceContent.replace(
    "import { supabase } from './supabase';",
    "import { databases } from './appwrite';"
  );
  
  // Replace environment variable references
  productServiceContent = productServiceContent.replace(
    /import\.meta\.env\.VITE_SUPABASE_URL/g,
    "import.meta.env.VITE_APPWRITE_ENDPOINT"
  );
  
  // Update getProducts function
  productServiceContent = productServiceContent.replace(
    /export const getProducts = async \(filters?: ProductFilters\) => \{[^}]*\}/s,
    `export const getProducts = async (filters?: ProductFilters) => {
  try {
    // Build query based on filters
    let query = databases.listDocuments(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION
    );
    
    // Apply filters if provided
    if (filters) {
      const queries: string[] = [];
      
      if (filters.category) {
        queries.push(\`equal("category", "\${filters.category}")\`);
      }
      
      if (filters.search) {
        queries.push(\`search("name", "\${filters.search}")\`);
      }
      
      if (filters.limit) {
        queries.push(\`limit(\${filters.limit})\`);
      }
      
      if (queries.length > 0) {
        query = databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION,
          queries
        );
      }
    }
    
    const response = await query;
    return { data: response.documents, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};`
  );
  
  // Update getProductById function
  productServiceContent = productServiceContent.replace(
    /export const getProductById = async \(id: string\) => \{[^}]*\}/s,
    `export const getProductById = async (id: string) => {
  try {
    const response = await databases.getDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION,
      id
    );
    return { data: response, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};`
  );
  
  // Update createProduct function
  productServiceContent = productServiceContent.replace(
    /export const createProduct = async \(product: any\) => \{[^}]*\}/s,
    `export const createProduct = async (product: any) => {
  try {
    const response = await databases.createDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION,
      'unique()',
      product
    );
    return { data: response, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};`
  );
  
  // Update updateProduct function
  productServiceContent = productServiceContent.replace(
    /export const updateProduct = async \(id: string, updates: any\) => \{[^}]*\}/s,
    `export const updateProduct = async (id: string, updates: any) => {
  try {
    const response = await databases.updateDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION,
      id,
      updates
    );
    return { data: response, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};`
  );
  
  // Update deleteProduct function
  productServiceContent = productServiceContent.replace(
    /export const deleteProduct = async \(id: string\) => \{[^}]*\}/s,
    `export const deleteProduct = async (id: string) => {
  try {
    const response = await databases.deleteDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION,
      id
    );
    return { data: response, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};`
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(productServicePath, productServiceContent);
  console.log('Updated src/lib/amazon-product-service.ts to use Appwrite');
} else {
  console.log('Product service file not found.');
}

console.log('\\nNext steps:');
console.log('1. Review the updated product service to ensure all functions work as expected');
console.log('2. Update environment variables in your .env file:');
console.log('   - VITE_APPWRITE_DATABASE_ID');
console.log('   - VITE_APPWRITE_PRODUCTS_COLLECTION');
console.log('3. Test product-related functionality');