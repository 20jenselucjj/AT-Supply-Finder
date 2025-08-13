import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useKit } from "@/context/kit-context";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMemo, useState } from "react";

const KitSummary = () => {
  const { kit, getVendorTotals, clearKit } = useKit();
  const [openConfirm, setOpenConfirm] = useState(false);

  // Memoize derived pricing to avoid unnecessary recalcs each render
  const { vendorTotals, bestVendor, subtotal } = useMemo(() => {
    const vendorTotals = getVendorTotals();
    const bestVendor = vendorTotals.length > 0
      ? vendorTotals.reduce((best, current) => current.total < best.total ? current : best)
      : null;
    const subtotal = kit.reduce((total, item) => {
      const bestPrice = item.offers.slice().sort((a, b) => a.price - b.price)[0]?.price || 0;
      return total + (bestPrice * item.quantity);
    }, 0);
    return { vendorTotals, bestVendor, subtotal };
  }, [kit, getVendorTotals]);
  
  if (kit.length === 0) {
    return null;
  }
  
  return (
    <Card className="p-6 mt-6" aria-labelledby="kit-summary-heading">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
        <h2 id="kit-summary-heading" className="text-xl font-bold">Kit Summary</h2>
        <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Clear Kit</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear entire kit?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will remove all items from your kit. You can’t undo this immediately (undo history coming soon).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { clearKit(); setOpenConfirm(false); }}>Clear</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between py-2">
          <span>Subtotal ({kit.reduce((total, item) => total + item.quantity, 0)} items)</span>
          <span className="font-medium" aria-live="polite">{formatCurrency(subtotal)}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="font-medium">Best prices by vendor</h3>
        {vendorTotals.map(({ vendor, total, url }) => {
          const isBest = bestVendor && bestVendor.vendor === vendor;
          return (
            <div
              key={vendor}
              className="flex flex-col md:flex-row justify-between md:items-center gap-3 p-3 rounded-md border"
            >
              <div className="flex items-center gap-2">
                <span>{vendor}</span>
                {isBest && <Badge>Best price</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatCurrency(total)}</span>
                <Button asChild variant={isBest ? "hero" : "outline"} size="sm">
                  <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`View at ${vendor}`}>View</a>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default KitSummary;