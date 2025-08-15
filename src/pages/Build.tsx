import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useKit } from "@/context/kit-context";
import KitItem from "@/components/kit/KitItem";
import KitSummary from "@/components/kit/KitSummary";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/lib/types";

interface StarterKitTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  is_active: boolean;
  template_products?: {
    id: string;
    product_id: string;
    quantity: number;
    is_required: boolean;
    notes?: string;
  }[];
}

const Build = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : "";
  const { kit, addToKit } = useKit();
  const [starterTemplates, setStarterTemplates] = useState<StarterKitTemplate[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      // Transform database products to match Product interface
      const transformedProducts: Product[] = (data || []).map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        rating: product.rating || 0,
        imageUrl: product.image_url || '',
        asin: product.asin || '',
        dimensions: product.dimensions || '',
        weight: product.weight || '',
        material: product.material || '',
        features: product.features || [],
        price: product.price,
        affiliateLink: product.affiliate_link,
        offers: product.price ? [{
          name: 'Direct',
          price: product.price,
          url: product.affiliate_link || '#',
          lastUpdated: product.updated_at || new Date().toISOString()
        }] : []
      }));

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('starter_kit_templates')
        .select(`
          *,
          template_products (
            id,
            product_id,
            quantity,
            is_required,
            notes
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to load starter kit templates');
        return;
      }

      setStarterTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load starter kit templates');
    } finally {
      setLoading(false);
    }
  };

  const addTemplateToKit = (template: StarterKitTemplate) => {
    let addedCount = 0;
    template.template_products?.forEach(({ product_id, quantity }) => {
      const product = products.find(p => p.id === product_id);
      if (product) {
        addToKit(product, quantity);
        addedCount++;
      }
    });
    if (addedCount > 0) {
      toast.success(`Added ${addedCount} items from ${template.name} to your kit`);
    }
  };

  const TemplateCard = ({ template, onAddTemplate }: { template: StarterKitTemplate; onAddTemplate: (template: StarterKitTemplate) => void }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const templateProducts = template.template_products || [];
    const validProducts = templateProducts.map(tp => {
      const product = products.find(p => p.id === tp.product_id);
      return { ...tp, product };
    }).filter(tp => tp.product);

    const nextImage = () => {
      setCurrentImageIndex((prev) => (prev + 1) % validProducts.length);
    };

    const prevImage = () => {
      setCurrentImageIndex((prev) => (prev - 1 + validProducts.length) % validProducts.length);
    };

    const shortenName = (name: string, maxLength: number = 25) => {
      return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
    };

    useEffect(() => {
      if (validProducts.length > 1) {
        const interval = setInterval(nextImage, 3000);
        return () => clearInterval(interval);
      }
    }, [validProducts.length]);

    return (
      <div className="border rounded-xl p-0 flex flex-col justify-between hover:shadow-lg transition-all duration-300 overflow-hidden bg-white">
        {/* Image Section */}
        <div className="relative h-48 bg-gray-50">
          {validProducts.length > 0 ? (
            <>
              <img 
                src={validProducts[currentImageIndex]?.product?.imageUrl || '/placeholder.svg'} 
                alt={validProducts[currentImageIndex]?.product?.name || 'Product'}
                className="w-full h-full object-cover transition-opacity duration-500"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
              {validProducts.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    {validProducts.map((_, index) => (
                      <div 
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              {validProducts.length > 0 && (
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  {shortenName(validProducts[currentImageIndex]?.product?.name || '', 20)}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <img src="/placeholder.svg" alt="No products" className="w-16 h-16 opacity-50" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg text-gray-900">{template.name}</h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
              {template.category}
            </span>
          </div>
          
          {template.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>
          )}

          {/* Product List */}
          <div className="mb-4 flex-grow">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Includes:</h4>
            <div className="space-y-2 max-h-24 overflow-hidden">
              {validProducts.slice(0, 5).map((tp, index) => (
                <div key={tp.id} className="group relative">
                  <div className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors">
                    <span className="flex-shrink-0 text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {tp.quantity}x
                    </span>
                    <span 
                      className="text-xs text-gray-700 truncate cursor-help flex-1"
                      title={tp.product?.name || ''}
                    >
                      {tp.product?.name || 'Unknown Product'}
                    </span>
                    {tp.is_required && (
                      <span className="flex-shrink-0 text-primary text-xs font-bold" title="Required item">*</span>
                    )}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute left-0 bottom-full mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs">
                    {tp.product?.name || 'Unknown Product'}
                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              ))}
              {validProducts.length > 5 && (
                <div className="text-xs text-gray-500 text-center py-1">+{validProducts.length - 5} more items</div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <Button 
            onClick={() => onAddTemplate(template)}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg transition-colors"
            disabled={!templateProducts.length}
          >
            Add to Kit ({templateProducts.length} items)
          </Button>
        </div>
      </div>
    );
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
        <title>Build Your Kit | AT Supply Finder</title>
        <meta name="description" content="Select tapes, bandages and more to create your athletic training kit and compare prices across vendors." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 xs:gap-4 mb-4 xs:mb-6">
        <h1 className="text-2xl xs:text-3xl font-bold">Build your kit</h1>
        {kit.length > 0 && (
          <Button asChild variant="outline" size="sm" className="xs:size-default">
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
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading starter kit templates...</p>
            </div>
          ) : starterTemplates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No starter kit templates available yet.</p>
              <p className="text-sm text-muted-foreground">Templates created by admins will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-4 xs:gap-6 sm:grid-cols-2 lg:grid-cols-3">
               {starterTemplates.map(template => (
                 <TemplateCard key={template.id} template={template} onAddTemplate={addTemplateToKit} />
               ))}
             </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 xs:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 xs:space-y-6">
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
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <KitSummary />
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Build;
