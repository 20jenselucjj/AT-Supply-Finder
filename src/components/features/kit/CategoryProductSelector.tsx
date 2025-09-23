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
import { Product } from "@/lib/types/types";
import { databases } from "@/lib/api/appwrite";
import { FIRST_AID_CATEGORIES, type FirstAidCategory } from "./FirstAidCategories";
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
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null); // Added setError state

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { kit, addToKit, removeFromKit, updateQuantity, getProductQuantity } = useKit();

  const category = FIRST_AID_CATEGORIES.find(cat => cat.id === categoryId);

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
      console.log('Fetching products for category:', categoryId);
      
      // Use the category ID directly since we've updated the database to use the build page category system
      const productCategory = categoryId;
      if (!productCategory) {
        console.error('Unknown category ID:', categoryId);
        setProducts([]);
        return;
      }

      // Query products from Appwrite database
      let queries = [];
      queries.push(JSON.stringify({ method: 'equal', attribute: 'category', values: [productCategory] }));

      // Add search query if provided (fixed: using searchTerm instead of searchQuery)
      if (searchTerm) {
        // For Appwrite, we'll get all documents and filter client-side to avoid fulltext index requirement
        console.log('Search term provided, will filter client-side:', searchTerm);
      }

      // Add brand filter if not 'all'
      if (brandFilter !== 'all') {
        queries.push(JSON.stringify({ method: 'equal', attribute: 'brand', values: [brandFilter] }));
      }

      // Add price range filters
      if (priceRange.min) {
        queries.push(JSON.stringify({ method: 'greaterThanEqual', attribute: 'price', values: [parseFloat(priceRange.min)] }));
      }
      if (priceRange.max) {
        queries.push(JSON.stringify({ method: 'lessThanEqual', attribute: 'price', values: [parseFloat(priceRange.max)] }));
      }

      // Add rating filter
      if (ratingFilter !== 'any') {
        const minRating = parseInt(ratingFilter);
        queries.push(JSON.stringify({ method: 'greaterThanEqual', attribute: 'rating', values: [minRating] }));
      }

      // Add limit and order
      queries.push(JSON.stringify({ method: 'limit', values: [50] }));
      queries.push(JSON.stringify({ method: 'orderDesc', attribute: '$createdAt' }));

      console.log('Appwrite query:', queries);

      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        queries
      );

      console.log('Appwrite response:', response);

      // Transform Appwrite documents to match Product interface
      let transformedProducts: Product[] = (response.documents || []).map((product: any) => {
        // Convert features string to array if needed
        let features: string[] = [];
        if (typeof product.features === 'string' && product.features.trim() !== '') {
          features = product.features.split('..').map((f: string) => f.trim());
        } else if (Array.isArray(product.features)) {
          features = product.features;
        }

        // Ensure imageUrl is properly set, checking both imageUrl and image_url
        const imageUrl = product.imageUrl || product.image_url || '';

        // Ensure offers array is properly structured with valid URLs
        let offers = product.offers || [];
        if (offers.length > 0) {
          offers = offers.map(offer => ({
            ...offer,
            url: offer.url && offer.url !== '#' ? offer.url : `https://www.amazon.com/dp/${product.asin || 'B0'}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`
          }));
        } else if (product.price) {
          offers = [{
            name: 'Direct',
            price: product.price,
            url: product.affiliateLink && product.affiliateLink !== '#' 
              ? product.affiliateLink 
              : `https://www.amazon.com/dp/${product.asin || 'B0'}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`,
            lastUpdated: product.updatedAt || new Date().toISOString()
          }];
        }

        return {
          id: product.$id,
          name: product.name,
          category: product.category,
          brand: product.brand,
          rating: product.rating || 0,
          imageUrl: imageUrl,
          asin: product.asin || '',
          dimensions: product.dimensions || '',
          weight: product.weight || '',
          material: product.material || '',
          features: features,
          price: product.price,
          affiliateLink: product.affiliateLink,
          offers: offers
        };
      });

      console.log('Transformed products:', transformedProducts);

      // Apply client-side search filtering if search term is provided (fixed: using searchTerm)
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        transformedProducts = transformedProducts.filter(product => 
          product.name.toLowerCase().includes(searchTermLower) ||
          (product.brand && product.brand.toLowerCase().includes(searchTermLower)) ||
          (product.category && product.category.toLowerCase().includes(searchTermLower)) ||
          (product.features && product.features.some(feature => feature.toLowerCase().includes(searchTermLower)))
        );
        console.log(`Filtered ${transformedProducts.length} products based on search term: ${searchTerm}`);
      }

      setProducts(transformedProducts);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response
      });
      setError(`Failed to load products: ${error.message}`);
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
        (product.features && product.features.some(feature => 
          feature.toLowerCase().includes(searchTerm.toLowerCase())
        ));
      
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
      // Add a temporary visual indicator
      setTimeout(() => {
        const rowElement = document.querySelector(`[data-product-id="${product.id}"]`);
        if (rowElement) {
          const quantityCell = rowElement.querySelector('td:first-child');
          if (quantityCell) {
            quantityCell.classList.add('bg-primary/10');
            setTimeout(() => {
              quantityCell.classList.remove('bg-primary/10');
            }, 1000);
          }
        }
      }, 100);
    }
  };

  const handleQuantityChange = (product: Product, change: number) => {
    const currentQuantity = getProductQuantity(product.id);
    const newQuantity = currentQuantity + change;
    
    if (newQuantity <= 0) {
      // Add visual feedback before removing
      const rowElement = document.querySelector(`[data-product-id="${product.id}"]`);
      if (rowElement) {
        rowElement.classList.add('bg-destructive/10');
        setTimeout(() => {
          removeFromKit(product.id);
        }, 300);
      } else {
        removeFromKit(product.id);
      }
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
          ) : error ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchCategoryProducts} variant="outline">
                  Retry
                </Button>
              </CardContent>
            </Card>
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
            <div className="border rounded-lg overflow-hidden" id="product-table-container">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20 text-left">Add/Remove</TableHead>
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="w-40">Product</TableHead>
                      <TableHead className="w-24">Brand</TableHead>
                      <TableHead className="w-20">Price</TableHead>
                      <TableHead className="w-20">Rating</TableHead>
                      <TableHead className="w-32">Vendors</TableHead>
                      <TableHead className="w-20">Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedProducts.map((product) => {
                      const inKit = isProductInKit(product.id);
                      const bestOffer = product.offers[0];
                      
                      return (
                        <TableRow 
                          key={product.id} 
                          className={`${inKit ? 'bg-primary/5' : ''} hover:bg-muted/50`}
                          data-product-id={product.id}
                        >
                          <TableCell className="py-2 relative text-left">
                            {inKit ? (
                              <div className="flex flex-col items-center gap-0.5 animate-in fade-in zoom-in-95 duration-300">
                                <Button 
                                  onClick={() => handleQuantityChange(product, 1)}
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 p-0"
                                  title="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <span className="min-w-[1.2rem] text-center text-xs font-medium bg-primary/10 px-1 rounded">
                                  {getProductQuantity(product.id)}
                                </span>
                                <Button 
                                  onClick={() => handleQuantityChange(product, -1)}
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 p-0"
                                  title={getProductQuantity(product.id) === 1 ? "Remove item" : "Decrease quantity"}
                                >
                                  {getProductQuantity(product.id) === 1 ? (
                                    <span className="text-xs">✕</span>
                                  ) : (
                                    <Minus className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                onClick={() => handleProductToggle(product)}
                                variant="outline"
                                size="sm"
                                className="h-7 px-2"
                                title="Add to kit"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                <span className="text-xs">Add</span>
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center overflow-hidden">
                              <img 
                                src={product.imageUrl || product.image_url || "/placeholder.svg"} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/placeholder.svg";
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="py-2 max-w-[150px]">
                            <div>
                              <button 
                                className="font-medium text-left hover:text-primary hover:underline line-clamp-2 text-sm"
                                onClick={() => setSelectedProduct(product)}
                              >
                                {product.name}
                              </button>
                              <div className="text-xs text-muted-foreground truncate">{product.brand}</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 truncate">{product.brand}</TableCell>
                          <TableCell className="py-2">
                            {bestOffer ? (
                              <span className="font-semibold">{formatCurrency(bestOffer.price)}</span>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            {product.rating && product.rating > 0 ? (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-primary text-primary" />
                                <span>{product.rating.toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No rating</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 max-w-[100px]">
                            <div className="max-w-[100px]">
                              {product.offers && product.offers.length > 0 ? (
                                <VendorComparison 
                                  offers={product.offers} 
                                  productName={product.name}
                                  compact={true}
                                  onVendorSelect={(offer) => {
                                    console.log('Selected vendor:', offer.name, 'for', product.name);
                                  }}
                                />
                              ) : (
                                <span className="text-muted-foreground text-xs">No vendors</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="space-y-1">
                              {product.specifications?.weight && product.specifications.weight !== 'N/A' && (
                                <div className="text-xs">
                                  {product.specifications.weight}
                                </div>
                              )}
                              {product.specifications?.quantity && product.specifications.quantity !== 'N/A' && (
                                <div className="text-xs">
                                  {product.specifications.quantity}
                                </div>
                              )}
                              {(!product.specifications?.weight || product.specifications.weight === 'N/A') && 
                               (!product.specifications?.quantity || product.specifications.quantity === 'N/A') && (
                                <span className="text-muted-foreground text-xs">N/A</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div 
              className="grid gap-6"
              style={{ 
                gridTemplateColumns: kit.length > 0 
                  ? 'repeat(auto-fill, minmax(200px, 1fr))' 
                  : 'repeat(auto-fill, minmax(240px, 1fr))'
              }}
            >
              {filteredAndSortedProducts.map((product) => {
                const isInKit = isProductInKit(product.id);
                const bestOffer = product.offers[0];
                
                return (
                  <Card key={product.id} className={`transition-all hover:shadow-lg h-full flex flex-col ${isInKit ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-4 flex flex-col flex-grow">
                      <div className="space-y-3 flex flex-col h-full">
                        {/* Product Image */}
                        <div className="bg-secondary/70 rounded-xl p-3 flex items-center justify-center aspect-square relative overflow-hidden flex-grow">
                          <img
                            src={product.imageUrl || product.image_url || '/placeholder.svg'}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain hover:scale-105 transition-transform duration-300 rounded-xl"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder.svg";
                            }}
                          />
                          {isInKit && (
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                              In Kit
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="space-y-2 flex-grow">
                          <button 
                            className="font-semibold line-clamp-2 text-left hover:text-primary hover:underline w-full text-sm"
                            onClick={() => setSelectedProduct(product)}
                          >
                            {product.name}
                          </button>
                          <p className="text-xs text-muted-foreground">{product.brand}</p>
                          
                          {/* Add weight/quantity in grid view */}
                          <div className="flex flex-wrap gap-1 text-xs">
                            {(product.specifications?.quantity && product.specifications.quantity !== 'N/A') ? (
                              <Badge variant="outline" className="text-xs px-2 py-1">
                                Qty: {product.specifications.quantity}
                              </Badge>
                            ) : (
                              (product.specifications?.weight && product.specifications.weight !== 'N/A') && (
                                <Badge variant="outline" className="text-xs px-2 py-1">
                                  Qty: {product.specifications.weight}
                                </Badge>
                              )
                            )}
                          </div>
                          
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            {bestOffer && (
                              <span className="text-lg font-bold text-primary">
                                ${bestOffer.price.toFixed(2)}
                              </span>
                            )}
                            
                            {product.rating && product.rating > 0 ? (
                              <div className="flex items-center bg-secondary/60 px-2 py-1 rounded-full text-xs">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                <span className="font-medium">{product.rating.toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">No ratings</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {isInKit ? (
                            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 flex-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(product, -1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-medium text-xs px-1">
                                {getProductQuantity(product.id)}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(product, 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleProductToggle(product)}
                              size="sm"
                              className="flex-1"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProduct(product)}
                            className="h-8 w-8 p-0"
                          >
                            <Package className="w-4 h-4" />
                          </Button>
                        </div>
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