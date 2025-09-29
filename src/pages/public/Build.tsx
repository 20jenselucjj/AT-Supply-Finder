import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { useKit } from "@/context/kit-context";
import KitItem from "@/components/features/kit/KitItem";
import KitSummary from "@/components/features/kit/KitSummary";
import FirstAidCategories from "@/components/features/kit/FirstAidCategories";
import CategoryProductSelector from "@/components/features/kit/CategoryProductSelector";
import { useMemo, useState, useEffect, lazy, Suspense } from "react";
import { Product } from "@/lib/types/types";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

// Lazy load the AI kit indicator
const AIKitIndicator = lazy(() => import("@/components/features/kit/AIKitIndicator"));

type ViewMode = 'categories' | 'category-products';

const Build = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : "";
  const { kit, addToKit, clearKit } = useKit();
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAIGenerated, setIsAIGenerated] = useState(false);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setViewMode('category-products');
  };

  const handleBackToCategories = () => {
    setViewMode('categories');
    setSelectedCategoryId('');
  };

  // Handle deep link functionality for AI-generated kits
  useEffect(() => {
    const kitData = searchParams.get('kit');
    const aiGenerated = searchParams.get('ai') === 'true';
    
    if (kitData && aiGenerated) {
      try {
        const parsedKit = JSON.parse(kitData);
        console.log('AI Generated Kit Data:', parsedKit); // Debug log
        if (Array.isArray(parsedKit) && parsedKit.length > 0) {
          // Clear existing kit and add AI-generated items
          clearKit();
          parsedKit.forEach((item: any) => {
            // Handle multiple possible image URL properties with better fallback
            const imageUrl = item.imageUrl || item.product_image_url || item.image_url || '/placeholder.svg';
            console.log('Processing item:', item.name, 'Image URL:', imageUrl); // Debug log
            
            // Ensure offers array is properly structured
            const offers = item.offers && Array.isArray(item.offers) && item.offers.length > 0 
              ? item.offers.map((offer: any) => ({
                ...offer,
                url: offer.url && offer.url !== '#' ? offer.url : `https://www.amazon.com/dp/${item.asin}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`
              }))
            : [{
                name: 'AI Generated',
                url: `https://www.amazon.com/dp/${item.asin}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`,
                price: item.price || 0,
                lastUpdated: new Date().toISOString()
              }];
            
            addToKit({
              id: item.id || `ai-${Date.now()}-${Math.random()}`,
              name: item.name,
              brand: item.brand || 'Unknown',
              price: item.price || 0,
              imageUrl: imageUrl,
              category: item.category || item.product_category || 'miscellaneous',
              description: item.description || '',
              features: item.features || [],
              materials: item.materials || [],
              asin: item.asin || undefined,
              offers: offers,
              quantity: item.quantity || 1
            } as any, item.quantity || 1);
          });
          setIsAIGenerated(true);
          // Clear URL parameters after loading
          setSearchParams({});
        }
      } catch (error) {
        console.error('Failed to parse kit data from URL:', error);
      }
    }
  }, [searchParams, addToKit, clearKit, setSearchParams]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof kit>();
    kit.forEach(item => {
      // Ensure we have a category, defaulting to "miscellaneous" if none exists
      const category = item.category || 'miscellaneous';
      if (!map.has(category)) map.set(category, []);
      map.get(category)!.push(item);
    });
    return Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b));
  }, [kit]);
  
  // Loading fallback component
  const LoadingFallback = () => (
    <div className="flex justify-center items-center h-16">
      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
  
  return (
    <main className="container mx-auto py-6 xs:py-8 sm:py-10 px-3 xs:px-4 sm:px-6">
      <Helmet>
        <title>Kit Builder | AT Supply Finder</title>
        <meta name="description" content="Build your professional medical kit with AT Supply Finder. Select supplies and compare prices across trusted vendors." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      {/* AI-Generated Kit Indicator */}
      <Suspense fallback={<LoadingFallback />}>
        <AIKitIndicator isVisible={isAIGenerated && kit.length > 0} />
      </Suspense>

      <div className={kit.length > 0 ? "grid gap-4 xs:gap-6 lg:grid-cols-3" : ""}>
        <div className={kit.length > 0 ? "lg:col-span-2" : ""}>
          {viewMode === 'categories' ? (
            <FirstAidCategories onCategorySelect={handleCategorySelect} />
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
                Start building your first aid kit by selecting categories above.
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