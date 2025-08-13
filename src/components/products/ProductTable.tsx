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
import { ProductTableRow } from './ProductTableRow';

interface ProductTableProps {
  products: Product[];
  selectedForCompare: string[];
  toggleCompare: (id: string) => void;
  setQuickViewProduct?: (product: Product) => void;
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


export const ProductTable: React.FC<ProductTableProps> = ({ products, selectedForCompare, toggleCompare, setQuickViewProduct }) => {
  return (
    <div className="overflow-x-auto -mx-2 px-2 md:mx-0 md:px-0" role="region" aria-label="Product comparison table" tabIndex={0}>
      <Table className="min-w-[720px] md:min-w-0">
        <TableCaption className="sr-only">A list of available products.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[46px]">{/* compare */}</TableHead>
            <TableHead className="min-w-[180px]">Product</TableHead>
            <TableHead className="hidden lg:table-cell min-w-[200px]">Features</TableHead>
            <TableHead className="w-[90px]">Price</TableHead>
            <TableHead className="hidden md:table-cell w-[140px]">Vendors</TableHead>
            <TableHead className="min-w-[120px]">Add</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody variants={tableVariants} initial="hidden" animate="visible">
          {products.map((product) => (
            <ProductTableRow
              key={product.id}
              product={product}
              selectedForCompare={selectedForCompare}
              toggleCompare={toggleCompare}
              setQuickViewProduct={setQuickViewProduct}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};