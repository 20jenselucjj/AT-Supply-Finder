import { Product } from '@/lib/types/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useKit } from '@/context/kit-context';
import { getProductCountInfo, formatFeatures } from '@/utils/productUtils';

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductQuickView = ({
  product,
  isOpen,
  onClose
}: ProductQuickViewProps) => {
  const { addToKit } = useKit();

  if (!product) return null;

  const bestPrice = Math.min(...product.offers.map(o => o.price));
  const countInfo = getProductCountInfo(product);
  const formattedFeatures = formatFeatures(product.features?.join('..') || '');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center flex flex-col items-center gap-2">
            {product.name}
            {countInfo && (
              <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                {countInfo}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Image */}
          <div className="lg:col-span-1 flex justify-center">
            <img 
              src={product.imageUrl || product.image_url || '/placeholder-image.png'} 
              alt={product.name}
              className="max-w-full h-auto max-h-80 object-contain rounded-lg shadow-md border"
            />
          </div>
          
          {/* Product Details */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card border border-border p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Product Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Brand:</span>
                  <span>{product.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Category:</span>
                  <span>{product.category}</span>
                </div>
                {product.dimensions && (
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Dimensions:</span>
                    <span>{product.dimensions}</span>
                  </div>
                )}
                {product.weight && (
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Weight:</span>
                    <span>{product.weight}</span>
                  </div>
                )}
                {product.material && (
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Material:</span>
                    <span>{product.material}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-medium text-muted-foreground">Best Price:</span>
                  <span className="text-foreground font-bold">${bestPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="lg:col-span-1">
            {formattedFeatures.length > 0 && (
              <div className="bg-card border border-border p-4 rounded-lg h-fit">
                <h3 className="text-lg font-semibold mb-3">Features & Specifications</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {formattedFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-4 mt-6 pt-4 border-t border-border">
          <Button 
            onClick={() => addToKit(product)}
            className="flex-1 py-3 text-lg font-medium"
          >
            Add to Kit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};