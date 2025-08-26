import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ProductComparisonProps {
  products: Product[];
  onClose: () => void;
}

export const ProductComparison = ({ products, onClose }: ProductComparisonProps) => {
  if (products.length < 2) return null;

  const getPrice = (p: Product) => Math.min(...p.offers.map(o => o.price));

  return (
    <div className="border rounded-lg p-4 mb-6 bg-muted/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Comparing {products.length} Products</h3>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Clear Comparison
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(product => (
          <div key={product.id} className="border rounded p-3 bg-background">
            <div 
              className="cursor-pointer block mb-2"
              onClick={() => {
                const url = product.offers.find(offer => offer.name === "Amazon")?.url || product.offers[0]?.url;
                if (url) window.open(url, '_blank');
              }}
            >
              <div className="bg-secondary/70 border border-border rounded-md p-2 flex items-center justify-center h-32 shadow-sm">
                <img
                  src={product.imageUrl || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-28 object-contain hover:opacity-80 transition-opacity"
                />
              </div>
            </div>
            <h4 
              className="font-medium mb-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => {
                const url = product.offers.find(offer => offer.name === "Amazon")?.url || product.offers[0]?.url;
                if (url) window.open(url, '_blank');
              }}
            >
              {product.name}
            </h4>

            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Brand:</span> {product.brand}</div>
              <div><span className="font-medium">Rating:</span> {product.rating || 'N/A'}</div>
              <div><span className="font-medium">Price:</span> ${getPrice(product).toFixed(2)}</div>
              {product.dimensions && <div><span className="font-medium">Dimensions:</span> {product.dimensions}</div>}
              {product.weight && <div><span className="font-medium">Weight:</span> {product.weight}</div>}
              {product.material && <div><span className="font-medium">Material:</span> {product.material}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};