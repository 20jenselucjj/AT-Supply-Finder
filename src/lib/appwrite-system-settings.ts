import { client, functions } from './appwrite';
import { logger } from './logger';
import { 
  SecuritySettings, 
  NotificationSettings, 
  AppearanceSettings, 
  SystemConfiguration, 
  DatabaseSettings 
} from '@/components/admin/system-settings/types';
import { validateAllSettings, ValidationError } from './settings-validation';

// Define the structure of our Appwrite documents
interface SystemSettingsDocument {
  $id: string;
  settingsType: string;
  settingsData: string; // JSON string
}

/**
 * Fetch all system settings from Appwrite via function
 */
export const fetchAllSettings = async (): Promise<{
  securitySettings: SecuritySettings;
  notificationSettings: NotificationSettings;
  appearanceSettings: AppearanceSettings;
  systemConfiguration: SystemConfiguration;
  databaseSettings: DatabaseSettings;
} | null> => {
  try {
    // Call the Appwrite function to fetch settings
    const response = await functions.createExecution(
      import.meta.env.VITE_APPWRITE_SYSTEM_SETTINGS_FUNCTION_ID, // Function ID from env
      JSON.stringify({ action: 'fetch' })
    );

    // Check if response is valid
    if (!response || !response.responseBody) {
      throw new Error('Empty response from system settings function');
    }

    // Parse the response
    let result;
    try {
      result = JSON.parse(response.responseBody);
    } catch (parseError) {
      console.error('Error parsing response body:', response.responseBody);
      throw new Error('Invalid JSON response from system settings function');
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch system settings');
    }

    // Initialize default settings
    let securitySettings: SecuritySettings = {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireSpecialChars: true,
      ipWhitelist: [],
      enableSSO: false,
      ssoProvider: 'google',
      enforcePasswordHistory: 5,
      lockoutDuration: 30
    };

    let notificationSettings: NotificationSettings = {
      emailEnabled: true,
      slackEnabled: false,
      webhookUrl: '',
      alertThresholds: {
        cpu: 80,
        memory: 85,
        storage: 90,
        errorRate: 5
      },
      emailRecipients: [],
      notificationSchedule: {
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'UTC'
      },
      enableDigest: false,
      digestFrequency: 'daily'
    };

    let appearanceSettings: AppearanceSettings = {
      defaultTheme: 'system',
      accentColor: 'blue',
      sidebarCollapsed: false,
      densityMode: 'comfortable',
      fontFamily: 'Inter',
      fontSize: 'medium',
      borderRadius: 'medium',
      animationSpeed: 'normal'
    };

    let systemConfiguration: SystemConfiguration = {
      companyName: 'AT Supply Finder',
      companyAddress: '',
      companyPhone: '',
      timezone: 'UTC',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12h',
      currency: 'USD',
      language: 'en',
      enableAuditLogs: true,
      retentionPeriod: 90,
      enableAutoUpdates: true,
      updateChannel: 'stable'
    };

    let databaseSettings: DatabaseSettings = {
      maxConnections: 100,
      connectionTimeout: 30,
      queryTimeout: 30,
      backupSchedule: '0 2 * * *',
      enableReplication: false,
      replicationMode: 'async',
      enableCompression: true,
      maintenanceWindow: {
        day: 'Sunday',
        startTime: '02:00',
        endTime: '04:00'
      }
    };

    // Parse each document and update the corresponding settings
    if (Array.isArray(result.data)) {
      for (const document of result.data) {
        const doc = document as unknown as SystemSettingsDocument;
        try {
          const parsedData = JSON.parse(doc.settingsData);
          
          // Log the document for debugging
          console.log(`Processing document ${doc.$id} with settingsType: ${doc.settingsType}`);
          
          switch (doc.settingsType) {
            case 'security':
              securitySettings = { ...securitySettings, ...parsedData };
              break;
            case 'notification':
              notificationSettings = { ...notificationSettings, ...parsedData };
              break;
            case 'appearance':
              appearanceSettings = { ...appearanceSettings, ...parsedData };
              break;
            case 'system':
              systemConfiguration = { ...systemConfiguration, ...parsedData };
              break;
            case 'database':
              databaseSettings = { ...databaseSettings, ...parsedData };
              break;
            // Also check for the full names in case they were created differently
            case 'securitySettings':
              securitySettings = { ...securitySettings, ...parsedData };
              break;
            case 'notificationSettings':
              notificationSettings = { ...notificationSettings, ...parsedData };
              break;
            case 'appearanceSettings':
              appearanceSettings = { ...appearanceSettings, ...parsedData };
              break;
            case 'systemConfiguration':
              systemConfiguration = { ...systemConfiguration, ...parsedData };
              break;
            case 'databaseSettings':
              databaseSettings = { ...databaseSettings, ...parsedData };
              break;
            default:
              console.warn(`Unknown settingsType: ${doc.settingsType}`);
          }
        } catch (parseError) {
          console.error(`Error parsing settings data for ${doc.settingsType}:`, parseError);
          // Log the error but continue with other settings
        }
      }
    }

    return {
      securitySettings,
      notificationSettings,
      appearanceSettings,
      systemConfiguration,
      databaseSettings
    };
  } catch (error: any) {
    console.error('Error fetching system settings:', error);
    
    // Handle specific error cases
    if (error.code === 401) {
      console.warn('Unauthorized access to system settings function. Check function permissions and API key.');
      // Return null to indicate unauthorized access without logging to audit
      return null;
    }
    
    // Only log to audit if it's not an authorization error to prevent infinite loop
    await logger.auditLog({
      action: 'FETCH_SYSTEM_SETTINGS_FAILED',
      entityType: 'SYSTEM',
      details: {
        error: error instanceof Error ? error.message : String(error),
        code: error.code
      }
    });
    
    return null;
  }
};

