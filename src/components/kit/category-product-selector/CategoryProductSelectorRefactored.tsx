import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Package, ArrowLeft } from "lucide-react";
import { useKit } from "@/context/kit-context";
import { Product } from "@/lib/types";
import { databases } from '@/lib/appwrite';
import { FIRST_AID_CATEGORIES, type FirstAidCategory } from "../FirstAidCategories";
import ProductDetail from "../ProductDetail";
import { CategoryProductSelectorProps } from "./types";
import { Header } from "./Header";
import { SearchBar } from "./SearchBar";
import { ProductFilters } from "./ProductFilters";
import { ProductGridView } from "./ProductGridView";
import { ProductTableView } from "./ProductTableView";
import { Query } from "appwrite";

export const CategoryProductSelectorRefactored = ({ categoryId, onBack }: CategoryProductSelectorProps) => {
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
      
      const productCategory = categoryMapping[categoryId];
      if (!productCategory) {
        console.error('Unknown category ID:', categoryId);
        setProducts([]);
        return;
      }

      // Build queries for Appwrite
      let queries: any[] = [
        Query.equal('category', productCategory)
      ];

      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        queries
      );

      if (!response || !response.documents) {
        console.error('Error fetching products: No response or documents');
        setProducts([]);
        return;
      }

      const transformedProducts: Product[] = response.documents.map(product => ({
        id: product.$id,
        name: product.name,
        brand: product.brand || 'Unknown',
        category: product.category,
        subcategory: product.subcategory,
        description: product.description || '',
        features: Array.isArray(product.features) 
          ? product.features 
          : (typeof product.features === 'string' && product.features.trim() !== '' 
            ? product.features.split(',').map(f => f.trim()) 
            : []),
        imageUrl: product.imageUrl,
        rating: product.rating || 0,
        offers: product.offers || [],
        lastUpdated: product.$updatedAt || new Date().toISOString()
      }));
      
      setProducts(transformedProducts);
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
      <Header 
        category={category} 
        onBack={onBack} 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
      />
      
      <SearchBar 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        sortBy={sortBy} 
        setSortBy={setSortBy} 
      />

      {/* Main Layout with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Filters */}
        <div className="lg:col-span-1">
          <ProductFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            brandFilter={brandFilter}
            setBrandFilter={setBrandFilter}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            ratingFilter={ratingFilter}
            setRatingFilter={setRatingFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            availableBrands={availableBrands}
            clearAllFilters={clearAllFilters}
            products={products}
            filteredProducts={filteredAndSortedProducts}
            filtersExpanded={filtersExpanded}
            setFiltersExpanded={setFiltersExpanded}
          />
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
            <ProductTableView
              products={filteredAndSortedProducts}
              isProductInKit={isProductInKit}
              getProductQuantity={(product: Product) => getProductQuantity(product.id)}
              handleProductToggle={handleProductToggle}
              handleQuantityChange={handleQuantityChange}
              formatCurrency={formatCurrency}
              setSelectedProduct={setSelectedProduct}
              sortBy={sortBy}
              sortDirection={sortDirection}
              handleSort={handleSort}
              getSortIcon={getSortIcon}
            />
          ) : (
            <ProductGridView
              products={filteredAndSortedProducts}
              isProductInKit={isProductInKit}
              getProductQuantity={getProductQuantity}
              handleProductToggle={handleProductToggle}
              handleQuantityChange={handleQuantityChange}
              formatCurrency={formatCurrency}
              setSelectedProduct={setSelectedProduct}
            />
          )}
        </div>
      </div>
    </div>
  );
};