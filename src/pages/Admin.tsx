import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AlertCircle, Users, Settings, ShieldAlert, BarChart3, Package, Wrench } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { UserManagement } from '@/components/admin/UserManagement';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { StarterKitBuilder } from '@/components/admin/StarterKitBuilder';

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProducts: 0,
    totalOrders: 0
  });
  const [userCount, setUserCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth context to finish loading
    if (authLoading) {
      return;
    }

    if (!user) {
      console.log('No user found, redirecting to home');
      navigate('/');
      return;
    }

    if (!isAdmin) {
      console.log('User is not admin, redirecting to home');
      toast.error('You do not have permission to access the admin area');
      navigate('/');
      return;
    }

    // User is authenticated and is admin, fetch stats
    console.log('Admin page: User is admin, loading dashboard');
    fetchStats();
    setLoading(false);
  }, [user, isAdmin, authLoading, navigate]);

  const fetchStats = async () => {
    try {
      // Fetch real user count from user_roles table
      const { count: usersCount, error: usersError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });

      // Fetch real product count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        console.error('Error fetching user count:', usersError);
      }

      if (productsError) {
        console.error('Error fetching product count:', productsError);
      }

      setStats({
        totalUsers: usersCount || 0,
        activeUsers: Math.floor((usersCount || 0) * 0.7), // Estimate 70% active
        totalProducts: productsCount || 0,
        totalOrders: 0 // Orders not implemented yet
      });

      setUserCount(usersCount || 0);
      setProductCount(productsCount || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load admin dashboard data');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | AT Supply Finder</title>
        <meta name="description" content="Admin dashboard for AT Supply Finder" />
      </Helmet>

      <div className="py-10">
        <PageContainer>
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your site, users, and content from this central dashboard.
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Registered accounts</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">Active in last 30 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">Products in catalog</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">Processed orders</p>
                </CardContent>
              </Card>
            </div>

            {/* Admin Tabs */}
            <Tabs defaultValue="users" className="space-y-4">
              <TabsList>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="templates">Starter Kits</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-4">
                <UserManagement
                  totalUsers={userCount}
                  onUserCountChange={setUserCount}
                />
              </TabsContent>

              <TabsContent value="products" className="space-y-4">
                <ProductManagement
                  totalProducts={productCount}
                  onProductCountChange={setProductCount}
                />
              </TabsContent>

              <TabsContent value="templates" className="space-y-4">
                <StarterKitBuilder />
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <SystemSettings />
              </TabsContent>
            </Tabs>
          </div>
        </PageContainer>
      </div>
    </>
  );
};

export default Admin;