import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Star, Plus, Minus } from "lucide-react";
import ProductSpecifications from "../ProductSpecifications";
import VendorComparison from "../VendorComparison";
import { ProductCardProps } from "./types";

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
    <Card key={product.id} className={`transition-all ${isInKit ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover"
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
                {product.features.slice(0, 3).join(", ")}
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
            
            {/* Reviews Summary */}
            {product.reviews && product.reviews.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{product.rating?.toFixed(1)}</span>
                </div>
                <button 
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  onClick={() => setSelectedProduct(product)}
                >
                  ({product.reviews.length} review{product.reviews.length !== 1 ? 's' : ''})
                </button>
              </div>
            )}
            
            {product.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">{product.rating}</span>
              </div>
            )}
            
            {bestOffer && (
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{formatCurrency(bestOffer.price)}</span>
                <Badge variant="outline">{bestOffer.name}</Badge>
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
              <span className="min-w-[3rem] text-center text-sm font-medium">
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