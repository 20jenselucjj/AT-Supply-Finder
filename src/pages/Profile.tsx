import { useAuth } from '@/context/auth-context';
import { useKit } from '@/context/kit-context';
import { useFavorites } from '@/context/favorites-context';
import { useTheme } from '@/context/theme-context';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Helmet } from 'react-helmet-async';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Download, 
  Heart, 
  User, 
  Package, 
  Star, 
  Settings, 
  LayoutDashboard,
  Users,
  BarChart3,
  Wrench,
  FileBarChart,
  Sun,
  Moon,
  Palette,
  Bell,
  Eye,
  Lock,
  LogOut,
  Calendar,
  Tag,
  Share2,
  EyeOff,
  Edit3,
  Save
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { toast } from 'sonner';
import React, { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils';

const Profile = () => {
  const { user, signOut, isAdmin, updateUser } = useAuth();
  const { kit, savedKits, saveKit, loadKit, deleteKit, clearKit } = useKit();
  const { favorites, favoriteProducts, refreshFavorites, toggleFavorite } = useFavorites();
  const { theme, setTheme, contrastMode, setContrastMode, colorScheme, setColorScheme } = useTheme();
  const navigate = useNavigate();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [kitName, setKitName] = useState('');
  const [kitDescription, setKitDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: ''
  });
  
  // Initialize profile form with user data
  useEffect(() => {
    if (user) {
      // Only set the profile form values on initial load or when user changes
      // Use a ref to track if this is the initial load
      const isInitialLoad = !profileForm.name && !profileForm.company;
      
      if (isInitialLoad) {
        setProfileForm({
          name: user.name || '',
          email: user.email || '',
          company: user.prefs?.company || ''
        });
      }
      
      // Load user preferences from Appwrite if they exist
      if (user.prefs?.theme) {
        setTheme(user.prefs.theme);
      }
      if (user.prefs?.contrastMode) {
        setContrastMode(user.prefs.contrastMode);
      }
      if (user.prefs?.colorScheme) {
        setColorScheme(user.prefs.colorScheme);
      }
    }
  }, [user, setTheme, setContrastMode, setColorScheme]);

  // Save user preferences to Appwrite when they change
  useEffect(() => {
    if (user) {
      // Update user preferences in Appwrite
      const updatePreferences = async () => {
        try {
          await updateUser({
            prefs: {
              ...user.prefs,
              theme,
              contrastMode,
              colorScheme
            }
          });
        } catch (error) {
          console.error('Error saving user preferences:', error);
        }
      };
      
      // Debounce the update to avoid too many requests
      const timeoutId = setTimeout(updatePreferences, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [theme, contrastMode, colorScheme, user, updateUser]);

  // Refresh favorites when the favorites tab is opened
  useEffect(() => {
    if (activeTab === 'favorites') {
      refreshFavorites();
    }
  }, [activeTab, refreshFavorites]);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      toast.success('Logged out successfully!');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log out');
    }
  };

  const handleSaveKit = async () => {
    if (!kitName.trim()) {
      toast.error('Please enter a kit name');
      return;
    }

    try {
      await saveKit(kitName.trim(), kitDescription.trim() || undefined, isPublic);
      toast.success('Kit saved successfully!');
      setSaveDialogOpen(false);
      setKitName('');
      setKitDescription('');
      setIsPublic(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save kit');
    }
  };

  const handleLoadKit = async (kitId: string) => {
    try {
      await loadKit(kitId);
      toast.success('Kit loaded successfully!');
      navigate('/build');
    } catch (error: any) {
      toast.error(error.message || 'Failed to load kit');
    }
  };

  const handleDeleteKit = async (kitId: string, kitName: string) => {
    if (confirm(`Are you sure you want to delete "${kitName}"?`)) {
      try {
        await deleteKit(kitId);
        toast.success('Kit deleted successfully!');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete kit');
      }
    }
  };

  const handleProfileUpdate = async () => {
    try {
      if (!user) {
        toast.error('No user found');
        return;
      }
      
      // Create preferences object with all existing prefs plus our new value
      const updatedPrefs = {
        ...user.prefs,
        company: profileForm.company
      };
      
      // Update user profile in Appwrite
      const result = await updateUser({
        name: profileForm.name,
        prefs: updatedPrefs
      });
      
      if (result.error) {
        throw result.error;
      }
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleDeleteFavorite = async (productId: string, productName: string) => {
    if (confirm(`Are you sure you want to remove "${productName}" from your favorites?`)) {
      try {
        await toggleFavorite(productId);
        toast.success('Product removed from favorites!');
      } catch (error: any) {
        toast.error(error.message || 'Failed to remove favorite');
      }
    }
  };

  const calculateKitTotal = (kitItems: any[]) => {
    return kitItems.reduce((total, item) => {
      const lowestPrice = Math.min(...item.offers.map((offer: any) => offer.price));
      return total + (lowestPrice * item.quantity);
    }, 0);
  };

  return (
    <>
      <Helmet>
        <title>Profile | AT Supply Finder</title>
        <meta name="description" content="Manage your profile and saved kits" />
      </Helmet>
      
      <div className="py-6 sm:py-8 md:py-10">
        <PageContainer className="max-w-6xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profile</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Manage your account and preferences</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-2">
              <TabsTrigger value="dashboard" className="flex items-center gap-2 text-xs sm:text-sm">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2 text-xs sm:text-sm">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="kits" className="flex items-center gap-2 text-xs sm:text-sm">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">My Kits</span>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center gap-2 text-xs sm:text-sm">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Favorites</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2 text-xs sm:text-sm">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Preferences</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User Profile Card */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || user?.email}`} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{user?.name || 'User'}</div>
                        <div className="text-sm text-muted-foreground">{user?.email}</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>Saved Kits</span>
                      </div>
                      <span className="font-medium">{savedKits.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        <span>Favorites</span>
                      </div>
                      <span className="font-medium">{favorites.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Member Since</span>
                      </div>
                      <span className="font-medium">
                        {user?.$createdAt ? new Date(user.$createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    {isAdmin && (
                      <div className="pt-2">
                        <Badge variant="secondary" className="w-full justify-center py-2">
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          Administrator
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Stats and Quick Actions */}
                <div className="md:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LayoutDashboard className="h-5 w-5" />
                        Quick Overview
                      </CardTitle>
                      <CardDescription>Your account statistics and recent activity</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold">{savedKits.length}</div>
                          <div className="text-sm text-muted-foreground">Saved Kits</div>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold">{favorites.length}</div>
                          <div className="text-sm text-muted-foreground">Favorites</div>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold">
                            {kit.reduce((total, item) => total + item.quantity, 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">Current Kit Items</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="font-medium">Current Kit Summary</h3>
                        {kit.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                            <Package className="h-8 w-8 mx-auto mb-2" />
                            <p>Your kit is empty</p>
                            <Button asChild variant="outline" className="mt-2">
                              <Link to="/build">Build Your Kit</Link>
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span>Total Items:</span>
                              <span className="font-medium">
                                {kit.reduce((total, item) => total + item.quantity, 0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Estimated Total:</span>
                              <span className="font-medium">
                                {formatCurrency(calculateKitTotal(kit))}
                              </span>
                            </div>
                            <div className="pt-2">
                              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button className="w-full">
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Current Kit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Save Kit</DialogTitle>
                                    <DialogDescription>
                                      Save your current kit ({kit.length} items) to access it later from any device.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="kit-name">Kit Name</Label>
                                      <Input
                                        id="kit-name"
                                        value={kitName}
                                        onChange={(e) => setKitName(e.target.value)}
                                        placeholder="Enter kit name..."
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="kit-description">Description (Optional)</Label>
                                      <Textarea
                                        id="kit-description"
                                        value={kitDescription}
                                        onChange={(e) => setKitDescription(e.target.value)}
                                        placeholder="Describe your kit..."
                                        rows={3}
                                      />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="is-public"
                                        checked={isPublic}
                                        onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                                      />
                                      <Label htmlFor="is-public">Make this kit public</Label>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                                      Cancel
                                    </Button>
                                    <Button onClick={handleSaveKit}>
                                      Save Kit
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">Update your personal information and profile settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex flex-col items-center">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || user?.email}`} />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                          {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <Button variant="outline" size="sm" className="mt-3">
                        <Edit3 className="mr-2 h-4 w-4" />
                        Change Avatar
                      </Button>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm sm:text-base">Full Name</Label>
                        <Input
                          id="name"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                          disabled
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-sm sm:text-base">Company</Label>
                        <Input
                          id="company"
                          value={profileForm.company}
                          onChange={(e) => setProfileForm({...profileForm, company: e.target.value})}
                          placeholder="Your company name"
                          className="text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleProfileUpdate} className="w-full sm:w-auto">
                      Update Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>


            </TabsContent>

            <TabsContent value="kits" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    My Saved Kits
                  </CardTitle>
                  <CardDescription>Manage your saved kits and create new ones</CardDescription>
                </CardHeader>
                <CardContent>
                  {savedKits.length === 0 ? (
                    <div className="rounded-md border border-border p-8 text-center">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                      <h3 className="font-semibold mt-4">No saved kits yet</h3>
                      <p className="text-muted-foreground mt-2">
                        Save your first kit to access it from any device.
                      </p>
                      {kit.length === 0 && (
                        <Button asChild className="mt-4">
                          <Link to="/build">Build Your First Kit</Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {savedKits.map((savedKit) => (
                        <div key={savedKit.id} className="rounded-md border border-border p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-medium">{savedKit.name}</h4>
                                {savedKit.is_public && (
                                  <Badge variant="secondary">
                                    <Eye className="mr-1 h-3 w-3" />
                                    Public
                                  </Badge>
                                )}
                                <Badge variant="outline">
                                  <Tag className="mr-1 h-3 w-3" />
                                  {savedKit.kit_data.length} items
                                </Badge>
                              </div>
                              {savedKit.description && (
                                <p className="text-sm text-muted-foreground mt-2">{savedKit.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                                <span>Created {new Date(savedKit.created_at).toLocaleDateString()}</span>
                                <span>Updated {new Date(savedKit.updated_at).toLocaleDateString()}</span>
                                <span>Total: {formatCurrency(calculateKitTotal(savedKit.kit_data))}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleLoadKit(savedKit.id)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Load
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/kit/${savedKit.id}`);
                                  toast.success('Kit link copied to clipboard!');
                                }}
                              >
                                <Share2 className="mr-2 h-4 w-4" />
                                Share
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteKit(savedKit.id, savedKit.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    My Favorites
                  </CardTitle>
                  <CardDescription>Your saved products and items</CardDescription>
                </CardHeader>
                <CardContent>
                  {favorites.length === 0 ? (
                    <div className="rounded-md border border-border p-8 text-center">
                      <Heart className="h-12 w-12 mx-auto text-muted-foreground" />
                      <h3 className="font-semibold mt-4">No favorites yet</h3>
                      <p className="text-muted-foreground mt-2">
                        Browse the catalog and favorite products to easily find them later.
                      </p>
                      <Button asChild className="mt-4">
                        <Link to="/catalog">Browse Catalog</Link>
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-muted-foreground">
                          You have {favorites.length} favorited products.
                        </p>
                        <Button asChild variant="outline">
                          <Link to="/catalog?favorites=true">
                            <Heart className="mr-2 h-4 w-4" />
                            View All Favorites
                          </Link>
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {favoriteProducts.map((product) => (
                          <Card key={product.id} className="overflow-hidden">
                            <div className="p-4">
                              <div className="flex items-start gap-4">
                                {product.imageUrl ? (
                                  <img 
                                    src={product.imageUrl} 
                                    alt={product.name} 
                                    className="w-16 h-16 object-cover rounded-xl"
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center">
                                    <Package className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium truncate">{product.name}</h3>
                                  <p className="text-sm text-muted-foreground truncate">{product.brand}</p>
                                  {product.rating && (
                                    <div className="flex items-center mt-1">
                                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                      <span className="text-sm ml-1">{product.rating}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="mt-4 flex justify-between items-center">
                                <span className="font-medium">
                                  {product.price ? formatCurrency(product.price) : 'N/A'}
                                </span>
                                <div className="flex gap-2">
                                  <Button size="sm" asChild>
                                    <Link to={`/product/${product.id}`}>View</Link>
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleDeleteFavorite(product.id, product.name)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Appearance
                  </CardTitle>
                  <CardDescription>Customize how the application looks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Theme</h4>
                      <p className="text-sm text-muted-foreground">Select your preferred theme</p>
                    </div>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            Light
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Dark
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            System
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Contrast</h4>
                      <p className="text-sm text-muted-foreground">Adjust contrast for better visibility</p>
                    </div>
                    <Select value={contrastMode} onValueChange={setContrastMode}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select contrast" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High Contrast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Color Scheme</h4>
                      <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
                    </div>
                    <Select value={colorScheme} onValueChange={setColorScheme}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select color scheme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="first-aid">First Aid</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">Manage your notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-sm sm:text-base">Email Notifications</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-sm sm:text-base">Kit Updates</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">Notify me about kit changes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-sm sm:text-base">Product Updates</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">Notify me about product changes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Eye className="h-5 w-5" />
                    Privacy
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">Control your privacy settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-sm sm:text-base">Profile Visibility</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">Make your profile visible to others</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-sm sm:text-base">Kit Sharing</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">Allow others to view your public kits</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-sm sm:text-base">Activity Tracking</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">Track your activity for analytics</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Admin Section */}
          {isAdmin && (
            <Card className="border-primary/30 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <ShieldAlert className="h-5 w-5" />
                  Admin Dashboard
                </CardTitle>
                <CardDescription>Access administrative tools and settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button 
                    asChild 
                    variant="outline" 
                    className="h-auto p-3 sm:p-4 flex flex-col items-center justify-center gap-2 hover:border-primary text-xs sm:text-sm"
                  >
                    <Link to="/admin/dashboard">
                      <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span>Dashboard</span>
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    className="h-auto p-3 sm:p-4 flex flex-col items-center justify-center gap-2 hover:border-primary text-xs sm:text-sm"
                  >
                    <Link to="/admin/users">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span>User Management</span>
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    className="h-auto p-3 sm:p-4 flex flex-col items-center justify-center gap-2 hover:border-primary text-xs sm:text-sm"
                  >
                    <Link to="/admin/products">
                      <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span>Product Management</span>
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    className="h-auto p-3 sm:p-4 flex flex-col items-center justify-center gap-2 hover:border-primary text-xs sm:text-sm"
                  >
                    <Link to="/admin/analytics">
                      <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span>Analytics</span>
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    className="h-auto p-3 sm:p-4 flex flex-col items-center justify-center gap-2 hover:border-primary text-xs sm:text-sm"
                  >
                    <Link to="/admin/templates">
                      <Wrench className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span>Starter Kits</span>
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    className="h-auto p-3 sm:p-4 flex flex-col items-center justify-center gap-2 hover:border-primary text-xs sm:text-sm"
                  >
                    <Link to="/admin/reports">
                      <FileBarChart className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span>Reports</span>
                    </Link>
                  </Button>
                </div>
                
                <div className="mt-6 pt-6 border-t border-border">
                  <Button asChild variant="default" className="w-full text-sm sm:text-base">
                    <Link to="/admin" className="flex items-center justify-center gap-2">
                      <Settings className="h-4 w-4" />
                      Access Full Admin Dashboard
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sign Out Button at Bottom Center */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleSignOut} className="w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </PageContainer>
      </div>
    </>
  );
};

export default Profile;