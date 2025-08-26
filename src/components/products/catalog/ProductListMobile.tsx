import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useKit } from '@/context/kit-context';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Heart, Star } from 'lucide-react';
import { useFavorites } from '@/context/favorites-context';

interface ProductListMobileProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
}

// Mobile card variant replacing horizontal scroll table under a breakpoint.
export const ProductListMobile = ({ products, onProductSelect }: ProductListMobileProps) => {
  const { addToKit, getProductQuantity } = useKit();
  const { toggleFavorite, isFavorite } = useFavorites();

  // Get the best price from offers
  const getBestPrice = (product: Product) => {
    if (!product.offers || product.offers.length === 0) return 0;
    return Math.min(...product.offers.map(o => o.price));
  };

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {products.map(product => {
          const bestPrice = getBestPrice(product);
          const qty = getProductQuantity(product.id);
          const isProductFavorite = isFavorite(product.id);
          return (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="border rounded-xl p-4 bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div 
                  className="shrink-0 w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden border cursor-pointer"
                  onClick={() => onProductSelect(product)}
                >
                  <img
                    src={product.imageUrl || '/placeholder.svg'}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    width={160}
                    height={160}
                    className="object-contain w-full h-full"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 
                      className="font-semibold leading-tight mb-1 line-clamp-2 cursor-pointer hover:text-primary transition-colors" 
                      title={product.name}
                      onClick={() => onProductSelect(product)}
                    >
                      {product.name}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-8 w-8 shrink-0"
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
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2 flex flex-wrap gap-2 items-center">
                    <span className="font-medium">{product.brand}</span>
                    {product.rating && product.rating > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-secondary/60 px-1.5 py-0.5 rounded-full">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-[10px] font-medium">{product.rating.toFixed(1)}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">No ratings</span>
                    )}
                    <span className="font-bold text-primary">${bestPrice.toFixed(2)}</span>
                  </div>
                  
                  {product.features?.length && (
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5 mb-3">
                      {product.features.slice(0,2).map(f => <li key={f} className="truncate">{f}</li>)}
                    </ul>
                  )}
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.offers.slice(0,2).map(o => (
                      <div key={o.name} className="text-[11px] bg-muted px-2 py-1 rounded">
                        {o.name}
                      </div>
                    ))}
                    {product.offers.length > 2 && (
                      <span className="text-[11px] text-muted-foreground flex items-center">
                        +{product.offers.length - 2} more
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {qty > 0 ? (
                        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 flex-1">
                          <span className="font-medium text-xs px-2 min-w-[40px] text-center">
                            {qty}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addToKit(product, 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" className="flex-1 min-w-[110px]" onClick={() => addToKit(product)}>
                          Add to Kit
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="min-w-[84px]" onClick={() => onProductSelect(product)}>View</Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};