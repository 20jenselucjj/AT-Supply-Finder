import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useKit } from "@/context/kit-context";
import { Product } from "@/lib/types";

const currency = (n: number) => `$${n.toFixed(2)}`;

const cardVariants = {
  hover: {
    scale: 1.05,
    boxShadow: "0px 10px 20px rgba(0,0,0,0.1)",
    y: -5,
  },
  tap: {
    scale: 0.95,
  },
};

const ProductCard = ({ product, price, loading = false }: { product: Product, price?: number, loading?: boolean }) => {
  const { addToKit } = useKit();
  const bestOffer = product.offers.slice().sort((a, b) => a.price - b.price)[0];
  const bestIsAmazon = bestOffer?.name.toLowerCase().includes("amazon");

  // Example: Add Amazon affiliate product if product.id === "amazon-prewrap"
  if (product.id === "amazon-prewrap") {
    const asin = "B0C6TP64FL";
    return (
      <motion.div variants={cardVariants} whileHover="hover" whileTap="tap">
        <Card className="p-6 flex flex-col gap-5 border-4 border-yellow-400 shadow-lg bg-gradient-to-br from-yellow-100 via-white to-yellow-200 h-full">
          <div className="w-full h-44 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-md">
            <img
              src="https://m.media-amazon.com/images/I/81MKOjzOdxL._AC_SX425_PIbundle-4,TopRight,0,0_SH20_.jpg"
              alt="OK TAPE Pre Wrap Tape (4-Rolls, 120 Yards) - Athletic Foam Underwrap for Sports, Protect for Ankles Wrists Hands and Knees, 2.75 Inches - Black"
            className="h-full object-contain transition-transform duration-300 hover:scale-105 rounded-lg"
            loading="lazy"
            width="320"
            height="160"
            decoding="async"
            fetchPriority="low"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between flex-1 gap-4">
          <div className="flex-1">
            <h3 className="text-2xl font-extrabold leading-tight text-yellow-900 drop-shadow text-left">OK TAPE Pre Wrap Tape (4-Rolls, 120 Yards)</h3>
            <p className="text-sm text-yellow-700 mt-1 text-left">Athletic Foam Underwrap for Sports, Protect for Ankles Wrists Hands and Knees, 2.75 Inches - Black</p>
          </div>
          <div className="text-right sm:min-w-[120px]">
            <div className="text-sm">From</div>
            <div className="text-2xl font-bold text-yellow-800">$11.99</div>
            <div className="mt-1 flex flex-col items-end gap-1">
              <Badge variant="secondary" className="bg-yellow-300 text-yellow-900">Best price</Badge>
              <Badge className="bg-yellow-500 text-white">Best on Amazon</Badge>
            </div>
          </div>
        </div>
        <ul className="text-base text-yellow-800 list-disc pl-5 flex-1">
          <li className="text-left">4 rolls, 120 yards total</li>
          <li className="text-left">Non-adhesive, high quality PU foam</li>
          <li className="text-left">Breathable, stretchable, comfortable</li>
          <li className="text-left">Protects skin, can be used as hair band</li>
        </ul>
        <div className="flex flex-wrap gap-3 mt-auto">
          <Button
            asChild
            variant="hero"
            className="transition-transform duration-200 hover:scale-105 shadow-md"
          >
            <a
              href={`https://www.amazon.com/dp/${asin}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`}
              target="_blank"
              rel="sponsored noopener noreferrer"
              aria-label="View on Amazon"
            >
              Amazon · $11.99
            </a>
          </Button>
          <Button
            onClick={() => addToKit(product)}
            variant="secondary"
            className="transition-transform duration-200 hover:scale-105"
          >
            Add to Kit
          </Button>
          <Button
            asChild
            variant="outline"
            className="transition-transform duration-200 hover:scale-105 border-yellow-500 text-yellow-900 shadow-md"
          >
            <a
              href={`https://www.amazon.com/dp/${asin}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`}
              target="_blank"
              rel="sponsored noopener noreferrer"
              aria-label="Add to Amazon Cart"
            >
              Add to Amazon Cart
            </a>
          </Button>
        </div>
      </Card>
    </motion.div>
    );
  }

  // ...existing code...
  return (
    <motion.div variants={cardVariants} whileHover="hover" whileTap="tap">
    <Card className="p-5 flex flex-col gap-4 h-full">
      <div className="w-full h-40 bg-muted rounded-md flex items-center justify-center overflow-hidden">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <img
            src={product.imageUrl || "/placeholder.svg"}
            alt={`${product.name} product image`}
            className="h-full object-contain transition-transform duration-300 hover:scale-105"
            loading="lazy"
            width="320"
            height="160"
            decoding="async"
            fetchPriority="low"
          />
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between flex-1 gap-4">
        <div className="flex-1">
          <h3 className="text-base font-semibold leading-tight text-left">
            {loading ? <Skeleton className="h-5 w-32 mb-1" /> : product.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 text-left">
            {loading ? <Skeleton className="h-3 w-20" /> : product.category}
          </p>
        </div>
        <div className="text-right sm:min-w-[100px]">
          <div className="text-sm">From</div>
          <div className="text-xl font-bold">
            {loading ? <Skeleton className="h-6 w-16" /> : price ? currency(price) : currency(bestOffer.price)}
          </div>
          <div className="mt-1 flex flex-col items-end gap-1">
            {loading ? <Skeleton className="h-5 w-20" /> : <Badge variant="secondary">Best price</Badge>}
            {bestIsAmazon && !loading && <Badge>Best on Amazon</Badge>}
          </div>
        </div>
      </div>

      {product.features && product.features.length > 0 && (
        <ul className="text-sm text-muted-foreground list-disc pl-5 flex-1">
          {loading
            ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-3 w-24 mb-1" />)
            : product.features.map((f) => (
                <li key={f} className="text-left">{f}</li>
              ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2 mt-auto">
        <Button
          onClick={() => addToKit(product)}
          variant="secondary"
          className="transition-transform duration-200 hover:scale-105"
          disabled={loading}
        >
          Add to Kit
        </Button>
        {product.offers.map((o) => (
          <Button
            key={o.name}
            asChild
            variant={o.name.toLowerCase().includes("amazon") ? "hero" : "outline"}
            className="transition-transform duration-200 hover:scale-105"
            disabled={loading}
          >
            <a href={o.url} target="_blank" rel="sponsored noopener noreferrer" aria-label={`View on ${o.name}`}>
              {o.name} · {currency(o.price)}
            </a>
          </Button>
        ))}
        {product.asin && (
          <Button
            asChild
            variant="outline"
            className="transition-transform duration-200 hover:scale-105"
            disabled={loading}
          >
            <a
              href={`https://www.amazon.com/dp/${product.asin}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`}
              target="_blank"
              rel="sponsored noopener noreferrer"
              aria-label="Add to Amazon Cart"
            >
              Add to Amazon Cart
            </a>
          </Button>
        )}
      </div>
    </Card>
    </motion.div>
  );
};

export default React.memo(ProductCard);