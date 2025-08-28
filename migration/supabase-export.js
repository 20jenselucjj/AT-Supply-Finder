// Script to export data from Supabase
require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function exportData() {
  try {
    console.log('Starting Supabase data export...');
    console.log('Supabase URL:', supabaseUrl);
    
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not set. Please check your environment variables.');
    }
    
    if (!supabaseKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Please check your environment variables.');
    }

    // Export users - we need to access the auth schema differently
    try {
      // First try to get users from the public.users table if it exists
      const { data: publicUsers, error: publicUsersError } = await supabase
        .from('users')
        .select('*');
      
      if (!publicUsersError && publicUsers) {
        console.log(`Exported ${publicUsers.length} users from public.users`);
        require('fs').writeFileSync('users.json', JSON.stringify(publicUsers, null, 2));
      } else {
        // If that fails, we'll create an empty users file since we're migrating to Appwrite auth
        console.log('No public users table found, creating empty users file');
        require('fs').writeFileSync('users.json', JSON.stringify([], null, 2));
      }
    } catch (error) {
      console.log('Creating empty users file for Appwrite migration');
      require('fs').writeFileSync('users.json', JSON.stringify([], null, 2));
    }

    // Export user roles
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*');
    
    if (userRolesError) {
      console.error('Error exporting user roles:', userRolesError);
    } else {
      console.log(`Exported ${userRoles.length} user roles`);
      require('fs').writeFileSync('user_roles.json', JSON.stringify(userRoles, null, 2));
    }

    // Export products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');
    
    if (productsError) {
      console.error('Error exporting products:', productsError);
    } else {
      console.log(`Exported ${products.length} products`);
      require('fs').writeFileSync('products.json', JSON.stringify(products, null, 2));
    }

    // Export starter kit templates
    const { data: starterKitTemplates, error: starterKitTemplatesError } = await supabase
      .from('starter_kit_templates')
      .select('*');
    
    if (starterKitTemplatesError) {
      console.error('Error exporting starter kit templates:', starterKitTemplatesError);
    } else {
      console.log(`Exported ${starterKitTemplates.length} starter kit templates`);
      require('fs').writeFileSync('starter_kit_templates.json', JSON.stringify(starterKitTemplates, null, 2));
    }

    // Export user kits
    const { data: userKits, error: userKitsError } = await supabase
      .from('user_kits')
      .select('*');
    
    if (userKitsError) {
      console.error('Error exporting user kits:', userKitsError);
    } else {
      console.log(`Exported ${userKits.length} user kits`);
      require('fs').writeFileSync('user_kits.json', JSON.stringify(userKits, null, 2));
    }

    // Export user favorites
    const { data: userFavorites, error: userFavoritesError } = await supabase
      .from('user_favorites')
      .select('*');
    
    if (userFavoritesError) {
      console.error('Error exporting user favorites:', userFavoritesError);
    } else {
      console.log(`Exported ${userFavorites.length} user favorites`);
      require('fs').writeFileSync('user_favorites.json', JSON.stringify(userFavorites, null, 2));
    }

    // Export template products
    const { data: templateProducts, error: templateProductsError } = await supabase
      .from('template_products')
      .select('*');
    
    if (templateProductsError) {
      console.error('Error exporting template products:', templateProductsError);
    } else {
      console.log(`Exported ${templateProducts.length} template products`);
      require('fs').writeFileSync('template_products.json', JSON.stringify(templateProducts, null, 2));
    }

    // Export vendor offers
    const { data: vendorOffers, error: vendorOffersError } = await supabase
      .from('vendor_offers')
      .select('*');
    
    if (vendorOffersError) {
      console.error('Error exporting vendor offers:', vendorOffersError);
    } else {
      console.log(`Exported ${vendorOffers.length} vendor offers`);
      require('fs').writeFileSync('vendor_offers.json', JSON.stringify(vendorOffers, null, 2));
    }

    // Export audit logs
    const { data: auditLogs, error: auditLogsError } = await supabase
      .from('audit_logs')
      .select('*');
    
    if (auditLogsError) {
      console.error('Error exporting audit logs:', auditLogsError);
    } else {
      console.log(`Exported ${auditLogs.length} audit logs`);
      require('fs').writeFileSync('audit_logs.json', JSON.stringify(auditLogs, null, 2));
    }

    console.log('Export completed successfully!');
  } catch (error) {
    console.error('Error during export:', error);
  }
}

exportData();