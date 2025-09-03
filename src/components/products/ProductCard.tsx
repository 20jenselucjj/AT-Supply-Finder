import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useKit } from "@/context/kit-context";
import { useFavorites } from "@/context/favorites-context";
import { Product } from "@/lib/types";
import { Heart, Star } from "lucide-react";

const currency = (n: number) => `$${n.toFixed(2)}`;

const cardVariants = {
  hover: {
    y: -8,
    boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.1), 0px 10px 10px -5px rgba(0,0,0,0.04)",
  },
  tap: {
    scale: 0.98,
  },
};

const ProductCard = ({ product, price, loading = false }: { product: Product, price?: number, loading?: boolean }) => {
  const { addToKit, getProductQuantity } = useKit();
  const { toggleFavorite, isFavorite } = useFavorites();
  const bestOffer = product.offers.slice().sort((a, b) => a.price - b.price)[0];
  const bestIsAmazon = bestOffer?.name.toLowerCase().includes("amazon");
  const isProductFavorite = isFavorite(product.id);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleFavorite(product.id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Example: Add Amazon affiliate product if product.id === "amazon-prewrap"
  if (product.id === "amazon-prewrap") {
    const asin = "B0C6TP64FL";
    return (
      <motion.div variants={cardVariants} whileHover="hover" whileTap="tap">
        <Card className="p-6 flex flex-col gap-5 border-4 border-yellow-400 shadow-lg bg-gradient-to-br from-yellow-100 via-white to-yellow-200 dark:from-yellow-900/30 dark:via-background dark:to-yellow-900/20 h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 dark:bg-yellow-400/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/10 dark:bg-yellow-400/5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 p-2 h-8 w-8 hover:bg-yellow-200/50 dark:hover:bg-yellow-900/30 z-10"
            onClick={handleToggleFavorite}
            aria-label={isProductFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart 
              className={`h-4 w-4 transition-colors ${
                isProductFavorite ? 'fill-red-500 text-red-500' : 'text-yellow-600 dark:text-yellow-400 hover:text-red-500'
              }`} 
            />
          </Button>
          
          <div className="w-full h-44 bg-white dark:bg-background rounded-xl flex items-center justify-center overflow-hidden shadow-md relative z-10">
            <img
              src="https://m.media-amazon.com/images/I/81MKOjzOdxL._AC_SX425_PIbundle-4,TopRight,0,0_SH20_.jpg"
              alt="OK TAPE Pre Wrap Tape (4-Rolls, 120 Yards) - Athletic Foam Underwrap for Sports, Protect for Ankles Wrists Hands and Knees, 2.75 Inches - Black"
              className="h-full object-contain transition-transform duration-300 hover:scale-105 rounded-lg"
              loading="lazy"
              width="320"
              height="160"
              decoding="async"
              fetchPriority="low"
            />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between flex-1 gap-4 relative z-10">
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-extrabold leading-tight text-yellow-900 dark:text-yellow-100 drop-shadow text-left">OK TAPE Pre Wrap Tape (4-Rolls, 120 Yards)</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 text-left">Athletic Foam Underwrap for Sports, Protect for Ankles Wrists Hands and Knees, 2.75 Inches - Black</p>
            </div>
            <div className="text-right md:min-w-[120px]">
              <div className="text-sm">From</div>
              <div className="text-xl md:text-2xl font-bold text-yellow-800 dark:text-yellow-200">$11.99</div>
              <div className="mt-1 flex flex-col items-end gap-1">
                <Badge variant="secondary" className="bg-yellow-300 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-100 text-xs md:text-sm">Best price</Badge>
                <Badge className="bg-yellow-500 dark:bg-yellow-600 text-white text-xs md:text-sm">Best on Amazon</Badge>
              </div>
            </div>
          </div>
          
          <ul className="text-base text-yellow-800 dark:text-yellow-200 list-disc pl-5 flex-1 relative z-10">
            <li className="text-left">4 rolls, 120 yards total</li>
            <li className="text-left">Non-adhesive, high quality PU foam</li>
            <li className="text-left">Breathable, stretchable, comfortable</li>
            <li className="text-left">Protects skin, can be used as hair band</li>
          </ul>
          
          <div className="flex flex-wrap gap-3 mt-auto relative z-10">
            <Button
              asChild
              variant="hero"
              className="transition-transform duration-200 hover:scale-105 shadow-md flex-1 md:flex-none"
            >
              <a
                href={`https://www.amazon.com/dp/${asin}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`}
                target="_blank"
                rel="sponsored noopener noreferrer"
                aria-label="View on Amazon"
              >
                Amazon · $11.99
              </a>
            </Button>
            <Button
              onClick={() => addToKit(product)}
              variant="secondary"
              className="transition-transform duration-200 hover:scale-105 flex-1 md:flex-none"
            >
              Add to Kit
            </Button>
            <Button
              asChild
              variant="outline"
              className="transition-transform duration-200 hover:scale-105 border-yellow-500 text-yellow-900 dark:text-yellow-100 shadow-md flex-1 md:flex-none"
            >
              <a
                href={`https://www.amazon.com/dp/${asin}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`}
                target="_blank"
                rel="sponsored noopener noreferrer"
                aria-label="Add to Amazon Cart"
              >
                Add to Amazon Cart
              </a>
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={cardVariants} whileHover="hover" whileTap="tap">
      <Card className="p-5 flex flex-col gap-4 h-full relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 p-2 h-8 w-8 hover:bg-accent/50 z-10"
          onClick={handleToggleFavorite}
          disabled={loading}
          aria-label={isProductFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart 
            className={`h-4 w-4 transition-colors ${
              isProductFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'
            }`} 
          />
        </Button>
        
        <div className="w-full h-40 bg-secondary/70 rounded-xl p-2 flex items-center justify-center overflow-hidden shadow-sm relative z-10">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <img
              src={product.imageUrl || product.image_url || "/placeholder.svg"}
              alt={`${product.name} product image`}
              className="h-full object-contain transition-transform duration-300 hover:scale-105 rounded-xl"
              loading="lazy"
              width="320"
              height="160"
              decoding="async"
              fetchPriority="low"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between flex-1 gap-4 relative z-10">
          <div className="flex-1">
            <h3 className="text-base md:text-lg font-semibold leading-tight text-left">
              {loading ? <Skeleton className="h-5 w-32 mb-1" /> : product.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 text-left">
              {loading ? <Skeleton className="h-3 w-20" /> : product.category}
            </p>
            
            <div className="flex items-center mt-1 text-xs text-muted-foreground">
              {getProductQuantity(product.id) > 0 && (
                <span className="ml-auto bg-primary/10 px-3 py-1 rounded text-xs font-medium">
                  Qty: {getProductQuantity(product.id)}
                </span>
              )}
              {!getProductQuantity(product.id) && product.weight && (
                <span className="ml-auto bg-primary/10 px-3 py-1 rounded text-xs font-medium">
                  Qty: {product.weight}
                </span>
              )}
            </div>
            
            {product.rating && product.rating > 0 && !loading && (
              <div className="flex items-center mt-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  {product.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          
          <div className="text-right md:min-w-[100px]">
            <div className="text-sm">From</div>
            <div className="text-lg md:text-xl font-bold">
              {loading ? <Skeleton className="h-6 w-16" /> : price ? currency(price) : currency(bestOffer.price)}
            </div>
            <div className="mt-1 flex flex-col items-end gap-1">
              {loading ? <Skeleton className="h-5 w-20" /> : null}
              {bestIsAmazon && !loading && <Badge className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200">Amazon</Badge>}
            </div>
          </div>
        </div>

        {product.features && product.features.length > 0 && (
          <ul className="text-sm text-muted-foreground list-disc pl-5 flex-1 relative z-10">
            {loading
              ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-3 w-24 mb-1" />)
              : product.features.map((f) => (
                <li key={f} className="text-left">{f}</li>
              ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2 mt-auto relative z-10">
          <Button
            onClick={() => addToKit(product)}
            variant="secondary"
            className="transition-transform duration-200 hover:scale-105 flex-1 md:flex-none min-w-[120px]"
            disabled={loading}
          >
            Add to Kit
          </Button>
          {product.offers.map((o) => (
            <Button
              key={o.name}
              asChild
              variant={o.name.toLowerCase().includes("amazon") ? "hero" : "outline"}
              className="transition-transform duration-200 hover:scale-105 flex-1 md:flex-none min-w-[120px]"
              disabled={loading}
            >
              <a 
                href={o.url && o.url !== '#' ? o.url : `https://www.amazon.com/dp/${product.asin || 'B0'}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`} 
                target="_blank" 
                rel="sponsored noopener noreferrer" 
                aria-label={`View on ${o.name}`}
                onClick={(e) => {
                  // If the URL is invalid, prevent navigation and show an error
                  if (!o.url || o.url === '#') {
                    e.preventDefault();
                    console.error('Invalid product URL for offer:', o);
                    // Optionally show a toast notification to the user
                  }
                }}
              >
                {o.name} · {currency(o.price)}
              </a>
            </Button>
          ))}
          {product.asin && (
            <Button
              asChild
              variant="outline"
              className="transition-transform duration-200 hover:scale-105 flex-1 md:flex-none min-w-[120px]"
              disabled={loading}
            >
              <a
                href={`https://www.amazon.com/dp/${product.asin}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`}
                target="_blank"
                rel="sponsored noopener noreferrer"
                aria-label="Add to Amazon Cart"
              >
                Add to Amazon Cart
              </a>
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default React.memo(ProductCard);