import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useKit } from "@/context/kit-context";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils/utils";
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
import { CheckCircle, AlertCircle, Package, ExternalLink, Plus, Minus, Save, ShoppingCart } from "lucide-react";
import { FIRST_AID_CATEGORIES } from "./FirstAidCategories";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const KitSummary = () => {
  const { kit, getVendorTotals, clearKit, updateQuantity, removeFromKit, saveKit } = useKit();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [showDetailedItems, setShowDetailedItems] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
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

  const handleSaveKitClick = () => {
    if (user) {
      setSaveDialogOpen(true);
    } else {
      // Redirect to login page with a return URL to the current page
      toast.info('Please log in or create an account to save your kit');
      navigate('/login', { state: { from: location.pathname } });
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



  // Generate Amazon add to cart URL for the entire kit
  const generateAmazonAddToCartUrl = () => {
    const associateTag = 'athletic2006-20'; // From .env AMAZON_PA_PARTNER_TAG
    const baseUrl = 'https://www.amazon.com/gp/aws/cart/add.html';
    
    // Build query parameters for each item in the kit
    const params = new URLSearchParams();
    params.append('AssociateTag', associateTag);
    
    let itemIndex = 1;
    kit.forEach((item) => {
      if (item.asin) {
        params.append(`ASIN.${itemIndex}`, item.asin);
        params.append(`Quantity.${itemIndex}`, item.quantity.toString());
        itemIndex++;
      }
    });
    
    return `${baseUrl}?${params.toString()}`;
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
      // Use the category ID directly since we've updated the database to use the build page category system
      const productCategory = category.id;
      
      // Handle both standard category matches and additional category mappings
      const categoryItems = kit.filter(item => {
        // Base case: direct category match
        if (item.category === productCategory) return true;
        
        // Special cases for categories that map to multiple product categories
        if (category.id === "trauma-emergency" && item.category === "hot-cold-therapy") return true;
        if (category.id === "instruments-tools" && item.category === "health-monitoring") return true;
        
        return false;
      });
      
      const itemCount = categoryItems.reduce((total, item) => total + item.quantity, 0);
      
      return {
        ...category,
        itemCount,
        isComplete: itemCount >= 1, // Changed from category.estimatedItems to 1 for better UX
        items: categoryItems
      };
    });
    
    // Update completion score calculation to use FIRST_AID_CATEGORIES
    const categoriesWithItems = categoryBreakdown.filter(cat => cat.itemCount > 0).length; // Changed to check itemCount > 0
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
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" className="xs:size-default" onClick={handleSaveKitClick}>
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
          {categoryBreakdown.filter(cat => cat.isComplete).length} of {FIRST_AID_CATEGORIES.length} categories covered
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
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.log('Image failed to load for item:', item.name, 'URL:', item.imageUrl);
                        // Try multiple fallback approaches
                        if (target.src.includes('amazon.com') && item.asin) {
                          // Try to construct image URL from ASIN
                          target.src = `https://m.media-amazon.com/images/I/${item.asin}._SL1500_.jpg`;
                        } else if (target.src !== window.location.origin + "/placeholder.svg") {
                          target.src = "/placeholder.svg";
                        }
                      }}
                      onLoad={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.log('Image loaded successfully for item:', item.name, 'URL:', target.src);
                      }}
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        {/* Product name link - ensure it goes to Amazon directly */}
                        <a
                          href={bestOffer?.url && bestOffer.url !== '#' ? bestOffer.url : `https://www.amazon.com/dp/${item.asin || 'B0'}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sm hover:text-primary transition-colors line-clamp-2"
                          title={item.name}
                          onClick={(e) => {
                            // If the URL is invalid, prevent navigation and show an error
                            if ((!bestOffer || !bestOffer.url || bestOffer.url === '#') && !item.asin) {
                              e.preventDefault();
                              console.error('Invalid product URL for item:', item);
                              // Optionally show a toast notification to the user
                            }
                          }}
                        >
                          {item.name}
                        </a>
                        <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                        
                        {/* Price Info */}
                        {bestOffer && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(bestOffer.price)} ea • {bestOffer.name}
                            </span>
                            <a
                              href={bestOffer.url && bestOffer.url !== '#' ? bestOffer.url : `https://www.amazon.com/dp/${item.asin || 'B0'}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                              onClick={(e) => {
                                // If the URL is invalid, prevent navigation and show an error
                                if (!bestOffer.url || bestOffer.url === '#') {
                                  e.preventDefault();
                                  console.error('Invalid product URL for item:', item);
                                  // Optionally show a toast notification to the user
                                }
                              }}
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
              {category.isComplete ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium truncate block">{category.name}</span>
                {category.isComplete && (
                  <span className="text-xs text-gray-500">{category.items.length} items</span>
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
        
        {/* Amazon Add to Cart Button */}
        <div className="mt-4 pt-4 border-t">
          <Button 
            className="w-full bg-orange-600 hover:bg-orange-700 text-white" 
            asChild
          >
            <a
              href={generateAmazonAddToCartUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Amazon Cart
            </a>
          </Button>
        </div>
      </div>
      
      {/* Save Kit Dialog - Only render when user is authenticated */}
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

    </Card>
  );
};

export default KitSummary;