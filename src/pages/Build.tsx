import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useKit } from "@/context/kit-context";
import KitItem from "@/components/kit/KitItem";
import KitSummary from "@/components/kit/KitSummary";
import ATSupplyCategories from "@/components/kit/ATSupplyCategories";
import CategoryProductSelector from "@/components/kit/CategoryProductSelector";
import { useMemo, useState } from "react";
import { Product } from "@/lib/types";

type ViewMode = 'categories' | 'category-products';

const Build = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : "";
  const { kit } = useKit();
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setViewMode('category-products');
  };

  const handleBackToCategories = () => {
    setViewMode('categories');
    setSelectedCategoryId('');
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
    <main className="container mx-auto py-6 xs:py-8 sm:py-10 px-3 xs:px-4 sm:px-6">
      <Helmet>
        <title>AT Supply Finder</title>
        <meta name="description" content="Select tapes, bandages and more to create your athletic training kit and compare prices across vendors." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      {kit.length > 0 && (
        <div className="flex justify-end mb-4 xs:mb-6">
          <Button asChild variant="outline" size="sm" className="xs:size-default">
            <Link to="/catalog">Add More Items</Link>
          </Button>
        </div>
      )}
      
      <div className={kit.length > 0 ? "grid gap-4 xs:gap-6 lg:grid-cols-3" : ""}>
        <div className={kit.length > 0 ? "lg:col-span-2" : ""}>
          {viewMode === 'categories' ? (
            <ATSupplyCategories onCategorySelect={handleCategorySelect} />
          ) : viewMode === 'category-products' ? (
            <CategoryProductSelector 
              categoryId={selectedCategoryId} 
              onBack={handleBackToCategories} 
            />
          ) : kit.length > 0 ? (
            <div className="space-y-4 xs:space-y-6">
              {grouped.map(([category, items]) => (
                <div key={category} className="space-y-2 xs:space-y-3">
                  <h2 className="text-base xs:text-lg font-semibold">{category}</h2>
                  <div className="space-y-2">
                    {items.map(item => (
                      <KitItem key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Start building your athletic training kit by selecting categories above.
              </p>
              <Button asChild variant="outline">
                <Link to="/catalog">Or browse all products</Link>
              </Button>
            </div>
          )}
        </div>
        {kit.length > 0 && (
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <KitSummary />
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Build;
