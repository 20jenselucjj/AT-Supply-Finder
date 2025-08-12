import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useKit } from "@/context/kit-context";
import { useAuth } from "@/context/auth-context";
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

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md" style={{ background: "var(--gradient-primary)" }} />
          <span className="text-lg font-semibold">Wrap Wizard</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1" aria-label="Main">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/catalog" className={navLinkClass}>
            Catalog
          </NavLink>
          <NavLink to="/build" className={navLinkClass}>
            Build a Kit {kitCount > 0 && <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">{kitCount}</span>}
          </NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="hero">
            <Link to="/catalog">Start Browsing</Link>
          </Button>
          <Button
            variant="outline"
            aria-label={user ? "User profile" : "Login"}
            onClick={handleProfileClick}
          >
            {user ? "Profile" : "Login"}
          </Button>
          <Button
            variant="outline"
            aria-label="Toggle dark mode"
            onClick={() => setDarkMode((d) => !d)}
          >
            {darkMode ? "🌙" : "☀️"}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
