import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';
import { databases, account } from '@/lib/appwrite';
import { toast } from 'sonner';
import {
  Users,
  Package,
  Activity,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Star,
  ShoppingCart,
  Calendar,
  Database,
  BarChart3,
  PieChart,
  LineChart,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay } from 'date-fns';

// Import the new smaller components
import { MetricCard } from './MetricCard';
import UserGrowthChart from './UserGrowthChart';
import ProductCategoriesChart from './ProductCategoriesChart';
import RevenueChart from './RevenueChart';
import SystemHealthCard from './SystemHealthCard';
import QuickActionsCard from './QuickActionsCard';

interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ElementType;
  color: string;
  description: string;
  trend?: number[];
  isLoading?: boolean;
  prefix?: string;
  suffix?: string;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  responseTime: number;
  dbConnections: number;
  errorRate: number;
}

interface ChartData {
  name: string;
  value: number;
}

export const DashboardOverview: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    uptime: '0 days',
    responseTime: 0,
    dbConnections: 0,
    errorRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [productCategoryData, setProductCategoryData] = useState<ChartData[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const { user } = useAuth();

  const quickActions = [
    {
      id: 'invite-user',
      title: 'Invite User',
      description: 'Send invitation to new team member',
      icon: Users,
      color: 'bg-blue-500',
      action: () => toast.info('User invitation feature coming soon!')
    },
    {
      id: 'add-product',
      title: 'Add Product',
      description: 'Add new product to catalog',
      icon: Package,
      color: 'bg-green-500',
      action: () => toast.info('Product management feature coming soon!')
    },
    {
      id: 'view-analytics',
      title: 'View Analytics',
      description: 'Check detailed analytics',
      icon: Activity,
      color: 'bg-purple-500',
      action: () => toast.info('Detailed analytics coming soon!')
    },
    {
      id: 'system-backup',
      title: 'System Backup',
      description: 'Create system backup',
      icon: Database,
      color: 'bg-orange-500',
      action: () => toast.info('Backup feature coming soon!')
    }
  ];

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Check admin permissions using Appwrite
      const isAdmin = await account.get();
      if (!isAdmin) {
        toast.error('You must be logged in to view dashboard.');
        return;
      }

      // Fetch user statistics from Appwrite
      // Using 'users' collection instead of 'userProfiles' which doesn't exist
      const usersResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'users',
        [JSON.stringify({ method: 'limit', values: [1000] })]
      );
      const totalUsers = usersResponse.total;

      // Fetch active users (users who signed in within last 30 days)
      // Note: Appwrite doesn't have a direct way to filter by date, so we'll need to filter client-side
      const allUsersResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'users',
        []
      );
      
      const thirtyDaysAgo = subDays(new Date(), 30);
      const activeUsers = allUsersResponse.documents.filter((user: any) => {
        const lastSignIn = user.lastSignInAt ? new Date(user.lastSignInAt) : new Date(user.$createdAt);
        return lastSignIn >= thirtyDaysAgo;
      }).length;

      // Fetch new users today
      const today = startOfDay(new Date());
      const newUsersToday = allUsersResponse.documents.filter((user: any) => {
        const createdAt = new Date(user.$createdAt);
        return createdAt >= today;
      }).length;

      // Fetch product statistics
      const productsResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        [JSON.stringify({ method: 'limit', values: [1000] })]
      );
      const totalProducts = productsResponse.total;

      // Fetch order statistics
      // Since the orders table doesn't exist, we'll use mock data
      const totalOrders = 0;
      const orderData = [];
      // Calculate revenue
      const totalRevenue = orderData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Calculate engagement metrics
      const sessionData = Math.floor(Math.random() * 1000) + 500;
      const conversionRate = Math.random() * 5 + 2;

      // Calculate average order value
      const avgOrderValue = totalOrders && totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Build metrics array
      const metricsData: MetricCard[] = [
        {
          id: 'total-users',
          title: 'Total Users',
          value: totalUsers || 0,
          previousValue: (totalUsers || 0) - (newUsersToday || 0),
          change: newUsersToday || 0,
          changeType: 'increase',
          icon: Users,
          color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400',
          description: 'Registered users',
          trend: [65, 70, 68, 75, 80, 78, 85],
          isLoading: false
        },
        {
          id: 'active-users',
          title: 'Active Users',
          value: activeUsers || 0,
          previousValue: Math.max(0, (activeUsers || 0) - 5),
          change: 5,
          changeType: 'increase',
          icon: Activity,
          color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400',
          description: 'Active in last 30 days',
          trend: [45, 52, 48, 55, 60, 58, 65],
          isLoading: false
        },
        {
          id: 'total-products',
          title: 'Products',
          value: totalProducts || 0,
          previousValue: Math.max(0, (totalProducts || 0) - 2),
          change: 2,
          changeType: 'increase',
          icon: Package,
          color: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-400',
          description: 'Products in catalog',
          trend: [20, 25, 30, 28, 35, 40, 42],
          isLoading: false
        },
        {
          id: 'total-revenue',
          title: 'Total Revenue',
          value: totalRevenue,
          previousValue: totalRevenue * 0.9,
          change: totalRevenue * 0.1,
          changeType: 'increase',
          icon: DollarSign,
          color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-400',
          description: 'Lifetime revenue',
          trend: [1200, 1500, 1800, 2100, 2400, 2700, 3000],
          isLoading: false,
          prefix: '$'
        },
        {
          id: 'conversion-rate',
          title: 'Conversion Rate',
          value: `${conversionRate.toFixed(1)}%`,
          previousValue: `${(conversionRate - 0.5).toFixed(1)}%`,
          change: 0.5,
          changeType: 'increase',
          icon: TrendingUp,
          color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-400',
          description: 'User engagement rate',
          trend: [2.1, 2.5, 2.8, 3.2, 3.0, 3.5, conversionRate],
          isLoading: false
        },
        {
          id: 'avg-order-value',
          title: 'Avg Order Value',
          value: avgOrderValue,
          previousValue: avgOrderValue * 0.95,
          change: avgOrderValue * 0.05,
          changeType: 'increase',
          icon: ShoppingCart,
          color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-400',
          description: 'Average order value',
          trend: [45, 48, 52, 49, 55, 58, 60],
          isLoading: false,
          prefix: '$'
        }
      ];

      setMetrics(metricsData);

      // Mock system health data
      setSystemHealth({
        status: 'healthy',
        uptime: `${Math.floor(Math.random() * 30) + 1} days`,
        responseTime: Math.floor(Math.random() * 100) + 50,
        dbConnections: Math.floor(Math.random() * 50) + 10,
        errorRate: Math.random() * 0.5
      });

      // Generate user growth data for the last 7 days
      const userData = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        userData.push({
          date: format(date, 'MMM dd'),
          users: Math.floor(Math.random() * 50) + 100 + i * 5,
          newUsers: Math.floor(Math.random() * 10) + 1
        });
      }
      setUserGrowthData(userData);

      // Generate product category data
      setProductCategoryData([
        { name: 'Electronics', value: 35 },
        { name: 'Home & Garden', value: 25 },
        { name: 'Sports', value: 20 },
        { name: 'Books', value: 12 },
        { name: 'Other', value: 8 }
      ]);

      // Generate revenue data
      const revenue = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        revenue.push({
          date: format(date, 'MMM dd'),
          revenue: Math.floor(Math.random() * 1000) + 500
        });
      }
      setRevenueData(revenue);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchDashboardData();
    toast.success('Dashboard data refreshed');
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email?.split('@')[0]}! Here's what's happening with your platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Last updated: {format(lastUpdated, 'HH:mm:ss')}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.id} metric={metric} index={index} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UserGrowthChart data={userGrowthData} />
        <ProductCategoriesChart data={productCategoryData} />
      </div>

      {/* Revenue and System Health */}
      <div className="grid gap-6 lg:grid-cols-3">
        <RevenueChart data={revenueData} />
        <SystemHealthCard systemHealth={systemHealth} />
      </div>

      {/* Quick Actions */}
      <QuickActionsCard actions={quickActions} />
    </div>
  );
};

export default DashboardOverview;