import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { toast } from 'sonner';
import { Package, Plus, Trash2, Edit, Star, DollarSign, ExternalLink, Trash } from 'lucide-react';
import { format } from 'date-fns';

interface ProductData {
  id: string;
  name: string;
  category: string;
  brand: string;
  rating?: number;
  price?: number;
  dimensions?: string;
  weight?: string;
  material?: string;
  features?: string[];
  image_url?: string;
  asin?: string;
  affiliate_link?: string;
  created_at: string;
  updated_at: string;
  vendor_offers?: VendorOffer[];
}

interface VendorOffer {
  id: string;
  vendor_name: string;
  url: string;
  price: number;
  last_updated: string;
}

interface ProductManagementProps {
  totalProducts: number;
  onProductCountChange: (count: number) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ totalProducts, onProductCountChange }) => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    brand: '',
    rating: '',
    price: '',
    dimensions: '',
    weight: '',
    material: '',
    features: '',
    image_url: '',
    asin: '',
    affiliate_link: ''
  });
  
  const [isLoadingProductInfo, setIsLoadingProductInfo] = useState(false);
  
  const productsPerPage = 10;

  const fetchProducts = async (page = 1, search = '', category = 'all') => {
    try {
      setLoading(true);
      
      let query = supabaseAdmin
        .from('products')
        .select(`
          *,
          vendor_offers (
            id,
            vendor_name,
            url,
            price,
            last_updated
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * productsPerPage, page * productsPerPage - 1);

      if (search) {
        query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,category.ilike.%${search}%`);
      }

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to fetch products');
        return;
      }

      setProducts(data || []);
      setTotalPages(Math.ceil((count || 0) / productsPerPage));
      onProductCountChange(count || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('category')
        .not('category', 'is', null);
      
      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      category: '',
      brand: '',
      rating: '',
      price: '',
      dimensions: '',
      weight: '',
      material: '',
      features: '',
      image_url: '',
      asin: '',
      affiliate_link: ''
    });
  };

  // Bulk selection functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(products.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      toast.error('No products selected');
      return;
    }

    try {
      setIsDeleting(true);
      const productIds = Array.from(selectedProducts);
      
      const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .in('id', productIds);

      if (error) {
        toast.error(`Failed to delete products: ${error.message}`);
        return;
      }

      toast.success(`Successfully deleted ${productIds.length} product${productIds.length > 1 ? 's' : ''}`);
      setSelectedProducts(new Set());
      fetchProducts(currentPage, searchTerm, selectedCategory);
    } catch (error) {
      console.error('Error deleting products:', error);
      toast.error('Failed to delete products');
    } finally {
      setIsDeleting(false);
    }
  };

  const isAllSelected = products.length > 0 && selectedProducts.size === products.length;
  const isIndeterminate = selectedProducts.size > 0 && selectedProducts.size < products.length;



  // Extract ASIN from Amazon affiliate link
  const extractASINFromLink = (url: string): string | null => {
    try {
      // Common Amazon URL patterns
      const patterns = [
        /\/dp\/([A-Z0-9]{10})/i,
        /\/gp\/product\/([A-Z0-9]{10})/i,
        /\/product\/([A-Z0-9]{10})/i,
        /asin=([A-Z0-9]{10})/i,
        /\/([A-Z0-9]{10})(?:\/|\?|$)/i
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      return null;
    } catch (error) {
      console.error('Error extracting ASIN:', error);
      return null;
    }
  };

  // Auto-populate product information from affiliate link
  const handleAffiliateLinkChange = async (url: string) => {
    setProductForm(prev => ({ ...prev, affiliate_link: url }));
    
    if (!url.trim()) return;
    
    const asin = extractASINFromLink(url);
    if (!asin) {
      toast.error('Could not extract ASIN from the provided link');
      return;
    }
    
    setIsLoadingProductInfo(true);
    
    try {
      // Call our scraping API to get product information
      const response = await fetch('http://localhost:3001/api/scrape-amazon-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to scrape product information');
      }
      
      if (result.success && result.data) {
        const productData = result.data;
        
        // Auto-populate the form with scraped data
        setProductForm(prev => ({
          ...prev,
          name: productData.name || prev.name,
          brand: productData.brand || prev.brand,
          category: productData.category || prev.category,
          image_url: productData.image_url || prev.image_url,
          asin: productData.asin || prev.asin,
          rating: productData.rating ? productData.rating.toString() : prev.rating,
          price: productData.price ? productData.price.toString() : prev.price,
          dimensions: productData.dimensions || prev.dimensions,
          weight: productData.weight || prev.weight,
          material: productData.material || prev.material,
          features: productData.features ? productData.features.join('\n') : prev.features
        }));
        
        toast.success('Product information extracted successfully!');
      } else {
        // Fallback to just extracting ASIN
        setProductForm(prev => ({ ...prev, asin }));
        toast.success(`ASIN extracted: ${asin}. Please fill in the remaining product details manually.`);
      }
      
    } catch (error) {
      console.error('Error processing affiliate link:', error);
      // Fallback to just extracting ASIN
      setProductForm(prev => ({ ...prev, asin }));
      toast.error(`Failed to auto-populate product info: ${error.message}. ASIN extracted: ${asin}`);
    } finally {
      setIsLoadingProductInfo(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      if (!productForm.name || !productForm.category || !productForm.brand) {
        toast.error('Name, category, and brand are required');
        return;
      }

      const productData = {
        name: productForm.name,
        category: productForm.category,
        brand: productForm.brand,
        rating: productForm.rating ? parseFloat(productForm.rating) : null,
        price: productForm.price ? parseFloat(productForm.price) : null,
        dimensions: productForm.dimensions || null,
        weight: productForm.weight || null,
        material: productForm.material || null,
        features: productForm.features ? productForm.features.split('\n').filter(f => f.trim()) : null,
        image_url: productForm.image_url || null,
        asin: productForm.asin || null,
        affiliate_link: productForm.affiliate_link || null
      };

      const { error } = await supabaseAdmin
        .from('products')
        .insert(productData);

      if (error) {
        toast.error(`Failed to create product: ${error.message}`);
        return;
      }

      toast.success('Product created successfully');
      setIsAddProductOpen(false);
      resetForm();
      fetchProducts(currentPage, searchTerm, selectedCategory);
      fetchCategories();
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      const productData = {
        name: productForm.name,
        category: productForm.category,
        brand: productForm.brand,
        rating: productForm.rating ? parseFloat(productForm.rating) : null,
        price: productForm.price ? parseFloat(productForm.price) : null,
        dimensions: productForm.dimensions || null,
        weight: productForm.weight || null,
        material: productForm.material || null,
        features: productForm.features ? productForm.features.split('\n').filter(f => f.trim()) : null,
        image_url: productForm.image_url || null,
        asin: productForm.asin || null,
        affiliate_link: productForm.affiliate_link || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseAdmin
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) {
        toast.error(`Failed to update product: ${error.message}`);
        return;
      }

      toast.success('Product updated successfully');
      setEditingProduct(null);
      resetForm();
      fetchProducts(currentPage, searchTerm, selectedCategory);
      fetchCategories();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) {
        toast.error(`Failed to delete product: ${error.message}`);
        return;
      }

      toast.success('Product deleted successfully');
      fetchProducts(currentPage, searchTerm, selectedCategory);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const openEditDialog = (product: ProductData) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      brand: product.brand,
      rating: product.rating?.toString() || '',
      price: product.price?.toString() || '',
      dimensions: product.dimensions || '',


      weight: product.weight || '',
      material: product.material || '',
      features: product.features?.join('\n') || '',
      image_url: product.image_url || '',
      asin: product.asin || '',
      affiliate_link: product.affiliate_link || ''
    });
  };

  const getMinPrice = (offers: VendorOffer[] = []) => {
    if (offers.length === 0) return null;
    return Math.min(...offers.map(offer => offer.price));
  };

  useEffect(() => {
    fetchProducts(currentPage, searchTerm, selectedCategory);
  }, [currentPage, selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchProducts(1, searchTerm, selectedCategory);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Management
              </CardTitle>
              <CardDescription>
                Manage your product catalog. Total products: {totalProducts}
              </CardDescription>
            </div>
            <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Create a new product manually.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="affiliate_link">Amazon Affiliate Link</Label>
                    <div className="flex gap-2">
                      <Input
                        id="affiliate_link"
                        value={productForm.affiliate_link}
                        onChange={(e) => handleAffiliateLinkChange(e.target.value)}
                        placeholder="Paste Amazon affiliate link to auto-populate product info"
                        disabled={isLoadingProductInfo}
                      />
                      {isLoadingProductInfo && (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Paste an Amazon product link to automatically extract the ASIN and help populate product details
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={productForm.category}
                      onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Athletic Tape"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand *</Label>
                    <Input
                      id="brand"
                      value={productForm.brand}
                      onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="e.g., Mueller"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rating">Rating (0-5)</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={productForm.rating}
                      onChange={(e) => setProductForm(prev => ({ ...prev, rating: e.target.value }))}
                      placeholder="4.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="29.99"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dimensions">Dimensions</Label>
                    <Input
                      id="dimensions"
                      value={productForm.dimensions}
                      onChange={(e) => setProductForm(prev => ({ ...prev, dimensions: e.target.value }))}
                      placeholder="e.g., 1.5in x 15yd"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight</Label>
                    <Input
                      id="weight"
                      value={productForm.weight}
                      onChange={(e) => setProductForm(prev => ({ ...prev, weight: e.target.value }))}
                      placeholder="e.g., 3.2 lbs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="material">Material</Label>
                    <Input
                      id="material"
                      value={productForm.material}
                      onChange={(e) => setProductForm(prev => ({ ...prev, material: e.target.value }))}
                      placeholder="e.g., Cotton blend"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="features">Features (one per line)</Label>
                    <Textarea
                      id="features"
                      value={productForm.features}
                      onChange={(e) => setProductForm(prev => ({ ...prev, features: e.target.value }))}
                      placeholder="High tensile strength\nHypoallergenic adhesive\nEasy tear"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input
                      id="image_url"
                      value={productForm.image_url}
                      onChange={(e) => setProductForm(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="asin">ASIN</Label>
                    <Input
                      id="asin"
                      value={productForm.asin}
                      onChange={(e) => setProductForm(prev => ({ ...prev, asin: e.target.value }))}
                      placeholder="Amazon ASIN"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsAddProductOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddProduct}>
                    Create Product
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} variant="outline">
              Search
            </Button>
            {selectedProducts.size > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedProducts.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Products</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedProducts.size} selected product{selectedProducts.size > 1 ? 's' : ''}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete} disabled={isDeleting}>
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          ref={(el) => {
                            if (el) el.indeterminate = isIndeterminate;
                          }}
                        />
                      </TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const minPrice = getMinPrice(product.vendor_offers);
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.has(product.id)}
                              onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.image_url && (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {product.dimensions && `${product.dimensions} • `}
                                  {product.weight}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell>{product.brand}</TableCell>
                          <TableCell>
                            {product.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                {product.rating}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.vendor_offers && product.vendor_offers.length > 0
                              ? `$${product.vendor_offers.reduce((min, p) => p.price < min ? p.price : min, product.vendor_offers[0].price).toFixed(2)}`
                              : product.price ? `$${product.price.toFixed(2)}` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(product)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Edit Product</DialogTitle>
                                  <DialogDescription>
                                    Update product information.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="col-span-2">
                                    <Label htmlFor="edit-affiliate_link">Amazon Affiliate Link</Label>
                                    <div className="flex gap-2">
                                      <Input
                                        id="edit-affiliate_link"
                                        value={productForm.affiliate_link}
                                        onChange={(e) => handleAffiliateLinkChange(e.target.value)}
                                        placeholder="Paste Amazon affiliate link to auto-populate product info"
                                        disabled={isLoadingProductInfo}
                                      />
                                      {isLoadingProductInfo && (
                                        <div className="flex items-center">
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Paste an Amazon product link to automatically extract the ASIN and help populate product details
                                    </p>
                                  </div>
                                  <div className="col-span-2">
                                    <Label htmlFor="edit-name">Product Name *</Label>
                                    <Input
                                      id="edit-name"
                                      value={productForm.name}
                                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-category">Category *</Label>
                                    <Input
                                      id="edit-category"
                                      value={productForm.category}
                                      onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-brand">Brand *</Label>
                                    <Input
                                      id="edit-brand"
                                      value={productForm.brand}
                                      onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-rating">Rating (0-5)</Label>
                                    <Input
                                      id="edit-rating"
                                      type="number"
                                      min="0"
                                      max="5"
                                      step="0.1"
                                      value={productForm.rating}
                                      onChange={(e) => setProductForm(prev => ({ ...prev, rating: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-price">Price ($)</Label>
                                    <Input
                                      id="edit-price"
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={productForm.price}
                                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                                      placeholder="29.99"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-dimensions">Dimensions</Label>
                                    <Input
                                      id="edit-dimensions"
                                      value={productForm.dimensions}
                                      onChange={(e) => setProductForm(prev => ({ ...prev, dimensions: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-weight">Weight</Label>
                                    <Input
                                      id="edit-weight"
                                      value={productForm.weight}
                                      onChange={(e) => setProductForm(prev => ({ ...prev, weight: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-material">Material</Label>
                                    <Input
                                      id="edit-material"
                                      value={productForm.material}
                                      onChange={(e) => setProductForm(prev => ({ ...prev, material: e.target.value }))}
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <Label htmlFor="edit-features">Features (one per line)</Label>
                                    <Textarea
                                      id="edit-features"
                                      value={productForm.features}
                                      onChange={(e) => setProductForm(prev => ({ ...prev, features: e.target.value }))}
                                      rows={3}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-image_url">Image URL</Label>
                                    <Input
                                      id="edit-image_url"
                                      value={productForm.image_url}
                                      onChange={(e) => setProductForm(prev => ({ ...prev, image_url: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-asin">ASIN</Label>
                                    <Input
                                      id="edit-asin"
                                      value={productForm.asin}
                                      onChange={(e) => setProductForm(prev => ({ ...prev, asin: e.target.value }))}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => {
                                    setEditingProduct(null);
                                    resetForm();
                                  }}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleUpdateProduct}>
                                    Update Product
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {/* Mobile Select All */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                  />
                  <Label className="text-sm font-medium">Select All</Label>
                </div>
                {selectedProducts.size > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {selectedProducts.size} selected
                  </span>
                )}
              </div>

              {products.map((product) => {
                const minPrice = getMinPrice(product.vendor_offers);
                return (
                  <Card key={product.id} className="p-4">
                    <div className="space-y-3">
                      {/* Header with checkbox and product info */}
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                          className="mt-1 flex-shrink-0"
                        />
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                          <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">{product.category}</Badge>
                            <span>{product.brand}</span>
                          </div>
                        </div>
                      </div>

                      {/* Product details */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <Label className="text-xs text-muted-foreground">Price</Label>
                          <div className="font-medium">
                            {product.vendor_offers && product.vendor_offers.length > 0
                              ? `$${product.vendor_offers.reduce((min, p) => p.price < min ? p.price : min, product.vendor_offers[0].price).toFixed(2)}`
                              : product.price ? `$${product.price.toFixed(2)}` : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Rating</Label>
                          <div className="flex items-center gap-1">
                            {product.rating ? (
                              <>
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-medium">{product.rating}</span>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dimensions and weight */}
                      {(product.dimensions || product.weight) && (
                        <div className="text-xs text-muted-foreground">
                          {product.dimensions && `${product.dimensions}`}
                          {product.dimensions && product.weight && ' • '}
                          {product.weight}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-9"
                              onClick={() => openEditDialog(product)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              <span className="text-xs">Edit</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Product</DialogTitle>
                              <DialogDescription>
                                Update product information.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="col-span-full">
                                <Label htmlFor="mobile-edit-affiliate_link">Amazon Affiliate Link</Label>
                                <div className="flex gap-2">
                                  <Input
                                    id="mobile-edit-affiliate_link"
                                    value={productForm.affiliate_link}
                                    onChange={(e) => handleAffiliateLinkChange(e.target.value)}
                                    placeholder="Paste Amazon affiliate link to auto-populate product info"
                                    disabled={isLoadingProductInfo}
                                  />
                                  {isLoadingProductInfo && (
                                    <div className="flex items-center">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Paste an Amazon product link to automatically extract the ASIN and help populate product details
                                </p>
                              </div>
                              <div className="col-span-full">
                                <Label htmlFor="mobile-edit-name">Product Name *</Label>
                                <Input
                                  id="mobile-edit-name"
                                  value={productForm.name}
                                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="mobile-edit-category">Category *</Label>
                                <Input
                                  id="mobile-edit-category"
                                  value={productForm.category}
                                  onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="mobile-edit-brand">Brand *</Label>
                                <Input
                                  id="mobile-edit-brand"
                                  value={productForm.brand}
                                  onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingProduct(null)}>
                                Cancel
                              </Button>
                              <Button onClick={handleUpdateProduct}>
                                Update Product
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 h-9">
                              <Trash2 className="h-4 w-4 mr-2" />
                              <span className="text-xs">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{product.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProduct(product.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};