import { Product } from "./types";

// Centralized product list so multiple pages (Catalog, Build, templates) can share consistent product data.
// In a future iteration this can be replaced by a fetch from an API / database layer.
export const products: Product[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "OK TAPE Pre Wrap Tape (4-Rolls, 120 Yards)",
    category: "Pre-wrap",
    brand: "OK TAPE",
    rating: 4.1,
    dimensions: "2.75in x 30yd",
    weight: "1.2 lbs",
    material: "Polyurethane foam",
    features: [
      "4 rolls, 120 yards total",
      "Non-adhesive, high quality PU foam",
      "Breathable, stretchable, comfortable",
      "Protects skin, can be used as hair band"
    ],
    offers: [
      { name: "Amazon", url: "https://amzn.to/3HrnKMh", price: 11.99, lastUpdated: "2024-01-15T00:00:00Z" }
    ],
    imageUrl: "https://m.media-amazon.com/images/I/81MKOjzOdxL._AC_SX425_PIbundle-4,TopRight,0,0_SH20_.jpg"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Mueller Athletic Tape, 1.5in x 15yd (24 rolls)",
    category: "Athletic Tape",
    brand: "Mueller",
    rating: 4.5,
    dimensions: "1.5in x 15yd",
    weight: "3.2 lbs",
    material: "Cotton blend with zinc oxide adhesive",
    features: ["High tensile strength", "Hypoallergenic adhesive"],
    offers: [
      { name: "Amazon", url: "https://amzn.to/45u2duf", price: 39.99, lastUpdated: "2024-01-15T00:00:00Z" },
      { name: "Rogue Fitness", url: "https://www.roguefitness.com", price: 42.0, lastUpdated: "2024-01-15T00:00:00Z" },
    ],
    imageUrl: "https://m.media-amazon.com/images/I/81iDFKQWgZL.__AC_SY300_SX300_QL70_ML2_.jpg"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    name: "Coban Self-Adherent Wrap, 3in (12 rolls)",
    category: "Cohesive Bandage",
    brand: "3M Coban",
    rating: 4.6,
    dimensions: "3in x 5yd",
    weight: "2.1 lbs",
    material: "Non-woven elastic material",
    features: ["No clips or tape needed", "Breathable"],
    offers: [
      { name: "Amazon", url: "https://amzn.to/3UnMY10", price: 28.49, lastUpdated: "2024-01-15T00:00:00Z" },
      { name: "Medline", url: "https://www.medline.com", price: 29.99, lastUpdated: "2024-01-15T00:00:00Z" },
    ],
    imageUrl: "https://m.media-amazon.com/images/I/61TiQ6HBFAL.__AC_SX300_SY300_QL70_ML2_.jpg"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    name: "KT Tape Pro, Kinesiology Tape (20 strips)",
    category: "Kinesiology Tape",
    brand: "KT Tape",
    rating: 4.3,
    dimensions: "2in x 10in strips",
    weight: "0.3 lbs",
    material: "100% synthetic fabric with acrylic adhesive",
    features: ["Water-resistant", "Up to 7 days wear"],
    offers: [
      { name: "Amazon", url: "https://amzn.to/4mgh4jn", price: 17.99, lastUpdated: "2024-01-15T00:00:00Z" },
      { name: "KT Tape", url: "https://kttape.com", price: 19.99, lastUpdated: "2024-01-15T00:00:00Z" },
    ],
    imageUrl: "https://picsum.photos/400/400?random=4"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    name: "Elastic Bandage Wrap, 4in x 5yd (6 rolls)",
    category: "Elastic Bandage",
    brand: "ACE",
    rating: 4.2,
    dimensions: "4in x 5yd",
    weight: "1.8 lbs",
    material: "Cotton and polyester blend",
    features: ["Provides compression", "Reusable", "Latex-free"],
    offers: [
      { name: "Amazon", url: "https://amzn.to/41I8xgC", price: 15.99, lastUpdated: "2024-01-15T00:00:00Z" },
      { name: "CVS", url: "https://cvs.com", price: 18.49, lastUpdated: "2024-01-15T00:00:00Z" },
    ],
    imageUrl: "https://picsum.photos/400/400?random=5"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440005",
    name: "Medical Gauze Pads, 4x4in (100 count)",
    category: "Gauze",
    brand: "Johnson & Johnson",
    rating: 4.8,
    dimensions: "4in x 4in",
    weight: "0.8 lbs",
    material: "100% cotton gauze",
    features: ["Sterile", "Absorbent", "Non-adherent"],
    offers: [
      { name: "Amazon", url: "https://amzn.to/4myiFRP", price: 12.99, lastUpdated: "2024-01-15T00:00:00Z" },
      { name: "Walgreens", url: "https://walgreens.com", price: 14.99, lastUpdated: "2024-01-15T00:00:00Z" },
    ],
    imageUrl: "https://picsum.photos/400/400?random=6"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440006",
    name: "Foam Padding Tape, 2in x 30yd",
    category: "Padding",
    brand: "Mueller",
    rating: 4.1,
    dimensions: "2in x 30yd",
    weight: "0.6 lbs",
    material: "Polyurethane foam with adhesive backing",
    features: ["Extra cushioning", "Tear-resistant", "Easy application"],
    offers: [
      { name: "Amazon", url: "https://amazon.com", price: 8.99, lastUpdated: "2024-01-15T00:00:00Z" },
      { name: "Dick's Sporting Goods", url: "https://dickssportinggoods.com", price: 9.99, lastUpdated: "2024-01-15T00:00:00Z" },
    ],
    imageUrl: "https://picsum.photos/400/400?random=7"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440007",
    name: "Zinc Oxide Tape, 1in x 15yd (12 rolls)",
    category: "Athletic Tape",
    brand: "Cramer",
    rating: 4.5,
    dimensions: "1in x 15yd",
    weight: "2.4 lbs",
    material: "Cotton cloth with zinc oxide adhesive",
    features: ["Superior adhesion", "Rigid support", "Professional grade"],
    offers: [
      { name: "Amazon", url: "https://amazon.com", price: 24.99, lastUpdated: "2024-01-15T00:00:00Z" },
      { name: "Cramer", url: "https://cramersportsmed.com", price: 26.99, lastUpdated: "2024-01-15T00:00:00Z" },
    ],
    imageUrl: "https://picsum.photos/400/400?random=8"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440008",
    name: "Self-Stick Bandage Wrap, 2in (12 rolls)",
    category: "Cohesive Bandage",
    brand: "3M",
    rating: 4.4,
    dimensions: "2in x 5yd",
    weight: "1.5 lbs",
    material: "Non-woven cohesive material",
    features: ["Self-adherent", "Breathable", "Multiple colors"],
    offers: [
      { name: "Amazon", url: "https://amazon.com", price: 19.99, lastUpdated: "2024-01-15T00:00:00Z" },
      { name: "3M", url: "https://3m.com", price: 21.99, lastUpdated: "2024-01-15T00:00:00Z" },
    ],
    imageUrl: "https://picsum.photos/400/400?random=9"
  },
];

export const getProductById = (id: string) => products.find(p => p.id === id);
