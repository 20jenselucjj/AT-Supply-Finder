import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { databases, account } from '@/lib/appwrite';
import { toast } from 'sonner';
import { useRBAC } from '@/hooks/use-rbac';
import { logger } from '@/lib/logger';
import { Package, Plus, Trash2, Edit, Star, DollarSign, ExternalLink, Trash, Upload, Download, Filter, Search, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { fuzzySearch, generateSuggestions } from '@/lib/fuzzy-search';
import { ProductData, ProductManagementProps, AdvancedFilters } from './types';
import { ProductTable } from './ProductTable';
import { ProductCard } from './ProductCard';
import { ProductForm } from './ProductForm';
import { Filters } from './Filters';
import { SearchAndActions } from './SearchAndActions';

export const ProductManagementRefactored: React.FC<ProductManagementProps> = ({ totalProducts, onProductCountChange }) => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'price'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isImportProductsOpen, setIsImportProductsOpen] = useState(false);
  
  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    minPrice: undefined,
    maxPrice: undefined,
    minRating: undefined,
    maxRating: undefined,
    brand: '',
    material: '',
    weight: ''
  });
  
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
  
  // Bulk update state
  const [bulkUpdateData, setBulkUpdateData] = useState({
    category: '',
    brand: ''
  });
  
  const [isLoadingProductInfo, setIsLoadingProductInfo] = useState(false);
  const { isEditorOrAdmin } = useRBAC();
  
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
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((page - 1) * productsPerPage, page * productsPerPage - 1);

      // Apply search term filter
      if (search) {
        // Enhanced search with multiple matching strategies
        const searchTerms = search.split(' ').filter(term => term.length > 0);
        
        if (searchTerms.length > 0) {
          // For multiple terms, search each term separately
          const searchConditions = searchTerms.map(term => 
            `name.ilike.%${term}%,brand.ilike.%${term}%,category.ilike.%${term}%,material.ilike.%${term}%`
          ).join(',');
          
          query = query.or(searchConditions);
        } else {
          // For single term, use broader matching
          query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,category.ilike.%${search}%,material.ilike.%${search}%`);
        }
      }

      // Apply category filter
      if (category !== 'all') {
        query = query.eq('category', category);
      }

      // Apply advanced filters
      if (advancedFilters.minPrice !== undefined) {
        query = query.gte('price', advancedFilters.minPrice);
      }
      
      if (advancedFilters.maxPrice !== undefined) {
        query = query.lte('price', advancedFilters.maxPrice);
      }
      
      if (advancedFilters.minRating !== undefined) {
        query = query.gte('rating', advancedFilters.minRating);
      }
      
      if (advancedFilters.maxRating !== undefined) {
        query = query.lte('rating', advancedFilters.maxRating);
      }
      
      if (advancedFilters.brand) {
        query = query.ilike('brand', `%${advancedFilters.brand}%`);
      }
      
      if (advancedFilters.material) {
        query = query.ilike('material', `%${advancedFilters.material}%`);
      }
      
      if (advancedFilters.weight) {
        query = query.ilike('weight', `%${advancedFilters.weight}%`);
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

  // Fetch brands for filter dropdown
  const fetchBrands = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('brand')
        .not('brand', 'is', null);
      
      if (error) {
        console.error('Error fetching brands:', error);
        return;
      }

      const uniqueBrands = [...new Set(data.map(item => item.brand).filter(Boolean))];
      setBrands(uniqueBrands);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  // Fetch materials for filter dropdown
  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('material')
        .not('material', 'is', null);
      
      if (error) {
        console.error('Error fetching materials:', error);
        return;
      }

      const uniqueMaterials = [...new Set(data.map(item => item.material).filter(Boolean))];
      setMaterials(uniqueMaterials);
    } catch (error) {
      console.error('Error fetching materials:', error);
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
      
      // Fetch product names before deletion for audit logging
      const { data: productData, error: fetchError } = await supabaseAdmin
        .from('products')
        .select('id, name, category, brand')
        .in('id', productIds);

      const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .in('id', productIds);

      if (error) {
        await logger.auditLog({
          action: 'BULK_DELETE_PRODUCTS_FAILED',
          entity_type: 'PRODUCT',
          details: {
            count: productIds.length,
            error: error.message
          }
        });
        toast.error(`Failed to delete products: ${error.message}`);
        return;
      }

      // Log successful bulk deletion
      await logger.auditLog({
        action: 'BULK_DELETE_PRODUCTS',
        entity_type: 'PRODUCT',
        details: {
          count: productIds.length,
          products: productData?.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            brand: p.brand
          }))
        }
      });

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

  const handleExportProducts = async () => {
    try {
      // Fetch all products for export
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*');
      
      if (error) {
        await logger.auditLog({
          action: 'EXPORT_ALL_PRODUCTS_FAILED',
          entity_type: 'PRODUCT',
          details: {
            error: error.message
          }
        });
        toast.error('Failed to fetch products for export');
        return;
      }

      // Convert to CSV
      const csvHeaders = Object.keys(data[0] || {}).join(',');
      const csvRows = data.map(product => 
        Object.values(product).map(value => 
          typeof value === 'object' ? JSON.stringify(value) : value
        ).join(',')
      );
      
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Log successful export
      await logger.auditLog({
        action: 'EXPORT_ALL_PRODUCTS',
        entity_type: 'PRODUCT',
        details: {
          count: data.length
        }
      });
      
      toast.success('Products exported successfully');
    } catch (error) {
      console.error('Error exporting products:', error);
      toast.error('Failed to export products');
    }
  };

  const handleBulkExport = async () => {
    if (selectedProducts.size === 0) {
      toast.error('No products selected');
      return;
    }

    try {
      // Fetch selected products for export
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .in('id', Array.from(selectedProducts));
      
      if (error) {
        await logger.auditLog({
          action: 'EXPORT_SELECTED_PRODUCTS_FAILED',
          entity_type: 'PRODUCT',
          details: {
            count: selectedProducts.size,
            error: error.message
          }
        });
        toast.error('Failed to fetch selected products for export');
        return;
      }

      // Convert to CSV
      const csvHeaders = Object.keys(data[0] || {}).join(',');
      const csvRows = data.map(product => 
        Object.values(product).map(value => 
          typeof value === 'object' ? JSON.stringify(value) : value
        ).join(',')
      );

      // Log successful export
      await logger.auditLog({
        action: 'EXPORT_SELECTED_PRODUCTS',
        entity_type: 'PRODUCT',
        details: {
          count: data.length
        }
      });
      
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `selected-products-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${selectedProducts.size} product${selectedProducts.size > 1 ? 's' : ''} exported successfully`);
    } catch (error) {
      console.error('Error exporting selected products:', error);
      toast.error('Failed to export selected products');
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedProducts.size === 0) {
      toast.error('No products selected');
      return;
    }

    if (!bulkUpdateData.category && !bulkUpdateData.brand) {
      toast.error('Please select at least one field to update');
      return;
    }

    try {
      // Prepare update data
      const updateData: any = {};
      if (bulkUpdateData.category) updateData.category = bulkUpdateData.category;
      if (bulkUpdateData.brand) updateData.brand = bulkUpdateData.brand;
      updateData.updated_at = new Date().toISOString();

      // Update selected products
      const { error } = await supabaseAdmin
        .from('products')
        .update(updateData)
        .in('id', Array.from(selectedProducts));
      
      if (error) {
        toast.error('Failed to update products');
        return;
      }

      toast.success(`${selectedProducts.size} product${selectedProducts.size > 1 ? 's' : ''} updated successfully`);
      
      // Reset bulk update data
      setBulkUpdateData({ category: '', brand: '' });
      
      // Refresh product list
      fetchProducts(currentPage, searchTerm, selectedCategory);
    } catch (error) {
      console.error('Error updating products:', error);
      toast.error('Failed to update products');
    }
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 2) {
        toast.error('CSV file is empty or invalid');
        return;
      }

      // Parse CSV headers
      const headers = lines[0].split(',').map(header => header.trim());
      
      // Parse data rows
      const productsToImport = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length !== headers.length) continue;
        
        const product: any = {};
        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          const value = values[j]?.trim() || '';
          
          // Convert numeric values
          if (header === 'price' || header === 'rating') {
            const numValue = parseFloat(value);
            product[header] = isNaN(numValue) ? null : numValue;
          } else if (header === 'features') {
            product[header] = value ? value.split(';').map(f => f.trim()) : [];
          } else {
            product[header] = value || null;
          }
        }
        
        // Validate required fields
        if (product.name && product.category && product.brand) {
          productsToImport.push(product);
        }
      }

      if (productsToImport.length === 0) {
        toast.error('No valid products found in CSV');
        return;
      }

      // Insert products
      const { error } = await supabaseAdmin
        .from('products')
        .insert(productsToImport);
      
      if (error) {
        toast.error(`Failed to import products: ${error.message}`);
        return;
      }

      toast.success(`Successfully imported ${productsToImport.length} product${productsToImport.length > 1 ? 's' : ''}`);
      
      // Refresh product list
      fetchProducts(currentPage, searchTerm, selectedCategory);
      fetchCategories();
      fetchBrands();
      fetchMaterials();
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Failed to import products from CSV');
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

  // Generate search suggestions
  const generateSearchSuggestions = (query: string) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      return;
    }
    
    const suggestions = generateSuggestions(
      products,
      query,
      ['name', 'brand', 'category', 'material'],
      5
    );
    
    setSearchSuggestions(suggestions);
  };

  // Handle search input with suggestions
  const handleSearchInput = (value: string) => {
    setSearchTerm(value);
    generateSearchSuggestions(value);
    
    if (value) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Select a suggestion
  const selectSuggestion = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    setCurrentPage(1);
    fetchProducts(1, suggestion, selectedCategory);
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

      const { data, error } = await supabaseAdmin
        .from('products')
        .insert(productData)
        .select();

      if (error) {
        await logger.auditLog({
          action: 'CREATE_PRODUCT_FAILED',
          entity_type: 'PRODUCT',
          details: {
            product_name: productForm.name,
            error: error.message
          }
        });
        toast.error(`Failed to create product: ${error.message}`);
        return;
      }

      // Log successful product creation
      await logger.auditLog({
        action: 'CREATE_PRODUCT',
        entity_type: 'PRODUCT',
        entity_id: data?.[0]?.id,
        details: {
          product_name: productForm.name,
          category: productForm.category,
          brand: productForm.brand
        }
      });

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
        await logger.auditLog({
          action: 'UPDATE_PRODUCT_FAILED',
          entity_type: 'PRODUCT',
          entity_id: editingProduct.id,
          details: {
            product_name: productForm.name,
            error: error.message
          }
        });
        toast.error(`Failed to update product: ${error.message}`);
        return;
      }

      // Log successful product update
      await logger.auditLog({
        action: 'UPDATE_PRODUCT',
        entity_type: 'PRODUCT',
        entity_id: editingProduct.id,
        details: {
          product_name: productForm.name,
          category: productForm.category,
          brand: productForm.brand
        }
      });

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
      const { data: productData, error: fetchError } = await supabaseAdmin
        .from('products')
        .select('name, category, brand')
        .eq('id', productId)
        .single();
      
      const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) {
        await logger.auditLog({
          action: 'DELETE_PRODUCT_FAILED',
          entity_type: 'PRODUCT',
          entity_id: productId,
          details: {
            error: error.message
          }
        });
        toast.error(`Failed to delete product: ${error.message}`);
        return;
      }

      // Log successful product deletion
      await logger.auditLog({
        action: 'DELETE_PRODUCT',
        entity_type: 'PRODUCT',
        entity_id: productId,
        details: {
          product_name: productData?.name,
          category: productData?.category,
          brand: productData?.brand
        }
      });

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

  const getMinPrice = (offers: any[] = []) => {
    if (offers.length === 0) return null;
    return Math.min(...offers.map(offer => offer.price));
  };

  useEffect(() => {
    fetchProducts(currentPage, searchTerm, selectedCategory);
  }, [currentPage, selectedCategory, sortBy, sortOrder, advancedFilters]);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchMaterials();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('product-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        (payload) => {
          console.log('New product added:', payload.new);
          // Refresh the product list when a new product is added
          fetchProducts(currentPage, searchTerm, selectedCategory);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          console.log('Product updated:', payload.new);
          // Refresh the product list when a product is updated
          fetchProducts(currentPage, searchTerm, selectedCategory);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'products' },
        (payload) => {
          console.log('Product deleted:', payload.old);
          // Refresh the product list when a product is deleted
          fetchProducts(currentPage, searchTerm, selectedCategory);
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchProducts(1, searchTerm, selectedCategory);
  };

  // Check if any advanced filters are active
  const hasActiveFilters = () => {
    return (
      advancedFilters.minPrice !== undefined ||
      advancedFilters.maxPrice !== undefined ||
      advancedFilters.minRating !== undefined ||
      advancedFilters.maxRating !== undefined ||
      !!advancedFilters.brand ||
      !!advancedFilters.material ||
      !!advancedFilters.weight
    );
  };

  // Reset all filters
  const resetFilters = () => {
    setAdvancedFilters({
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      maxRating: undefined,
      brand: '',
      material: '',
      weight: ''
    });
    setCurrentPage(1);
  };

  // Apply filters (trigger refetch)
  const applyFilters = () => {
    setCurrentPage(1);
    fetchProducts(1, searchTerm, selectedCategory);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Product Management</h2>
              <p className="text-muted-foreground">Manage your product catalog</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SearchAndActions
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
            handleSearch={handleSearch}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            hasActiveFilters={hasActiveFilters}
            sortBy={sortBy}
            sortOrder={sortOrder}
            setSortBy={setSortBy as any}
            setSortOrder={setSortOrder as any}
            selectedProducts={selectedProducts}
            isDeleting={isDeleting}
            handleBulkDelete={handleBulkDelete}
            handleBulkExport={handleBulkExport}
            handleExportProducts={handleExportProducts}
            isAddProductOpen={isAddProductOpen}
            setIsAddProductOpen={setIsAddProductOpen}
            isImportProductsOpen={isImportProductsOpen}
            setIsImportProductsOpen={setIsImportProductsOpen}
            handleCSVImport={handleCSVImport}
          />
          
          {/* Advanced Filters Panel */}
          {showFilters && (
            <Filters
              advancedFilters={advancedFilters}
              setAdvancedFilters={setAdvancedFilters}
              brands={brands}
              resetFilters={resetFilters}
              applyFilters={applyFilters}
            />
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <ProductTable
                products={products}
                selectedProducts={selectedProducts}
                handleSelectProduct={handleSelectProduct}
                isAllSelected={isAllSelected}
                isIndeterminate={isIndeterminate}
                handleSelectAll={handleSelectAll}
                openEditDialog={openEditDialog}
                handleDeleteProduct={handleDeleteProduct}
                getMinPrice={getMinPrice}
                productForm={productForm}
                setProductForm={setProductForm}
                handleUpdateProduct={handleUpdateProduct}
                handleAffiliateLinkChange={handleAffiliateLinkChange}
                isLoadingProductInfo={isLoadingProductInfo}
                categories={categories}
                brands={brands}
              />

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {/* Mobile Select All */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      ref={(el) => {
                        if (el) (el as HTMLInputElement).indeterminate = isIndeterminate;
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

                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={selectedProducts.has(product.id)}
                    handleSelectProduct={handleSelectProduct}
                    openEditDialog={openEditDialog}
                    handleDeleteProduct={handleDeleteProduct}
                    getMinPrice={getMinPrice}
                    productForm={productForm}
                    setProductForm={setProductForm}
                    handleUpdateProduct={handleUpdateProduct}
                    handleAffiliateLinkChange={handleAffiliateLinkChange}
                    isLoadingProductInfo={isLoadingProductInfo}
                  />
                ))}
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

export default ProductManagementRefactored;