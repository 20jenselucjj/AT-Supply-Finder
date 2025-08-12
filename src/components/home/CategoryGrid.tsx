import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Box, Scissors, Shield, Thermometer, Pill, Package } from "lucide-react";

const categories = [
  {
    name: "Athletic Tape",
    description: "Zinc-oxide and cohesive tapes for secure support.",
    icon: Box,
    slug: "athletic-tape",
  },
  {
    name: "Pre-wrap",
    description: "Comfort layer to protect skin under tape.",
    icon: Package,
    slug: "pre-wrap",
  },
  {
    name: "Elastic Bandages",
    description: "Compression wraps in multiple widths.",
    icon: Shield,
    slug: "elastic-bandages",
  },
  {
    name: "Kinesiology Tape",
    description: "Flexible support for movement and recovery.",
    icon: Scissors,
    slug: "kinesiology-tape",
  },
  {
    name: "Cold & Hot Therapy",
    description: "Ice packs, heat packs, and sleeves.",
    icon: Thermometer,
    slug: "cold-hot-therapy",
  },
  {
    name: "First Aid",
    description: "Pads, gauze, antiseptics, scissors, and more.",
    icon: Pill,
    slug: "first-aid",
  },
];

const cardVariants = {
  hover: {
    scale: 1.05,
    boxShadow: "0px 10px 20px rgba(0,0,0,0.1)",
    y: -5,
  },
  tap: {
    scale: 0.95,
  },
};

const CategoryGrid = () => {
  return (
    <div className="container mx-auto py-12">
      <div className="max-w-2xl mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold">Shop by category</h2>
        <p className="text-muted-foreground mt-2">
          We organize the essentials for trainers and athletes so you can build a kit fast.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map(({ name, description, icon: Icon, slug }) => (
          <Link to={`/catalog?cat=${slug}`} key={name}>
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              whileTap="tap"
              className="h-full"
            >
              <Card className="p-5 glass h-full">
                <div className="flex items-start gap-4">
                  <div
                    className="p-2 rounded-md border"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Icon className="text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium">{name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;