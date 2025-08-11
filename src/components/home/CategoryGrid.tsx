import { Card } from "@/components/ui/card";
import { Box, Scissors, Shield, Thermometer, Pill, Package } from "lucide-react";

const categories = [
  {
    name: "Athletic Tape",
    description: "Zinc-oxide and cohesive tapes for secure support.",
    icon: Box,
  },
  {
    name: "Pre-wrap",
    description: "Comfort layer to protect skin under tape.",
    icon: Package,
  },
  {
    name: "Elastic Bandages",
    description: "Compression wraps in multiple widths.",
    icon: Shield,
  },
  {
    name: "Kinesiology Tape",
    description: "Flexible support for movement and recovery.",
    icon: Scissors,
  },
  {
    name: "Cold & Hot Therapy",
    description: "Ice packs, heat packs, and sleeves.",
    icon: Thermometer,
  },
  {
    name: "First Aid",
    description: "Pads, gauze, antiseptics, scissors, and more.",
    icon: Pill,
  },
];

const CategoryGrid = () => {
  return (
    <section className="container mx-auto py-12" id="how-it-works">
      <div className="max-w-2xl mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold">Shop by category</h2>
        <p className="text-muted-foreground mt-2">
          We organize the essentials for trainers and athletes so you can build a kit fast.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(({ name, description, icon: Icon }) => (
          <Card key={name} className="p-5 glass transition-transform hover:-translate-y-0.5">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-md border" style={{ background: "var(--gradient-primary)" }}>
                <Icon className="text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-medium">{name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
