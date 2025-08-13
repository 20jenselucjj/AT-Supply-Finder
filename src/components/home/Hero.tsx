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
    <section className="relative bg-hero" onMouseMove={handleMove}>
      <div className="container mx-auto py-20 md:py-28 lg:py-36">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.span
            className="inline-flex items-center px-4 py-2 text-sm rounded-full bg-primary/10 text-primary border border-primary/20 mb-6"
            variants={itemVariants}
          >
            🏆 Trusted by 10,000+ Athletes • Save 20-40%
          </motion.span>
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
            variants={itemVariants}
          >
            Stop Overpaying for <span className="text-primary">Athletic Supplies</span>
          </motion.h1>
          <motion.p
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Compare prices across <strong>Amazon and top vendors</strong> instantly. Build your perfect athletic kit and save hundreds on tape, bandages, and pre-wrap.
          </motion.p>
          
          <motion.div
            className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Price comparison</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Expert curated</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Free to use</span>
            </div>
          </motion.div>
          <motion.div
            className="mt-8 flex items-center justify-center gap-4 flex-wrap"
            variants={itemVariants}
          >
            <Button asChild variant="hero" size="lg" className="px-8 py-4 text-lg font-semibold">
              <Link to="/catalog">
                Start Saving Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 py-4 text-lg">
              <Link to="/build">Build Your Kit</Link>
            </Button>
          </motion.div>
          
          <motion.div
            className="mt-6 text-sm text-muted-foreground"
            variants={itemVariants}
          >
            ⚡ <strong>Free to use</strong> • No signup required • Instant price comparison
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
