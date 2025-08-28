# AT Supply Finder - Supabase to Appwrite Migration

This directory contains scripts to migrate data from Supabase to Appwrite for the AT Supply Finder application.

## Prerequisites

1. Node.js installed
2. Supabase project with data to migrate
3. Appwrite instance set up with the required collections

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables:
   ```bash
   # Supabase credentials
   export SUPABASE_URL="your_supabase_url"
   export SUPABASE_SERVICE_KEY="your_supabase_service_key"
   
   # Appwrite credentials
   export APPWRITE_ENDPOINT="your_appwrite_endpoint"
   export APPWRITE_PROJECT_ID="your_appwrite_project_id"
   export APPWRITE_API_KEY="your_appwrite_api_key"
   ```

## Running the Migration

### Option 1: Run export and import separately

1. Export data from Supabase:
   ```bash
   npm run export
   ```

2. Import data into Appwrite:
   ```bash
   npm run import
   ```

### Option 2: Run both steps together

```bash
npm run migrate
```

## What Gets Migrated

The migration scripts will transfer the following data:

1. Users and their authentication data
2. User roles and permissions
3. Product catalog
4. Starter kit templates
5. User-created kits
6. User favorites
7. Template-product relationships
8. Vendor offers
9. Audit logs

## Troubleshooting

If you encounter any issues during the migration:

1. Check that all environment variables are set correctly
2. Ensure the Appwrite collections have been created with the correct attributes
3. Verify that the Supabase credentials have sufficient permissions
4. Check the console output for specific error messages

## Post-Migration Steps

After the migration is complete:

1. Update your application code to use Appwrite instead of Supabase
2. Test all functionality to ensure data integrity
3. Update authentication logic to use Appwrite Auth
4. Modify data fetching and mutation logic to work with Appwrite
5. Update any server-side functions to use Appwrite instead of Supabase