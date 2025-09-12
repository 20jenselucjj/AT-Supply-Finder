import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Cross } from "lucide-react";
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
    <section 
      className="relative bg-gradient-to-b from-background to-secondary border-b border-border" 
      onMouseMove={handleMove}
    >
      <div className="container mx-auto py-8 md:py-12 lg:py-16">
        <div className="mx-auto max-w-4xl text-center animate-fade-in">

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight stagger-item text-foreground flex items-center justify-center gap-4" style={{ fontFamily: 'var(--font-heading)' }}>
            Build Your <span className="text-red-500 animate-pulse">First Aid Kit</span>
            <Cross className="h-12 w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 text-red-500 animate-pulse" />
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto stagger-item" style={{ fontFamily: 'var(--font-body)' }}>
            Compare medical supplies across <strong className="font-semibold">trusted vendors</strong> and build your first aid kit at competitive prices.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm font-medium stagger-item">
            <div className="flex items-center gap-2 bg-secondary/80 px-4 py-2 rounded-full border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
              <span>Quality Products</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary/80 px-4 py-2 rounded-full border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
              <span>Expert Curated</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary/80 px-4 py-2 rounded-full border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
              <span>Best Prices</span>
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


        </div>
          
          {/* Background Image positioned below text content */}
          <div className="mt-4 flex justify-center">
            <img 
              src="/background.png" 
              alt="Medical supplies background" 
              className="max-w-4xl w-full h-auto rounded-lg shadow-2xl stagger-item"
            />
          </div>
        </div>
      </section>
  );
};

export default Hero;