import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Bandage, 
  Syringe, 
  Shield, 
  Thermometer, 
  Pill, 
  Package,
  Scissors,
  FileText
} from "lucide-react";

const categories = [
  {
    name: "Wound Care & Dressings",
    description: "Bandages, gauze, and dressings for wound treatment.",
    icon: Bandage,
    slug: "wound-care-dressings",
    priceFrom: "$9.99",
    popular: true,
  },
  {
    name: "Tapes & Wraps",
    description: "Medical tapes and elastic wraps for support and securing dressings.",
    icon: Package,
    slug: "tapes-wraps",
    priceFrom: "$7.99",
    popular: false,
  },
  {
    name: "Antiseptics & Ointments",
    description: "Cleaning solutions and ointments for wound care.",
    icon: Syringe,
    slug: "antiseptics-ointments",
    priceFrom: "$5.99",
    popular: true,
  },
  {
    name: "Pain & Symptom Relief",
    description: "Medications for pain and common symptoms.",
    icon: Pill,
    slug: "pain-relief",
    priceFrom: "$4.99",
    popular: false,
  },
  {
    name: "Instruments & Tools",
    description: "Essential tools for first aid treatment.",
    icon: Scissors,
    slug: "instruments-tools",
    priceFrom: "$12.99",
    popular: false,
  },
  {
    name: "Trauma & Emergency",
    description: "Supplies for emergency situations and serious injuries.",
    icon: Shield,
    slug: "trauma-emergency",
    priceFrom: "$15.99",
    popular: false,
  },
  {
    name: "Personal Protection Equipment (PPE)",
    description: "Gloves, masks, and sanitizers for protection.",
    icon: Shield,
    slug: "ppe",
    priceFrom: "$8.99",
    popular: true,
  },
  {
    name: "First Aid Information & Essentials",
    description: "Guides and essentials for first aid preparedness.",
    icon: FileText,
    slug: "information-essentials",
    priceFrom: "$3.99",
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