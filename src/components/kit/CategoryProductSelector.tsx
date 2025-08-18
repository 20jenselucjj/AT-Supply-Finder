import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, Package, Star, Plus, Minus, Filter, Grid, List, ChevronUp, ChevronDown, Check } from "lucide-react";
import { useKit } from "@/context/kit-context";
import { Product } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { AT_SUPPLY_CATEGORIES, type ATSupplyCategory } from "./ATSupplyCategories";
import ProductSpecifications from "./ProductSpecifications";
import VendorComparison from "./VendorComparison";
import ProductDetail from "./ProductDetail";

interface CategoryProductSelectorProps {
  categoryId: string;
  onBack: () => void;
}

const CategoryProductSelector = ({ categoryId, onBack }: CategoryProductSelectorProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "rating" | "brand">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [ratingFilter, setRatingFilter] = useState<string>("any");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { kit, addToKit, removeFromKit, updateQuantity, getProductQuantity } = useKit();

  const category = AT_SUPPLY_CATEGORIES.find(cat => cat.id === categoryId);

  // Format currency helper
  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  useEffect(() => {
    fetchCategoryProducts();
  }, [categoryId]);

  const fetchCategoryProducts = async () => {
    try {
      setLoading(true);
      
      const categoryMapping: Record<string, string> = {
        "taping-bandaging": "Taping & Bandaging",
        "first-aid-wound-care": "First Aid & Wound Care",
        "instruments-tools": "Instruments & Tools",
        "hot-cold-therapy": "Hot & Cold Therapy",
        "injury-prevention-rehab": "Injury Prevention & Rehab",
        "protective-equipment": "Protective Equipment",
        "hydration-nutrition": "Hydration & Nutrition",
        "cleaning-sanitization": "Cleaning & Sanitization",
        "documentation-forms": "Documentation & Forms",
        "emergency-equipment": "Emergency Equipment"
      };
      
      const productCategory = categoryMapping[categoryId];
      if (!productCategory) {
        console.error('Unknown category ID:', categoryId);
        setProducts([]);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', productCategory);

      if (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } else {
        const transformedProducts: Product[] = (data || []).map(product => ({
          id: product.id,
          name: product.name,
          brand: product.brand || 'Unknown',
          category: product.category,
          subcategory: product.subcategory,
          description: product.description || '',
          features: product.features || [],
          imageUrl: product.image_url,
          rating: product.rating || 0,
          offers: product.offers || [],
          lastUpdated: product.updated_at || new Date().toISOString()
        }));
        setProducts(transformedProducts);
      }
    } catch (error) {
      console.error('Error in fetchCategoryProducts:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.features.some(feature => 
          feature.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesBrand = !brandFilter || brandFilter === "all" || product.brand === brandFilter;
      
      const matchesPrice = (() => {
        if (!priceRange.min && !priceRange.max) return true;
        const bestOffer = product.offers[0];
        if (!bestOffer) return false;
        
        const price = bestOffer.price;
        const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
        const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        
        return price >= minPrice && price <= maxPrice;
      })();
      
      const matchesRating = !ratingFilter || ratingFilter === "any" || (product.rating && product.rating >= parseFloat(ratingFilter));
      
      return matchesSearch && matchesBrand && matchesPrice && matchesRating;
    });

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "price":
          aValue = a.offers[0]?.price || 0;
          bValue = b.offers[0]?.price || 0;
          break;
        case "rating":
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case "brand":
          aValue = a.brand.toLowerCase();
          bValue = b.brand.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, searchTerm, brandFilter, priceRange, ratingFilter, sortBy, sortDirection]);

  const availableBrands = useMemo(() => {
    const brands = [...new Set(products.map(p => p.brand))].filter(Boolean);
    return brands.sort();
  }, [products]);

  const isProductInKit = (productId: string) => {
    return kit.some(item => item.id === productId);
  };

  const handleProductToggle = (product: Product) => {
    if (isProductInKit(product.id)) {
      removeFromKit(product.id);
    } else {
      addToKit(product, 1);
    }
  };

  const handleQuantityChange = (product: Product, change: number) => {
    const currentQuantity = getProductQuantity(product.id);
    const newQuantity = currentQuantity + change;
    if (newQuantity <= 0) {
      removeFromKit(product.id);
    } else {
      if (currentQuantity === 0) {
        addToKit(product, newQuantity);
      } else {
        updateQuantity(product.id, newQuantity);
      }
    }
  };

  const handleSort = (field: "name" | "price" | "rating" | "brand") => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setBrandFilter("all");
    setPriceRange({ min: "", max: "" });
    setRatingFilter("any");
  };

  const getSortIcon = (field: "name" | "price" | "rating" | "brand") => {
    if (sortBy !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  if (!category) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Category not found.</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Categories
        </Button>
      </div>
    );
  }

  // Show ProductDetail if a product is selected
  if (selectedProduct) {
    return (
      <ProductDetail 
        product={selectedProduct} 
        onBack={() => setSelectedProduct(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{category.name}</h1>
            <p className="text-muted-foreground">{category.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value: "name" | "price" | "rating" | "brand") => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="brand">Brand</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Layout with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Filters */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-hidden flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </div>
                <button
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
                </button>
              </CardTitle>
            </CardHeader>
            {filtersExpanded && (
              <CardContent className="flex-1 overflow-y-auto space-y-6">
                {/* Brand Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand</label>
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All brands</SelectItem>
                    {availableBrands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Price Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Price Range</label>
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Min price"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Max price"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  />
                </div>
              </div>
              
              {/* Rating Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Rating</label>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any rating</SelectItem>
                    <SelectItem value="4">4+ stars</SelectItem>
                    <SelectItem value="3">3+ stars</SelectItem>
                    <SelectItem value="2">2+ stars</SelectItem>
                    <SelectItem value="1">1+ stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Actions */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="w-full"
                  size="sm"
                >
                  Clear All Filters
                </Button>
                <div className="text-center">
                  <Badge variant="outline">
                    {filteredAndSortedProducts.length} of {products.length} products
                  </Badge>
                </div>
              </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right Content - Products */}
        <div className="lg:col-span-3">
          {/* Products Display */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {products.length === 0 
                    ? "No products available in this category yet." 
                    : "No products match your current filters."}
                </p>
                {searchTerm || (brandFilter && brandFilter !== "all") ? (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("");
                      setBrandFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : viewMode === "table" ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("name")} className="flex items-center gap-2 p-0">
                        Product
                        {getSortIcon("name")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("brand")} className="flex items-center gap-2 p-0">
                    Brand
                    {getSortIcon("brand")}
                  </Button>
                </TableHead>
                <TableHead>Specifications</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("price")} className="flex items-center gap-2 p-0">
                    Price
                    {getSortIcon("price")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("rating")} className="flex items-center gap-2 p-0">
                    Rating
                    {getSortIcon("rating")}
                  </Button>
                </TableHead>
                <TableHead>Vendors</TableHead>
                <TableHead>Reviews</TableHead>
                <TableHead className="w-32">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedProducts.map((product) => {
                const inKit = isProductInKit(product.id);
                const bestOffer = product.offers[0];
                
                return (
                  <TableRow key={product.id} className={inKit ? 'bg-primary/5' : ''}>
                    <TableCell>
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center overflow-hidden">
                        <img 
                          src={product.imageUrl || "/placeholder.svg"} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img 
                          src={product.imageUrl || "/placeholder.svg"} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <button 
                            className="font-medium text-left hover:text-blue-600 hover:underline"
                            onClick={() => setSelectedProduct(product)}
                          >
                            {product.name}
                          </button>
                          <div className="text-sm text-muted-foreground">{product.brand}</div>
                          {product.features && product.features.length > 0 && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {product.features.slice(0, 2).join(", ")}
                              {product.features.length > 2 && "..."}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>
                      <ProductSpecifications product={product} />
                    </TableCell>
                    <TableCell>
                      {bestOffer ? (
                        <span className="font-semibold">{formatCurrency(bestOffer.price)}</span>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.rating && product.rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{product.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No rating</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.offers && product.offers.length > 0 ? (
                        <div className="max-w-xs">
                          <VendorComparison 
                            offers={product.offers} 
                            productName={product.name}
                            onVendorSelect={(offer) => {
                              console.log('Selected vendor:', offer.name, 'for', product.name);
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No vendors</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.reviews && product.reviews.length > 0 ? (
                        <button 
                          className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                          onClick={() => setSelectedProduct(product)}
                        >
                          {product.reviews.length} review{product.reviews.length !== 1 ? 's' : ''}
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-sm">No reviews</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {inKit ? (
                        <div className="flex items-center gap-1">
                          <Button 
                            onClick={() => handleQuantityChange(product, -1)}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="min-w-[2rem] text-center text-sm font-medium">
                            {getProductQuantity(product.id)}
                          </span>
                          <Button 
                            onClick={() => handleQuantityChange(product, 1)}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => handleProductToggle(product)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedProducts.map((product) => {
                const isInKit = isProductInKit(product.id);
                const bestOffer = product.offers[0];
                
                return (
                  <Card key={product.id} className={`transition-all ${isInKit ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-12 h-12 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <button 
                        className="font-semibold line-clamp-2 text-left hover:text-blue-600 hover:underline w-full"
                        onClick={() => setSelectedProduct(product)}
                      >
                        {product.name}
                      </button>
                      <p className="text-sm text-muted-foreground">{product.brand}</p>
                      
                      {product.features && product.features.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {product.features.slice(0, 3).join(", ")}
                          {product.features.length > 3 && "..."}
                        </div>
                      )}
                      
                      {/* Product Specifications */}
                      <ProductSpecifications product={product} />
                      
                      {/* Vendor Comparison */}
                      {product.offers && product.offers.length > 0 && (
                        <VendorComparison 
                          offers={product.offers} 
                          productName={product.name}
                          onVendorSelect={(offer) => {
                            console.log('Selected vendor:', offer.name, 'for', product.name);
                          }}
                        />
                      )}
                      
                      {/* Reviews Summary */}
                      {product.reviews && product.reviews.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{product.rating?.toFixed(1)}</span>
                          </div>
                          <button 
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                            onClick={() => setSelectedProduct(product)}
                          >
                            ({product.reviews.length} review{product.reviews.length !== 1 ? 's' : ''})
                          </button>
                        </div>
                      )}
                      
                      {product.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{product.rating}</span>
                        </div>
                      )}
                      
                      {bestOffer && (
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">{formatCurrency(bestOffer.price)}</span>
                          <Badge variant="outline">{bestOffer.name}</Badge>
                        </div>
                      )}
                    </div>
                    
                    {isInKit ? (
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => handleQuantityChange(product, -1)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="min-w-[3rem] text-center text-sm font-medium">
                          Qty: {getProductQuantity(product.id)}
                        </span>
                        <Button 
                          onClick={() => handleQuantityChange(product, 1)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handleProductToggle(product)}
                        variant="outline"
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Kit
                      </Button>
                    )}
                  </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryProductSelector;