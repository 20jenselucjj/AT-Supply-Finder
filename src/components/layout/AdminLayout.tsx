import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
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
  ChevronDown
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
    badge: 'New'
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    href: '/admin/products'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/admin/analytics'
  },
  {
    id: 'templates',
    label: 'Starter Kits',
    icon: Wrench,
    href: '/admin/templates'
  },
  {
    id: 'system',
    label: 'System Settings',
    icon: Settings,
    href: '/admin/system'
  }
];

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

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
              "flex-1 justify-start gap-3 h-10 font-medium",
              isActive && "bg-transparent hover:bg-primary/5",
              collapsed && level === 0 && "px-2"
            )}
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
            <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-primary")} />
            {(!collapsed || level > 0) && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
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
                  "h-3 w-3 transition-transform duration-200",
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn("p-4 border-b border-border", collapsed && "px-2")}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg text-primary-foreground font-bold text-sm">
            W
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-sm">AT Supply Finder</h2>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {sidebarItems.map(item => renderSidebarItem(item))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className={cn("p-4 border-t border-border", collapsed && "px-2")}>
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback className="text-xs">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          )}
        </div>
        
        {!collapsed && (
          <div className="flex items-center gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                try {
                  await signOut();
                  navigate('/'); // Redirect to home after sign out
                } catch (error) {
                  console.error('Sign out error:', error);
                }
              }} 
              className="flex-1"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? '64px' : '280px' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col border-r border-border bg-card"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-80 p-0">
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
                <SheetContent side="left" className="w-80 p-0">
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

              {/* Breadcrumbs */}
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
              <NotificationsPanel />
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