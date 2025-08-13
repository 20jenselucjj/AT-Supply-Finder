import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type KitItem } from "@/context/kit-context";
import { useKit } from "@/context/kit-context";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface KitItemProps {
  item: KitItem;
}

const KitItem = ({ item }: KitItemProps) => {
  const { updateQuantity, removeFromKit } = useKit();
  const [pendingQty, setPendingQty] = useState<number>(item.quantity);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    // sync external updates (e.g., from buttons)
    setPendingQty(item.quantity);
  }, [item.quantity]);

  // Debounce manual input to reduce rapid re-renders
  useEffect(() => {
    if (pendingQty === item.quantity) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      updateQuantity(item.id, pendingQty);
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [pendingQty, item.id, item.quantity, updateQuantity]);
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setPendingQty(value);
    }
  };
  
  const incrementQuantity = () => {
    updateQuantity(item.id, item.quantity + 1);
  };
  
  const decrementQuantity = () => {
    updateQuantity(item.id, item.quantity - 1);
  };
  
  const bestOffer = item.offers.slice().sort((a, b) => a.price - b.price)[0];
  
  return (
  <div className="flex items-center gap-4 p-4 border rounded-lg flex-wrap md:flex-nowrap" role="listitem">
      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
        <a
          href={item.offers.find(offer => offer.name === "Amazon")?.url || item.offers[0]?.url}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer h-full w-full flex items-center justify-center"
        >
          <img
            src={item.imageUrl || "/placeholder.svg"}
            alt={`${item.name} product image`}
            className="h-full object-contain hover:opacity-80 transition-opacity"
            loading="lazy"
            width="64"
            height="64"
            decoding="async"
            // Using lowercase fetchpriority to avoid React warning about unknown prop
            // @ts-ignore - not in the standard JSX typings yet
            fetchpriority="low"
          />
        </a>
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate" title={item.name}>{item.name}</h3>
        <p className="text-sm text-muted-foreground">{item.category}</p>
        {bestOffer && (
          <p className="text-xs text-muted-foreground mt-1" aria-label={`Best unit price from ${bestOffer.name} at ${bestOffer.price}`}>
            Best: {bestOffer.name} • {formatCurrency(bestOffer.price)} ea
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-2 my-2 md:my-0">
        <Button
          variant="outline"
          size="icon"
          onClick={decrementQuantity}
          disabled={item.quantity <= 1}
          aria-label="Decrease quantity"
          className="h-8 w-8"
        >
          -
        </Button>
        <Input
          type="number"
            min="1"
            value={pendingQty}
            onChange={handleQuantityChange}
            className="w-16 text-center h-8"
            aria-label={`Quantity for ${item.name}`}
          />
        <Button
          variant="outline"
          size="icon"
          onClick={incrementQuantity}
          aria-label="Increase quantity"
          className="h-8 w-8"
        >
          +
        </Button>
      </div>
      
      <div className="text-right min-w-[110px]">
        <div className="text-sm text-muted-foreground">Total</div>
        <div className="font-medium" aria-live="polite">{bestOffer ? formatCurrency(bestOffer.price * item.quantity) : '—'}</div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeFromKit(item.id)}
        aria-label="Remove item"
        className="h-8 w-8"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default KitItem;