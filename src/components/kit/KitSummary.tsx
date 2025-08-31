import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useKit } from "@/context/kit-context";
import { useAuth } from "@/context/auth-context";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useMemo, useState } from "react";
import { CheckCircle, AlertCircle, Package, Star, ExternalLink, Plus, Minus, Save } from "lucide-react";
import { FIRST_AID_CATEGORIES } from "@/components/kit/FirstAidCategories";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const KitSummary = () => {
  const { kit, getVendorTotals, clearKit, updateQuantity, removeFromKit, saveKit } = useKit();
  const { user } = useAuth();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [showDetailedItems, setShowDetailedItems] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [kitName, setKitName] = useState('');
  const [kitDescription, setKitDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantity(itemId, newQuantity);
    } else {
      // When quantity would be 0 or less, remove the item from the kit
      removeFromKit(itemId);
    }
  };

  const handleSaveKit = async () => {
    if (!kitName.trim()) {
      toast.error('Please enter a kit name');
      return;
    }

    try {
      await saveKit(kitName.trim(), kitDescription.trim() || undefined, isPublic);
      toast.success('Kit saved successfully!');
      setSaveDialogOpen(false);
      setKitName('');
      setKitDescription('');
      setIsPublic(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save kit');
    }
  };

  const handleSaveClick = () => {
    if (user) {
      setSaveDialogOpen(true);
    } else {
      setLoginPromptOpen(true);
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating ? 'fill-primary text-primary' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">({rating})</span>
      </div>
    );
  };

  // Memoize derived pricing and category analysis
  const { vendorTotals, bestVendor, subtotal, categoryBreakdown, completionScore } = useMemo(() => {
    const vendorTotals = getVendorTotals();
    const bestVendor = vendorTotals.length > 0
      ? vendorTotals.reduce((best, current) => current.total < best.total ? current : best)
      : null;
    const subtotal = kit.reduce((total, item) => {
      const offers = item.offers || [];
      const bestPrice = offers.length > 0 
        ? offers.slice().sort((a, b) => a.price - b.price)[0]?.price || 0
        : 0;
      return total + (bestPrice * item.quantity);
    }, 0);
    
    // Analyze category coverage - updated to use FIRST_AID_CATEGORIES
    const categoryBreakdown = FIRST_AID_CATEGORIES.map(category => {
      // Map first aid categories to product categories (reverse mapping from FirstAidCategories.tsx)
      const categoryMapping: Record<string, string> = {
        "wound-care-dressings": "First Aid & Wound Care",
        "tapes-wraps": "Taping & Bandaging",
        "antiseptics-ointments": "First Aid & Wound Care",
        "pain-relief": "Over-the-Counter Medication",
        "instruments-tools": "Instruments & Tools",
        "trauma-emergency": "Emergency Care",
        "ppe": "Personal Protection Equipment (PPE)",
        "information-essentials": "Documentation & Communication"
      };
      
      const productCategory = categoryMapping[category.id];
      // Handle both standard category matches and additional category mappings
      const categoryItems = kit.filter(item => {
        // Base case: direct category match
        if (item.category === productCategory) return true;
        
        // Special cases for categories that map to multiple product categories
        if (category.id === "trauma-emergency" && item.category === "Hot & Cold Therapy") return true;
        if (category.id === "instruments-tools" && item.category === "Health Monitoring") return true;
        
        return false;
      });
      
      return {
        ...category,
        itemCount: categoryItems.length,
        totalQuantity: categoryItems.reduce((sum, item) => sum + item.quantity, 0),
        hasItems: categoryItems.length > 0
      };
    });
    
    // Update completion score calculation to use FIRST_AID_CATEGORIES
    const categoriesWithItems = categoryBreakdown.filter(cat => cat.hasItems).length;
    const completionScore = Math.round((categoriesWithItems / FIRST_AID_CATEGORIES.length) * 100);
    
    return { vendorTotals, bestVendor, subtotal, categoryBreakdown, completionScore };
  }, [kit, getVendorTotals]);
  
  if (kit.length === 0) {
    return null;
  }
  
  return (
    <Card className="p-4 xs:p-6 mt-6" aria-labelledby="kit-summary-heading">
      <div className="flex flex-col xs:flex-row justify-between xs:items-center gap-3 xs:gap-4 mb-4">
        <h2 id="kit-summary-heading" className="text-lg xs:text-xl font-bold">Kit Summary</h2>
        <div className="flex gap-2">
          <Button size="sm" className="xs:size-default" onClick={handleSaveClick}>
            <Save className="mr-2 h-4 w-4" />
            Save to Profile
          </Button>
          <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="xs:size-default">Clear Kit</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear entire kit?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will remove all items from your kit. You can't undo this immediately (undo history coming soon).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { clearKit(); setOpenConfirm(false); }}>Clear</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {/* Login Prompt Dialog */}
      <Dialog open={loginPromptOpen} onOpenChange={(open) => {
        setLoginPromptOpen(open);
        // If dialog is closing and user goes to login page, we should close it
        if (!open) {
          // Reset state if needed
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Kit to Profile</DialogTitle>
            <DialogDescription>
              To save your kit to your profile, you'll need to create an account or log in.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Saving your kit allows you to access it from any device and manage multiple kits.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button variant="outline" asChild>
                <Link to="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link to="/login">Create Account</Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Save Kit Dialog (only shown when user is logged in) */}
      {user && (
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Kit</DialogTitle>
              <DialogDescription>
                Save your current kit ({kit.length} items) to access it later from any device.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="kit-name">Kit Name</Label>
                <Input
                  id="kit-name"
                  value={kitName}
                  onChange={(e) => setKitName(e.target.value)}
                  placeholder="Enter kit name..."
                />
              </div>
              <div>
                <Label htmlFor="kit-description">Description (Optional)</Label>
                <Textarea
                  id="kit-description"
                  value={kitDescription}
                  onChange={(e) => setKitDescription(e.target.value)}
                  placeholder="Describe your kit..."
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                />
                <Label htmlFor="is-public">Make this kit public</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveKit}>
                Save Kit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Kit Completion Status */}
      <div className="mb-6 p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-sm xs:text-base">Kit Completion</h3>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${completionScore}%` }}
            />
          </div>
          <span className="text-sm font-medium">{completionScore}%</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {categoryBreakdown.filter(cat => cat.hasItems).length} of {FIRST_AID_CATEGORIES.length} categories covered
        </p>
      </div>

      {/* Detailed Items List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm xs:text-base">Items in Kit ({kit.length})</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetailedItems(!showDetailedItems)}
            className="text-xs"
          >
            {showDetailedItems ? 'Hide' : 'Show'} Details
          </Button>
        </div>
        
        {showDetailedItems && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {kit.map((item) => {
              const offers = item.offers || [];
        const bestOffer = offers.length > 0 ? offers.slice().sort((a, b) => a.price - b.price)[0] : null;
              return (
                <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg bg-muted">
                  {/* Product Image */}
                  <div className="w-12 h-12 bg-background rounded-md flex items-center justify-center overflow-hidden flex-shrink-0 border">
                    <img
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.name}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <Link
                          to={`/product/${item.id}`}
                          className="font-medium text-sm hover:text-primary transition-colors line-clamp-2"
                          title={item.name}
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                        {renderStars(item.rating)}
                        
                        {/* Price Info */}
                        {bestOffer && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(bestOffer.price)} ea • {bestOffer.name}
                            </span>
                            <a
                              href={bestOffer.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="h-6 w-6"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="h-6 w-6"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Total Price */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">Total:</span>
                      <span className="font-medium text-sm">
                        {bestOffer ? formatCurrency(bestOffer.price * item.quantity) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="mb-6">
        <h3 className="font-medium text-sm xs:text-base mb-3">Category Coverage</h3>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
          {categoryBreakdown.map(category => (
            <div key={category.id} className="flex items-center gap-2 p-2 rounded border">
              {category.hasItems ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium truncate block">{category.name}</span>
                {category.hasItems && (
                  <span className="text-xs text-gray-500">{category.totalQuantity} items</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center py-2">
          <span className="text-sm xs:text-base">Subtotal ({kit.reduce((total, item) => total + item.quantity, 0)} items)</span>
          <span className="font-medium text-sm xs:text-base" aria-live="polite">{formatCurrency(subtotal)}</span>
        </div>
      </div>
      

    </Card>
  );
};

export default KitSummary;