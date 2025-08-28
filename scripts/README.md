# Appwrite Permissions Update

This script fixes permissions for all Appwrite collections to ensure admin users have full access to manage products and other data.

## How to Run

1. Make sure you have Node.js installed
2. Open a terminal in this directory
3. Install dependencies if not already installed:
   ```
   npm install node-appwrite dotenv
   ```
4. Make sure your .env file contains the necessary Appwrite credentials:
   ```
   VITE_APPWRITE_ENDPOINT=your_endpoint
   VITE_APPWRITE_PROJECT_ID=your_project_id
   VITE_APPWRITE_API_KEY=your_api_key
   VITE_APPWRITE_DATABASE_ID=your_database_id
   ```
5. Run the script:
   ```
   node update-permissions.js
   ```

The script will update permissions for all collections to ensure:
- Read access for any user
- Create, update, and delete access for authenticated users

This fixes the "Failed to update product: The current user is not authorized to perform the requested action" error.