import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette } from 'lucide-react';
import { AppearanceSettings } from './types';

interface AppearanceSettingsCardProps {
  appearanceSettings: AppearanceSettings;
  setAppearanceSettings: React.Dispatch<React.SetStateAction<AppearanceSettings>>;
  theme: string;
  setTheme: (theme: string) => void;
  contrastMode: string;
  setContrastMode: (contrastMode: string) => void;
  colorScheme: string;
  setColorScheme: (colorScheme: string) => void;
}

export const AppearanceSettingsCard: React.FC<AppearanceSettingsCardProps> = ({
  appearanceSettings,
  setAppearanceSettings,
  theme,
  setTheme,
  contrastMode,
  setContrastMode,
  colorScheme,
  setColorScheme
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Appearance Settings
        </CardTitle>
        <CardDescription>
          Customize the look and feel of the admin interface
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="theme-select">Theme</Label>
            <Select value={theme} onValueChange={(value: string) => setTheme(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contrast-select">Contrast Mode</Label>
            <Select value={contrastMode} onValueChange={(value: string) => setContrastMode(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High Contrast</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="color-scheme">Color Scheme</Label>
            <Select value={colorScheme} onValueChange={(value: string) => setColorScheme(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="density-select">Density Mode</Label>
            <Select 
              value={appearanceSettings.densityMode} 
              onValueChange={(value: any) => 
                setAppearanceSettings(prev => ({ ...prev, densityMode: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="spacious">Spacious</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="font-family">Font Family</Label>
            <Select 
              value={appearanceSettings.fontFamily} 
              onValueChange={(value) => 
                setAppearanceSettings(prev => ({ ...prev, fontFamily: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Open Sans">Open Sans</SelectItem>
                <SelectItem value="Lato">Lato</SelectItem>
                <SelectItem value="Montserrat">Montserrat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="font-size">Font Size</Label>
              <Select 
                value={appearanceSettings.fontSize} 
                onValueChange={(value: any) => 
                  setAppearanceSettings(prev => ({ ...prev, fontSize: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="border-radius">Border Radius</Label>
              <Select 
                value={appearanceSettings.borderRadius} 
                onValueChange={(value: any) => 
                  setAppearanceSettings(prev => ({ ...prev, borderRadius: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="animation-speed">Animation Speed</Label>
            <Select 
              value={appearanceSettings.animationSpeed} 
              onValueChange={(value: any) => 
                setAppearanceSettings(prev => ({ ...prev, animationSpeed: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="fast">Fast</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};