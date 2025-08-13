import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useKit } from "@/context/kit-context";
import KitItem from "@/components/kit/KitItem";
import KitSummary from "@/components/kit/KitSummary";
import { products } from "@/lib/products";
import { useMemo } from "react";

const Build = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : "";
  const { kit, addToKit } = useKit();

  // Starter templates (could move to dedicated module if grows)
  const templates = [
    {
      id: 'basic-starter',
      name: 'Basic Tape Starter',
      description: 'Core tape & wrap essentials to get going.',
      items: [
        { id: '1', quantity: 1 }, // Mueller Athletic Tape
        { id: 'amazon-prewrap', quantity: 1 },
        { id: '2', quantity: 1 }, // Coban
      ],
    },
    {
      id: 'coverage-plus',
      name: 'Coverage + Support',
      description: 'Adds elastic + gauze for broader treatment.',
      items: [
        { id: '1', quantity: 1 },
        { id: '2', quantity: 1 },
        { id: '4', quantity: 1 },
        { id: '5', quantity: 1 },
      ],
    },
    {
      id: 'full-kit',
      name: 'Comprehensive Kit',
      description: 'A balanced set for most training room needs.',
      items: [
        { id: '1', quantity: 1 },
        { id: 'amazon-prewrap', quantity: 1 },
        { id: '2', quantity: 1 },
        { id: '3', quantity: 1 },
        { id: '4', quantity: 1 },
        { id: '5', quantity: 1 },
        { id: '6', quantity: 1 },
      ],
    },
  ];

  const grouped = useMemo(() => {
    const map = new Map<string, typeof kit>();
    kit.forEach(item => {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    });
    return Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b));
  }, [kit]);
  
  return (
  <main className="container mx-auto py-10 px-4 sm:px-6">
      <Helmet>
        <title>Build Your Kit | Wrap Wizard</title>
        <meta name="description" content="Select tapes, bandages and more to create your athletic training kit and compare prices across vendors." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Build your kit</h1>
        {kit.length > 0 && (
          <Button asChild variant="outline">
            <Link to="/catalog">Add More Items</Link>
          </Button>
        )}
      </div>
      
      {kit.length === 0 ? (
        <div className="py-10">
          <div className="text-center mb-8">
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Your kit is empty. Start fast with a template or add individual products from the catalog.
            </p>
            <Button asChild variant="hero" className="mb-6">
              <Link to="/catalog">Browse Catalog</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map(t => (
              <div key={t.id} className="border rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold mb-1">{t.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{t.description}</p>
                  <ul className="text-xs space-y-1 list-disc pl-4 mb-4">
                    {t.items.map(it => {
                      const p = products.find(p => p.id === it.id);
                      return <li key={it.id}>{p ? p.name : it.id}</li>;
                    })}
                  </ul>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    t.items.forEach(it => {
                      const p = products.find(p => p.id === it.id);
                      if (p) addToKit(p, it.quantity);
                    });
                  }}
                >
                  Add Template
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <ul className="space-y-8" aria-label="Kit items grouped by category">
            {grouped.map(([category, items]) => (
              <li key={category} className="space-y-4">
                <div className="sticky top-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 z-10 border-b">
                  <h2 className="text-lg font-semibold">{category}</h2>
                </div>
                <div className="space-y-4" role="list">
                  {items.map(item => <KitItem key={item.id} item={item} />)}
                </div>
              </li>
            ))}
          </ul>
          <KitSummary />
        </div>
      )}
    </main>
  );
};

export default Build;
