// Simple test script to verify appwrite-system-settings functionality
import { fetchAllSettings } from '../appwrite-system-settings';

async function testFetchSettings() {
  console.log('Testing fetchAllSettings...');
  
  try {
    const settings = await fetchAllSettings();
    console.log('Settings fetched successfully:');
    console.log(JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error fetching settings:', error);
  }
}

// Run the test
testFetchSettings();