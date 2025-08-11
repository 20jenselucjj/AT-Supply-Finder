import React, { useContext } from 'react';
import { TableCell } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Product } from '@/lib/types';
import { useKit } from '@/context/kit-context';

interface ProductTableRowProps {
  product: Product;
}

const TableRow = motion.tr;

const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const ProductTableRow: React.FC<ProductTableRowProps> = ({ product }) => {
  const { addToKit } = useKit();

  const bestPrice = product.offers.length > 0
    ? Math.min(...product.offers.map(o => o.price))
    : undefined;

  return (
    <TableRow variants={rowVariants}>
      <TableCell>
        <Checkbox />
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center">
          <img
            src={product.imageUrl || 'https://placehold.co/40x40'}
            alt={product.name}
            className="w-10 h-10 mr-4 object-cover"
          />
          <div>
            <div>{product.name}</div>
            <div className="text-sm text-muted-foreground">{product.category}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <ul className="list-disc list-inside">
          {product.features?.slice(0, 3).map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </TableCell>
      <TableCell>
        {bestPrice !== undefined ? `$${bestPrice.toFixed(2)}` : 'N/A'}
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          {product.offers.map((offer) => (
            <Button variant="outline" size="sm" key={offer.name} asChild>
              <a href={offer.url} target="_blank" rel="noopener noreferrer">
                {offer.name}
              </a>
            </Button>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <Button onClick={() => addToKit(product)}>Add to Kit</Button>
      </TableCell>
    </TableRow>
  );
};