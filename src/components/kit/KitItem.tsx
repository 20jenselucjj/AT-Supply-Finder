import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KitItem } from "@/context/kit-context";
import { useKit } from "@/context/kit-context";
import { X } from "lucide-react";

interface KitItemProps {
  item: KitItem;
}

const KitItem = ({ item }: KitItemProps) => {
  const { updateQuantity, removeFromKit } = useKit();
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      updateQuantity(item.id, value);
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
    <div className="flex items-center gap-4 p-4 border rounded-lg flex-wrap md:flex-nowrap">
      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
        <img
          src={item.imageUrl || "/placeholder.svg"}
          alt={`${item.name} product image`}
          className="h-full object-contain"
          loading="lazy"
          width="64"
          height="64"
          decoding="async"
          fetchPriority="low"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{item.name}</h3>
        <p className="text-sm text-muted-foreground">{item.category}</p>
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
          value={item.quantity}
          onChange={handleQuantityChange}
          className="w-16 text-center h-8"
          aria-label="Quantity"
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
      
      <div className="text-right min-w-[100px]">
        <div className="text-sm text-muted-foreground">Total</div>
        <div className="font-medium">${(bestOffer.price * item.quantity).toFixed(2)}</div>
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