import { Product } from '@/lib/types/types';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useKit } from '@/context/kit-context';
import { Plus, Minus, Heart } from 'lucide-react';
import { useFavorites } from '@/context/favorites-context';
import { Badge } from '@/components/ui/badge';
import { getProductCountInfo } from '@/utils/productUtils';

interface ProductGridProps {
  products: Product[];
  selectedForCompare: string[];
  toggleCompare: (id: string) => void;
  setQuickViewProduct?: (product: Product) => void;
}

export const ProductGrid = ({ products, selectedForCompare, toggleCompare, setQuickViewProduct }: ProductGridProps) => {
  const { addToKit, getProductQuantity, updateQuantity, removeFromKit } = useKit();
  const { toggleFavorite, isFavorite } = useFavorites();

  // Get the best price from offers
  const getBestPrice = (product: Product) => {
    if (!product.offers || product.offers.length === 0) return 0;
    return Math.min(...product.offers.map(o => o.price));
  };

  return (
    <div className="grid gap-6 grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => {
        const bestPrice = getBestPrice(product);
        const isProductFavorite = isFavorite(product.id);
        const hasMultipleOffers = product.offers && product.offers.length > 1;
        const productQuantity = getProductQuantity(product.id);
        
        return (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -5 }}
            className="border rounded-xl p-5 hover:shadow-lg transition-all duration-300 bg-card text-card-foreground relative overflow-hidden group"
          >
            {/* Favorite button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-3 right-3 p-2 h-8 w-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(product.id);
              }}
              aria-label={isProductFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart 
                className={`h-4 w-4 transition-colors ${
                  isProductFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                }`} 
              />
            </Button>
            
            {/* Compare checkbox */}
            <div className="absolute top-3 left-3 flex gap-2 z-10">
              <Checkbox
                checked={selectedForCompare.includes(product.id)}
                onCheckedChange={() => toggleCompare(product.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity data-[state=checked]:opacity-100"
              />
            </div>
            
            <a
              href={product.offers.find(offer => offer.name === "Amazon")?.url || product.offers[0]?.url || `https://www.amazon.com/dp/${product.asin || 'B0'}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`}
              target="_blank"
              rel="noopener noreferrer"
              className="block cursor-pointer"
              onClick={(e) => {
                const url = product.offers.find(offer => offer.name === "Amazon")?.url || product.offers[0]?.url;
                // If the URL is invalid, prevent navigation and show an error
                if (!url || url === '#') {
                  e.preventDefault();
                  console.error('Invalid product URL for item:', product);
                  // Optionally show a toast notification to the user
                }
              }}
            >
              <div className="bg-secondary/70 rounded-xl p-3 mb-4 flex items-center justify-center aspect-square relative overflow-hidden">
                <img
                  src={product.imageUrl || product.image_url || '/placeholder.svg'}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-300 rounded-xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
                {hasMultipleOffers && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    {product.offers.length} offers
                  </div>
                )}
              </div>
            </a>
            
            <div className="mb-3">
              <h3 className="font-semibold mb-1 line-clamp-2 leading-tight">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
              
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-lg font-bold text-foreground">
                  ${bestPrice.toFixed(2)}
                </span>
                {(() => {
                  const countInfo = getProductCountInfo(product);
                  return countInfo ? (
                    <Badge variant="outline" className="text-xs px-2 py-1 bg-muted/30 text-foreground border-border">
                      {countInfo}
                    </Badge>
                  ) : null;
                })()}
              </div>
            </div>
            
            <div className="flex flex-col gap-2 mt-2">
              {getProductQuantity(product.id) > 0 ? (
                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateQuantity(product.id, getProductQuantity(product.id) - 1);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-sm px-3 py-1">
                    Qty: {getProductQuantity(product.id)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToKit(product, 1);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToKit(product);
                  }}
                  className="w-full"
                >
                  Add to Kit
                </Button>
              )}
              
              <Button
                variant="outline"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickViewProduct && setQuickViewProduct(product);
                }}
              >
                Quick View
              </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};