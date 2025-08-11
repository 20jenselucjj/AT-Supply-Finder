import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-accent"
  }`;

const SiteHeader = () => {
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
            Build a Kit
          </NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <a href="#how-it-works">How it works</a>
          </Button>
          <Button asChild variant="hero">
            <Link to="/catalog">Start Browsing</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
