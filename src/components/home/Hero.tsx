import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useCallback } from "react";

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
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center px-3 py-1 text-xs rounded-full border mb-4">
            Compare • Build • Save
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Build your perfect athletic wrap and bandage kit
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Compare prices across Amazon and top vendors. Mix and match bandages, tape, pre-wrap and more—without spreadsheets.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild variant="hero">
              <Link to="/catalog">
                Start browsing
                <ArrowRight className="ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/build">Build a kit</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
