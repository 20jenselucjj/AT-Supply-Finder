import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useKit } from "@/context/kit-context";
import { useAuth } from "@/context/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import React from "react";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-accent"
  }`;

const SiteHeader = () => {
  const { kitCount } = useKit();
  const { user } = useAuth();
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

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-3 sm:px-4">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/Gemini_Generated_Image_n24esqn24esqn24e.png"
            alt="Wrap Wizard Logo"
            className="h-12 w-12 rounded-md object-cover object-center bg-background border border-border shadow"
            style={{ objectFit: 'cover', objectPosition: 'center', background: '#fff' }}
            decoding="async"
          />
          <span className="text-lg font-semibold">Wrap Wizard</span>
        </Link>
        
        {/* Mobile Navigation */}
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 py-4" aria-label="Main">
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
                {/* Favorites removed */}
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
