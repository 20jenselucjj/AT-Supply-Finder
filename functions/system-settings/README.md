# System Settings Function

This Appwrite function handles secure operations on system settings, following Appwrite's best practices for administrative operations.

## Deployment Instructions

1. **Package the function:**
   ```bash
   node scripts/deploy-system-settings-function.js
   ```

2. **Deploy via Appwrite CLI:**
   ```bash
   appwrite login
   appwrite functions createDeployment --functionId=<FUNCTION_ID> --entrypoint="index.js" --code="dist/system-settings-function.tar.gz" --activate=true
   ```

3. **Or deploy via Appwrite Dashboard:**
   - Go to your Appwrite project dashboard
   - Navigate to Functions
   - Create a new function or select an existing one
   - Upload the `dist/system-settings-function.tar.gz` file
   - Set the entrypoint to `index.js`
   - Activate the deployment

## Environment Variables

The function requires the following environment variables to be set in the Appwrite function configuration:

- `APPWRITE_FUNCTION_ENDPOINT` - Your Appwrite endpoint
- `APPWRITE_FUNCTION_PROJECT_ID` - Your Appwrite project ID
- `APPWRITE_FUNCTION_API_KEY` - A server API key with appropriate permissions
- `APPWRITE_DATABASE_ID` - Your database ID (optional, defaults to 'atSupplyFinder')

## Usage

The function accepts JSON payloads with the following structure:

```json
{
  "action": "fetch|update",
  "settingsType": "securitySettings|notificationSettings|appearanceSettings|systemConfiguration|databaseSettings",
  "settingsData": { /* settings object for update action */ }
}
```

### Fetch all settings:
```json
{
  "action": "fetch"
}
```

### Update settings:
```json
{
  "action": "update",
  "settingsType": "securitySettings",
  "settingsData": {
    "twoFactorEnabled": true,
    "sessionTimeout": 30
  }
}
```

## Security

This function uses a server API key to perform administrative operations, ensuring that clients cannot directly access sensitive operations. All operations are logged for audit purposes.