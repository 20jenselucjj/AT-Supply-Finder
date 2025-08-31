import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';
import { databases, account, functions } from '@/lib/appwrite';
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
  DollarSign,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay } from 'date-fns';

// Import the new smaller components
import { MetricCard } from './MetricCard';
import UserGrowthChart from './UserGrowthChart';
import ProductCategoriesChart from './ProductCategoriesChart';
import RevenueChart from './RevenueChart';
import SystemHealthCard from './SystemHealthCard';

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

const DashboardOverview: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    uptime: '99.9%',
    responseTime: 120,
    dbConnections: 42,
    errorRate: 0.1
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [userGrowthData, setUserGrowthData] = useState<any[]>([
    { date: 'Mon', users: 400, newUsers: 24 },
    { date: 'Tue', users: 300, newUsers: 13 },
    { date: 'Wed', users: 200, newUsers: 8 },
    { date: 'Thu', users: 278, newUsers: 15 },
    { date: 'Fri', users: 189, newUsers: 9 },
    { date: 'Sat', users: 239, newUsers: 12 },
    { date: 'Sun', users: 349, newUsers: 18 }
  ]);
  const [productCategoryData, setProductCategoryData] = useState<ChartData[]>([
    { name: 'First Aid', value: 45 },
    { name: 'Mobility', value: 30 },
    { name: 'Daily Living', value: 15 },
    { name: 'Medical Equipment', value: 10 }
  ]);
  const [revenueData, setRevenueData] = useState<any[]>([
    { date: 'Week 1', revenue: 4000 },
    { date: 'Week 2', revenue: 3000 },
    { date: 'Week 3', revenue: 2000 },
    { date: 'Week 4', revenue: 2780 },
    { date: 'Week 5', revenue: 1890 }
  ]);
  const { user } = useAuth();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Check admin permissions using Appwrite
      const isAdmin = await account.get();
      if (!isAdmin) {
        toast.error('You must be logged in to view dashboard.');
        return;
      }

      // Fetch user statistics using the same API endpoint as UserManagement component
      let totalUsers = 0;
      let activeUsers = 0;
      let newUsersToday = 0;
      
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
      
        // Handle both success and error responses
        if (responseData.success === false) {
          throw new Error(responseData.error || 'Function execution failed');
        }
      
        // Properly handle the response structure from the Appwrite function
        if (responseData.data && responseData.data.users) {
          const users = responseData.data.users;
          totalUsers = responseData.data.total || users.length;
        
          // Calculate active users and new users from the detailed data
          const thirtyDaysAgo = subDays(new Date(), 30);
          const today = startOfDay(new Date());
        
          // Use the same logic as UserManagement component for active users
          activeUsers = users.filter((user: any) => {
            // Check if user has accessed the system within the last 30 days
            const accessedAt = user.lastSignInAt || user.accessedAt ? new Date(user.lastSignInAt || user.accessedAt) : null;
            if (accessedAt) {
              return accessedAt > thirtyDaysAgo;
            }
            // Fallback to creation date if no accessedAt
            const createdAt = user.createdAt || user.$createdAt ? new Date(user.createdAt || user.$createdAt) : new Date();
            return createdAt > thirtyDaysAgo;
          }).length;
        
          newUsersToday = users.filter((user: any) => {
            const createdAt = user.createdAt || user.$createdAt ? new Date(user.createdAt || user.$createdAt) : new Date();
            return createdAt >= today;
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
        
          // Calculate active users and new users from the detailed data
          const users = usersResponse.documents || [];
          const thirtyDaysAgo = subDays(new Date(), 30);
          const today = startOfDay(new Date());
        
          // Use the same logic as UserManagement component for active users
          activeUsers = users.filter((user: any) => {
            // Check if user has accessed the system within the last 30 days
            const accessedAt = user.lastSignInAt ? new Date(user.lastSignInAt) : null;
            if (accessedAt) {
              return accessedAt > thirtyDaysAgo;
            }
            // Fallback to creation date if no accessedAt
            const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();
            return createdAt > thirtyDaysAgo;
          }).length;
        
          newUsersToday = users.filter((user: any) => {
            const createdAt = new Date(user.createdAt);
            return createdAt >= today;
          }).length;
        } catch (fallbackError) {
          console.error('Error fetching user count from Appwrite:', fallbackError);
        }
      }

      // Update metrics with the fetched data
      const updatedMetrics: MetricCard[] = [
        {
          id: 'total-users',
          title: 'Total Users',
          value: totalUsers,
          icon: Users,
          color: 'text-blue-500',
          description: 'All registered users',
          change: 12,
          changeType: 'increase'
        },
        {
          id: 'active-users',
          title: 'Active Users',
          value: activeUsers,
          icon: Activity,
          color: 'text-green-500',
          description: 'Users active in last 30 days',
          change: 8,
          changeType: 'increase'
        },
        {
          id: 'new-users-today',
          title: 'New Users Today',
          value: newUsersToday,
          icon: UserPlus,
          color: 'text-purple-500',
          description: 'Users registered today',
          change: 3,
          changeType: 'increase'
        },
        {
          id: 'system-health',
          title: 'System Health',
          value: '99.9%',
          icon: ShieldCheck,
          color: 'text-teal-500',
          description: 'Overall system uptime',
          change: 0.1,
          changeType: 'increase'
        }
      ];

      setMetrics(updatedMetrics);
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
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground text-sm">
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

      {/* Metrics Grid - Responsive for all screen sizes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.id} metric={metric} index={index} />
        ))}
      </div>

      {/* Charts Section - Fully responsive */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UserGrowthChart data={userGrowthData} />
        <ProductCategoriesChart data={productCategoryData} />
      </div>

      {/* Revenue and System Health - Responsive layout */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RevenueChart data={revenueData} />
        <SystemHealthCard systemHealth={systemHealth} />
      </div>
    </div>
  );
};

export default DashboardOverview;