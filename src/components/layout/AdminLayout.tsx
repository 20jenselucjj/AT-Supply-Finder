import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { logger } from '@/lib/logger';
import { useRBAC } from '@/hooks/use-rbac';
import {
  LayoutDashboard,
  Users,
  Package,
  BarChart3,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  Database,
  FileText,
  LogOut,
  Moon,
  Sun,
  Wrench,
  ChevronDown,
  Search,
  Bell,
  HelpCircle,
  UserCog,
  Home,
  ShoppingCart,
  FileBarChart,
  CreditCard,
  Mail,
  MapPin,
  Tag,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { NotificationsPanel } from '@/components/admin/NotificationsPanel';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children?: SidebarItem[];
  requiredRole?: 'user' | 'editor' | 'admin';
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin/dashboard'
  },
  {
    id: 'users',
    label: 'User Management',
    icon: Users,
    href: '/admin/users',
    badge: 'New',
    requiredRole: 'admin'
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    href: '/admin/products',
    requiredRole: 'editor'
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingCart,
    href: '/admin/orders',
    requiredRole: 'editor'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
    requiredRole: 'editor'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileBarChart,
    href: '/admin/reports',
    requiredRole: 'editor'
  },
  {
    id: 'templates',
    label: 'Starter Kits',
    icon: Wrench,
    href: '/admin/templates',
    requiredRole: 'editor'
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Mail,
    href: '/admin/marketing',
    requiredRole: 'editor'
  },
  {
    id: 'system',
    label: 'System Settings',
    icon: Settings,
    href: '/admin/system',
    requiredRole: 'admin'
  }
];

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { userRole, loading: rbacLoading } = useRBAC();
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page
      navigate(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  }, [searchQuery, navigate]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const filterSidebarItemsByRole = (items: SidebarItem[]): SidebarItem[] => {
    if (rbacLoading || !userRole) return [];
    
    return items.filter(item => {
      // If no role requirement, show to all authenticated users
      if (!item.requiredRole) return true;
      
      // Admins see everything
      if (userRole === 'admin') return true;
      
      // Editors see editor and user items
      if (userRole === 'editor') {
        return item.requiredRole === 'editor' || item.requiredRole === 'user';
      }
      
      // Users only see user items
      return item.requiredRole === 'user';
    }).map(item => {
      // Also filter children if they exist
      if (item.children) {
        return {
          ...item,
          children: filterSidebarItemsByRole(item.children)
        };
      }
      return item;
    });
  };

  const filteredSidebarItems = filterSidebarItemsByRole(sidebarItems);

  const renderSidebarItem = (item: SidebarItem, level: number = 0) => {
    const isActive = location.pathname === item.href;
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex items-center rounded-lg transition-all duration-200 relative group",
            level > 0 ? "ml-4 pl-4 border-l border-border" : "",
            isActive 
              ? "bg-primary/10 text-primary border-r-2 border-r-primary" 
              : "hover:bg-accent hover:text-accent-foreground",
            collapsed && level === 0 ? "justify-center" : "justify-between"
          )}
        >
          <Button
            variant="ghost"
            size={collapsed && level === 0 ? "icon" : "sm"}
            className={cn(
              "flex-1 justify-start gap-3 h-10 font-medium dark:text-white",
              isActive && "bg-transparent hover:bg-primary/5",
              collapsed && level === 0 && "px-2"
            )}
            title={collapsed && level === 0 ? item.label : undefined}
            onClick={() => {
              if (item.href) {
                console.log('Navigating to:', item.href);
                navigate(item.href);
                setMobileOpen(false);
              } else if (hasChildren) {
                console.log('Toggling dropdown for item without href:', item.id);
                toggleExpanded(item.id);
              }
            }}
          >
            <item.icon className={cn("h-4 w-4 flex-shrink-0 dark:text-white", isActive && "text-primary")} />
            {(!collapsed || level > 0) && (
              <>
                <span className="flex-1 text-left text-foreground dark:text-white">{item.label}</span>
                {item.badge && (
                  <Badge variant={item.badgeVariant || "secondary"} className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Button>
          
          {hasChildren && (!collapsed || level > 0) && (
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 mr-2 flex-shrink-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Chevron clicked for:', item.id);
                toggleExpanded(item.id);
              }}
            >
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform duration-200 text-foreground dark:text-white",
                  isExpanded && "rotate-180"
                )}
              />
            </Button>
          )}
        </motion.div>

        {/* Children */}
        <AnimatePresence>
          {hasChildren && isExpanded && (!collapsed || level > 0) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1">
                {item.children?.map(child => renderSidebarItem(child, level + 1))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Admin', href: '/admin' }];

    pathSegments.slice(1).forEach((segment, index) => {
      const href = `/admin/${pathSegments.slice(1, index + 2).join('/')}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ label, href });
    });

    return breadcrumbs;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      {/* Header */}
      <div className={cn("p-4 border-b border-border", collapsed && "px-2")}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg text-primary-foreground font-bold text-sm">
            W
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-sm text-foreground">AT Supply Finder</h2>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Loading state for RBAC */}
      {rbacLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : (
        /* Navigation */
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-2">
            {filteredSidebarItems.map(item => renderSidebarItem(item))}
          </nav>
        </ScrollArea>
      )}
      
      {/* Quick Actions - Improved for all sizes and themes */}
      <div className="px-3 pb-4">
        <Separator className="mb-3" />
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 text-foreground hover:text-foreground dark:text-white" 
            size="sm"
            title={collapsed ? "Import Data" : undefined}
          >
            <Upload className="h-4 w-4 dark:text-white" />
            <span className={collapsed ? "hidden" : "inline"}>Import Data</span>
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 text-foreground hover:text-foreground dark:text-white" 
            size="sm"
            title={collapsed ? "Export Data" : undefined}
          >
            <Download className="h-4 w-4 dark:text-white" />
            <span className={collapsed ? "hidden" : "inline"}>Export Data</span>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className={cn("p-4 border-t border-border", collapsed && "px-2")}>
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback className="text-xs text-foreground">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          )}
        </div>
        
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleTheme} className="flex-1 text-foreground">
              {theme === 'dark' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
              <span className="ml-2">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                try {
                  // Log the sign out action
                  await logger.auditLog({
                    action: 'ADMIN_SIGN_OUT',
                    entity_type: 'USER',
                    details: {
                      email: user?.email
                    }
                  });
                  
                  await signOut();
                  navigate('/'); // Redirect to home after sign out
                } catch (error) {
                  console.error('Sign out error:', error);
                }
              }} 
              className="flex-1 text-foreground"
            >
              <LogOut className="h-3 w-3" />
              <span className="ml-2">Sign Out</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - Improved responsive classes */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? '64px' : '280px' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col border-r border-border bg-card text-card-foreground"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-80 p-0 bg-card text-card-foreground">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0 bg-card text-card-foreground">
                  <SidebarContent />
                </SheetContent>
              </Sheet>

              {/* Desktop Collapse Button */}
              <Button
                variant="outline"
                size="icon"
                className="hidden lg:flex"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>

              {/* Breadcrumbs - Improved responsive behavior */}
              <Breadcrumb className="hidden md:flex">
                <BreadcrumbList>
                  {generateBreadcrumbs().map((crumb, index, array) => (
                    <React.Fragment key={crumb.href}>
                      <BreadcrumbItem>
                        {index === array.length - 1 ? (
                          <BreadcrumbPage className="font-medium">{crumb.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={crumb.href} className="text-muted-foreground hover:text-foreground">
                            {crumb.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < array.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative hidden md:block">
                <div className={`relative transition-all duration-300 ${isSearchFocused ? 'w-64' : 'w-40'}`}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    className="pl-9 pr-4 w-full"
                  />
                </div>
              </form>
              
              <Button variant="ghost" size="icon">
                <HelpCircle className="h-4 w-4" />
              </Button>
              <NotificationsPanel />
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;