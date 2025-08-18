import { useAuth } from '@/context/auth-context';
import { useKit } from '@/context/kit-context';
import { useFavorites } from '@/context/favorites-context';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Helmet } from 'react-helmet-async';
import { ShieldAlert, Plus, Trash2, Download, Heart } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { toast } from 'sonner';
import React, { useState } from 'react';

const Profile = () => {
  const { user, signOut, isAdmin } = useAuth();
  const { kit, savedKits, saveKit, loadKit, deleteKit, clearKit } = useKit();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [kitName, setKitName] = useState('');
  const [kitDescription, setKitDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
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

  return (
    <>
      <Helmet>
  <title>Profile | AT Supply Finder</title>
        <meta name="description" content="Manage your profile and saved kits" />
      </Helmet>
      
      <div className="py-10">
        <PageContainer className="max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your account settings and saved kits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Account Information</h3>
                <div className="rounded-md border p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">User ID</p>
                      <p className="font-medium">{user?.id}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Saved Kits</h3>
                  {kit.length > 0 && (
                    <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
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
                  )}
                </div>
                
                {savedKits.length === 0 ? (
                  <div className="rounded-md border p-4 text-center">
                    <p className="text-muted-foreground">You haven't saved any kits yet.</p>
                    <p className="text-sm mt-2">Create a kit and save it to access it from any device.</p>
                    {kit.length === 0 && (
                      <Button asChild className="mt-4" variant="outline">
                        <Link to="/build">Build Your First Kit</Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedKits.map((savedKit) => (
                      <div key={savedKit.id} className="rounded-md border p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{savedKit.name}</h4>
                            {savedKit.description && (
                              <p className="text-sm text-muted-foreground mt-1">{savedKit.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span>{savedKit.kit_data.length} items</span>
                              <span>Created {new Date(savedKit.created_at).toLocaleDateString()}</span>
                              {savedKit.is_public && <span className="text-blue-600">Public</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
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
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Favorites</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span>{favorites.length} favorited</span>
                  </div>
                </div>
                
                {favorites.length === 0 ? (
                  <div className="rounded-md border p-4 text-center">
                    <p className="text-muted-foreground">You haven't favorited any products yet.</p>
                    <p className="text-sm mt-2">Browse the catalog and favorite products to easily find them later.</p>
                    <Button asChild className="mt-4" variant="outline">
                      <Link to="/catalog">Browse Catalog</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border p-4">
                    <p className="text-muted-foreground">You have {favorites.length} favorited products.</p>
                    <p className="text-sm mt-2">Visit the catalog to view and manage your favorites.</p>
                    <Button asChild className="mt-4" variant="outline">
                      <Link to="/catalog">View Favorites</Link>
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Admin Dashboard Link */}
              {user && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Admin Access</h3>
                  <div className="rounded-md border p-4">
                    {isAdmin ? (
                    <>
                      <p className="font-medium text-green-600 mb-2">You have admin privileges</p>
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/admin" className="flex items-center justify-center">
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          Access Admin Dashboard
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Admin access is restricted to authorized personnel only.</p>
                  )}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <Button variant="destructive" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    </>
  );
};

export default Profile;