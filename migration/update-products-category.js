const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

// Initialize the Appwrite client
const client = new Client();
client
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY); // Use server key for write operations

const databases = new Databases(client);

// Category mapping from old database categories to new build page categories
const CATEGORY_MAPPING = {
  "First Aid & Wound Care": "wound-care-dressings",
  "Taping & Bandaging": "tapes-wraps",
  "Over-the-Counter Medication": "pain-relief",
  "Instruments & Tools": "instruments-tools",
  "Emergency Care": "trauma-emergency",
  "Personal Protection Equipment (PPE)": "ppe",
  "Documentation & Communication": "information-essentials",
  "Hot & Cold Therapy": "hot-cold-therapy",
  "Hydration & Nutrition": "hydration-nutrition",
  "Miscellaneous & General": "miscellaneous"
};

async function updateProductCategories() {
  try {
    console.log('Starting product category update...');
    
    // Get all products
    const response = await databases.listDocuments(
      process.env.VITE_APPWRITE_DATABASE_ID,
      'products',
      [] // No query to get all documents
    );
    
    console.log(`Found ${response.total} products to update`);
    
    // Update each product with the new category system
    for (const product of response.documents) {
      const oldCategory = product.category;
      const newCategory = CATEGORY_MAPPING[oldCategory] || "miscellaneous"; // Default to miscellaneous if no mapping found
      
      if (oldCategory !== newCategory) {
        console.log(`Updating product ${product.name}: ${oldCategory} -> ${newCategory}`);
        
        await databases.updateDocument(
          process.env.VITE_APPWRITE_DATABASE_ID,
          'products',
          product.$id,
          {
            ...product,
            category: newCategory
          }
        );
      } else {
        console.log(`Product ${product.name} already has correct category: ${oldCategory}`);
      }
    }
    
    console.log('Product category update completed successfully!');
  } catch (error) {
    console.error('Error updating product categories:', error);
  }
}

// Run the update
updateProductCategories();