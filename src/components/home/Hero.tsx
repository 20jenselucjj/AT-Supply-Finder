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
      ease: "easeOut",
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
      <div className="container mx-auto py-20 md:py-28">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.span
            className="inline-flex items-center px-3 py-1 text-xs rounded-full border mb-4"
            variants={itemVariants}
          >
            Compare • Build • Save
          </motion.span>
          <motion.h1
            className="text-4xl md:text-5xl font-bold tracking-tight"
            variants={itemVariants}
          >
            Build your perfect athletic wrap and bandage kit
          </motion.h1>
          <motion.p
            className="mt-4 text-lg text-muted-foreground"
            variants={itemVariants}
          >
            Compare prices across Amazon and top vendors. Mix and match
            bandages, tape, pre-wrap and more—without spreadsheets.
          </motion.p>
          <motion.div
            className="mt-8 flex items-center justify-center gap-3"
            variants={itemVariants}
          >
            <Button asChild variant="hero">
              <Link to="/catalog">
                Start browsing
                <ArrowRight className="ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/build">Build a kit</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
