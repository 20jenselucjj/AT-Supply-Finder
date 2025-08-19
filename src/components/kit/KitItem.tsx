import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type KitItem } from "@/context/kit-context";
import { useKit } from "@/context/kit-context";
import { X, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Link } from "react-router-dom";

interface KitItemProps {
  item: KitItem;
}

const KitItem = ({ item }: KitItemProps) => {
  const { updateQuantity, removeFromKit } = useKit();
  const [pendingQty, setPendingQty] = useState<number>(item.quantity);
  const debounceRef = useRef<number | null>(null);

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1 mt-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">({rating})</span>
      </div>
    );
  };

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
  
  const offers = item.offers || [];
  const bestOffer = offers.length > 0 ? offers.slice().sort((a, b) => a.price - b.price)[0] : null;
  
  return (
  <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 xs:gap-4 p-3 xs:p-4 border rounded-lg" role="listitem">
      <div className="w-12 h-12 xs:w-16 xs:h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
        <a
          href={offers.find(offer => offer.name === "Amazon")?.url || offers[0]?.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer h-full w-full flex items-center justify-center"
        >
          <img
            src={item.imageUrl || "/placeholder.svg"}
            alt={`${item.name} product image`}
            className="h-full object-contain hover:opacity-80 transition-opacity"
            loading="lazy"
            width="48"
            height="48"
            decoding="async"
            // Using lowercase fetchpriority to avoid React warning about unknown prop
            // @ts-ignore - not in the standard JSX typings yet
            fetchpriority="low"
          />
        </a>
      </div>
      
      <div className="flex-1 min-w-0 w-full xs:w-auto">
        <Link 
          to={`/product/${item.id}`}
          className="font-medium text-sm xs:text-base line-clamp-2 xs:truncate hover:text-primary transition-colors block" 
          title={item.name}
        >
          {item.name}
        </Link>
        <p className="text-xs xs:text-sm text-muted-foreground">{item.category}</p>
        {renderStars(item.rating)}
        {bestOffer && (
          <p className="text-xs text-muted-foreground mt-1" aria-label={`Best unit price from ${bestOffer.name} at ${bestOffer.price}`}>
            Best: {bestOffer.name} • {formatCurrency(bestOffer.price)} ea
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-2 order-last xs:order-none">
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
      
      <div className="text-right min-w-[80px] xs:min-w-[110px] flex-shrink-0">
        <div className="text-xs xs:text-sm text-muted-foreground">Total</div>
        <div className="font-medium text-sm xs:text-base" aria-live="polite">{bestOffer ? formatCurrency(bestOffer.price * item.quantity) : '—'}</div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeFromKit(item.id)}
        aria-label="Remove item"
        className="h-7 w-7 xs:h-8 xs:w-8 flex-shrink-0 self-start xs:self-center"
      >
        <X className="h-3 w-3 xs:h-4 xs:w-4" />
      </Button>
    </div>
  );
};

export default KitItem;