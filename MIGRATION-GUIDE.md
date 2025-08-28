# Migration Guide: Supabase to Appwrite

This guide provides step-by-step instructions for migrating the AT Supply Finder application from Supabase to Appwrite.

## Overview

The migration involves:
1. Exporting data from Supabase
2. Transforming the data to match Appwrite's structure
3. Importing data into Appwrite
4. Updating the application code to use Appwrite instead of Supabase

## Prerequisites

1. Node.js v16+ installed
2. Access to your Supabase project
3. Access to your Appwrite instance
4. Backup of your current Supabase database

## Step 1: Prepare Your Environments

### Supabase Setup
1. Get your Supabase project URL and service key from the Supabase dashboard
2. Ensure you have sufficient permissions to read all data

### Appwrite Setup
1. Create a new project in Appwrite or use an existing one
2. Create the required collections (already done based on our analysis)
3. Get your Appwrite endpoint, project ID, and API key

## Step 2: Export Data from Supabase

1. Navigate to the migration directory:
   ```bash
   cd migration
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set environment variables:
   ```bash
   # Windows (Command Prompt)
   set SUPABASE_URL=your_supabase_url
   set SUPABASE_SERVICE_KEY=your_supabase_service_key
   
   # Windows (PowerShell)
   $env:SUPABASE_URL="your_supabase_url"
   $env:SUPABASE_SERVICE_KEY="your_supabase_service_key"
   
   # macOS/Linux
   export SUPABASE_URL=your_supabase_url
   export SUPABASE_SERVICE_KEY=your_supabase_service_key
   ```

4. Run the export script:
   ```bash
   node supabase-export.js
   ```

This will create JSON files for each table in your Supabase database.

## Step 3: Transform and Import Data to Appwrite

1. Set Appwrite environment variables:
   ```bash
   # Windows (Command Prompt)
   set APPWRITE_ENDPOINT=your_appwrite_endpoint
   set APPWRITE_PROJECT_ID=your_appwrite_project_id
   set APPWRITE_API_KEY=your_appwrite_api_key
   
   # Windows (PowerShell)
   $env:APPWRITE_ENDPOINT="your_appwrite_endpoint"
   $env:APPWRITE_PROJECT_ID="your_appwrite_project_id"
   $env:APPWRITE_API_KEY="your_appwrite_api_key"
   
   # macOS/Linux
   export APPWRITE_ENDPOINT=your_appwrite_endpoint
   export APPWRITE_PROJECT_ID=your_appwrite_project_id
   export APPWRITE_API_KEY=your_appwrite_api_key
   ```

2. Run the import script:
   ```bash
   node appwrite-import.js
   ```

## Step 4: Update Application Code

### Update Environment Variables

1. Update your `.env` file to use Appwrite instead of Supabase:
   ```env
   # Appwrite Configuration
   VITE_APPWRITE_ENDPOINT=http://localhost/v1
   VITE_APPWRITE_PROJECT_ID=your_project_id
   VITE_APPWRITE_DATABASE_ID=atSupplyFinder
   VITE_APPWRITE_PRODUCTS_COLLECTION=products
   VITE_APPWRITE_USERS_COLLECTION=users
   VITE_APPWRITE_USER_KITS_COLLECTION=userKits
   VITE_APPWRITE_USER_ROLES_COLLECTION=userRoles
   ```

### Update Client Configuration

1. Run the client configuration update script:
   ```bash
   node update-client-config.js
   ```

### Update Authentication Context

1. Run the authentication context update script:
   ```bash
   node update-auth-context.js
   ```

### Update Product Service

1. Run the product service update script:
   ```bash
   node update-product-service.js
   ```

## Step 5: Update Remaining Services

You'll need to update other services in a similar manner:

1. User management service
2. Kit management service
3. Favorites service
4. Audit logging service
5. Any other services that interact with the database

## Step 6: Update Frontend Components

Update any components that directly use Supabase:

1. Replace `useQuery` hooks that call Supabase with ones that call Appwrite
2. Update form submissions to use Appwrite endpoints
3. Update real-time subscriptions to use Appwrite's real-time features

## Step 7: Test the Migration

1. Run the application locally:
   ```bash
   npm run dev
   ```

2. Test all functionality:
   - User authentication (login, signup, logout)
   - Product browsing and search
   - Kit creation and management
   - Favorites functionality
   - Admin features

3. Verify data integrity:
   - Check that all products are displayed correctly
   - Verify user kits are intact
   - Confirm user roles are preserved
   - Ensure audit logs are working

## Step 8: Deploy

1. Update your production environment variables
2. Deploy the updated application
3. Monitor for any issues

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure your Appwrite API key has sufficient permissions
2. **Data Type Mismatches**: Check that data types match between Supabase and Appwrite
3. **Missing Environment Variables**: Verify all required environment variables are set
4. **Network Issues**: Ensure your Appwrite endpoint is accessible

### Getting Help

If you encounter issues:
1. Check the console logs for error messages
2. Verify your Appwrite collections match the expected structure
3. Ensure all environment variables are correctly set
4. Consult the Appwrite documentation

## Rollback Plan

If you need to rollback to Supabase:
1. Revert the code changes
2. Restore the Supabase database from backup
3. Update environment variables back to Supabase
4. Redeploy the original application

## Conclusion

This migration guide should help you successfully transition from Supabase to Appwrite. The process involves careful data handling and code updates, but following these steps should result in a smooth transition.

Remember to thoroughly test all functionality after the migration to ensure everything works as expected.