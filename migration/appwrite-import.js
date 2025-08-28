// Script to import data into Appwrite
require('dotenv').config({ path: '../.env' });
const { Client, Databases } = require('node-appwrite');

// Appwrite configuration
const client = new Client();
client
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '68af870000012641090a')
  .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'atSupplyFinder';

async function importData() {
  try {
    console.log('Starting Appwrite data import...');
    console.log('Appwrite Endpoint:', process.env.VITE_APPWRITE_ENDPOINT);
    console.log('Appwrite Project ID:', process.env.VITE_APPWRITE_PROJECT_ID);
    
    // Check if required environment variables are set
    if (!process.env.VITE_APPWRITE_API_KEY) {
      throw new Error('VITE_APPWRITE_API_KEY is not set. Please check your environment variables.');
    }

    // Import user roles
    const userRolesData = JSON.parse(require('fs').readFileSync('user_roles.json', 'utf8'));
    console.log(`Importing ${userRolesData.length} user roles...`);
    
    for (const role of userRolesData) {
      try {
        // Try to update first, if it doesn't exist, create it
        try {
          await databases.updateDocument(
            DATABASE_ID,
            'userRoles',
            role.id,
            {
              userId: role.user_id,
              role: role.role,
            }
          );
          console.log(`Updated user role ${role.id}`);
        } catch (updateError) {
          // If update fails, try to create
          try {
            await databases.createDocument(
              DATABASE_ID,
              'userRoles',
              role.id,
              {
                userId: role.user_id,
                role: role.role,
              }
            );
            console.log(`Created user role ${role.id}`);
          } catch (createError) {
            if (createError.message.includes('already exists')) {
              console.log(`User role ${role.id} already exists, skipping...`);
            } else {
              throw createError;
            }
          }
        }
      } catch (error) {
        console.error(`Error importing user role ${role.id}:`, error.message);
      }
    }

    // Import products
    const productsData = JSON.parse(require('fs').readFileSync('products.json', 'utf8'));
    console.log(`Importing ${productsData.length} products...`);
    
    for (const product of productsData) {
      try {
        // Process features array - convert to string if needed
        let features = product.features || [];
        if (Array.isArray(features)) {
          features = features.join(', '); // Convert array to comma-separated string
        }
        
        // Try to update first, if it doesn't exist, create it
        try {
          await databases.updateDocument(
            DATABASE_ID,
            'products',
            product.id,
            {
              name: product.name,
              category: product.category,
              brand: product.brand,
              rating: product.rating ? parseFloat(product.rating) : null,
              price: product.price ? parseFloat(product.price) : null,
              dimensions: product.dimensions,
              weight: product.weight,
              material: product.material,
              features: features, // Use processed features
              imageUrl: product.image_url,
              asin: product.asin,
              affiliateLink: product.affiliate_link,
              description: product.description,
            }
          );
          console.log(`Updated product ${product.id}`);
        } catch (updateError) {
          // If update fails, try to create
          try {
            await databases.createDocument(
              DATABASE_ID,
              'products',
              product.id,
              {
                name: product.name,
                category: product.category,
                brand: product.brand,
                rating: product.rating ? parseFloat(product.rating) : null,
                price: product.price ? parseFloat(product.price) : null,
                dimensions: product.dimensions,
                weight: product.weight,
                material: product.material,
                features: features, // Use processed features
                imageUrl: product.image_url,
                asin: product.asin,
                affiliateLink: product.affiliate_link,
                description: product.description,
              }
            );
            console.log(`Created product ${product.id}`);
          } catch (createError) {
            if (createError.message.includes('already exists')) {
              console.log(`Product ${product.id} already exists, skipping...`);
            } else {
              throw createError;
            }
          }
        }
      } catch (error) {
        console.error(`Error importing product ${product.id}:`, error.message);
      }
    }

    // Import starter kit templates
    const starterKitTemplatesData = JSON.parse(require('fs').readFileSync('starter_kit_templates.json', 'utf8'));
    console.log(`Importing ${starterKitTemplatesData.length} starter kit templates...`);
    
    for (const template of starterKitTemplatesData) {
      try {
        // Try to update first, if it doesn't exist, create it
        try {
          await databases.updateDocument(
            DATABASE_ID,
            'starterKitTemplates',
            template.id,
            {
              name: template.name,
              description: template.description,
              category: template.category,
              estimatedCost: template.estimated_cost ? parseFloat(template.estimated_cost) : 0,
              products: template.products ? JSON.stringify(template.products) : null,
              isActive: template.is_active !== undefined ? template.is_active : true,
            }
          );
          console.log(`Updated starter kit template ${template.id}`);
        } catch (updateError) {
          // If update fails, try to create
          try {
            await databases.createDocument(
              DATABASE_ID,
              'starterKitTemplates',
              template.id,
              {
                name: template.name,
                description: template.description,
                category: template.category,
                estimatedCost: template.estimated_cost ? parseFloat(template.estimated_cost) : 0,
                products: template.products ? JSON.stringify(template.products) : null,
                isActive: template.is_active !== undefined ? template.is_active : true,
              }
            );
            console.log(`Created starter kit template ${template.id}`);
          } catch (createError) {
            if (createError.message.includes('already exists')) {
              console.log(`Starter kit template ${template.id} already exists, skipping...`);
            } else {
              throw createError;
            }
          }
        }
      } catch (error) {
        console.error(`Error importing starter kit template ${template.id}:`, error.message);
      }
    }

    // Import user kits
    const userKitsData = JSON.parse(require('fs').readFileSync('user_kits.json', 'utf8'));
    console.log(`Importing ${userKitsData.length} user kits...`);
    
    for (const kit of userKitsData) {
      try {
        // Try to update first, if it doesn't exist, create it
        try {
          await databases.updateDocument(
            DATABASE_ID,
            'userKits',
            kit.id,
            {
              userId: kit.user_id,
              name: kit.name,
              description: kit.description,
              kitData: kit.kit_data ? JSON.stringify(kit.kit_data) : '{}',
              isPublic: kit.is_public || false,
            }
          );
          console.log(`Updated user kit ${kit.id}`);
        } catch (updateError) {
          // If update fails, try to create
          try {
            await databases.createDocument(
              DATABASE_ID,
              'userKits',
              kit.id,
              {
                userId: kit.user_id,
                name: kit.name,
                description: kit.description,
                kitData: kit.kit_data ? JSON.stringify(kit.kit_data) : '{}',
                isPublic: kit.is_public || false,
              }
            );
            console.log(`Created user kit ${kit.id}`);
          } catch (createError) {
            if (createError.message.includes('already exists')) {
              console.log(`User kit ${kit.id} already exists, skipping...`);
            } else {
              throw createError;
            }
          }
        }
      } catch (error) {
        console.error(`Error importing user kit ${kit.id}:`, error.message);
      }
    }

    // Import user favorites
    const userFavoritesData = JSON.parse(require('fs').readFileSync('user_favorites.json', 'utf8'));
    console.log(`Importing ${userFavoritesData.length} user favorites...`);
    
    for (const favorite of userFavoritesData) {
      try {
        // Try to update first, if it doesn't exist, create it
        try {
          await databases.updateDocument(
            DATABASE_ID,
            'userFavorites',
            favorite.id,
            {
              userId: favorite.user_id,
              productId: favorite.product_id,
            }
          );
          console.log(`Updated user favorite ${favorite.id}`);
        } catch (updateError) {
          // If update fails, try to create
          try {
            await databases.createDocument(
              DATABASE_ID,
              'userFavorites',
              favorite.id,
              {
                userId: favorite.user_id,
                productId: favorite.product_id,
              }
            );
            console.log(`Created user favorite ${favorite.id}`);
          } catch (createError) {
            if (createError.message.includes('already exists')) {
              console.log(`User favorite ${favorite.id} already exists, skipping...`);
            } else {
              throw createError;
            }
          }
        }
      } catch (error) {
        console.error(`Error importing user favorite ${favorite.id}:`, error.message);
      }
    }

    // Import template products
    const templateProductsData = JSON.parse(require('fs').readFileSync('template_products.json', 'utf8'));
    console.log(`Importing ${templateProductsData.length} template products...`);
    
    for (const templateProduct of templateProductsData) {
      try {
        // Try to update first, if it doesn't exist, create it
        try {
          await databases.updateDocument(
            DATABASE_ID,
            'templateProducts',
            templateProduct.id,
            {
              templateId: templateProduct.template_id,
              productId: templateProduct.product_id,
              quantity: templateProduct.quantity || 1,
              isRequired: templateProduct.is_required !== undefined ? templateProduct.is_required : true,
              notes: templateProduct.notes,
            }
          );
          console.log(`Updated template product ${templateProduct.id}`);
        } catch (updateError) {
          // If update fails, try to create
          try {
            await databases.createDocument(
              DATABASE_ID,
              'templateProducts',
              templateProduct.id,
              {
                templateId: templateProduct.template_id,
                productId: templateProduct.product_id,
                quantity: templateProduct.quantity || 1,
                isRequired: templateProduct.is_required !== undefined ? templateProduct.is_required : true,
                notes: templateProduct.notes,
              }
            );
            console.log(`Created template product ${templateProduct.id}`);
          } catch (createError) {
            if (createError.message.includes('already exists')) {
              console.log(`Template product ${templateProduct.id} already exists, skipping...`);
            } else {
              throw createError;
            }
          }
        }
      } catch (error) {
        console.error(`Error importing template product ${templateProduct.id}:`, error.message);
      }
    }

    // Import vendor offers
    const vendorOffersData = JSON.parse(require('fs').readFileSync('vendor_offers.json', 'utf8'));
    console.log(`Importing ${vendorOffersData.length} vendor offers...`);
    
    for (const offer of vendorOffersData) {
      try {
        // Try to update first, if it doesn't exist, create it
        try {
          await databases.updateDocument(
            DATABASE_ID,
            'vendorOffers',
            offer.id,
            {
              productId: offer.product_id,
              vendorName: offer.vendor_name,
              url: offer.url,
              price: offer.price ? parseFloat(offer.price) : 0,
            }
          );
          console.log(`Updated vendor offer ${offer.id}`);
        } catch (updateError) {
          // If update fails, try to create
          try {
            await databases.createDocument(
              DATABASE_ID,
              'vendorOffers',
              offer.id,
              {
                productId: offer.product_id,
                vendorName: offer.vendor_name,
                url: offer.url,
                price: offer.price ? parseFloat(offer.price) : 0,
              }
            );
            console.log(`Created vendor offer ${offer.id}`);
          } catch (createError) {
            if (createError.message.includes('already exists')) {
              console.log(`Vendor offer ${offer.id} already exists, skipping...`);
            } else {
              throw createError;
            }
          }
        }
      } catch (error) {
        console.error(`Error importing vendor offer ${offer.id}:`, error.message);
      }
    }

    // Import audit logs
    const auditLogsData = JSON.parse(require('fs').readFileSync('audit_logs.json', 'utf8'));
    console.log(`Importing ${auditLogsData.length} audit logs...`);
    
    for (const log of auditLogsData) {
      try {
        // Try to update first, if it doesn't exist, create it
        try {
          await databases.updateDocument(
            DATABASE_ID,
            'auditLogs',
            log.id,
            {
              userId: log.user_id,
              action: log.action,
              entityType: log.entity_type,
              entityId: log.entity_id,
              details: log.details ? JSON.stringify(log.details) : null,
              ipAddress: log.ip_address,
              userAgent: log.user_agent,
            }
          );
          console.log(`Updated audit log ${log.id}`);
        } catch (updateError) {
          // If update fails, try to create
          try {
            await databases.createDocument(
              DATABASE_ID,
              'auditLogs',
              log.id,
              {
                userId: log.user_id,
                action: log.action,
                entityType: log.entity_type,
                entityId: log.entity_id,
                details: log.details ? JSON.stringify(log.details) : null,
                ipAddress: log.ip_address,
                userAgent: log.user_agent,
              }
            );
            console.log(`Created audit log ${log.id}`);
          } catch (createError) {
            if (createError.message.includes('already exists')) {
              console.log(`Audit log ${log.id} already exists, skipping...`);
            } else {
              throw createError;
            }
          }
        }
      } catch (error) {
        console.error(`Error importing audit log ${log.id}:`, error.message);
      }
    }

    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Error during import:', error.message);
  }
}

importData();