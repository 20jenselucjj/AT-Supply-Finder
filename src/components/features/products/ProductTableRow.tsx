import React from 'react';
import { TableCell } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Product } from '@/lib/types/types';
import { useKit } from '@/context/kit-context';

interface ProductTableRowProps {
  product: Product;
  selectedForCompare: string[];
  toggleCompare: (id: string) => void;
  setQuickViewProduct?: (product: Product) => void;
}

const TableRow = motion.tr;

const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const ProductTableRow: React.FC<ProductTableRowProps> = ({ product, selectedForCompare, toggleCompare, setQuickViewProduct }) => {
  const { addToKit, getProductQuantity } = useKit();

  const bestPrice = product.offers.length > 0
    ? Math.min(...product.offers.map(o => o.price))
    : undefined;

  // Find Amazon offer, if exists
  const amazonOffer = product.offers.find(offer => offer.name === "Amazon");

  return (
    <TableRow variants={rowVariants} className="align-top product-row-fixed">
      <TableCell>
        <Checkbox
          checked={selectedForCompare.includes(product.id)}
          onCheckedChange={() => toggleCompare(product.id)}
        />
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center">
          <a
            href={amazonOffer?.url || product.offers[0]?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer flex-shrink-0" 
          >
            <div className="bg-secondary/70 border border-border rounded-md p-1 mr-4 flex items-center justify-center w-12 h-12 shadow-sm">
              <img
                src={product.imageUrl || 'https://placehold.co/40x40'}
                alt={product.name}
                className="w-10 h-10 object-contain hover:opacity-80 transition-opacity"
              />
            </div>
          </a>
          <div className="min-w-0">
            <div className="text-sm md:text-base truncate">{product.name}</div>
            <div className="text-xs md:text-sm text-muted-foreground truncate">{product.brand}</div>
            <div className="text-xs text-muted-foreground truncate">{product.category}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <ul className="list-disc list-inside text-xs md:text-sm space-y-0.5">
          {product.features?.slice(0, 3).map((feature, index) => (
            <li key={index} className="truncate max-w-[200px]">{feature}</li>
          ))}
        </ul>
      </TableCell>
      <TableCell>
        {bestPrice !== undefined ? `$${bestPrice.toFixed(2)}` : 'N/A'}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {product.offers.slice(0, 2).map((offer) => (
            <Button variant="outline" size="sm" key={offer.name} asChild className="text-xs px-2 py-1 h-auto">
              <a href={offer.url} target="_blank" rel="noopener noreferrer">
                {offer.name}
              </a>
            </Button>
          ))}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {product.weight && (
          <div className="text-xs">
            {product.weight}
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => addToKit(product)}
              className="text-xs md:text-sm px-2 py-1 h-auto"
            >
              Add
            </Button>
            {getProductQuantity(product.id) > 0 && (
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium min-w-[20px] text-center">
                Qty: {getProductQuantity(product.id)}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            className="text-xs md:text-sm px-2 py-1 h-auto"
            onClick={() => setQuickViewProduct && setQuickViewProduct(product)}
          >
            View
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
