import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { databases, functions, account } from '@/lib/appwrite';
import { toast } from 'sonner';
import { useRBAC } from '@/hooks/use-rbac';
import { logger } from '@/lib/logger';
import { BarChart3, TrendingUp, Users, Package, Eye, Download, RefreshCw, Calendar, Activity, Target, PieChart, LineChart, BarChart, Globe, ShoppingCart, CreditCard, Filter } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, subMonths } from 'date-fns';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { Query } from 'appwrite';

interface AnalyticsData {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  totalProducts: number;
  popularProducts: Array<{
    id: string;
    name: string;
    brand: string;
    views: number;
  }>;
  userGrowthData: Array<{
    date: string;
    users: number;
    newUsers: number;
  }>;
  productCategoryData: Array<{
    category: string;
    value: number;
    color: string;
  }>;
  systemMetrics: {
    databaseSize: string;
    responseTime: number;
    uptime: string;
  };
  revenueData: Array<{
    date: string;
    revenue: number;
  }>;
  topCategories: Array<{
    category: string;
    products: number;
    revenue: number;
  }>;
  // New data for enhanced analytics
  userActivityData: Array<{
    day: string;
    activeUsers: number;
  }>;
  productPerformanceData: Array<{
    name: string;
    sales: number;
    views: number;
    conversion: number;
  }>;
  geographicData: Array<{
    country: string;
    users: number;
    revenue: number;
  }>;
}

