import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { VendorOffer } from "@/lib/types/types";
import { formatCurrency } from "@/lib/utils/utils";

interface VendorComparisonProps {
  offers: VendorOffer[];
  productName: string;
  onVendorSelect?: (offer: VendorOffer) => void;
  compact?: boolean;
}

const VendorComparison = ({ offers, productName, onVendorSelect, compact = false }: VendorComparisonProps) => {
  if (!offers || offers.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No vendors
      </div>
    );
  }

  // Sort offers by price (lowest first)
  const sortedOffers = [...offers].sort((a, b) => a.price - b.price);
  const bestOffer = sortedOffers[0];

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {sortedOffers.map((offer, index) => {
        const isBest = offer === bestOffer;
        return (
          <div
            key={`${offer.name}-${index}`}
            className={`flex items-center justify-between ${compact ? 'p-1 border rounded' : 'p-2 border rounded-md'}`}
          >
            <div className="flex items-center gap-2">
              <span className={compact ? "text-xs font-medium" : "text-sm font-medium"}>{offer.name}</span>
              {!compact && isBest && (
                <Badge variant="default" className={compact ? "text-xs px-1 py-0" : "text-xs"}>
                  Best
                </Badge>
              )}
            </div>
            {!compact && (
              <div className="flex items-center gap-1">
                <span className={compact ? "text-xs font-semibold" : "text-sm font-semibold"}>
                  {formatCurrency(offer.price)}
                </span>
                <Button
                  variant="outline"
                  size={compact ? "icon" : "sm"}
                  onClick={() => {
                    if (onVendorSelect) {
                      onVendorSelect(offer);
                    }
                    window.open(offer.url, '_blank', 'noopener,noreferrer');
                  }}
                  className={compact ? "h-6 w-6 p-1" : "h-7 px-2"}
                >
                  <ExternalLink className={compact ? "w-2 h-2" : "w-3 h-3"} />
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default VendorComparison;