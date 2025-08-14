import { ChevronDown } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { ProductQuickView } from "@/components/products/ProductQuickView";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductComparison } from "@/components/products/ProductComparison";
import { ProductTable } from "@/components/products/ProductTable";
import { ProductListMobile } from "@/components/products/ProductListMobile";

import { Product } from "@/lib/types";
import { products as sharedProducts } from "@/lib/products";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useKit } from "@/context/kit-context";

const mock: Product[] = sharedProducts;

const Catalog = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : "";
  const [params, setParams] = useSearchParams();
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const asins = mock.map((p) => p.id).join(",");
    if (asins) {
      // Skip API call in development since the serverless function isn't running
      if (import.meta.env.DEV) {
        console.log('Skipping Amazon pricing API call in development');
        setPrices({});
        return;
      }
      
      fetch(`/api/amazon-pricing?asins=${asins}`)
        .then(async (res) => {
          // Check if response is actually JSON
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return res.json();
          } else {
            // If not JSON (likely HTML error page), return empty object
            console.warn('API endpoint returned non-JSON response, likely not available in development');
            return {};
          }
        })
        .then((data) => setPrices(data))
        .catch((error) => {
          console.warn('Failed to fetch pricing data:', error);
          // Set empty prices object on error
          setPrices({});
        });
    }
  }, []);

  const q = params.get("q") || "";
  const cat = params.get("cat") || "all";
  const sort = params.get("sort") || "relevance";
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [brands, setBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const isNarrow = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false;
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  // Advanced Filters: collapsed by default for more room
  const [advancedFiltersExpanded, setAdvancedFiltersExpanded] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>(mock.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    let items = mock.filter((p) =>
      (!term ||
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.features || []).some((f) => f.toLowerCase().includes(term))) &&
      (cat === "all" || p.category === cat)
    );

    const getBestPrice = (p: Product) => Math.min(...p.offers.map(o => o.price));

    // Apply new filters
    items = items.filter(p => {
      const price = getBestPrice(p);
      return price >= priceRange[0] &&
             price <= priceRange[1] &&
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
      default:
        break;
    }
    return items;
  }, [q, cat, sort, priceRange, brands, minRating]);

  const { kitCount } = useKit();
  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    // reset page param if we add pagination later
    setParams(next, { replace: true });
  };

  return (
    <main className="container mx-auto py-10">
      <Helmet>
  <title>Compare Athletic Tape & Bandage Prices | Save 20-40% | AT Supply Finder</title>
        <meta name="description" content="Compare prices on athletic tape, bandages, pre-wrap & training supplies across Amazon and top vendors. Professional-grade products with instant price comparison. Save 20-40% on every order." />
        <link rel="canonical" href={canonical} />
      </Helmet>



      <section className="mb-8">
        <div className="flex flex-col gap-6">
          {/* Search and Controls Row */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
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
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  aria-pressed={viewMode === 'grid'}
                  className="px-3"
                >
                  ⊞ Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                  className="px-3"
                >
                  ☰ List
                </Button>
              </div>
              
              {/* Sort Dropdown */}
              <div>
                <label htmlFor="catalog-sort" className="sr-only">
                  Sort products
                </label>
                <select
                  id="catalog-sort"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[120px] w-full max-w-[160px] sm:min-w-[160px] sm:w-auto"
                  value={sort}
                  onChange={(e) => updateParam("sort", e.currentTarget.value)}
                  aria-label="Sort products"
                >
                  <option value="relevance">Sort: Relevance</option>
                  <option value="price-asc">💰 Price: Low to High</option>
                  <option value="price-desc">💰 Price: High to Low</option>
                  <option value="name-asc">🔤 Name: A to Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">Filter by Category</h3>
            <div
              className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible snap-x"
              aria-label="Filter by category"
            >
              {categories.map((c) => {
                const isActive = c === cat;
                const productCount = c === "all" ? mock.length : mock.filter(p => p.category.toLowerCase() === c.toLowerCase()).length;
                return (
                  <Button
                    key={c}
                    variant={isActive ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => updateParam("cat", c === "all" ? "" : c)}
                    aria-pressed={isActive}
                    aria-label={`Filter by ${c}`}
                    className={`whitespace-nowrap rounded-full px-4 h-10 flex-shrink-0 snap-start relative active:scale-[0.95] transition ${isActive ? 'ring-2 ring-primary/40' : ''}`}
                  >
                    <span className="font-medium text-sm">
                      {c === "all" ? "All" : c.replace(/_/g, ' ')}
                    </span>
                    <span className="ml-2 text-[11px] opacity-70 bg-muted rounded-full px-2 py-0.5 leading-none">
                      {productCount}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Advanced Filters (collapsible) */}
          <div className="bg-muted/30 rounded-lg p-0 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 cursor-pointer select-none" onClick={() => setAdvancedFiltersExpanded(v => !v)}>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <span>Advanced Filters</span>
                <ChevronDown
                  className={`h-5 w-5 ml-1 transition-transform duration-200 ${advancedFiltersExpanded ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={e => {
                  e.stopPropagation();
                  setPriceRange([0, 1000]);
                  setBrands([]);
                  setMinRating(0);
                }}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>
            {advancedFiltersExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 pb-6">
                <div>
                  <label className="block mb-3 text-sm font-medium">💰 Price Range</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">${priceRange[0]}</span>
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full"
                      />
                      <span className="text-sm">${priceRange[1]}</span>
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      Showing products up to ${priceRange[1]}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block mb-3 text-sm font-medium">🏷️ Brands</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {Array.from(new Set(mock.map(p => p.brand))).filter(Boolean).map(brand => {
                      const productCount = mock.filter(p => p.brand === brand).length;
                      return (
                        <label key={brand} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={brands.includes(brand)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBrands([...brands, brand]);
                              } else {
                                setBrands(brands.filter(b => b !== brand));
                              }
                            }}
                            className="rounded"
                          />
                          <span>{brand}</span>
                          <span className="text-xs text-muted-foreground">({productCount})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block mb-3 text-sm font-medium">⭐ Minimum Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={`rating-${rating}`}
                        onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                        className={`p-2 rounded text-sm transition-colors ${
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
                  {minRating > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {minRating}+ stars only
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 border-t">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium">{filtered.length}</span> 
                <span className="text-muted-foreground"> result{filtered.length !== 1 ? "s" : ""}</span>
                {q && (
                  <span className="text-muted-foreground"> for "{q}"</span>
                )}
              </div>
              {(q || cat !== "all" || brands.length > 0 || minRating > 0 || priceRange[1] < 1000) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    updateParam("q", "");
                    updateParam("cat", "");
                    setBrands([]);
                    setMinRating(0);
                    setPriceRange([0, 1000]);
                  }}
                  className="text-xs"
                >
                  Clear all filters
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {selectedForCompare.length > 0 && (
                <div className="flex items-center gap-2">
                  <span>Comparing {selectedForCompare.length} products</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedForCompare([])}
                  >
                    Clear comparison
                  </Button>
                </div>
              )}
              <div className="hidden sm:block">
                💡 Tip: Click images to view on Amazon
              </div>
            </div>
          </div>
        </div>
      </section>

      {selectedForCompare.length > 0 && (
        <ProductComparison
          products={mock.filter(p => selectedForCompare.includes(p.id))}
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



      {filtered.length === 0 ? (
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
        (() => {
          if (viewMode === 'grid') {
            return (
              <ProductGrid
                products={filtered}
                selectedForCompare={selectedForCompare}
                toggleCompare={(id) => setSelectedForCompare(prev =>
                  prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                )}
                setQuickViewProduct={setQuickViewProduct}
              />
            );
          }
          if (viewMode === 'list') {
            // Always use mobile card variant for list view
            return (
              <ProductListMobile
                products={filtered}
                selectedForCompare={selectedForCompare}
                toggleCompare={(id) => setSelectedForCompare(prev =>
                  prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                )}
                setQuickViewProduct={setQuickViewProduct}
              />
            );
          }
          // grid view
          return (
            <ProductGrid
              products={filtered}
              selectedForCompare={selectedForCompare}
              toggleCompare={(id) => setSelectedForCompare(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
              )}
              setQuickViewProduct={setQuickViewProduct}
            />
          );
        })()
      )}
    </main>
  );
};

export default Catalog;
