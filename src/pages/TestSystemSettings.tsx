import React, { useState, useEffect } from 'react';
import { fetchAllSettings } from '@/lib/appwrite-system-settings';

const TestSystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        console.log('Fetching system settings...');
        const result = await fetchAllSettings();
        console.log('Fetch result:', result);
        setSettings(result);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  if (loading) {
    return <div className="p-4">Loading system settings...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">System Settings Test</h1>
      {settings ? (
        <div>
          <h2 className="text-xl font-semibold mb-2">Security Settings</h2>
          <pre>{JSON.stringify(settings.securitySettings, null, 2)}</pre>
          
          <h2 className="text-xl font-semibold mb-2">Notification Settings</h2>
          <pre>{JSON.stringify(settings.notificationSettings, null, 2)}</pre>
          
          <h2 className="text-xl font-semibold mb-2">Appearance Settings</h2>
          <pre>{JSON.stringify(settings.appearanceSettings, null, 2)}</pre>
          
          <h2 className="text-xl font-semibold mb-2">System Configuration</h2>
          <pre>{JSON.stringify(settings.systemConfiguration, null, 2)}</pre>
          
          <h2 className="text-xl font-semibold mb-2">Database Settings</h2>
          <pre>{JSON.stringify(settings.databaseSettings, null, 2)}</pre>
        </div>
      ) : (
        <div>No settings found</div>
      )}
    </div>
  );
};

export default TestSystemSettings;