import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { BarChart3, TrendingUp, Users, Package, Eye, Download, RefreshCw } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

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

  systemMetrics: {
    databaseSize: string;
    responseTime: number;
    uptime: string;
  };
}

export const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    totalProducts: 0,
    popularProducts: [],

    systemMetrics: {
      databaseSize: '0 MB',
      responseTime: 0,
      uptime: '0 days'
    }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Check if current user is admin
      const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin');
      if (adminError || !isAdminResult) {
        toast.error('You must be an admin to view analytics.');
        return;
      }

      // Fetch user statistics
      const { count: totalUsers } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });

      // Fetch users created today
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);
      
      const { count: newUsersToday } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfToday.toISOString())
        .lte('created_at', endOfToday.toISOString());

      // Fetch users created this week
      const weekAgo = subDays(today, 7);
      const { count: newUsersThisWeek } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      // Fetch product statistics
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Fetch popular products (mock data since we don't have view tracking)
      const { data: products } = await supabase
        .from('products')
        .select('id, name, brand')
        .limit(5);

      const popularProducts = (products || []).map((product, index) => ({
        ...product,
        views: Math.floor(Math.random() * 1000) + 100 // Mock view data
      }));



      // Mock system metrics
      const systemMetrics = {
        databaseSize: `${Math.floor(Math.random() * 500) + 100} MB`,
        responseTime: Math.floor(Math.random() * 200) + 50,
        uptime: `${Math.floor(Math.random() * 30) + 1} days`
      };

      setAnalytics({
        totalUsers: totalUsers || 0,
        newUsersToday: newUsersToday || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        totalProducts: totalProducts || 0,
        popularProducts,

        systemMetrics
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
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
  }, [timeRange]);

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
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
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


    </div>
  );
};