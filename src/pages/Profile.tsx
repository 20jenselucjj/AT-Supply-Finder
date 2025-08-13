import { useAuth } from '@/context/auth-context';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';
import PageContainer from '@/components/layout/PageContainer';
import { toast } from 'sonner';

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
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

  return (
    <>
      <Helmet>
        <title>Profile | Wrap Wizard</title>
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
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Saved Kits</h3>
                <div className="rounded-md border p-4 text-center">
                  <p className="text-muted-foreground">You haven't saved any kits yet.</p>
                  <p className="text-sm mt-2">Create a kit and save it to access it from any device.</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Favorites</h3>
                <div className="rounded-md border p-4 text-center">
                  <p className="text-muted-foreground">You haven't favorited any products yet.</p>
                  <p className="text-sm mt-2">Browse the catalog and favorite products to easily find them later.</p>
                </div>
              </div>
              
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