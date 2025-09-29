import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Star, Plus, Minus } from "lucide-react";
import ProductSpecifications from "../ProductSpecifications";
import VendorComparison from "../VendorComparison";
import { ProductCardProps } from "./types";
import { getProductCountInfo } from "@/utils/productUtils";

export const ProductCard = ({
  product,
  isInKit,
  bestOffer,
  formatCurrency,
  setSelectedProduct,
  handleProductToggle,
  handleQuantityChange,
  getProductQuantity
}: ProductCardProps) => {
  return (
    <Card key={product.id} className={`transition-all ${isInKit ? 'ring-2 ring-primary bg-primary/5 dark:bg-primary/10' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-xl flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Package className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
          
          <div className="space-y-2">
            <button 
              className="font-semibold line-clamp-2 text-left hover:text-blue-600 hover:underline w-full"
              onClick={() => setSelectedProduct(product)}
            >
              {product.name}
            </button>
            <p className="text-sm text-muted-foreground">{product.brand}</p>
            
            {product.features && product.features.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {product.features.slice(0, 3).join(" • ")}
                {product.features.length > 3 && "..."}
              </div>
            )}
            
            {/* Product Specifications */}
            <ProductSpecifications product={product} />
            
            {/* Vendor Comparison */}
            {product.offers && product.offers.length > 0 && (
              <VendorComparison 
                offers={product.offers} 
                productName={product.name}
                onVendorSelect={(offer) => {
                  console.log('Selected vendor:', offer.name, 'for', product.name);
                }}
              />
            )}
            
            {/* Product Count */}
            <div className="flex items-center gap-2 text-sm">
              {(() => {
                const countInfo = getProductCountInfo(product);
                return countInfo ? (
                  <Badge variant="outline" className="text-xs px-2 py-1 bg-primary/10 text-primary">
                    {countInfo}
                  </Badge>
                ) : null;
              })()}
              {product.reviews && product.reviews.length > 0 && (
                <button 
                  className="text-blue-600 hover:text-blue-800 hover:underline text-xs"
                  onClick={() => setSelectedProduct(product)}
                >
                  ({product.reviews.length} review{product.reviews.length !== 1 ? 's' : ''})
                </button>
              )}
            </div>

            
            {bestOffer && (
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{formatCurrency(bestOffer.price)}</span>
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">{bestOffer.name}</span>
              </div>
            )}
          </div>
          
          {isInKit ? (
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => handleQuantityChange(product, -1)}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="min-w-[3rem] text-center text-sm font-medium px-2">
                Qty: {getProductQuantity(product.id)}
              </span>
              <Button 
                onClick={() => handleQuantityChange(product, 1)}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => handleProductToggle(product)}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Kit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};