import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Plus, Minus, Check, ExternalLink } from "lucide-react";
import { useKit } from "@/context/kit-context";
import { Product } from "@/lib/types/types";
import { getProductCountInfo } from "@/utils/productUtils";

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

const ProductDetail = ({ product, onBack }: ProductDetailProps) => {
  const { kit, addToKit, removeFromKit, updateQuantity } = useKit();
  const [quantity, setQuantity] = useState(1);
  
  const isInKit = kit.some(item => item.id === product.id);
  const kitItem = kit.find(item => item.id === product.id);
  
  // Use kit quantity if item is in kit, otherwise use local quantity
  const currentQuantity = isInKit ? (kitItem?.quantity || 1) : quantity;

  const handleAddToKit = () => {
    addToKit(product, currentQuantity);
  };

  const handleRemoveFromKit = () => {
    removeFromKit(product.id);
    setQuantity(1); // Reset to 1 when removed from kit
  };

  const adjustQuantity = (delta: number) => {
    const newQuantity = Math.max(1, currentQuantity + delta);
    if (isInKit) {
      // Update kit quantity directly if item is in kit
      updateQuantity(product.id, newQuantity);
    } else {
      // Update local state if not in kit
      setQuantity(newQuantity);
    }
  };



  // Get the best price from offers
  const bestPrice = product.offers && product.offers.length > 0 
    ? Math.min(...product.offers.map(o => o.price))
    : null;

  // Get the best offer URL for the product link
  const bestOfferUrl = product.offers && product.offers.length > 0 
    ? product.offers.find(o => o.price === bestPrice)?.url || product.offers[0]?.url
    : '#';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
      </div>

      {/* Product Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Product Image and Basic Info */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Product Image - Made smaller */}
              <div className="aspect-square bg-secondary/70 rounded-lg flex items-center justify-center overflow-hidden border max-w-md mx-auto w-full">
                <img
                  src={product.imageUrl || product.image_url || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Try multiple fallback options
                    if (target.src !== '/placeholder.svg') {
                      target.src = '/placeholder.svg';
                    }
                  }}
                />
              </div>
              
              <div className="space-y-3">
                {/* Product Title with Link */}
                <div>
                  <a 
                    href={bestOfferUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xl font-bold hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    {product.name}
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                  {product.description && (
                    <p className="text-muted-foreground mt-1 text-sm">{product.description}</p>
                  )}
                </div>
                
                {/* Product Features - Improved Display */}
                {product.features && product.features.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-foreground">Key Features:</h3>
                    <div className="space-y-1">
                      {product.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <p className="text-sm text-foreground leading-relaxed">{feature}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{product.brand}</Badge>
                  <Badge variant="outline" className="text-xs">{product.category}</Badge>
                  {product.subcategory && (
                    <Badge variant="outline" className="text-xs">{product.subcategory}</Badge>
                  )}
                  {getProductCountInfo(product.features) && (
                    <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {getProductCountInfo(product.features)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Options - Enhanced */}
        <Card className="h-fit border-2 border-primary/20">
          <CardHeader className="p-4 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardTitle className="text-lg text-primary">Add to Kit</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="text-center pt-2">
              <div className="text-3xl font-bold text-primary">
                {bestPrice !== null ? `$${bestPrice.toFixed(2)}` : 'Price not available'}
              </div>
              {product.offers && product.offers.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Best price from {product.offers.find(o => o.price === bestPrice)?.name || product.offers[0]?.name}
                </div>
              )}
            </div>
            
            {/* Quantity Selection - Always Visible */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-center">Select Quantity</div>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-2"
                  onClick={() => adjustQuantity(-1)}
                  disabled={currentQuantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="bg-secondary/50 px-4 py-2 rounded-lg min-w-[60px] text-center">
                  <span className="text-lg font-bold">{currentQuantity}</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-2"
                  onClick={() => adjustQuantity(1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Total Price Display */}
              {bestPrice !== null && (
                <div className="text-center p-2 bg-secondary/30 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Price</div>
                  <div className="text-xl font-bold text-primary">
                    ${(bestPrice * currentQuantity).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
            
            {!isInKit ? (
              <Button onClick={handleAddToKit} className="w-full h-11 text-base font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Add {currentQuantity} to Kit
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-semibold">
                    In kit (Quantity: {kitItem?.quantity})
                  </span>
                </div>
                
                <Button
                  onClick={handleRemoveFromKit}
                  variant="outline"
                  className="w-full h-11 text-base border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Remove from Kit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>



    </div>
  );
};

export default ProductDetail;