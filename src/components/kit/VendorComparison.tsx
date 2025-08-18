import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { VendorOffer } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface VendorComparisonProps {
  offers: VendorOffer[];
  productName: string;
  onVendorSelect?: (offer: VendorOffer) => void;
}

const VendorComparison = ({ offers, productName, onVendorSelect }: VendorComparisonProps) => {
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
    <div className="space-y-2">
      {sortedOffers.map((offer, index) => {
        const isBest = offer === bestOffer;
        return (
          <div
            key={`${offer.name}-${index}`}
            className="flex items-center justify-between p-2 border rounded-md"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{offer.name}</span>
              {isBest && (
                <Badge variant="default" className="text-xs">
                  Best Price
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {formatCurrency(offer.price)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onVendorSelect) {
                    onVendorSelect(offer);
                  }
                  window.open(offer.url, '_blank', 'noopener,noreferrer');
                }}
                className="h-7 px-2"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VendorComparison;