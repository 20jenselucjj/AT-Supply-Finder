import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useCallback } from "react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

const Hero = () => {
  const handleMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--pointer-x", `${x}px`);
    el.style.setProperty("--pointer-y", `${y}px`);
  }, []);

  return (
    <section className="relative bg-gradient-to-b from-background to-secondary border-b border-border" onMouseMove={handleMove}>
      <div className="container mx-auto py-20 md:py-28 lg:py-36">
        <div className="mx-auto max-w-4xl text-center animate-fade-in">
          <span className="inline-flex items-center px-5 py-2.5 text-sm rounded-full bg-primary/15 text-primary border border-primary/30 mb-8 font-medium stagger-item shadow-sm hover:shadow-md hover:bg-primary/20 transition-all duration-300 transform hover:-translate-y-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
            Trusted by Medical Professionals
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight stagger-item" style={{ fontFamily: 'var(--font-heading)' }}>
            Build Your <span className="text-primary">First Aid Kit</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto stagger-item" style={{ fontFamily: 'var(--font-body)' }}>
            Find essential medical supplies for any emergency. Compare prices across <strong className="font-semibold">trusted vendors</strong> instantly and build your first aid kit with essential medical supplies at competitive prices.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm font-medium stagger-item">
            <div className="flex items-center gap-2 bg-secondary/80 px-4 py-2 rounded-full border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
              <span>Medical Grade Quality</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary/80 px-4 py-2 rounded-full border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
              <span>First Aid Expert Curated</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary/80 px-4 py-2 rounded-full border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
              <span>Competitive Pricing</span>
            </div>
          </div>
          <div className="mt-12 flex items-center justify-center gap-5 flex-wrap stagger-item">
            <Button asChild variant="default" size="lg" className="px-10 py-7 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl bg-gradient-to-r from-primary to-primary/90">
              <Link to="/build" className="flex items-center">
                Build Your Kit
                <ArrowRight className="ml-3 h-5 w-5 animate-pulse" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-10 py-7 text-lg font-medium border-2 hover:bg-primary/10 transition-all duration-300 transform hover:-translate-y-1 rounded-xl shadow-sm hover:shadow-md">
              <Link to="/catalog" className="flex items-center">Browse Supplies</Link>
            </Button>
          </div>

          <div className="mt-8 text-sm font-medium bg-secondary/80 px-6 py-3 rounded-full border border-border shadow-sm inline-block stagger-item">
            ⚡ <strong className="text-primary">Free to use</strong> • No signup required • <span className="text-primary">Instant price comparison</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;