import { Helmet } from "react-helmet-async";
import ProductCard, { Product } from "@/components/products/ProductCard";

const mock: Product[] = [
  {
    id: "1",
    name: "Mueller Athletic Tape, 1.5in x 15yd (24 rolls)",
    category: "Athletic Tape",
    features: ["High tensile strength", "Hypoallergenic adhesive"],
    offers: [
      { name: "Amazon", url: "https://amazon.com", price: 39.99 },
      { name: "Rogue Fitness", url: "https://www.roguefitness.com", price: 42.0 },
    ],
  },
  {
    id: "2",
    name: "Coban Self-Adherent Wrap, 3in (12 rolls)",
    category: "Cohesive Bandage",
    features: ["No clips or tape needed", "Breathable"],
    offers: [
      { name: "Amazon", url: "https://amazon.com", price: 28.49 },
      { name: "Medline", url: "https://www.medline.com", price: 29.99 },
    ],
  },
  {
    id: "3",
    name: "KT Tape Pro, Kinesiology Tape (20 strips)",
    category: "Kinesiology Tape",
    features: ["Water-resistant", "Up to 7 days wear"],
    offers: [
      { name: "Amazon", url: "https://amazon.com", price: 17.99 },
      { name: "KT Tape", url: "https://kttape.com", price: 19.99 },
    ],
  },
];

const Catalog = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : "";
  return (
    <main className="container mx-auto py-10">
      <Helmet>
        <title>Catalog – Athletic Wraps & Bandages | Wrap Wizard</title>
        <meta name="description" content="Browse athletic tapes, bandages, and training supplies. Compare Amazon and vendor prices in one place." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <h1 className="text-3xl font-bold mb-6">Catalog</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mock.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </main>
  );
};

export default Catalog;
