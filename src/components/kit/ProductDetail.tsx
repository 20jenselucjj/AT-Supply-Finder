import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Plus, Minus, Check, ExternalLink } from "lucide-react";
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
                
                {/* Product Features as Description */}
                {product.features && product.features.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm mb-1">Features:</h3>
                    <p className="text-xs text-muted-foreground">
                      {product.features.join('. ') + '.'}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {renderStars(product.rating || 0)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {product.rating ? product.rating.toFixed(1) : 'No rating'} 
                    {product.reviews && product.reviews.length > 0 ? ` (${product.reviews.length} reviews)` : ''}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-1">
                  <Badge variant="secondary" className="text-xs">{product.brand}</Badge>
                  <Badge variant="outline" className="text-xs">{product.category}</Badge>
                  {product.subcategory && (
                    <Badge variant="outline" className="text-xs">{product.subcategory}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Options - More compact */}
        <Card className="h-fit">
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Add to Kit</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {bestPrice !== null ? `$${bestPrice.toFixed(2)}` : 'Price not available'}
            </div>
            {product.offers && product.offers.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Best price from {product.offers.find(o => o.price === bestPrice)?.name || product.offers[0]?.name}
              </div>
            )}
            
            {!isInKit ? (
              <div className="space-y-4 mt-3">
                <div className="space-y-2">
                  <div className="text-xs font-medium">Quantity:</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => adjustQuantity(-1)}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => adjustQuantity(1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <Button onClick={handleAddToKit} className="w-full text-sm h-9">
                  <Plus className="w-3 h-3 mr-1" />
                  Add to Kit
                </Button>
              </div>
            ) : (
              <div className="space-y-3 mt-3">
                <div className="flex items-center gap-1 text-green-600 bg-green-50 p-2 rounded">
                  <Check className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    In kit (Quantity: {kitItem?.quantity})
                  </span>
                </div>
                
                <Button
                  onClick={handleRemoveFromKit}
                  variant="outline"
                  className="w-full text-sm h-9"
                >
                  <Minus className="w-3 h-3 mr-1" />
                  Remove from Kit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Specifications */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-lg">Specifications</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <ProductSpecifications product={product} />
        </CardContent>
      </Card>

      {/* Vendor Comparison */}
      {product.offers && product.offers.length > 0 && (
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Vendor Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <VendorComparison offers={product.offers} productName={product.name} />
          </CardContent>
        </Card>
      )}

      {/* Product Reviews */}
      {product.reviews && product.reviews.length > 0 && (
        <ProductReviews reviews={product.reviews} averageRating={product.rating} />
      )}
    </div>
  );
};

export default ProductDetail;