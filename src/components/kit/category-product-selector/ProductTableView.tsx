import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { ProductTableViewProps } from "./types";
import { ProductRow } from "./ProductRow";

export const ProductTableView = ({
  products,
  isProductInKit,
  getProductQuantity,
  handleProductToggle,
  handleQuantityChange,
  formatCurrency,
  setSelectedProduct,
  sortBy,
  sortDirection,
  handleSort,
  getSortIcon
}: ProductTableViewProps) => {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("name")} className="flex items-center gap-2 p-0">
                Product
                {getSortIcon("name")}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("brand")} className="flex items-center gap-2 p-0">
                Brand
                {getSortIcon("brand")}
              </Button>
            </TableHead>
            <TableHead>Specifications</TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("price")} className="flex items-center gap-2 p-0">
                Price
                {getSortIcon("price")}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("rating")} className="flex items-center gap-2 p-0">
                Rating
                {getSortIcon("rating")}
              </Button>
            </TableHead>
            <TableHead>Vendors</TableHead>
            <TableHead>Reviews</TableHead>
            <TableHead className="w-32">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const inKit = isProductInKit(product.id);
            const bestOffer = product.offers[0];
            
            return (
              <ProductRow
                key={product.id}
                product={product}
                inKit={inKit}
                bestOffer={bestOffer}
                formatCurrency={formatCurrency}
                setSelectedProduct={setSelectedProduct}
                handleProductToggle={handleProductToggle}
                handleQuantityChange={handleQuantityChange}
                getProductQuantity={getProductQuantity}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};