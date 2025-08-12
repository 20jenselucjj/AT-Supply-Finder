import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useKit } from "@/context/kit-context";
import { Badge } from "@/components/ui/badge";

const currency = (n: number) => `$${n.toFixed(2)}`;

const KitSummary = () => {
  const { kit, getVendorTotals, clearKit } = useKit();
  
  const vendorTotals = getVendorTotals();
  const bestVendor = vendorTotals.length > 0
    ? vendorTotals.reduce((best, current) =>
        current.total < best.total ? current : best
      )
    : null;
  
  const subtotal = kit.reduce((total, item) => {
    const bestPrice = item.offers.slice().sort((a, b) => a.price - b.price)[0]?.price || 0;
    return total + (bestPrice * item.quantity);
  }, 0);
  
  if (kit.length === 0) {
    return null;
  }
  
  return (
    <Card className="p-6 mt-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
        <h2 className="text-xl font-bold">Kit Summary</h2>
        <Button variant="outline" onClick={clearKit}>
          Clear Kit
        </Button>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between py-2">
          <span>Subtotal ({kit.reduce((total, item) => total + item.quantity, 0)} items)</span>
          <span className="font-medium">{currency(subtotal)}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="font-medium">Best prices by vendor</h3>
        {vendorTotals.map(({ vendor, total, url }) => (
          <div
            key={vendor}
            className="flex flex-col md:flex-row justify-between md:items-center gap-3 p-3 rounded-md border"
          >
            <div className="flex items-center gap-2">
              <span>{vendor}</span>
              {bestVendor && bestVendor.vendor === vendor && (
                <Badge>Best price</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{currency(total)}</span>
              <Button asChild variant={bestVendor && bestVendor.vendor === vendor ? "hero" : "outline"} size="sm">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  View
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default KitSummary;