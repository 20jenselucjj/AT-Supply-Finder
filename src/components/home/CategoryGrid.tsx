import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Box, Scissors, Shield, Thermometer, Pill, Package } from "lucide-react";

const categories = [
  {
    name: "Athletic Tape",
    description: "Professional-grade zinc oxide tapes. Compare prices from $24.99.",
    icon: Box,
    slug: "athletic-tape",
    priceFrom: "$24.99",
    popular: true,
  },
  {
    name: "Pre-wrap",
    description: "Protective foam underwrap. Save up to 30% vs retail.",
    icon: Package,
    slug: "pre-wrap",
    priceFrom: "$11.99",
    popular: false,
  },
  {
    name: "Elastic Bandages",
    description: "Compression wraps in all sizes. Best deals guaranteed.",
    icon: Shield,
    slug: "elastic-bandages",
    priceFrom: "$15.99",
    popular: false,
  },
  {
    name: "Kinesiology Tape",
    description: "Flexible therapeutic tape. Compare top brands instantly.",
    icon: Scissors,
    slug: "kinesiology-tape",
    priceFrom: "$17.99",
    popular: true,
  },
  {
    name: "Cold & Hot Therapy",
    description: "Recovery essentials. Find the lowest prices here.",
    icon: Thermometer,
    slug: "cold-hot-therapy",
    priceFrom: "$8.99",
    popular: false,
  },
  {
    name: "First Aid",
    description: "Complete medical supplies. Bulk pricing available.",
    icon: Pill,
    slug: "first-aid",
    priceFrom: "$12.99",
    popular: false,
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
        <h2 className="text-2xl md:text-3xl font-semibold">Shop by Category</h2>
        <p className="text-muted-foreground mt-2">
          Professional athletic supplies organized by category. Compare prices and save on every order.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map(({ name, description, icon: Icon, slug, priceFrom, popular }) => (
          <Link to={`/catalog?cat=${slug}`} key={name}>
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              whileTap="tap"
              className="h-full relative"
            >
              {popular && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full z-10">
                  Popular
                </div>
              )}
              <Card className="p-5 glass h-full">
                <div className="flex items-start gap-4">
                  <div
                    className="p-2 rounded-md border"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Icon className="text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-2">
                      {description}
                    </p>
                    <div className="text-sm font-semibold text-primary">
                      From {priceFrom}
                    </div>
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