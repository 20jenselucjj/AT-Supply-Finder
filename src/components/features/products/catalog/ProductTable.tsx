import React from 'react';
import { motion } from 'framer-motion';
import {
  Table,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useKit } from '@/context/kit-context';
import { useFavorites } from '@/context/favorites-context';

interface ProductTableProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
}

const TableBody = motion.tbody;

const tableVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const ProductTable: React.FC<ProductTableProps> = ({ products, onProductSelect }) => {
  const { addToKit } = useKit();
  const { toggleFavorite, isFavorite } = useFavorites();

  // Get the best price from offers
  const getBestPrice = (product: Product) => {
    if (!product.offers || product.offers.length === 0) return 0;
    return Math.min(...product.offers.map(o => o.price));
  };

  return (
    <div className="overflow-x-auto -mx-2 px-2 md:mx-0 md:px-0" role="region" aria-label="Product comparison table" tabIndex={0}>
      <Table className="min-w-[720px] md:min-w-0">
        <TableCaption className="sr-only">A list of available products.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">Product</TableHead>
            <TableHead className="hidden lg:table-cell min-w-[200px]">Features</TableHead>
            <TableHead className="w-[90px]">Price</TableHead>
            <TableHead className="hidden md:table-cell w-[140px]">Vendors</TableHead>
            <TableHead className="min-w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody variants={tableVariants} initial="hidden" animate="visible">
          {products.map((product) => {
            const bestPrice = getBestPrice(product);
            const isProductFavorite = isFavorite(product.id);
            return (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-16 h-16 rounded-md bg-muted flex items-center justify-center cursor-pointer"
                    onClick={() => onProductSelect(product)}
                  >
                    <img
                      src={product.imageUrl || '/placeholder.svg'}
                      alt={product.name}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <div>
                    <div 
                      className="font-medium cursor-pointer hover:text-primary transition-colors"
                      onClick={() => onProductSelect(product)}
                    >
                      {product.name}
                    </div>
                    <div className="text-sm text-muted-foreground">{product.brand}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <ul className="text-sm space-y-1">
                  {product.features?.slice(0, 3).map((feature, index) => (
                    <li key={index} className="line-clamp-1">{feature}</li>
                  ))}
                </ul>
              </TableCell>
              <TableCell>
                <div className="font-bold text-foreground">${bestPrice.toFixed(2)}</div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex flex-wrap gap-1">
                  {product.offers.slice(0, 2).map((offer, index) => (
                    <div key={index} className="text-xs bg-muted px-2 py-1 rounded">
                      {offer.name}
                    </div>
                  ))}
                  {product.offers.length > 2 && (
                    <div className="text-xs text-muted-foreground">+{product.offers.length - 2}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product.id);
                      }}
                      aria-label={isProductFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart 
                        className={`h-4 w-4 transition-colors ${
                          isProductFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                        }`} 
                      />
                    </Button>
                    <Button size="sm" onClick={() => addToKit(product)}>
                      Add to Kit
                    </Button>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onProductSelect(product)}>
                    View
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    </div>
  );
};