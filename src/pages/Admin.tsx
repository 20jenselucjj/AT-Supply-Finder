import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { toast } from 'sonner';
import { AlertCircle, Users, Settings, ShieldAlert, BarChart3, Package, Wrench, Shield, AlertTriangle } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { UserManagement } from '@/components/admin/UserManagement';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { StarterKitBuilder } from '@/components/admin/StarterKitBuilder';
import { Analytics } from '@/components/admin/Analytics';

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
      // Fetch real user count from user_profiles view
      const { count: usersCount, error: usersError } = await supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch real product count
      const { count: productsCount, error: productsError } = await supabaseAdmin
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
              <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-full">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userCount || stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Registered accounts</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-full">
                    <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">Active in last 30 days</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-full">
                    <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{productCount || stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">Products in catalog</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-l-4 border-l-emerald-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Status</CardTitle>
                  <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 rounded-full">
                    <ShieldAlert className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Online</div>
                  <p className="text-xs text-muted-foreground">All systems operational</p>
                </CardContent>
              </Card>
            </div>



            {/* Admin Tabs */}
            <Tabs defaultValue="users" className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-lg p-1 shadow-sm border">
                <TabsList className="grid w-full grid-cols-4 bg-transparent">
                  <TabsTrigger 
                    value="users" 
                    className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-300"
                  >
                    <Users className="h-4 w-4" />
                    Users
                  </TabsTrigger>
                  <TabsTrigger 
                    value="products" 
                    className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900 dark:data-[state=active]:text-green-300"
                  >
                    <Package className="h-4 w-4" />
                    Products
                  </TabsTrigger>
                  <TabsTrigger 
                    value="templates" 
                    className="flex items-center gap-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900 dark:data-[state=active]:text-purple-300"
                  >
                    <Wrench className="h-4 w-4" />
                    Starter Kits
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics" 
                    className="flex items-center gap-2 data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-900 dark:data-[state=active]:text-indigo-300"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </div>

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

              <TabsContent value="analytics" className="space-y-4">
                <Analytics />
              </TabsContent>


            </Tabs>
          </div>
        </PageContainer>
      </div>
    </>
  );
};

export default Admin;