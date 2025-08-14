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

  const starterTemplates = [
    {
      id: 'basic-starter',
      name: 'Basic Tape Starter',
      description: 'Core tape & wrap essentials to get going.',
      products: [
        { id: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 },
        { id: '550e8400-e29b-41d4-a716-446655440001', quantity: 1 },
      ],
    },
    {
      id: 'coverage-plus',
      name: 'Coverage + Support',
      description: 'Adds elastic + gauze for broader treatment.',
      products: [
        { id: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 },
        { id: '550e8400-e29b-41d4-a716-446655440001', quantity: 1 },
        { id: '550e8400-e29b-41d4-a716-446655440002', quantity: 1 },
        { id: '550e8400-e29b-41d4-a716-446655440004', quantity: 1 },
      ],
    },
    {
      id: 'full-kit',
      name: 'Comprehensive Kit',
      description: 'A balanced set for most training room needs.',
      products: [
        { id: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 },
        { id: '550e8400-e29b-41d4-a716-446655440001', quantity: 1 },
        { id: '550e8400-e29b-41d4-a716-446655440002', quantity: 1 },
        { id: '550e8400-e29b-41d4-a716-446655440003', quantity: 1 },
        { id: '550e8400-e29b-41d4-a716-446655440004', quantity: 1 },
        { id: '550e8400-e29b-41d4-a716-446655440005', quantity: 1 },
      ],
    },
  ];

  const addTemplateToKit = (template: any) => {
    let addedCount = 0;
    template.products.forEach(({ id, quantity }: any) => {
      const product = products.find(p => p.id === id);
      if (product) {
        addToKit(product, quantity);
        addedCount++;
      }
    });
  };

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
        <title>Build Your Kit | AT Supply Finder</title>
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
            {starterTemplates.map(template => (
              <div key={template.id} className="border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <ul className="text-xs space-y-1 list-disc pl-4 mb-4">
                    {template.products.slice(0, 3).map(tp => {
                      const product = products.find(p => p.id === tp.id);
                      return (
                        <li key={tp.id}>
                          {tp.quantity}x {product ? product.name : `Product ${tp.id}`}
                        </li>
                      );
                    })}
                    {template.products.length > 3 && (
                      <li className="text-muted-foreground">...and {template.products.length - 3} more</li>
                    )}
                  </ul>
                </div>
                <Button 
                  onClick={() => addTemplateToKit(template)}
                  className="w-full"
                >
                  Add Template
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {grouped.map(([category, items]) => (
              <div key={category} className="space-y-3">
                <h2 className="text-lg font-semibold">{category}</h2>
                <div className="space-y-2">
                  {items.map(item => (
                    <KitItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <KitSummary />
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Build;
