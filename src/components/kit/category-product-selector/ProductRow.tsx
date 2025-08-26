import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Star, Plus, Minus } from "lucide-react";
import ProductSpecifications from "../ProductSpecifications";
import VendorComparison from "../VendorComparison";
import { ProductRowProps } from "./types";

export const ProductRow = ({
  product,
  inKit,
  bestOffer,
  formatCurrency,
  setSelectedProduct,
  handleProductToggle,
  handleQuantityChange,
  getProductQuantity
}: ProductRowProps) => {
  return (
    <TableRow key={product.id} className={inKit ? 'bg-primary/5' : ''}>
      <TableCell>
        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center overflow-hidden">
          <img 
            src={product.imageUrl || "/placeholder.svg"} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div>
            <button 
              className="font-medium text-left hover:text-blue-600 hover:underline"
              onClick={() => setSelectedProduct(product)}
            >
              {product.name}
            </button>
            <div className="text-sm text-muted-foreground">{product.brand}</div>
            {product.features && product.features.length > 0 && (
              <div className="text-sm text-muted-foreground mt-1">
                {product.features.slice(0, 2).join(", ")}
                {product.features.length > 2 && "..."}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>{product.brand}</TableCell>
      <TableCell>
        <ProductSpecifications product={product} />
      </TableCell>
      <TableCell>
        {bestOffer ? (
          <span className="font-semibold">{formatCurrency(bestOffer.price)}</span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </TableCell>
      <TableCell>
        {product.rating && product.rating > 0 ? (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">No rating</span>
        )}
      </TableCell>
      <TableCell>
        {product.offers && product.offers.length > 0 ? (
          <div className="max-w-xs">
            <VendorComparison 
              offers={product.offers} 
              productName={product.name}
              onVendorSelect={(offer) => {
                console.log('Selected vendor:', offer.name, 'for', product.name);
              }}
            />
          </div>
        ) : (
          <span className="text-muted-foreground">No vendors</span>
        )}
      </TableCell>
      <TableCell>
        {product.reviews && product.reviews.length > 0 ? (
          <button 
            className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
            onClick={() => setSelectedProduct(product)}
          >
            {product.reviews.length} review{product.reviews.length !== 1 ? 's' : ''}
          </button>
        ) : (
          <span className="text-muted-foreground text-sm">No reviews</span>
        )}
      </TableCell>
      <TableCell>
        {inKit ? (
          <div className="flex items-center gap-1">
            <Button 
              onClick={() => handleQuantityChange(product, -1)}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="min-w-[2rem] text-center text-sm font-medium">
              {getProductQuantity(product.id)}
            </span>
            <Button 
              onClick={() => handleQuantityChange(product, 1)}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => handleProductToggle(product)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};