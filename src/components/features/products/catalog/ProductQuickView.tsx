import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useKit } from '@/context/kit-context';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[95vw] xs:w-[90vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-3 sm:gap-6">
          <div className="flex flex-col gap-3 xs:gap-2 sm:gap-4">
            <div 
              className="cursor-pointer block"
              onClick={() => {
                const url = product.offers.find(offer => offer.name === "Amazon")?.url || product.offers[0]?.url;
                if (url) window.open(url, '_blank');
              }}
            >
              <div className="bg-secondary/70 border border-border rounded-md p-2 xs:p-3 sm:p-4 flex items-center justify-center h-48 xs:h-56 sm:h-64 shadow-sm overflow-hidden">
                <img
                  src={product.imageUrl || '/placeholder.svg'}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain hover:opacity-80 transition-opacity"
                />
              </div>
            </div>
            <Button onClick={() => addToKit(product)} className="text-xs xs:text-sm px-2 xs:px-3 py-1.5 xs:py-2">
              Add to Kit
            </Button>
          </div>

          <div className="space-y-3 xs:space-y-4">
            <div>
              <h3 className="font-medium mb-2 text-sm xs:text-base">Product Details</h3>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-1.5 xs:gap-2 text-xs xs:text-sm">
                <div><span className="text-muted-foreground">Brand:</span> {product.brand}</div>
                <div><span className="text-muted-foreground">Category:</span> {product.category}</div>
                {product.dimensions && <div className="xs:col-span-2"><span className="text-muted-foreground">Dimensions:</span> {product.dimensions}</div>}
                {product.weight && <div><span className="text-muted-foreground">Qty:</span> {product.weight}</div>}
                {product.material && <div><span className="text-muted-foreground">Material:</span> {product.material}</div>}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2 text-sm xs:text-base">Description</h3>
              <div className="text-xs xs:text-sm text-muted-foreground leading-relaxed">
                {product.features && product.features.length > 0 ? (
                  <p>{product.features.join('. ')}.</p>
                ) : (
                  <p>No description available for this product.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2 text-sm xs:text-base">Pricing</h3>
              <div className="space-y-1.5 xs:space-y-2">
                {product.offers.map((offer, index) => (
                  <div key={index} className="flex justify-between items-center text-xs xs:text-sm">
                    <span>{offer.name}</span>
                    <span>${offer.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center font-medium pt-1.5 xs:pt-2 border-t border-border/50">
                  <span className="text-xs xs:text-sm">Best Price:</span>
                  <span className="text-primary text-sm xs:text-base">${bestPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};