import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Box, Scissors, Shield, Thermometer, Pill, Package } from "lucide-react";

const categories = [
  {
    name: "Wound Care",
    description: "Professional-grade bandages and dressings for superior wound protection.",
    icon: Box,
    slug: "wound-care",
    priceFrom: "$12.99",
    popular: true,
  },
  {
    name: "Burn Treatment",
    description: "Specialized gels and dressings for effective burn care.",
    icon: Thermometer,
    slug: "burn-treatment",
    priceFrom: "$15.99",
    popular: false,
  },
  {
    name: "General Supplies",
    description: "Essential first aid items for everyday emergencies.",
    icon: Package,
    slug: "general-supplies",
    priceFrom: "$8.99",
    popular: false,
  },
  {
    name: "Tools & Equipment",
    description: "Professional medical tools for accurate treatment.",
    icon: Scissors,
    slug: "tools-equipment",
    priceFrom: "$17.99",
    popular: true,
  },
  {
    name: "Medications",
    description: "Over-the-counter medications for common ailments.",
    icon: Pill,
    slug: "medications",
    priceFrom: "$9.99",
    popular: false,
  },
  {
    name: "Trauma Care",
    description: "Advanced supplies for serious injury management.",
    icon: Shield,
    slug: "trauma-care",
    priceFrom: "$24.99",
    popular: false,
  },
];

// Using custom CSS animations instead of Framer Motion

const CategoryGrid = () => {
  return (
    <div className="container mx-auto py-16 bg-gradient-to-br from-background to-secondary/70 rounded-xl border border-border shadow-md padding-container">
      <div className="max-w-2xl mb-12">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent inline-block" style={{ fontFamily: 'var(--font-heading)' }}>First Aid Categories</h2>
        <p className="text-muted-foreground mt-4" style={{ fontFamily: 'var(--font-body)' }}>
          Essential medical supplies organized by category for quick access.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
        {categories.map(({ name, description, icon: Icon, slug, priceFrom, popular }) => (
          <Link to={`/catalog?cat=${slug}`} key={name}>
            <div className="h-full relative pro-card animate-scale">
              {popular && (
                <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-xs px-4 py-1.5 rounded-full z-10 font-medium shadow-md border border-primary/30 animate-pulse">
                  ★ Popular
                </div>
              )}
              <Card className="p-6 h-full border border-border hover:border-primary/30 transition-all duration-300 bg-gradient-to-br from-background to-secondary/50 hover:shadow-md transform hover:-translate-y-1">
                <div className="flex items-start gap-5">
                  <div
                    className="p-4 rounded-lg shadow-sm flex items-center justify-center"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Icon className="text-primary-foreground h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {description}
                    </p>
                    <div className="text-sm font-semibold text-primary bg-primary/10 inline-block px-3 py-1 rounded-full">
                      From {priceFrom}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;