import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useKit } from "@/context/kit-context";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";
import { ShieldAlert } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Sun, Moon } from "lucide-react";
import React from "react";

const navLinkClass = ({ isActive, mobile = false }: { isActive: boolean; mobile?: boolean }) =>
  `relative ${mobile ? 'px-4 xs:px-5 py-3 xs:py-4 text-base xs:text-lg font-semibold' : 'px-2 md:px-3 lg:px-4 py-2 md:py-3 text-xs md:text-sm font-medium'} rounded-md flex items-center gap-1 md:gap-2 transition-colors duration-150 active:scale-[0.94] active:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 overflow-visible ${isActive
    ? "bg-secondary text-secondary-foreground shadow-sm after:content-[''] after:absolute after:left-2 after:right-2 after:-bottom-1 after:h-0.5 after:bg-primary after:rounded-full"
    : "hover:bg-accent"
  }`;

const SiteHeader = () => {
  const { kitCount } = useKit();
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();

  // Close mobile sheet on route change (safety in case a Link inside triggers navigation without onClick handler)
  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleProfileClick = () => {
    if (user) {
      navigate("/profile");
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex h-16 xs:h-18 sm:h-20 items-center justify-between px-2 xs:px-3 sm:px-4">
        <Link to="/" className="flex items-center gap-2 xs:gap-3">
          <div
            className="h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 rounded-md border-2 border-primary/20 shadow-md flex items-center justify-center bg-background overflow-hidden"
            aria-label="AT Supply Finder Logo"
          >
            <img src="/logo.png" alt="AT Supply Finder Logo" className="h-6 w-6 xs:h-8 xs:w-8 sm:h-10 sm:w-10" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm xs:text-base sm:text-lg font-bold text-primary leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>AT Supply Finder</span>
          </div>
        </Link>

        {/* Mobile Navigation */}
        {isMobile ? (
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Open menu" className="active:scale-95 h-8 w-8 xs:h-9 xs:w-9 p-0">
                <Menu className="h-4 w-4 xs:h-5 xs:w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[270px] sm:w-[320px] p-0 flex flex-col">
              <div className="px-4 pt-4 pb-3 border-b border-border flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-md border-2 border-primary/20 overflow-hidden flex items-center justify-center bg-background"
                  aria-label="AT Supply Finder Logo"
                >
                  <img src="/logo.png" alt="AT Supply Finder Logo" className="h-8 w-8" />
                </div>
                <span className="font-semibold tracking-tight">AT Supply Finder</span>
              </div>
              <nav className="flex flex-col gap-1 py-4 px-3 overflow-y-auto flex-1" aria-label="Main">
                <NavLink to="/" className={(props) => navLinkClass({ ...props, mobile: true })} end onClick={() => setMobileOpen(false)}>
                  Home
                </NavLink>
                <NavLink to="/catalog" className={(props) => navLinkClass({ ...props, mobile: true })} onClick={() => setMobileOpen(false)}>
                  Catalog
                </NavLink>
                <NavLink to="/build" className={(props) => navLinkClass({ ...props, mobile: true })} onClick={() => setMobileOpen(false)}>
                  <span className="inline-flex items-center">
                    Build Your Kit
                    {kitCount > 0 && (
                      <span className="ml-2 bg-primary text-primary-foreground text-[10px] rounded-full h-5 w-5 flex items-center justify-center">
                        {kitCount}
                      </span>
                    )}
                  </span>
                </NavLink>
                {/* Additional actions */}
                <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => { handleProfileClick(); setMobileOpen(false); }}
                    className="justify-start"
                  >
                    {user ? 'Profile' : 'Login'}
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      asChild
                      className="justify-start"
                    >
                      <Link to="/admin" onClick={() => setMobileOpen(false)}>
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={toggleTheme}
                    className="justify-start"
                  >
                    {isDark ? (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        Dark Mode
                      </>
                    )}
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        ) : (
          <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>
            <NavLink to="/catalog" className={navLinkClass}>
              Catalog
            </NavLink>
            <NavLink to="/build" className={navLinkClass}>
              <span className="inline-flex items-center">
                Build Your Kit
                {kitCount > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {kitCount}
                  </span>
                )}
              </span>
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                <span className="inline-flex items-center">
                  <ShieldAlert className="mr-1 h-4 w-4" />
                  Admin
                </span>
              </NavLink>
            )}
            {/* Favorites removed */}
          </nav>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="default"
            aria-label={user ? "User profile" : "Login"}
            onClick={handleProfileClick}
            className="px-4 sm:px-5 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {user ? "Profile" : "Login"}
          </Button>
          <Button
            variant="secondary"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
            className="px-4 sm:px-5 bg-secondary hover:bg-secondary/80"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;