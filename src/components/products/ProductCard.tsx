import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  imageUrl?: string;
}

const currency = (n: number) => `$${n.toFixed(2)}`;

const ProductCard = ({ product }: { product: Product }) => {
  const bestOffer = product.offers.slice().sort((a, b) => a.price - b.price)[0];
  const bestIsAmazon = bestOffer?.name.toLowerCase().includes("amazon");

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="w-full h-40 bg-muted rounded-md flex items-center justify-center overflow-hidden">
        <img
          src={product.imageUrl || "/placeholder.svg"}
          alt={`${product.name} product image`}
          className="h-full object-contain"
          loading="lazy"
        />
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold leading-tight">{product.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
        </div>
        <div className="text-right">
          <div className="text-sm">From</div>
          <div className="text-xl font-bold">{currency(bestOffer.price)}</div>
          <div className="mt-1 flex items-center gap-2 justify-end">
            <Badge variant="secondary">Best price</Badge>
            {bestIsAmazon && <Badge>Best on Amazon</Badge>}
          </div>
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
            <a href={o.url} target="_blank" rel="sponsored noopener noreferrer" aria-label={`View on ${o.name}`}>
              {o.name} · {currency(o.price)}
            </a>
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default ProductCard;
