import { Product } from '@/lib/types';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useKit } from '@/context/kit-context';

interface ProductGridProps {
  products: Product[];
  selectedForCompare: string[];
  toggleCompare: (id: string) => void;
  setQuickViewProduct?: (product: Product) => void;
}

export const ProductGrid = ({ products, selectedForCompare, toggleCompare, setQuickViewProduct }: ProductGridProps) => {
  const { addToKit, getProductQuantity } = useKit();

  return (
  <div className="grid gap-5 grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {products.map(product => (
        <motion.div
          key={product.id}
          whileHover={{ scale: 1.03 }}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card text-card-foreground relative"
        >
          <div className="absolute top-2 right-2 flex gap-2">
            <Checkbox
              checked={selectedForCompare.includes(product.id)}
              onCheckedChange={() => toggleCompare(product.id)}
            />
          </div>
          <a
            href={product.offers.find(offer => offer.name === "Amazon")?.url || product.offers[0]?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block cursor-pointer"
          >
            <img
              src={product.imageUrl || '/placeholder.svg'}
              alt={product.name}
              className="w-full h-48 object-contain mb-4 hover:opacity-80 transition-opacity"
            />
          </a>
          <h3 className="font-medium mb-2 pr-6">{product.name}</h3>
          <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
            <span className="text-primary font-bold">
              ${Math.min(...product.offers.map(o => o.price)).toFixed(2)}
            </span>
            {product.rating && (
              <div className="flex items-center bg-secondary/60 px-2 py-0.5 rounded text-xs">
                <span className="font-medium mr-1">{product.rating}</span>
                <span aria-hidden="true">★</span>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <Button
              onClick={() => addToKit(product)}
              className="w-full sm:flex-1"
            >
              Add to Kit
            </Button>
            <div className="flex items-center gap-2 sm:flex-1">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setQuickViewProduct && setQuickViewProduct(product)}
              >
                Quick View
              </Button>
              {getProductQuantity(product.id) > 0 && (
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium min-w-[28px] text-center">
                  {getProductQuantity(product.id)}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};