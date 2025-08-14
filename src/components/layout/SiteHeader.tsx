import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useKit } from "@/context/kit-context";
import { useAuth } from "@/context/auth-context";
import { ShieldAlert } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import React from "react";

const navLinkClass = ({ isActive, mobile = false }: { isActive: boolean; mobile?: boolean }) =>
  `relative ${mobile ? 'px-5 py-4 text-lg font-semibold' : 'px-4 py-3 text-sm font-medium'} rounded-md flex items-center gap-2 transition-colors duration-150 active:scale-[0.94] active:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 overflow-visible ${isActive
    ? "bg-secondary text-secondary-foreground shadow-sm after:content-[''] after:absolute after:left-2 after:right-2 after:-bottom-1 after:h-0.5 after:bg-primary after:rounded-full"
    : "hover:bg-accent"
  }`;

const SiteHeader = () => {
  const { kitCount } = useKit();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = React.useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleProfileClick = () => {
    if (user) {
      navigate("/profile");
    } else {
      navigate("/login");
    }
  };

  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();

  // Close mobile sheet on route change (safety in case a Link inside triggers navigation without onClick handler)
  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-3 sm:px-4">
        <Link to="/" className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-md border-2 border-primary/20 shadow-md flex items-center justify-center bg-white overflow-hidden"
            aria-label="Athletic Training Supply Finder Logo"
          >
            <img src="/logo.svg" alt="Athletic Training Supplies Logo" className="h-10 w-10" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>AT Supply Finder</span>
            <span className="text-sm text-muted-foreground -mt-1">Athletic Training Supplies</span>
          </div>
        </Link>

        {/* Mobile Navigation */}
        {isMobile ? (
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu" className="active:scale-95">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[270px] sm:w-[320px] p-0 flex flex-col">
              <div className="px-4 pt-4 pb-3 border-b flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-md border-2 border-primary/20 overflow-hidden flex items-center justify-center bg-white"
                  aria-label="AT Supply Finder Logo"
                >
                  <img src="/logo.svg" alt="Athletic Training Supplies Logo" className="h-8 w-8" />
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
                    Build a Kit
                    {kitCount > 0 && (
                      <span className="ml-2 bg-primary text-primary-foreground text-[10px] rounded-full h-5 w-5 flex items-center justify-center">
                        {kitCount}
                      </span>
                    )}
                  </span>
                </NavLink>
                {/* Additional actions */}
                <div className="mt-4 pt-4 border-t flex flex-col gap-2">
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
                    onClick={() => setDarkMode(d => !d)}
                    className="justify-start"
                  >
                    Toggle Theme
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
                Build a Kit
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

        <div className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="hero" className="hidden md:flex">
            <Link to="/catalog">Browse</Link>
          </Button>
          <Button
            variant="outline"
            aria-label={user ? "User profile" : "Login"}
            onClick={handleProfileClick}
            className="px-3 sm:px-4"
          >
            {user ? "Profile" : "Login"}
          </Button>
          <Button
            variant="outline"
            aria-label="Toggle dark mode"
            onClick={() => setDarkMode((d) => !d)}
            className="px-3 sm:px-4"
          >
            {darkMode ? "🌙" : "☀️"}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
