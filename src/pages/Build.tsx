import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { useKit } from "@/context/kit-context";
import KitItem from "@/components/kit/KitItem";
import KitSummary from "@/components/kit/KitSummary";
import FirstAidCategories from "@/components/kit/FirstAidCategories";
import CategoryProductSelector from "@/components/kit/CategoryProductSelector";
import { useMemo, useState, useEffect, lazy, Suspense } from "react";
import { Product } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

// Lazy load the AI kit indicator
const AIKitIndicator = lazy(() => import("@/components/kit/AIKitIndicator"));

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
        const parsedKit = JSON.parse(decodeURIComponent(kitData));
        if (Array.isArray(parsedKit) && parsedKit.length > 0) {
          // Clear existing kit and add AI-generated items
          clearKit();
          parsedKit.forEach((item: any) => {
            // Map product categories to first aid categories when possible
            const categoryMapping: Record<string, string> = {
              // Wound Care & Dressings
              'Bandages': 'First Aid & Wound Care',
              'Gauze': 'First Aid & Wound Care',
              'Dressings': 'First Aid & Wound Care',
              'Adhesive Bandages': 'First Aid & Wound Care',
              
              // Tapes & Wraps
              'Medical Tape': 'Taping & Bandaging',
              'Elastic Bandages': 'Taping & Bandaging',
              'Athletic Tape': 'Taping & Bandaging',
              'Cohesive Wrap': 'Taping & Bandaging',
              
              // Antiseptics & Ointments
              'Antibiotic Ointment': 'First Aid & Wound Care',
              'Antiseptic': 'First Aid & Wound Care',
              'Alcohol': 'First Aid & Wound Care',
              'Hydrogen Peroxide': 'First Aid & Wound Care',
              
              // Pain & Symptom Relief
              'Pain Relievers': 'Over-the-Counter Medication',
              'Pain Relief': 'Over-the-Counter Medication',
              'Antihistamines': 'Over-the-Counter Medication',
              'Medication': 'Over-the-Counter Medication',
              
              // Instruments & Tools
              'Scissors': 'Instruments & Tools',
              'Tweezers': 'Instruments & Tools',
              'Thermometers': 'Instruments & Tools',
              'Medical Instruments': 'Instruments & Tools',
              
              // Trauma & Emergency
              'Emergency Supplies': 'Emergency Care',
              'Cold Packs': 'Hot & Cold Therapy',
              'Emergency Blankets': 'Emergency Care',
              
              // PPE
              'Gloves': 'Personal Protection Equipment (PPE)',
              'Masks': 'Personal Protection Equipment (PPE)',
              'Sanitizer': 'Personal Protection Equipment (PPE)',
              
              // Information & Essentials
              'First Aid Books': 'Documentation & Communication',
              'Documentation': 'Documentation & Communication'
            };
            
            // Try to map the category or use the existing one
            let mappedCategory = item.category || 'Other';
            for (const [source, target] of Object.entries(categoryMapping)) {
              if (mappedCategory.includes(source) || item.name.includes(source)) {
                mappedCategory = target;
                break;
              }
            }

            addToKit({
              id: item.id || `ai-${Date.now()}-${Math.random()}`,
              name: item.name,
              brand: item.brand || 'Unknown',
              price: item.price || 0,
              imageUrl: item.image || '/placeholder-product.jpg',
              category: mappedCategory, // Use mapped category
              description: item.description || '',
              features: item.features || [],
              materials: item.materials || [],
              offers: item.offers || [{
                name: 'AI Generated',
                url: '#',
                price: item.price || 0,
                lastUpdated: new Date().toISOString()
              }]
            }, item.quantity || 1);
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
      // Ensure we have a category, defaulting to "Other" if none exists
      const category = item.category || 'Other';
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