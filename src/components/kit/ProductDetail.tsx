import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Package, Plus, Minus, Check } from "lucide-react";
import { useKit } from "@/context/kit-context";
import { Product } from "@/lib/types";
import ProductSpecifications from "./ProductSpecifications";
import VendorComparison from "./VendorComparison";
import ProductReviews from "./ProductReviews";

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

const ProductDetail = ({ product, onBack }: ProductDetailProps) => {
  const { kit, addToKit, removeFromKit } = useKit();
  const [quantity, setQuantity] = useState(1);
  
  const isInKit = kit.some(item => item.id === product.id);
  const kitItem = kit.find(item => item.id === product.id);

  const handleAddToKit = () => {
    addToKit(product, quantity);
  };

  const handleRemoveFromKit = () => {
    removeFromKit(product.id);
  };

  const adjustQuantity = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : i < rating
            ? "fill-yellow-200 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Image and Basic Info */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Product Image Placeholder */}
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <Package className="w-16 h-16 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">{product.name}</h1>
                <p className="text-muted-foreground">{product.description}</p>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {renderStars(product.rating)}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.rating.toFixed(1)} ({product.reviews?.length || 0} reviews)
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{product.brand}</Badge>
                  <Badge variant="outline">{product.category}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Options */}
        <Card>
          <CardHeader>
            <CardTitle>Add to Kit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">
              {product.offers && product.offers.length > 0 
                ? `$${Math.min(...product.offers.map(o => o.price)).toFixed(2)}` 
                : 'Price not available'}
            </div>
            {product.offers && product.offers.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Best price from {product.offers.find(o => o.price === Math.min(...product.offers.map(p => p.price)))?.name}
              </div>
            )}
            
            {!isInKit ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustQuantity(-1)}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustQuantity(1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <Button onClick={handleAddToKit} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Kit
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    In kit (Quantity: {kitItem?.quantity})
                  </span>
                </div>
                
                <Button
                  onClick={handleRemoveFromKit}
                  variant="outline"
                  className="w-full"
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Remove from Kit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Specifications */}
      <ProductSpecifications product={product} />

      {/* Vendor Comparison */}
      <VendorComparison product={product} />

      {/* Product Reviews */}
      <ProductReviews product={product} />
    </div>
  );
};

export default ProductDetail;