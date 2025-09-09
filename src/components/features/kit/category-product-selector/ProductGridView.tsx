import { ProductGridViewProps } from "./types";
import { ProductCard } from "./ProductCard";

export const ProductGridView = ({
  products,
  isProductInKit,
  getProductQuantity,
  handleProductToggle,
  handleQuantityChange,
  formatCurrency,
  setSelectedProduct
}: ProductGridViewProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => {
        const isInKit = isProductInKit(product.id);
        const bestOffer = product.offers[0];
        
        return (
          <ProductCard
            key={product.id}
            product={product}
            isInKit={isInKit}
            bestOffer={bestOffer}
            formatCurrency={formatCurrency}
            setSelectedProduct={setSelectedProduct}
            handleProductToggle={handleProductToggle}
            handleQuantityChange={handleQuantityChange}
            getProductQuantity={getProductQuantity}
          />
        );
      })}
    </div>
  );
};