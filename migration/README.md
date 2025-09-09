# Migration Scripts

This directory contains migration scripts for setting up and updating the Appwrite database collections used by the AT Supply Finder application.

## Available Scripts

### 1. Category System Update
```bash
npm run migrate:categories
```
Updates the category system in the database.

### 2. Product Category Update
```bash
npm run migrate:products-category
```
Updates product categories in the database.

### 3. Chat History Collection Setup
```bash
npm run migrate:chat-history
```
Creates the chatHistory collection with the required attributes and indexes for storing chat conversation history.

## Running Migrations

To run any migration script, use the corresponding npm command from the project root directory:

```bash
npm run migrate:chat-history
```

## Prerequisites

Before running migrations, ensure you have:
1. Set up your `.env` file with the required Appwrite credentials
2. Installed all project dependencies with `npm install`
3. Proper permissions to modify the Appwrite database

## Environment Variables

The migration scripts require the following environment variables:
- `VITE_APPWRITE_ENDPOINT`: Your Appwrite endpoint URL
- `VITE_APPWRITE_PROJECT_ID`: Your Appwrite project ID
- `VITE_APPWRITE_API_KEY`: Your Appwrite API key
- `VITE_APPWRITE_DATABASE_ID`: Your Appwrite database ID

## Error Handling

Migration scripts include error handling for common issues:
- Collection already exists
- Missing environment variables
- Insufficient permissions
- Network connectivity issues

If a migration fails, check the console output for specific error messages and resolve the underlying issue before retrying.