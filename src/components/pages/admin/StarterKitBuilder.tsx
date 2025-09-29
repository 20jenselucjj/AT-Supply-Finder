import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { databases, account } from '@/lib/api/appwrite';
import { toast } from 'sonner';
import { useRBAC } from '@/hooks/use-rbac';
import { logger } from '@/lib/utils/logger';
import { Query } from 'appwrite';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  Download,
  Filter,
  Search,
  BarChart3,
  FileText,
  Settings,
  Wrench,
  ShoppingCart,
  Eye,
  EyeOff,
  Minus,
  X
} from 'lucide-react';

interface StarterKitTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
  is_visible_on_home: boolean;
  products: SelectedProduct[];
  estimatedCost: number;
  $createdAt: string;
  $updatedAt: string;
}

interface SelectedProduct {
  productId: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  asin?: string;
  isRequired: boolean;
  notes?: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  imageUrl?: string;
  features?: string[];
  asin?: string;
  affiliateLink?: string;
}

export const StarterKitBuilder: React.FC = () => {
  const { isEditorOrAdmin } = useRBAC();
  
  // Template management state
  const [templates, setTemplates] = useState<StarterKitTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [activeTab, setActiveTab] = useState('templates');
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProductSelectionOpen, setIsProductSelectionOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<StarterKitTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<StarterKitTemplate | null>(null);
  
  // Product management state
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    isActive: true,
    is_visible_on_home: true
  });

  // Additional state
  const [categories, setCategories] = useState<string[]>([]);

  // Load products from catalog
  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      
      // Build query similar to product service
       const queries = [
         Query.orderAsc('name'),
         Query.limit(1000)
       ];
      
      console.log('Loading products with queries:', queries);
      
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        queries
      );
      
      console.log('Products response:', response);
      
      const formattedProducts: Product[] = response.documents.map((doc: any) => ({
        id: doc.$id,
        name: doc.name,
        brand: doc.brand || 'Unknown',
        category: doc.category || 'General',
        price: doc.price || 0,
        imageUrl: doc.imageUrl || '/placeholder-product.svg', // Fixed field name and added fallback
        features: doc.features || [],
        asin: doc.asin,
        affiliateLink: doc.affiliateLink
      }));
      
      console.log('Formatted products:', formattedProducts);
      setProducts(formattedProducts);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(formattedProducts.map(p => p.category))];
      setCategories(uniqueCategories);
      
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  // Load templates
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'starterKitTemplates',
        [
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]
      );
      
      const formattedTemplates: StarterKitTemplate[] = response.documents.map((doc: any) => ({
        id: doc.$id,
        name: doc.name,
        description: doc.description,
        category: doc.category,
        isActive: doc.isActive !== undefined ? doc.isActive : true, // Fixed: use isActive consistently
        is_visible_on_home: doc.is_visible_on_home || false,
        products: doc.products ? JSON.parse(doc.products) : [],
        estimatedCost: doc.estimatedCost || 0,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt
      }));
      
      setTemplates(formattedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  // Product selection functions
  const addProductToKit = (product: Product) => {
    const existingProduct = selectedProducts.find(p => p.productId === product.id);
    if (existingProduct) {
      setSelectedProducts(prev => 
        prev.map(p => 
          p.productId === product.id 
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      );
    } else {
      const newSelectedProduct: SelectedProduct = {
        productId: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        quantity: 1,
        imageUrl: product.imageUrl,
        asin: product.asin,
        isRequired: true,
        notes: ''
      };
      setSelectedProducts(prev => [...prev, newSelectedProduct]);
    }
  };

  const removeProductFromKit = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProductFromKit(productId);
      return;
    }
    setSelectedProducts(prev => 
      prev.map(p => 
        p.productId === productId 
          ? { ...p, quantity }
          : p
      )
    );
  };

  const updateProductRequired = (productId: string, isRequired: boolean) => {
    setSelectedProducts(prev => 
      prev.map(p => 
        p.productId === productId 
          ? { ...p, isRequired }
          : p
      )
    );
  };

  const calculateTotalCost = (products: SelectedProduct[]): number => {
    return products.reduce((total, product) => total + (product.price * product.quantity), 0);
  };

  // Template CRUD operations
  const createTemplate = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Template name is required');
        return;
      }

      if (selectedProducts.length === 0) {
        toast.error('Please select at least one product for the starter kit');
        return;
      }

      const templateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        isActive: formData.isActive, // Fixed: use isActive consistently
        is_visible_on_home: formData.is_visible_on_home,
        products: JSON.stringify(selectedProducts),
        estimatedCost: calculateTotalCost(selectedProducts)
      };

      const response = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'starterKitTemplates',
        'unique()',
        templateData
      );

      // Log audit trail
      try {
        const user = await account.get();
        await logger.auditLog({ // Fixed: use auditLog instead of logActivity
          action: 'create_starter_kit_template',
          entityType: 'starter_kit_template',
          entityId: response.$id,
          details: { templateName: templateData.name, productCount: selectedProducts.length }
        });
      } catch (logError) {
        console.warn('Failed to log activity:', logError);
      }

      toast.success('Starter kit template created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const updateTemplate = async () => {
    try {
      if (!editingTemplate || !formData.name.trim()) {
        toast.error('Template name is required');
        return;
      }

      if (selectedProducts.length === 0) {
        toast.error('Please select at least one product for the starter kit');
        return;
      }

      const templateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        isActive: formData.isActive,
        is_visible_on_home: formData.is_visible_on_home,
        products: JSON.stringify(selectedProducts),
        estimatedCost: calculateTotalCost(selectedProducts)
      };

      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'starterKitTemplates',
        editingTemplate.id,
        templateData
      );

      // Log audit trail
      try {
        const user = await account.get();
        await logger.auditLog({ // Fixed: use auditLog instead of logActivity
          action: 'update_starter_kit_template',
          entityType: 'starter_kit_template',
          entityId: editingTemplate.id,
          details: { templateName: templateData.name, productCount: selectedProducts.length }
        });
      } catch (logError) {
        console.warn('Failed to log activity:', logError);
      }

      toast.success('Starter kit template updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const deleteTemplate = async (templateId: string, templateName: string) => {
    try {
      await databases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'starterKitTemplates',
        templateId
      );

      // Log audit trail
      try {
        const user = await account.get();
        await logger.auditLog({
          action: 'delete_starter_kit_template',
          entityType: 'starter_kit_template',
          entityId: templateId,
          details: { templateName: templateName }
        });
      } catch (logError) {
        console.warn('Failed to log activity:', logError);
      }

      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  // Utility functions
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      isActive: true,
      is_visible_on_home: true
    });
    setSelectedProducts([]);
    setEditingTemplate(null);
  };

  const openEditDialog = (template: StarterKitTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      isActive: template.isActive,
      is_visible_on_home: template.is_visible_on_home
    });
    setSelectedProducts(template.products || []);
    setIsEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openPreviewDialog = (template: StarterKitTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  // Check permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const hasAccess = await isEditorOrAdmin();
        setHasPermission(hasAccess);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasPermission(false);
      }
    };
    
    checkPermissions();
  }, [isEditorOrAdmin]);

  // Initialize component
  useEffect(() => {
    if (hasPermission) {
      loadTemplates();
      loadProducts();
    }
  }, [hasPermission]);

  // Filter and sort templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    const aValue = a[sortBy as keyof StarterKitTemplate];
    const bValue = b[sortBy as keyof StarterKitTemplate];
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Filter products for selection
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(productSearchTerm.toLowerCase());
    const matchesCategory = productCategoryFilter === 'all' || product.category === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Check permissions
  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to view templates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Starter Kit Builder</h1>
          <p className="text-muted-foreground">
            Create and manage starter kit templates with product selection and visibility controls
          </p>
        </div>
        {hasPermission && (
          <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Create Starter Kit
          </Button>
        )}
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="estimatedCost">Cost</SelectItem>
                <SelectItem value="$createdAt">Created Date</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="w-full sm:w-auto"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Starter Kit Templates ({filteredTemplates.length})</CardTitle>
          <CardDescription>
            Manage your starter kit templates and control their visibility on the home page
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : paginatedTemplates.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">No templates found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating your first starter kit template.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Home Visibility</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          {template.description && (
                            <div className="text-sm text-muted-foreground">
                              {template.description.substring(0, 60)}
                              {template.description.length > 60 && '...'}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{template.category}</Badge>
                      </TableCell>
                      <TableCell>{template.products.length} items</TableCell>
                      <TableCell>${template.estimatedCost.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? "default" : "secondary"}> {/* Fixed: use isActive consistently */}
                          {template.isActive ? 'Active' : 'Inactive'} {/* Fixed: use isActive consistently */}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {template.is_visible_on_home ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="ml-2 text-sm">
                            {template.is_visible_on_home ? 'Visible' : 'Hidden'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPreviewDialog(template)}
                            title="Preview Template"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {hasPermission && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPermission && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{template.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteTemplate(template.id, template.name)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, filteredTemplates.length)} of{' '}
                    {filteredTemplates.length} templates
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
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
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Starter Kit Template</DialogTitle>
            <DialogDescription>
              Build a new starter kit by selecting products and configuring settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Template Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Athletic Injury Recovery Kit"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sports Medicine">Sports Medicine</SelectItem>
                    <SelectItem value="Emergency Care">Emergency Care</SelectItem>
                    <SelectItem value="Workplace Safety">Workplace Safety</SelectItem>
                    <SelectItem value="Home Care">Home Care</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Outdoor">Outdoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this starter kit is for and what it includes..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
                />
                <Label htmlFor="isActive">Active Template</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_visible_on_home"
                  checked={formData.is_visible_on_home}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible_on_home: checked as boolean }))}
                />
                <Label htmlFor="is_visible_on_home">Show on Home Page</Label>
              </div>
            </div>

            {/* Product Selection */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Select Products</h3>
                <Badge variant="outline">
                  {selectedProducts.length} products selected
                </Badge>
              </div>

              {/* Product Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Products */}
              {selectedProducts.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Selected Products</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    {selectedProducts.map((product) => (
                      <div key={product.productId} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-8 h-8 object-cover rounded bg-gray-100"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-product.svg';
                            }}
                          />
                          <div>
                            <div className="font-medium text-sm">{product.name}</div>
                            <div className="text-xs text-muted-foreground">{product.brand}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateProductQuantity(product.productId, product.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-8 text-center">{product.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateProductQuantity(product.productId, product.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeProductFromKit(product.productId)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-right">
                    <div className="text-lg font-semibold">
                      Total Cost: ${calculateTotalCost(selectedProducts).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Available Products */}
              <div>
                <h4 className="font-medium mb-3">Available Products</h4>
                <ScrollArea className="h-64 border rounded-lg">
                  <div className="p-3 space-y-2">
                    {loadingProducts ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No products found
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="w-10 h-10 object-cover rounded bg-gray-100"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-product.svg';
                              }}
                            />
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">{product.brand} • ${product.price.toFixed(2)}</div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addProductToKit(product)}
                            disabled={selectedProducts.some(p => p.productId === product.id)}
                          >
                            {selectedProducts.some(p => p.productId === product.id) ? 'Added' : 'Add'}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createTemplate} disabled={!formData.name.trim() || selectedProducts.length === 0}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Starter Kit Template</DialogTitle>
            <DialogDescription>
              Update the template information and product selection
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Template Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Template Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g., Athletic Injury Recovery Kit"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sports Medicine">Sports Medicine</SelectItem>
                    <SelectItem value="Emergency Care">Emergency Care</SelectItem>
                    <SelectItem value="Workplace Safety">Workplace Safety</SelectItem>
                    <SelectItem value="Home Care">Home Care</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Outdoor">Outdoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe what this starter kit is for and what it includes..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
                />
                <Label htmlFor="edit-isActive">Active Template</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-is_visible_on_home"
                  checked={formData.is_visible_on_home}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible_on_home: checked as boolean }))}
                />
                <Label htmlFor="edit-is_visible_on_home">Show on Home Page</Label>
              </div>
            </div>

            {/* Product Selection - Same as create dialog */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Select Products</h3>
                <Badge variant="outline">
                  {selectedProducts.length} products selected
                </Badge>
              </div>

              {/* Product Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Products */}
              {selectedProducts.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Selected Products</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    {selectedProducts.map((product) => (
                      <div key={product.productId} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                        <div className="flex items-center space-x-3">
                          {product.imageUrl && (
                            <img src={product.imageUrl} alt={product.name} className="w-8 h-8 object-cover rounded" />
                          )}
                          <div>
                            <div className="font-medium text-sm">{product.name}</div>
                            <div className="text-xs text-muted-foreground">{product.brand}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateProductQuantity(product.productId, product.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-8 text-center">{product.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateProductQuantity(product.productId, product.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeProductFromKit(product.productId)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-right">
                    <div className="text-lg font-semibold">
                      Total Cost: ${calculateTotalCost(selectedProducts).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Available Products */}
              <div>
                <h4 className="font-medium mb-3">Available Products</h4>
                <ScrollArea className="h-64 border rounded-lg">
                  <div className="p-3 space-y-2">
                    {loadingProducts ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No products found
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                          <div className="flex items-center space-x-3">
                            {product.imageUrl && (
                              <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded" />
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">{product.brand} • ${product.price.toFixed(2)}</div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addProductToKit(product)}
                            disabled={selectedProducts.some(p => p.productId === product.id)}
                          >
                            {selectedProducts.some(p => p.productId === product.id) ? 'Added' : 'Add'}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateTemplate} disabled={!formData.name.trim() || selectedProducts.length === 0}>
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Preview Starter Kit Template</span>
            </DialogTitle>
            <DialogDescription>
              Preview how this starter kit template will appear to users
            </DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-6">
              {/* Template Header */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      {previewTemplate.name}
                    </h2>
                    <div className="flex items-center space-x-4 mb-3">
                      <Badge variant="secondary" className="text-sm">
                        {previewTemplate.category}
                      </Badge>
                      <Badge variant={previewTemplate.isActive ? "default" : "secondary"}> {/* Fixed: use isActive consistently */}
                        {previewTemplate.isActive ? 'Active' : 'Inactive'} {/* Fixed: use isActive consistently */}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {previewTemplate.is_visible_on_home ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {previewTemplate.is_visible_on_home ? 'Visible on Home' : 'Hidden from Home'}
                        </span>
                      </div>
                    </div>
                    {previewTemplate.description && (
                      <p className="text-muted-foreground leading-relaxed">
                        {previewTemplate.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      ${previewTemplate.estimatedCost.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Estimated Total</div>
                  </div>
                </div>
              </div>

              {/* Products List */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Included Products ({previewTemplate.products.length} items)
                </h3>
                
                {previewTemplate.products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg">
                    No products selected for this template
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {previewTemplate.products.map((product, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50">
                        {product.imageUrl && (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-foreground">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">{product.brand}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {product.category}
                                </Badge>
                                {product.isRequired && (
                                  <Badge variant="destructive" className="text-xs">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              {product.notes && (
                                <p className="text-sm text-muted-foreground mt-2 italic">
                                  Note: {product.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-foreground">
                                ${product.price.toFixed(2)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Qty: {product.quantity}
                              </div>
                              <div className="text-sm font-medium text-primary">
                                ${(product.price * product.quantity).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cost Breakdown */}
              {previewTemplate.products.length > 0 && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Cost Breakdown</h4>
                  <div className="space-y-2">
                    {previewTemplate.products.map((product, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{product.name} (x{product.quantity})</span>
                        <span>${(product.price * product.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total Estimated Cost</span>
                        <span className="text-primary">
                          ${previewTemplate.estimatedCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StarterKitBuilder;