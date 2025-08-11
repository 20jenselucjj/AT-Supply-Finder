import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface VendorOffer {
  name: string;
  url: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  features?: string[];
  offers: VendorOffer[];
}

const currency = (n: number) => `$${n.toFixed(2)}`;

const ProductCard = ({ product }: { product: Product }) => {
  const bestOffer = product.offers.slice().sort((a, b) => a.price - b.price)[0];

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold leading-tight">{product.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
        </div>
        <div className="text-right">
          <div className="text-sm">From</div>
          <div className="text-xl font-bold">{currency(bestOffer.price)}</div>
        </div>
      </div>

      {product.features && product.features.length > 0 && (
        <ul className="text-sm text-muted-foreground list-disc pl-5">
          {product.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2 mt-auto">
        {product.offers.map((o) => (
          <Button key={o.name} asChild variant={o.name.toLowerCase().includes("amazon") ? "hero" : "outline"}>
            <a href={o.url} target="_blank" rel="noopener noreferrer" aria-label={`View on ${o.name}`}>
              {o.name} · {currency(o.price)}
            </a>
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default ProductCard;
