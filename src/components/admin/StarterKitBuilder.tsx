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
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Package, Plus, Trash2, Edit, Star, DollarSign, Copy, Eye, Wrench } from 'lucide-react';
import { format } from 'date-fns';

interface StarterKitTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_cost?: number;
  estimated_time?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  template_products?: TemplateProduct[];
}

interface TemplateProduct {
  id: string;
  template_id: string;
  product_id: string;
  quantity: number;
  is_required: boolean;
  notes?: string;
  product?: {
    id: string;
    name: string;
    brand: string;
    category: string;
    image_url?: string;
  };
}

interface ProductOption {
  id: string;
  name: string;
  brand: string;
  category: string;
  image_url?: string;
}

export const StarterKitBuilder: React.FC = () => {
  const [templates, setTemplates] = useState<StarterKitTemplate[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<StarterKitTemplate | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{ [productId: string]: { quantity: number; isRequired: boolean; notes: string } }>({});

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: '',
    difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    estimated_cost: '',
    estimated_time: '',
    is_active: true
  });

  const templatesPerPage = 10;

  const fetchTemplates = async (page = 1, search = '', category = 'all') => {
    try {
      setLoading(true);

      let query = supabase
        .from('starter_kit_templates')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * templatesPerPage, page * templatesPerPage - 1);

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
      }

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to fetch starter kit templates');
        return;
      }

      setTemplates(data || []);
      setTotalPages(Math.ceil((count || 0) / templatesPerPage));
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch starter kit templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, brand, category, image_url')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('starter_kit_templates')
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
    setTemplateForm({
      name: '',
      description: '',
      category: '',
      difficulty_level: 'beginner',
      estimated_cost: '',
      estimated_time: '',
      is_active: true
    });
    setSelectedProducts({});
  };

  const handleAddTemplate = async () => {
    try {
      if (!templateForm.name || !templateForm.category) {
        toast.error('Name and category are required');
        return;
      }

      const templateData = {
        name: templateForm.name,
        description: templateForm.description || null,
        category: templateForm.category,
        difficulty_level: templateForm.difficulty_level,
        estimated_cost: templateForm.estimated_cost ? parseFloat(templateForm.estimated_cost) : null,
        estimated_time: templateForm.estimated_time || null,
        is_active: templateForm.is_active
      };

      const { data: template, error: templateError } = await supabase
        .from('starter_kit_templates')
        .insert(templateData)
        .select()
        .single();

      if (templateError) {
        toast.error(`Failed to create template: ${templateError.message}`);
        return;
      }

      // Add selected products to the template
      const productEntries = Object.entries(selectedProducts).map(([productId, config]) => ({
        template_id: template.id,
        product_id: productId,
        quantity: config.quantity,
        is_required: config.isRequired,
        notes: config.notes || null
      }));

      if (productEntries.length > 0) {
        const { error: productsError } = await supabase
          .from('template_products')
          .insert(productEntries);

        if (productsError) {
          toast.error(`Template created but failed to add products: ${productsError.message}`);
        }
      }

      toast.success('Starter kit template created successfully');
      setIsAddTemplateOpen(false);
      resetForm();
      fetchTemplates(currentPage, searchTerm, selectedCategory);
      fetchCategories();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create starter kit template');
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      const templateData = {
        name: templateForm.name,
        description: templateForm.description || null,
        category: templateForm.category,
        difficulty_level: templateForm.difficulty_level,
        estimated_cost: templateForm.estimated_cost ? parseFloat(templateForm.estimated_cost) : null,
        estimated_time: templateForm.estimated_time || null,
        is_active: templateForm.is_active,
        updated_at: new Date().toISOString()
      };

      const { error: templateError } = await supabase
        .from('starter_kit_templates')
        .update(templateData)
        .eq('id', editingTemplate.id);

      if (templateError) {
        toast.error(`Failed to update template: ${templateError.message}`);
        return;
      }

      // Update template products
      // First, delete existing products
      await supabase
        .from('template_products')
        .delete()
        .eq('template_id', editingTemplate.id);

      // Then add new products
      const productEntries = Object.entries(selectedProducts).map(([productId, config]) => ({
        template_id: editingTemplate.id,
        product_id: productId,
        quantity: config.quantity,
        is_required: config.isRequired,
        notes: config.notes || null
      }));

      if (productEntries.length > 0) {
        const { error: productsError } = await supabase
          .from('template_products')
          .insert(productEntries);

        if (productsError) {
          toast.error(`Template updated but failed to update products: ${productsError.message}`);
        }
      }

      toast.success('Starter kit template updated successfully');
      setEditingTemplate(null);
      resetForm();
      fetchTemplates(currentPage, searchTerm, selectedCategory);
      fetchCategories();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update starter kit template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('starter_kit_templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        toast.error(`Failed to delete template: ${error.message}`);
        return;
      }

      toast.success('Starter kit template deleted successfully');
      fetchTemplates(currentPage, searchTerm, selectedCategory);
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete starter kit template');
    }
  };

  const handleDuplicateTemplate = async (template: StarterKitTemplate) => {
    try {
      const templateData = {
        name: `${template.name} (Copy)`,
        description: template.description,
        category: template.category,
        difficulty_level: template.difficulty_level,
        estimated_cost: template.estimated_cost,
        estimated_time: template.estimated_time,
        is_active: false // Set as inactive by default
      };

      const { data: newTemplate, error: templateError } = await supabase
        .from('starter_kit_templates')
        .insert(templateData)
        .select()
        .single();

      if (templateError) {
        toast.error(`Failed to duplicate template: ${templateError.message}`);
        return;
      }

      // Copy template products
      if (template.template_products && template.template_products.length > 0) {
        const productEntries = template.template_products.map(tp => ({
          template_id: newTemplate.id,
          product_id: tp.product_id,
          quantity: tp.quantity,
          is_required: tp.is_required,
          notes: tp.notes
        }));

        const { error: productsError } = await supabase
          .from('template_products')
          .insert(productEntries);

        if (productsError) {
          toast.error(`Template duplicated but failed to copy products: ${productsError.message}`);
        }
      }

      toast.success('Starter kit template duplicated successfully');
      fetchTemplates(currentPage, searchTerm, selectedCategory);
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate starter kit template');
    }
  };

  const openEditDialog = (template: StarterKitTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      category: template.category,
      difficulty_level: template.difficulty_level,
      estimated_cost: template.estimated_cost?.toString() || '',
      estimated_time: template.estimated_time || '',
      is_active: template.is_active
    });

    // Set selected products
    const productSelection: { [productId: string]: { quantity: number; isRequired: boolean; notes: string } } = {};
    template.template_products?.forEach(tp => {
      productSelection[tp.product_id] = {
        quantity: tp.quantity,
        isRequired: tp.is_required,
        notes: tp.notes || ''
      };
    });
    setSelectedProducts(productSelection);
  };

  const handleProductSelection = (productId: string, selected: boolean) => {
    if (selected) {
      setSelectedProducts(prev => ({
        ...prev,
        [productId]: { quantity: 1, isRequired: true, notes: '' }
      }));
    } else {
      setSelectedProducts(prev => {
        const newSelection = { ...prev };
        delete newSelection[productId];
        return newSelection;
      });
    }
  };

  const updateProductConfig = (productId: string, field: 'quantity' | 'isRequired' | 'notes', value: any) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchTemplates(currentPage, searchTerm, selectedCategory);
  }, [currentPage, selectedCategory]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTemplates(1, searchTerm, selectedCategory);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Starter Kit Template Builder
              </CardTitle>
              <CardDescription>
                Create and manage starter kit templates for different use cases
              </CardDescription>
            </div>
            <Dialog open={isAddTemplateOpen} onOpenChange={setIsAddTemplateOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Starter Kit Template</DialogTitle>
                  <DialogDescription>
                    Build a new starter kit template with products and configuration.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Template Information</h3>
                    <div>
                      <Label htmlFor="name">Template Name *</Label>
                      <Input
                        id="name"
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Athletic Injury Recovery Kit"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={templateForm.description}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the purpose and contents of this kit"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Input
                          id="category"
                          value={templateForm.category}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                          placeholder="e.g., Sports Medicine"
                        />
                      </div>
                      <div>
                        <Label htmlFor="difficulty">Difficulty Level</Label>
                        <Select value={templateForm.difficulty_level} onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setTemplateForm(prev => ({ ...prev, difficulty_level: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="cost">Estimated Cost ($)</Label>
                        <Input
                          id="cost"
                          type="number"
                          min="0"
                          step="0.01"
                          value={templateForm.estimated_cost}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, estimated_cost: e.target.value }))}
                          placeholder="99.99"
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Estimated Time</Label>
                        <Input
                          id="time"
                          value={templateForm.estimated_time}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, estimated_time: e.target.value }))}
                          placeholder="e.g., 30 minutes"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="active"
                        checked={templateForm.is_active}
                        onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_active: checked as boolean }))}
                      />
                      <Label htmlFor="active">Active Template</Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Select Products</h3>
                    <div className="max-h-96 overflow-y-auto border rounded-md p-2">
                      {products.map(product => {
                        const isSelected = selectedProducts[product.id];
                        return (
                          <div key={product.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              checked={!!isSelected}
                              onCheckedChange={(checked) => handleProductSelection(product.id, checked as boolean)}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{product.name}</div>
                              <div className="text-xs text-muted-foreground">{product.brand} • {product.category}</div>
                            </div>
                            {isSelected && (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="1"
                                  value={isSelected.quantity}
                                  onChange={(e) => updateProductConfig(product.id, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-16 h-8"
                                />
                                <Checkbox
                                  checked={isSelected.isRequired}
                                  onCheckedChange={(checked) => updateProductConfig(product.id, 'isRequired', checked)}
                                  title="Required"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsAddTemplateOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTemplate}>
                    Create Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search templates..."
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
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          {template.description && (
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {template.description}
                            </div>
                          )}
                          {template.estimated_time && (
                            <div className="text-xs text-muted-foreground mt-1">
                              ⏱️ {template.estimated_time}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDifficultyColor(template.difficulty_level)}>
                          {template.difficulty_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {template.template_products?.length || 0} products
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.estimated_cost && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {template.estimated_cost.toFixed(2)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(template)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Edit Starter Kit Template</DialogTitle>
                                <DialogDescription>
                                  Update template information and products.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <h3 className="font-semibold">Template Information</h3>
                                  <div>
                                    <Label htmlFor="edit-name">Template Name *</Label>
                                    <Input
                                      id="edit-name"
                                      value={templateForm.name}
                                      onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea
                                      id="edit-description"
                                      value={templateForm.description}
                                      onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                                      rows={3}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label htmlFor="edit-category">Category *</Label>
                                      <Input
                                        id="edit-category"
                                        value={templateForm.category}
                                        onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-difficulty">Difficulty Level</Label>
                                      <Select value={templateForm.difficulty_level} onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setTemplateForm(prev => ({ ...prev, difficulty_level: value }))}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="beginner">Beginner</SelectItem>
                                          <SelectItem value="intermediate">Intermediate</SelectItem>
                                          <SelectItem value="advanced">Advanced</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label htmlFor="edit-cost">Estimated Cost ($)</Label>
                                      <Input
                                        id="edit-cost"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={templateForm.estimated_cost}
                                        onChange={(e) => setTemplateForm(prev => ({ ...prev, estimated_cost: e.target.value }))}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-time">Estimated Time</Label>
                                      <Input
                                        id="edit-time"
                                        value={templateForm.estimated_time}
                                        onChange={(e) => setTemplateForm(prev => ({ ...prev, estimated_time: e.target.value }))}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="edit-active"
                                      checked={templateForm.is_active}
                                      onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_active: checked as boolean }))}
                                    />
                                    <Label htmlFor="edit-active">Active Template</Label>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h3 className="font-semibold">Select Products</h3>
                                  <div className="max-h-96 overflow-y-auto border rounded-md p-2">
                                    {products.map(product => {
                                      const isSelected = selectedProducts[product.id];
                                      return (
                                        <div key={product.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                          <Checkbox
                                            checked={!!isSelected}
                                            onCheckedChange={(checked) => handleProductSelection(product.id, checked as boolean)}
                                          />
                                          <div className="flex-1">
                                            <div className="font-medium text-sm">{product.name}</div>
                                            <div className="text-xs text-muted-foreground">{product.brand} • {product.category}</div>
                                          </div>
                                          {isSelected && (
                                            <div className="flex items-center gap-2">
                                              <Input
                                                type="number"
                                                min="1"
                                                value={isSelected.quantity}
                                                onChange={(e) => updateProductConfig(product.id, 'quantity', parseInt(e.target.value) || 1)}
                                                className="w-16 h-8"
                                              />
                                              <Checkbox
                                                checked={isSelected.isRequired}
                                                onCheckedChange={(checked) => updateProductConfig(product.id, 'isRequired', checked)}
                                                title="Required"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                  setEditingTemplate(null);
                                  resetForm();
                                }}>
                                  Cancel
                                </Button>
                                <Button onClick={handleUpdateTemplate}>
                                  Update Template
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicateTemplate(template)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

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
                                  onClick={() => handleDeleteTemplate(template.id)}
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
                  ))}
                </TableBody>
              </Table>

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