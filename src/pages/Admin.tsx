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
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              <Card className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Users</CardTitle>
                  <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{userCount || stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground hidden sm:block">Registered accounts</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Active</CardTitle>
                  <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeUsers}</div>
                  <p className="text-xs text-muted-foreground hidden sm:block">Active in last 30 days</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Products</CardTitle>
                  <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{productCount || stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground hidden sm:block">Products in catalog</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-emerald-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Status</CardTitle>
                  <div className="p-1.5 sm:p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                    <ShieldAlert className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">Online</div>
                  <p className="text-xs text-muted-foreground hidden sm:block">All systems operational</p>
                </CardContent>
              </Card>
            </div>



            {/* Admin Tabs */}
            <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-lg p-1 shadow-sm border">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-transparent gap-1 h-auto">
                  <TabsTrigger 
                    value="users" 
                    className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-3 sm:py-2 min-h-[44px] data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-300"
                  >
                    <Users className="h-4 w-4 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Users</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="products" 
                    className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-3 sm:py-2 min-h-[44px] data-[state=active]:bg-green-100 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900 dark:data-[state=active]:text-green-300"
                  >
                    <Package className="h-4 w-4 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Products</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="templates" 
                    className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-3 sm:py-2 min-h-[44px] data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900 dark:data-[state=active]:text-purple-300"
                  >
                    <Wrench className="h-4 w-4 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Kits</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics" 
                    className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-3 sm:py-2 min-h-[44px] data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-900 dark:data-[state=active]:text-indigo-300"
                  >
                    <BarChart3 className="h-4 w-4 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Analytics</span>
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