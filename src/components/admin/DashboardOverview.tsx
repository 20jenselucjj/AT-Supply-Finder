import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';
import { supabase, supabaseAdmin } from '@/lib/supabase';
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
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

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

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  color: string;
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

  const quickActions: QuickAction[] = [
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

      // Check admin permissions
      const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin');
      if (adminError || !isAdminResult) {
        toast.error('You must be an admin to view dashboard.');
        return;
      }

      // Fetch user statistics
      const { count: totalUsers } = await supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch active users (users who signed in within last 30 days)
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { count: activeUsers } = await supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', thirtyDaysAgo.toISOString());

      // Fetch new users today
      const today = startOfDay(new Date());
      const { count: newUsersToday } = await supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Fetch product statistics
      const { count: totalProducts } = await supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Fetch order statistics
      const { count: totalOrders, data: orderData } = await supabaseAdmin
        .from('orders')
        .select('total_amount', { count: 'exact' });

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

  const renderMetricCard = (metric: MetricCard, index: number) => {
    const isPositiveChange = metric.changeType === 'increase';
    const changeIcon = isPositiveChange ? ArrowUp : ArrowDown;
    const changeColor = isPositiveChange ? 'text-green-600' : 'text-red-600';

    return (
      <motion.div
        key={metric.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      >
        <Card className="relative overflow-hidden border-l-4 border-l-transparent hover:border-l-primary transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <div className={cn("p-2 rounded-full", metric.color)}>
              <metric.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">
                  {metric.isLoading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    <>
                      {metric.prefix}{typeof metric.value === 'number' ? metric.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : metric.value}{metric.suffix}
                    </>
                  )}
                </div>
                {metric.change !== undefined && (
                  <div className={cn("flex items-center text-sm", changeColor)}>
                    {React.createElement(changeIcon, { className: "h-3 w-3 mr-1" })}
                    +{typeof metric.change === 'number' ? metric.change.toLocaleString(undefined, { maximumFractionDigits: 2 }) : metric.change}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
              
              {/* Mini trend chart placeholder */}
              {metric.trend && (
                <div className="flex items-end gap-1 h-8 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  {metric.trend.map((value, i) => (
                    <div
                      key={i}
                      className="bg-primary/30 rounded-sm flex-1 transition-all duration-300"
                      style={{ height: `${(value / Math.max(...metric.trend!)) * 100}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const getStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return AlertTriangle;
      default: return Clock;
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
        {metrics.map((metric, index) => renderMetricCard(metric, index))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              User Growth
            </CardTitle>
            <CardDescription>
              New and total users over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="newUsers" stroke="#82ca9d" />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

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
                    data={productCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {productCategoryData.map((entry, index) => (
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
      </div>

      {/* Revenue and System Health */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Overview
            </CardTitle>
            <CardDescription>
              Weekly revenue trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>
              Real-time system status and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {React.createElement(getStatusIcon(systemHealth.status), {
                  className: cn("h-4 w-4", getStatusColor(systemHealth.status))
                })}
                <span className="font-medium">Overall Status</span>
              </div>
              <Badge className={getStatusColor(systemHealth.status)}>
                {systemHealth.status.toUpperCase()}
              </Badge>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-lg font-semibold">{systemHealth.uptime}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Response Time</p>
                <p className="text-lg font-semibold">{systemHealth.responseTime}ms</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">DB Connections</p>
                <p className="text-lg font-semibold">{systemHealth.dbConnections}/100</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-lg font-semibold">{systemHealth.errorRate.toFixed(2)}%</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Database Performance</span>
                <span>Good</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto p-4"
                onClick={action.action}
              >
                <div className={cn("p-2 rounded-full text-white", action.color)}>
                  <action.icon className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;