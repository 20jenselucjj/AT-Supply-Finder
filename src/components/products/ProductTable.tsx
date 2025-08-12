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

export const ProductTable: React.FC<ProductTableProps> = ({ products }) => {
  return (
    <Table>
      <TableCaption>A list of available products.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]"></TableHead>
          <TableHead className="w-[250px]">Product Name</TableHead>
          <TableHead className="w-[200px]">Features</TableHead>
          <TableHead className="w-[100px]">Price</TableHead>
          <TableHead className="w-[150px]">Vendors</TableHead>
          <TableHead className="w-[120px]">Add to Kit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody variants={tableVariants} initial="hidden" animate="visible">
        {products.map((product) => (
          <ProductTableRow key={product.id} product={product} />
        ))}
      </TableBody>
    </Table>
  );
};