/**
 * Update a specific settings document in Appwrite via function
 */
export const updateSettings = async (
  settingsType: string,
  settingsData: Record<string, any>
): Promise<boolean> => {
  try {
    // Call the Appwrite function to update settings
    const response = await functions.createExecution(
      import.meta.env.VITE_APPWRITE_SYSTEM_SETTINGS_FUNCTION_ID, // Function ID from env
      JSON.stringify({ 
        action: 'update',
        settingsType,
        settingsData
      })
    );

    // Check if response is valid
    if (!response || !response.responseBody) {
      throw new Error('Empty response from system settings function');
    }

    // Parse the response
    let result;
    try {
      result = JSON.parse(response.responseBody);
    } catch (parseError) {
      console.error('Error parsing response body:', response.responseBody);
      throw new Error('Invalid JSON response from system settings function');
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update system settings');
    }

    // Log successful update
    await logger.auditLog({
      action: 'UPDATE_SYSTEM_SETTINGS',
      entityType: 'SYSTEM',
      entityId: settingsType,
      details: {
        settingsType
      }
    });

    return true;
  } catch (error) {
    console.error(`Error updating ${settingsType} settings:`, error);
    await logger.auditLog({
      action: 'UPDATE_SYSTEM_SETTINGS_FAILED',
      entityType: 'SYSTEM',
      details: {
        settingsType,
        error: error instanceof Error ? error.message : String(error)
      }
    });
    return false;
  }
};

/**
 * Update all system settings
 */
export const updateAllSettings = async (settings: {
  securitySettings: SecuritySettings;
  notificationSettings: NotificationSettings;
  appearanceSettings: AppearanceSettings;
  systemConfiguration: SystemConfiguration;
  databaseSettings: DatabaseSettings;
}): Promise<boolean> => {
  try {
    // Validate settings before saving
    const validationErrors = validateAllSettings(settings);
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return false;
    }

    // Update each settings category
    const updatePromises = [
      updateSettings('securitySettings', settings.securitySettings),
      updateSettings('notificationSettings', settings.notificationSettings),
      updateSettings('appearanceSettings', settings.appearanceSettings),
      updateSettings('systemConfiguration', settings.systemConfiguration),
      updateSettings('databaseSettings', settings.databaseSettings)
    ];

    const results = await Promise.all(updatePromises);
    
    // Check if all updates were successful
    const allSuccessful = results.every(result => result === true);
    
    return allSuccessful;
  } catch (error) {
    console.error('Error updating all settings:', error);
    return false;
  }
};