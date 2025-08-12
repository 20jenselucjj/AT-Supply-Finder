import { Helmet } from "react-helmet-async";
import { ProductTable } from "@/components/products/ProductTable";
import { Product } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useKit } from "@/context/kit-context";

const mock: Product[] = [
  {
    id: "amazon-prewrap",
    name: "OK TAPE Pre Wrap Tape (4-Rolls, 120 Yards)",
    category: "Pre-wrap",
    features: [
      "4 rolls, 120 yards total",
      "Non-adhesive, high quality PU foam",
      "Breathable, stretchable, comfortable",
      "Protects skin, can be used as hair band"
    ],
    offers: [
      { name: "Amazon", url: "https://amzn.to/3HrnKMh", price: 11.99 }
    ],
    imageUrl: "https://m.media-amazon.com/images/I/81MKOjzOdxL._AC_SX425_PIbundle-4,TopRight,0,0_SH20_.jpg"
  },
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
  const [params, setParams] = useSearchParams();
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const asins = mock.map((p) => p.id).join(",");
    if (asins) {
      fetch(`/api/amazon-pricing?asins=${asins}`)
        .then((res) => res.json())
        .then((data) => setPrices(data))
        .catch(console.error);
    }
  }, []);

  const q = params.get("q") || "";
  const cat = params.get("cat") || "all";
  const sort = params.get("sort") || "relevance"; // relevance | price-asc | price-desc | name-asc

  const categories = useMemo(() => {
    const set = new Set<string>(mock.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    let items = mock.filter((p) =>
      (!term ||
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.features || []).some((f) => f.toLowerCase().includes(term))) &&
      (cat === "all" || p.category === cat)
    );

    const getBestPrice = (p: Product) => p.offers.slice().sort((a, b) => a.price - b.price)[0]?.price ?? Infinity;

    switch (sort) {
      case "price-asc":
        items = items.slice().sort((a, b) => getBestPrice(a) - getBestPrice(b));
        break;
      case "price-desc":
        items = items.slice().sort((a, b) => getBestPrice(b) - getBestPrice(a));
        break;
      case "name-asc":
        items = items.slice().sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // relevance: keep current order (mock order) for now
        break;
    }
    return items;
  }, [q, cat, sort]);

  const { kitCount } = useKit();
  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    // reset page param if we add pagination later
    setParams(next, { replace: true });
  };

  return (
    <main className="container mx-auto py-10">
      <Helmet>
        <title>Catalog – Athletic Wraps & Bandages | Wrap Wizard</title>
        <meta name="description" content="Browse athletic tapes, bandages, and training supplies. Compare Amazon and vendor prices in one place." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Athletic Wraps & Bandages Catalog</h1>
        {kitCount > 0 && (
          <Button asChild variant="hero">
            <Link to="/build">View Kit ({kitCount})</Link>
          </Button>
        )}
      </div>

      <section className="mb-6">
        <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
          <div className="md:col-span-2">
            <label htmlFor="catalog-search" className="sr-only">
              Search products
            </label>
            <Input
              id="catalog-search"
              placeholder="Search tapes, bandages, brands..."
              value={q}
              onChange={(e) => updateParam("q", e.currentTarget.value)}
              aria-label="Search products"
            />
          </div>
          <div>
            <label htmlFor="catalog-sort" className="sr-only">
              Sort products
            </label>
            <select
              id="catalog-sort"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={sort}
              onChange={(e) => updateParam("sort", e.currentTarget.value)}
              aria-label="Sort products"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" aria-label="Filter by category">
          {categories.map((c) => (
            <Button
              key={c}
              variant={c === cat ? "secondary" : "outline"}
              size="sm"
              onClick={() => updateParam("cat", c === "all" ? "" : c)}
              aria-pressed={c === cat}
              aria-label={`Filter by ${c}`}
              className="flex-1 min-w-[80px] md:flex-none"
            >
              {c}
            </Button>
          ))}
          <div className="w-full text-sm text-muted-foreground text-center mt-2 md:w-auto md:text-left md:ml-auto md:self-center md:mt-0">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No products match your filters. Try clearing filters or adjusting your search.</p>
      ) : (
        <ProductTable products={filtered} />
      )}
    </main>
  );
};

export default Catalog;
