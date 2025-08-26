import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Shield, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { SecuritySettings } from './types';

interface SecuritySettingsCardProps {
  securitySettings: SecuritySettings;
  setSecuritySettings: React.Dispatch<React.SetStateAction<SecuritySettings>>;
  showApiKey: boolean;
  setShowApiKey: React.Dispatch<React.SetStateAction<boolean>>;
  apiKey: string;
}

export const SecuritySettingsCard: React.FC<SecuritySettingsCardProps> = ({
  securitySettings,
  setSecuritySettings,
  showApiKey,
  setShowApiKey,
  apiKey
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Settings
        </CardTitle>
        <CardDescription>
          Configure authentication, access control, and security policies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="2fa">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require 2FA for all admin accounts
              </p>
            </div>
            <Switch
              id="2fa"
              checked={securitySettings.twoFactorEnabled}
              onCheckedChange={(checked) =>
                setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: checked }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={securitySettings.sessionTimeout}
                onChange={(e) =>
                  setSecuritySettings(prev => ({ 
                    ...prev, 
                    sessionTimeout: parseInt(e.target.value) || 30 
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="max-attempts">Max Login Attempts</Label>
              <Input
                id="max-attempts"
                type="number"
                value={securitySettings.maxLoginAttempts}
                onChange={(e) =>
                  setSecuritySettings(prev => ({ 
                    ...prev, 
                    maxLoginAttempts: parseInt(e.target.value) || 5 
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="password-length">Minimum Password Length</Label>
              <Input
                id="password-length"
                type="number"
                value={securitySettings.passwordMinLength}
                onChange={(e) =>
                  setSecuritySettings(prev => ({ 
                    ...prev, 
                    passwordMinLength: parseInt(e.target.value) || 8 
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="password-history">Password History (count)</Label>
              <Input
                id="password-history"
                type="number"
                value={securitySettings.enforcePasswordHistory}
                onChange={(e) =>
                  setSecuritySettings(prev => ({ 
                    ...prev, 
                    enforcePasswordHistory: parseInt(e.target.value) || 5 
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="special-chars">Require Special Characters</Label>
              <p className="text-sm text-muted-foreground">
                Passwords must include special characters
              </p>
            </div>
            <Switch
              id="special-chars"
              checked={securitySettings.requireSpecialChars}
              onCheckedChange={(checked) =>
                setSecuritySettings(prev => ({ ...prev, requireSpecialChars: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sso">Single Sign-On (SSO)</Label>
              <p className="text-sm text-muted-foreground">
                Enable SSO authentication
              </p>
            </div>
            <Switch
              id="sso"
              checked={securitySettings.enableSSO}
              onCheckedChange={(checked) =>
                setSecuritySettings(prev => ({ ...prev, enableSSO: checked }))
              }
            />
          </div>

          {securitySettings.enableSSO && (
            <div>
              <Label htmlFor="sso-provider">SSO Provider</Label>
              <Select 
                value={securitySettings.ssoProvider} 
                onValueChange={(value) =>
                  setSecuritySettings(prev => ({ ...prev, ssoProvider: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="microsoft">Microsoft</SelectItem>
                  <SelectItem value="okta">Okta</SelectItem>
                  <SelectItem value="auth0">Auth0</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="lockout-duration">Lockout Duration (minutes)</Label>
            <Input
              id="lockout-duration"
              type="number"
              value={securitySettings.lockoutDuration}
              onChange={(e) =>
                setSecuritySettings(prev => ({ 
                  ...prev, 
                  lockoutDuration: parseInt(e.target.value) || 30 
                }))
              }
            />
          </div>

          <div>
            <Label>IP Whitelist (one per line)</Label>
            <Textarea
              value={securitySettings.ipWhitelist.join('\n')}
              onChange={(e) =>
                setSecuritySettings(prev => ({ 
                  ...prev, 
                  ipWhitelist: e.target.value.split('\n').filter(ip => ip.trim() !== '') 
                }))
              }
              placeholder="192.168.1.1&#10;10.0.0.0/8"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};