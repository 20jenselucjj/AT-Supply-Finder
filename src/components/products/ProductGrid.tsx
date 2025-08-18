import { Product } from '@/lib/types';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useKit } from '@/context/kit-context';
import { Plus, Minus } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  selectedForCompare: string[];
  toggleCompare: (id: string) => void;
  setQuickViewProduct?: (product: Product) => void;
}

export const ProductGrid = ({ products, selectedForCompare, toggleCompare, setQuickViewProduct }: ProductGridProps) => {
  const { addToKit, getProductQuantity, updateQuantity, removeFromKit } = useKit();

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
            <div className="bg-secondary/70 border border-border rounded-md p-2 mb-4 flex items-center justify-center">
              <img
                src={product.imageUrl || '/placeholder.svg'}
                alt={product.name}
                loading="lazy"
                decoding="async"
                width={320}
                height={320}
                className="w-full h-44 object-contain hover:opacity-80 transition-opacity aspect-square"
              />
            </div>
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
          <div className="flex flex-col gap-2 mt-3">
            {getProductQuantity(product.id) > 0 ? (
              <div className="flex items-center justify-between bg-muted/50 rounded-md p-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(product.id, getProductQuantity(product.id) - 1)}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-medium text-sm px-3">
                  Qty: {getProductQuantity(product.id)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToKit(product, 1)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => addToKit(product)}
                className="w-full"
              >
                Add to Kit
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setQuickViewProduct && setQuickViewProduct(product)}
            >
              Quick View
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};