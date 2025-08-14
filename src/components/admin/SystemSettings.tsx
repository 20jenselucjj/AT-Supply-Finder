import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Settings, Save, RefreshCw, Globe, Mail, Shield, Database, Palette } from 'lucide-react';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  category: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface SettingsByCategory {
  [category: string]: SystemSetting[];
}

export const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [settingsByCategory, setSettingsByCategory] = useState<SettingsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [hasChanges, setHasChanges] = useState(false);

  const categoryIcons = {
    'general': Globe,
    'email': Mail,
    'security': Shield,
    'database': Database,
    'ui': Palette,
    'api': Settings
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });
      
      if (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to fetch system settings');
        return;
      }

      setSettings(data || []);
      
      // Group settings by category
      const grouped = (data || []).reduce((acc: SettingsByCategory, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
      }, {});
      
      setSettingsByCategory(grouped);
      
      // Initialize form data
      const initialFormData = (data || []).reduce((acc: { [key: string]: any }, setting) => {
        acc[setting.key] = parseSettingValue(setting.value, setting.data_type);
        return acc;
      }, {});
      
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to fetch system settings');
    } finally {
      setLoading(false);
    }
  };

  const parseSettingValue = (value: string, dataType: string) => {
    switch (dataType) {
      case 'boolean':
        return value === 'true';
      case 'number':
        return parseFloat(value) || 0;
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return {};
        }
      default:
        return value;
    }
  };

  const formatSettingValue = (value: any, dataType: string): string => {
    switch (dataType) {
      case 'boolean':
        return value.toString();
      case 'number':
        return value.toString();
      case 'json':
        return JSON.stringify(value, null, 2);
      default:
        return value;
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      const updates = settings.map(setting => ({
        id: setting.id,
        value: formatSettingValue(formData[setting.key], setting.data_type),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('system_settings')
        .upsert(updates, { onConflict: 'id' });

      if (error) {
        toast.error(`Failed to save settings: ${error.message}`);
        return;
      }

      toast.success('Settings saved successfully');
      setHasChanges(false);
      fetchSettings(); // Refresh to get updated timestamps
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    const initialFormData = settings.reduce((acc: { [key: string]: any }, setting) => {
      acc[setting.key] = parseSettingValue(setting.value, setting.data_type);
      return acc;
    }, {});
    
    setFormData(initialFormData);
    setHasChanges(false);
    toast.info('Settings reset to saved values');
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const value = formData[setting.key];
    
    switch (setting.data_type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={setting.key}
              checked={value || false}
              onCheckedChange={(checked) => handleInputChange(setting.key, checked)}
            />
            <Label htmlFor={setting.key} className="text-sm font-normal">
              {value ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || 0}
            onChange={(e) => handleInputChange(setting.key, parseFloat(e.target.value) || 0)}
            className="max-w-xs"
          />
        );
      
      case 'json':
        return (
          <Textarea
            value={JSON.stringify(value || {}, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleInputChange(setting.key, parsed);
              } catch {
                // Invalid JSON, but still update to show user input
                handleInputChange(setting.key, e.target.value);
              }
            }}
            rows={6}
            className="font-mono text-sm"
          />
        );
      
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleInputChange(setting.key, e.target.value)}
            className="max-w-md"
          />
        );
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure application parameters and system behavior
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {hasChanges && (
                <Button variant="outline" onClick={handleResetSettings}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
              <Button 
                onClick={handleSaveSettings} 
                disabled={!hasChanges || saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
          {hasChanges && (
            <Badge variant="secondary" className="w-fit">
              Unsaved changes
            </Badge>
          )}
        </CardHeader>
      </Card>

      {Object.entries(settingsByCategory).map(([category, categorySettings]) => {
        const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || Settings;
        
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 capitalize">
                <IconComponent className="h-5 w-5" />
                {category} Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {categorySettings.map((setting, index) => (
                <div key={setting.id}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">
                          {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                        {setting.description && (
                          <p className="text-sm text-muted-foreground">
                            {setting.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={setting.is_public ? 'default' : 'secondary'} className="text-xs">
                          {setting.is_public ? 'Public' : 'Private'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {setting.data_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2">
                      {renderSettingInput(setting)}
                    </div>
                  </div>
                  {index < categorySettings.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {Object.keys(settingsByCategory).length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No system settings found.</p>
              <p className="text-sm mt-2">
                Settings will appear here once they are configured in the database.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};