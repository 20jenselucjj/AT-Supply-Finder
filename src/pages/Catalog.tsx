import { ChevronDown, Grid, List, SlidersHorizontal, X, Filter } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { ProductQuickView } from "@/components/products/ProductQuickView";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductComparison } from "@/components/products/ProductComparison";
import { ProductTable } from "@/components/products/ProductTable";
import { ProductListMobile } from "@/components/products/ProductListMobile";

import { Product } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useKit } from "@/context/kit-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Storage key for product cache
const PRODUCTS_CACHE_KEY = 'wrap_wizard_products_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const Catalog = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : "";
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>(() => {
    // Initialize from cache if available and not expired
    try {
      const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch {
      // Ignore cache errors
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const q = params.get("q") || "";
  const cat = params.get("cat") || "all";
  const sort = params.get("sort") || "relevance";

  // Cache products data
  const cacheProducts = useCallback((productsData: Product[]) => {
    try {
      localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({
        data: productsData,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to cache products:', error);
    }
  }, []);

  // Load products from database with retry logic
  const loadProducts = useCallback(async (isRetry = false) => {
    if (!isRetry) {
      setLoading(true);
      setError(null);
    } else {
      setIsRetrying(true);
    }
    
    try {
      console.log('Starting to load products...', isRetry ? '(retry)' : '');
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      // Test basic connection first
      const { data: testData, error: testError } = await supabase
        .from('products')
        .select('count')
        .limit(1);
      
      console.log('Connection test:', { testData, testError });
      
      if (testError) {
        throw new Error(`Connection test failed: ${testError.message}`);
      }
      
      // First, let's try a simple query without joins
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

        // Apply search filter
        if (q) {
          query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%,category.ilike.%${q}%`);
        }

        // Apply category filter
        if (cat !== 'all') {
          query = query.eq('category', cat);
        }

        const { data, error } = await query;
        
        console.log('Supabase query result:', { data, error });
        
        if (error) {
          console.error('Error loading products:', error);
          setError(`Database error: ${error.message}`);
          setProducts([]);
          return;
        }
        
        setError(null); // Clear any previous errors

        // Transform database products to match Product interface
        const transformedProducts: Product[] = (data || []).map(product => ({
          id: product.id,
          name: product.name,
          category: product.category,
          brand: product.brand,
          rating: product.rating || 0,
          imageUrl: product.image_url || '',
          asin: product.asin || '',
          dimensions: product.dimensions || '',
          weight: product.weight || '',
          material: product.material || '',
          features: product.features || [],
          price: product.price,
          affiliateLink: product.affiliate_link,
          offers: product.price ? [{
            name: 'Direct',
            price: product.price,
            url: product.affiliate_link || '#',
            lastUpdated: product.updated_at || new Date().toISOString()
          }] : []
        }));
        
        console.log('Loaded products from database:', transformedProducts.length);
        console.log('Sample product:', transformedProducts[0]);
        setProducts(transformedProducts);
        
        // Cache the products data
        cacheProducts(transformedProducts);
        
        // Reset retry count on success
        setRetryCount(0);
        setError(null);
      } catch (error) {
        console.error('Error loading products:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(`Failed to load products: ${errorMessage}`);
        
        // Only clear products if this is not a retry and we don't have cached data
        if (!isRetry) {
          setProducts([]);
        }
      } finally {
        setLoading(false);
        setIsRetrying(false);
      }
    }, [q, cat, cacheProducts]);

  // Retry function
  const retryLoadProducts = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      loadProducts(true);
    }
  }, [retryCount, loadProducts]);

  // Load products from database
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('category')
          .not('category', 'is', null);
        
        if (error) {
          console.error('Error loading categories:', error);
          return;
        }

        const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, []);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [brands, setBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const isNarrow = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false;
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  // Advanced Filters: collapsed by default for more room
  const [advancedFiltersExpanded, setAdvancedFiltersExpanded] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);

  const allCategories = useMemo(() => {
    return ["all", ...categories];
  }, [categories]);

  const filtered = useMemo(() => {
    let items = [...products];
    
    // Filter by category (additional client-side filtering)
    if (cat !== "all") {
      items = items.filter((p) => p.category === cat);
    }

    const getBestPrice = (p: Product) => {
      if (!p.offers || p.offers.length === 0) return 0;
      return Math.min(...p.offers.map(o => o.price));
    };

    // Apply new filters
    items = items.filter(p => {
      const price = getBestPrice(p);
      // Skip price filtering if product has no offers
      const priceInRange = p.offers.length === 0 || (price >= priceRange[0] && price <= priceRange[1]);
      return priceInRange &&
             (brands.length === 0 || brands.includes(p.brand)) &&
             (p.rating ? p.rating >= minRating : true);
    });

    switch (sort) {
      case "price-asc":
        items.sort((a, b) => getBestPrice(a) - getBestPrice(b));
        break;
      case "price-desc":
        items.sort((a, b) => getBestPrice(b) - getBestPrice(a));
        break;
      case "name-asc":
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "rating-desc":
        items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }
    
    console.log('Filtered products:', items.length, 'from', products.length, 'total');
    console.log('Current filters - cat:', cat, 'q:', q, 'priceRange:', priceRange, 'brands:', brands, 'minRating:', minRating);
    
    return items;
  }, [products, q, cat, sort, priceRange, brands, minRating]);

  const { kitCount } = useKit();
  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    // reset page param if we add pagination later
    setParams(next, { replace: true });
  };

  // Get unique brands for filtering
  const uniqueBrands = useMemo(() => {
    return Array.from(new Set(products.map(p => p.brand))).filter(Boolean).slice(0, 12);
  }, [products]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (cat !== "all") count++;
    if (brands.length > 0) count += brands.length;
    if (minRating > 0) count++;
    if (priceRange[1] < 1000) count++;
    return count;
  }, [cat, brands, minRating, priceRange]);

  return (
    <main className="container mx-auto py-6">
      <Helmet>
        <title>Compare Athletic Tape & Bandage Prices | Save 20-40% | AT Supply Finder</title>
        <meta name="description" content="Compare prices on athletic tape, bandages, pre-wrap & training supplies across Amazon and top vendors. Professional-grade products with instant price comparison. Save 20-40% on every order." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      {/* Header with Breadcrumbs */}
      <div className="mb-6">
        <nav className="text-sm text-muted-foreground mb-2">
          <Link to="/" className="hover:text-primary">Home</Link> / Catalog
        </nav>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Product Catalog</h1>
            <p className="text-muted-foreground mt-1">Discover professional-grade medical supplies and equipment</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex gap-1 border rounded-md p-1 bg-muted/50">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                className="px-3"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                className="px-3"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Sort Dropdown */}
            <div className="hidden sm:block">
              <label htmlFor="catalog-sort" className="sr-only">
                Sort products
              </label>
              <Select value={sort} onValueChange={(value) => updateParam("sort", value)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="rating-desc">Top Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Mobile Sort */}
            <div className="sm:hidden">
              <Select value={sort} onValueChange={(value) => updateParam("sort", value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price-asc">Price: Low</SelectItem>
                  <SelectItem value="price-desc">Price: High</SelectItem>
                  <SelectItem value="name-asc">Name: A-Z</SelectItem>
                  <SelectItem value="rating-desc">Top Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - Filters (Desktop) */}
        <aside className="lg:w-80 flex-shrink-0 hidden lg:block">
          <div className="bg-card border rounded-lg sticky top-4 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                {activeFilterCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      updateParam("cat", "");
                      setBrands([]);
                      setMinRating(0);
                      setPriceRange([0, 1000]);
                    }}
                    className="text-xs h-auto p-1"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {activeFilterCount > 0 ? `${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}` : 'No filters applied'}
              </p>
            </div>
            
            {/* Category Filters */}
            <div className="p-4 border-b flex-shrink-0">
              <button
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                className="flex items-center justify-between w-full text-sm font-semibold mb-3 hover:text-primary transition-colors"
              >
                <span>Categories</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${categoriesExpanded ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {categoriesExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 max-h-48 overflow-y-auto"
                  >
                    {allCategories.map((c) => {
                      const isActive = c === cat;
                      const productCount = c === "all" ? products.length : products.filter(p => p.category.toLowerCase() === c.toLowerCase()).length;
                      return (
                        <button
                          key={c}
                          onClick={() => updateParam("cat", c === "all" ? "" : c)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                            isActive 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          <span>{c === "all" ? "All Categories" : c.replace(/_/g, ' ')}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive 
                              ? 'bg-primary-foreground/20 text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {productCount}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Advanced Filters */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">More Filters</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setPriceRange([0, 1000]);
                    setBrands([]);
                    setMinRating(0);
                  }}
                  className="text-xs h-auto p-1"
                >
                  Clear
                </Button>
              </div>
              
              <div className="space-y-5">
                {/* Price Range */}
                <div>
                  <label className="block mb-2 text-sm font-medium">Price Range</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-muted px-2 py-1 rounded">${priceRange[0]}</span>
                      <div className="flex-1 h-px bg-border"></div>
                      <span className="bg-muted px-2 py-1 rounded">${priceRange[1]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                        className="flex-1"
                      />
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Brands */}
                <div>
                  <label className="block mb-2 text-sm font-medium">Brands</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uniqueBrands.map(brand => {
                      const productCount = products.filter(p => p.brand === brand).length;
                      const isChecked = brands.includes(brand);
                      return (
                        <label key={brand} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBrands([...brands, brand]);
                              } else {
                                setBrands(brands.filter(b => b !== brand));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="flex-1 truncate">{brand}</span>
                          <span className="text-xs text-muted-foreground">({productCount})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                
                {/* Rating */}
                <div>
                  <label className="block mb-2 text-sm font-medium">Minimum Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={`rating-${rating}`}
                        onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                        className={`p-2 rounded text-sm transition-colors flex-1 flex items-center justify-center ${
                          minRating >= rating 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                        title={`${rating} stars and above`}
                      >
                        {rating}★
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Content - Products */}
        <div className="flex-1 min-w-0">
          {/* Top Bar - Search, Results, Mobile Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex-1 max-w-md">
                <label htmlFor="catalog-search" className="sr-only">
                  Search products
                </label>
                <div className="relative">
                  <Input
                    id="catalog-search"
                    placeholder="Search tapes, bandages, brands..."
                    value={q}
                    onChange={(e) => updateParam("q", e.currentTarget.value)}
                    aria-label="Search products"
                    className="pl-10"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    🔍
                  </div>
                </div>
              </div>
              
              {/* Mobile Filter Trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-sm text-muted-foreground">
                        {activeFilterCount > 0 ? `${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}` : 'No filters applied'}
                      </p>
                      {activeFilterCount > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            updateParam("cat", "");
                            setBrands([]);
                            setMinRating(0);
                            setPriceRange([0, 1000]);
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Clear all
                        </Button>
                      )}
                    </div>
                  </SheetHeader>
                  
                  <div className="py-4 space-y-6">
                    {/* Category Filters */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Categories</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {allCategories.map((c) => {
                          const isActive = c === cat;
                          const productCount = c === "all" ? products.length : products.filter(p => p.category.toLowerCase() === c.toLowerCase()).length;
                          return (
                            <button
                              key={c}
                              onClick={() => {
                                updateParam("cat", c === "all" ? "" : c);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                                isActive 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-muted'
                              }`}
                            >
                              <span>{c === "all" ? "All Categories" : c.replace(/_/g, ' ')}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                isActive 
                                  ? 'bg-primary-foreground/20 text-primary-foreground' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {productCount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Price Range */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Price Range</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="bg-muted px-2 py-1 rounded">${priceRange[0]}</span>
                          <div className="flex-1 h-px bg-border"></div>
                          <span className="bg-muted px-2 py-1 rounded">${priceRange[1]}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1000"
                            value={priceRange[0]}
                            onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                            className="flex-1"
                          />
                          <input
                            type="range"
                            min="0"
                            max="1000"
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Brands */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Brands</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {uniqueBrands.map(brand => {
                          const productCount = products.filter(p => p.brand === brand).length;
                          const isChecked = brands.includes(brand);
                          return (
                            <label key={brand} className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBrands([...brands, brand]);
                                  } else {
                                    setBrands(brands.filter(b => b !== brand));
                                  }
                                }}
                                className="rounded"
                              />
                              <span className="flex-1 truncate">{brand}</span>
                              <span className="text-xs text-muted-foreground">({productCount})</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Rating */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Minimum Rating</h3>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={`rating-${rating}`}
                            onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                            className={`p-2 rounded text-sm transition-colors flex-1 flex items-center justify-center ${
                              minRating >= rating 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                            title={`${rating} stars and above`}
                          >
                            {rating}★
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground w-full sm:w-auto justify-between sm:justify-end">
              <div>
                <span className="font-medium">{filtered.length}</span> 
                <span className="text-muted-foreground"> result{filtered.length !== 1 ? "s" : ""}</span>
                {q && (
                  <span className="text-muted-foreground"> for "{q}"</span>
                )}
              </div>
              
              {selectedForCompare.length > 0 && (
                <div className="flex items-center gap-2">
                  <span>Comparing {selectedForCompare.length} products</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedForCompare([])}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Product Display */}
          {loading || isRetrying ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-semibold mb-2">
                {isRetrying ? 'Retrying...' : 'Loading products...'}
              </h3>
              <p className="text-muted-foreground">
                {isRetrying ? 'Attempting to reconnect to database' : 'Fetching the latest products from database'}
              </p>
              {isRetrying && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground">Retry attempt {retryCount} of 3</div>
                </div>
              )}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-2">Failed to load products</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {error}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {retryCount < 3 && (
                  <Button 
                    onClick={retryLoadProducts}
                    disabled={isRetrying}
                    className="min-w-32"
                  >
                    {isRetrying ? 'Retrying...' : 'Try Again'}
                  </Button>
                )}
                {products.length > 0 && (
                  <Button 
                    variant="outline"
                    onClick={() => setError(null)}
                  >
                    Show Cached Products ({products.length})
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link to="/">Go Home</Link>
                </Button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                No products match your current filters. Try adjusting your search terms or clearing some filters.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="outline"
                  onClick={() => {
                    updateParam("q", "");
                    updateParam("cat", "");
                    setBrands([]);
                    setMinRating(0);
                    setPriceRange([0, 1000]);
                  }}
                >
                  Clear All Filters
                </Button>
                <Button asChild variant="hero">
                  <Link to="/">Browse Categories</Link>
                </Button>
              </div>
            </div>
          ) : (
            viewMode === 'list' ? (
              <ProductListMobile
                products={filtered}
                selectedForCompare={selectedForCompare}
                toggleCompare={(id) => setSelectedForCompare(prev =>
                  prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                )}
                setQuickViewProduct={setQuickViewProduct}
              />
            ) : (
              <ProductGrid
                products={filtered}
                selectedForCompare={selectedForCompare}
                toggleCompare={(id) => setSelectedForCompare(prev =>
                  prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                )}
                setQuickViewProduct={setQuickViewProduct}
              />
            )
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedForCompare.length > 0 && (
        <ProductComparison
          products={products.filter(p => selectedForCompare.includes(p.id))}
          onClose={() => setSelectedForCompare([])}
        />
      )}

      <ProductQuickView
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onCompareToggle={(id) => setSelectedForCompare(prev =>
          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )}
        isComparing={selectedForCompare.includes(quickViewProduct?.id || '')}
      />
    </main>
  );
};

export default Catalog;