export const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    totalProducts: 0,
    popularProducts: [],
    userGrowthData: [],
    productCategoryData: [],
    systemMetrics: {
      databaseSize: '0 MB',
      responseTime: 0,
      uptime: '0 days'
    },
    revenueData: [],
    topCategories: [],
    userActivityData: [],
    productPerformanceData: [],
    geographicData: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 7),
    end: new Date()
  });
  const { isEditorOrAdmin } = useRBAC();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Check if current user is admin
      // Note: In Appwrite, we'll need to check user roles differently
      // For now, we'll assume that if the user can access this page, they're authorized
    
      // Fetch user statistics using the same API endpoint as UserManagement component
      let totalUsers = 0;
      let newUsersToday = 0;
      let newUsersThisWeek = 0;
      
      try {
        // Use Appwrite function instead of direct API call
        const functionId = import.meta.env.VITE_APPWRITE_LIST_USERS_FUNCTION_ID;
        
        if (!functionId) {
          throw new Error('Missing Appwrite function ID in environment variables');
        }
        
        const execution = await functions.createExecution(
          functionId,
          JSON.stringify({ page: 1, limit: 1000 }),
          false // synchronous execution
        );
        
        if (execution.status !== 'completed') {
          throw new Error(`Function execution failed: ${execution.status}`);
        }
        
        // Parse the response
        const responseData = execution.responseBody ? JSON.parse(execution.responseBody) : {};
        
        if (responseData.users && responseData.total) {
          totalUsers = responseData.total || 0;
          
          // Calculate new users from the detailed data
          const users = responseData.users || [];
          const today = new Date();
          const startOfToday = startOfDay(today);
          const weekAgo = subDays(today, 7);
          
          newUsersToday = users.filter((user: any) => {
            const createdAt = new Date(user.createdAt);
            return createdAt >= startOfToday;
          }).length;
          
          newUsersThisWeek = users.filter((user: any) => {
            const createdAt = new Date(user.createdAt);
            return createdAt >= weekAgo;
          }).length;
        }
      } catch (serverError) {
        console.error('Error fetching user data from server API:', serverError);
        // Final fallback to direct Appwrite query
        try {
          const usersResponse = await databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'users'
          );
          totalUsers = usersResponse.total || 0;
          
          // Fetch users created today
          const today = new Date();
          const startOfToday = startOfDay(today).toISOString();
          const endOfToday = endOfDay(today).toISOString();
          
          const todayUsersResponse = await databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'users',
            [Query.greaterThanEqual('$createdAt', startOfToday), Query.lessThanEqual('$createdAt', endOfToday)]
          );
          
          newUsersToday = todayUsersResponse.total || 0;

          // Fetch users created this week
          const weekAgo = subDays(today, 7).toISOString();
          const weekUsersResponse = await databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'users',
            [Query.greaterThanEqual('$createdAt', weekAgo)]
          );
          
          newUsersThisWeek = weekUsersResponse.total || 0;
        } catch (fallbackError) {
          console.error('Error fetching user count from Appwrite:', fallbackError);
        }
      }

      // Fetch product statistics
      const productsResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        []
      );
      
      const totalProducts = productsResponse.total || 0;

      // Fetch popular products (mock data since we don't have view tracking)
      const popularProductsResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        [Query.limit(5)]
      );

      const popularProducts = (popularProductsResponse.documents || []).map((product: any, index: number) => ({
        id: product.$id,
        name: product.name,
        brand: product.brand,
        views: Math.floor(Math.random() * 1000) + 100 // Mock view data
      }));

      // Generate user growth data based on time range
      let daysToGenerate = 7;
      if (timeRange === '30d') daysToGenerate = 30;
      if (timeRange === '90d') daysToGenerate = 90;

      const userGrowthData = [];
      for (let i = daysToGenerate - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        userGrowthData.push({
          date: format(date, 'MMM dd'),
          users: Math.floor(Math.random() * 50) + 100 + i * 2,
          newUsers: Math.floor(Math.random() * 10) + 1
        });
      }

      // Generate product category data
      const productCategoryData = [
        { category: 'Electronics', value: 35, color: '#0088FE' },
        { category: 'Home & Garden', value: 25, color: '#00C49F' },
        { category: 'Sports', value: 20, color: '#FFBB28' },
        { category: 'Books', value: 12, color: '#FF8042' },
        { category: 'Other', value: 8, color: '#8884D8' }
      ];

      // Generate system metrics (mock data)
      const systemMetrics = {
        databaseSize: `${(Math.random() * 100).toFixed(1)} MB`,
        responseTime: Math.floor(Math.random() * 100) + 50,
        uptime: `${Math.floor(Math.random() * 30) + 1} days`
      };

      // Generate revenue data
      const revenueData = [];
      for (let i = daysToGenerate - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        revenueData.push({
          date: format(date, 'MMM dd'),
          revenue: Math.floor(Math.random() * 1000) + 500
        });
      }

      // Generate top categories data
      const topCategories = [
        { category: 'Electronics', products: 1250, revenue: 45000 },
        { category: 'Home & Garden', products: 980, revenue: 32000 },
        { category: 'Sports', products: 760, revenue: 28000 },
        { category: 'Books', products: 420, revenue: 15000 },
        { category: 'Other', products: 280, revenue: 9800 }
      ];

      // Generate user activity data
      const userActivityData = [
        { day: 'Mon', activeUsers: Math.floor(Math.random() * 100) + 200 },
        { day: 'Tue', activeUsers: Math.floor(Math.random() * 100) + 250 },
        { day: 'Wed', activeUsers: Math.floor(Math.random() * 100) + 300 },
        { day: 'Thu', activeUsers: Math.floor(Math.random() * 100) + 280 },
        { day: 'Fri', activeUsers: Math.floor(Math.random() * 100) + 350 },
        { day: 'Sat', activeUsers: Math.floor(Math.random() * 100) + 400 },
        { day: 'Sun', activeUsers: Math.floor(Math.random() * 100) + 380 }
      ];

      // Generate product performance data
      const productPerformanceData = [
        { name: 'Product A', sales: 400, views: 1200, conversion: 33.3 },
        { name: 'Product B', sales: 350, views: 1100, conversion: 31.8 },
        { name: 'Product C', sales: 300, views: 1000, conversion: 30.0 },
        { name: 'Product D', sales: 250, views: 900, conversion: 27.8 },
        { name: 'Product E', sales: 200, views: 800, conversion: 25.0 }
      ];

      // Generate geographic data
      const geographicData = [
        { country: 'USA', users: 12500, revenue: 450000 },
        { country: 'UK', users: 8500, revenue: 320000 },
        { country: 'Canada', users: 6200, revenue: 280000 },
        { country: 'Germany', users: 5800, revenue: 250000 },
        { country: 'France', users: 4900, revenue: 220000 },
        { country: 'Australia', users: 4200, revenue: 190000 },
        { country: 'Japan', users: 3800, revenue: 170000 }
      ];

      setAnalytics({
        totalUsers,
        newUsersToday,
        newUsersThisWeek,
        totalProducts,
        popularProducts,
        userGrowthData,
        productCategoryData,
        systemMetrics,
        revenueData,
        topCategories,
        userActivityData,
        productPerformanceData,
        geographicData
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    toast.success('Analytics data refreshed');
  };

  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      analytics
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Analytics data exported');
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Note: Appwrite doesn't have the same real-time subscription model as Supabase
    // We'll need to implement polling or use Appwrite's real-time features differently
    // For now, we'll just fetch data when the component mounts and when timeRange changes
    
    // Clean up function (no subscriptions to remove in this version)
    return () => {
      // No cleanup needed for this implementation
    };
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Monitor system performance and user engagement
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRefresh} disabled={refreshing} size="sm" className="flex-1 sm:flex-none">
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''} sm:mr-0 mr-2`} />
                  <span className="sm:hidden">Refresh</span>
                </Button>
                <Button variant="outline" onClick={exportData} size="sm" className="flex-1 sm:flex-none">
                  <Download className="h-4 w-4 sm:mr-0 mr-2" />
                  <span className="sm:hidden">Export</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Revenue</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{analytics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  +{analytics.newUsersThisWeek} this week
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Users Today</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analytics.newUsersToday}</div>
                <p className="text-xs text-muted-foreground">
                  Daily registrations
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{analytics.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  In catalog
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Eye className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{analytics.systemMetrics.responseTime}ms</div>
                <p className="text-xs text-muted-foreground">
                  Average response
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  User Growth
                </CardTitle>
                <CardDescription>
                  New and total users over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={analytics.userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="users" stroke="#8884d8" activeDot={{ r: 8 }} name="Total Users" />
                      <Line type="monotone" dataKey="newUsers" stroke="#82ca9d" name="New Users" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Revenue Overview
                </CardTitle>
                <CardDescription>
                  Weekly revenue trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={analytics.revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Popular Products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Products</CardTitle>
                <CardDescription>Most viewed products</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Desktop Table View */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.popularProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.brand}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{product.views}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {analytics.popularProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-tight mb-1 line-clamp-2">{product.name}</h4>
                        <Badge variant="outline" className="text-xs">{product.brand}</Badge>
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-sm font-medium">{product.views}</div>
                        <div className="text-xs text-muted-foreground">views</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Health</CardTitle>
                <CardDescription>Current system status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Database Size</span>
                  <Badge variant="outline">{analytics.systemMetrics.databaseSize}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">System Uptime</span>
                  <Badge variant="outline">{analytics.systemMetrics.uptime}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Operational
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  User Growth
                </CardTitle>
                <CardDescription>
                  New and total users over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={analytics.userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="users" stroke="#8884d8" activeDot={{ r: 8 }} name="Total Users" />
                      <Line type="monotone" dataKey="newUsers" stroke="#82ca9d" name="New Users" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* User Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  User Activity
                </CardTitle>
                <CardDescription>
                  Active users by day of week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={analytics.userActivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="activeUsers" fill="#8884d8" name="Active Users" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid gap-6">
            {/* Product Categories Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Product Categories
                </CardTitle>
                <CardDescription>
                  Distribution of products by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={analytics.productCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {analytics.productCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Categories Table */}
            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
                <CardDescription>Performance by product category</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.topCategories.map((category) => (
                      <TableRow key={category.category}>
                        <TableCell className="font-medium">{category.category}</TableCell>
                        <TableCell>{category.products}</TableCell>
                        <TableCell className="text-right">${category.revenue.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Revenue Overview
                </CardTitle>
                <CardDescription>
                  Weekly revenue trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={analytics.revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Product Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Product Performance
                </CardTitle>
                <CardDescription>
                  Sales vs Views vs Conversion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={analytics.productPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="sales" fill="#8884d8" name="Sales" />
                      <Bar yAxisId="left" dataKey="views" fill="#82ca9d" name="Views" />
                      <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="#ff7300" name="Conversion %" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6">
            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Geographic Distribution
                </CardTitle>
                <CardDescription>
                  Users and revenue by country
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={analytics.geographicData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="country" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" fill="#8884d8" name="Users" />
                      <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* System Performance */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Metrics
                  </CardTitle>
                  <CardDescription>
                    Current system performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Response Time</span>
                      <Badge variant="outline">{analytics.systemMetrics.responseTime}ms</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Database Size</span>
                      <Badge variant="outline">{analytics.systemMetrics.databaseSize}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Uptime</span>
                      <Badge variant="outline">{analytics.systemMetrics.uptime}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Status</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Operational
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Conversion Metrics
                  </CardTitle>
                  <CardDescription>
                    Sales performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={analytics.productPerformanceData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="name" />
                        <PolarRadiusAxis />
                        <Radar name="Conversion" dataKey="conversion" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};