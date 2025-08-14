import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useKit } from '@/context/kit-context';

interface ProductQuickViewProps {
  product: Product | null;
  onClose: () => void;
  onCompareToggle: (productId: string) => void;
  isComparing: boolean;
}

export const ProductQuickView = ({
  product,
  onClose,
  onCompareToggle,
  isComparing
}: ProductQuickViewProps) => {
  const { addToKit } = useKit();

  if (!product) return null;

  const bestPrice = Math.min(...product.offers.map(o => o.price));

  return (
    <Dialog open={!!product} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <a
              href={product.offers.find(offer => offer.name === "Amazon")?.url || product.offers[0]?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer block"
            >
              <div className="bg-secondary/70 border border-border rounded-md p-4 flex items-center justify-center h-64 shadow-sm">
                <img
                  src={product.imageUrl || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-56 object-contain hover:opacity-80 transition-opacity"
                />
              </div>
            </a>
            <div className="flex gap-2">
              <Button onClick={() => addToKit(product)} className="flex-1">
                Add to Kit
              </Button>
              <Button
                variant={isComparing ? 'secondary' : 'outline'}
                onClick={() => onCompareToggle(product.id)}
                className="flex-1"
              >
                {isComparing ? 'Comparing' : 'Compare'}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Product Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Brand:</span> {product.brand}</div>
                <div><span className="text-muted-foreground">Category:</span> {product.category}</div>
                {product.dimensions && <div><span className="text-muted-foreground">Dimensions:</span> {product.dimensions}</div>}
                {product.weight && <div><span className="text-muted-foreground">Weight:</span> {product.weight}</div>}
                {product.material && <div><span className="text-muted-foreground">Material:</span> {product.material}</div>}
                <div><span className="text-muted-foreground">Rating:</span> {product.rating || 'N/A'}</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Features</h3>
              <ul className="list-disc pl-5 text-sm">
                {product.features?.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Pricing</h3>
              <div className="space-y-2">
                {product.offers.map((offer, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span>{offer.name}</span>
                    <span>${offer.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center font-medium pt-2">
                  <span>Best Price:</span>
                  <span className="text-primary">${bestPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};