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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRBAC } from '@/hooks/use-rbac';
import { logger } from '@/lib/logger';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit, 
  Star, 
  DollarSign, 
  Copy, 
  Eye, 
  Wrench,
  Filter,
  Search,
  Download,
  Upload,
  Share2,
  Tag,
  Calendar,
  User,
  BarChart3,
  FileText,
  Image,
  Link,
  Settings,
  Save,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface StarterKitTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  template_products?: TemplateProduct[];
  tags?: string[];
  thumbnail_url?: string;
  estimated_cost?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  target_audience?: string;
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
    price?: number;
  };
}

interface ProductOption {
  id: string;
  name: string;
  brand: string;
  category: string;
  image_url?: string;
  price?: number;
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
  const [isEditTemplateOpen, setIsEditTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<StarterKitTemplate | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{ [productId: string]: { quantity: number; isRequired: boolean; notes: string } }>({});
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'estimated_cost'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeTab, setActiveTab] = useState('templates');
  const { isEditorOrAdmin } = useRBAC();

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: '',
    is_active: true,
    tags: [] as string[],
    thumbnail_url: '',
    difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    target_audience: '',
    estimated_cost: 0
  });

  const templatesPerPage = 10;

  const fetchTemplates = async (page = 1, search = '', category = 'all') => {
    try {
      setLoading(true);

      let query = supabase
        .from('starter_kit_templates')
        .select(`
          *,
          template_products (
            id,
            template_id,
            product_id,
            quantity,
            is_required,
            notes,
            products (
              id,
              name,
              brand,
              category,
              image_url,
              price
            )
          )
        `, { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((page - 1) * templatesPerPage, page * templatesPerPage - 1);

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
      }

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      if (difficultyFilter !== 'all') {
        query = query.eq('difficulty_level', difficultyFilter);
      }

      // Filter by tags if any selected
      if (selectedTags.length > 0) {
        // This would require a more complex query with JSON operations
        // For now, we'll filter on the client side
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
        .select('id, name, brand, category, image_url, price')
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

  const fetchTags = async () => {
    try {
      // Fetch all templates to extract tags
      const { data, error } = await supabase
        .from('starter_kit_templates')
        .select('tags');

      if (error) {
        console.error('Error fetching tags:', error);
        return;
      }

      // Extract unique tags
      const allTags = data.flatMap(template => template.tags || []);
      const uniqueTags = [...new Set(allTags)];
      setTags(uniqueTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const resetForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      category: '',
      is_active: true,
      tags: [],
      thumbnail_url: '',
      difficulty_level: 'beginner',
      target_audience: '',
      estimated_cost: 0
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
        is_active: templateForm.is_active,
        tags: templateForm.tags.length > 0 ? templateForm.tags : null,
        thumbnail_url: templateForm.thumbnail_url || null,
        difficulty_level: templateForm.difficulty_level,
        target_audience: templateForm.target_audience || null,
        estimated_cost: templateForm.estimated_cost || 0
      };

      const { data: template, error: templateError } = await supabase
        .from('starter_kit_templates')
        .insert(templateData)
        .select()
        .single();

      if (templateError) {
        await logger.auditLog({
          action: 'CREATE_TEMPLATE_FAILED',
          entity_type: 'STARTER_KIT_TEMPLATE',
          details: {
            template_name: templateForm.name,
            error: templateError.message
          }
        });
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

      // Log successful template creation
      await logger.auditLog({
        action: 'CREATE_TEMPLATE',
        entity_type: 'STARTER_KIT_TEMPLATE',
        entity_id: template.id,
        details: {
          template_name: templateForm.name,
          category: templateForm.category,
          difficulty_level: templateForm.difficulty_level,
          product_count: productEntries.length
        }
      });

      toast.success('Starter kit template created successfully');
      setIsAddTemplateOpen(false);
      resetForm();
      fetchTemplates(currentPage, searchTerm, selectedCategory);
      fetchCategories();
      fetchTags();
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
        is_active: templateForm.is_active,
        tags: templateForm.tags.length > 0 ? templateForm.tags : null,
        thumbnail_url: templateForm.thumbnail_url || null,
        difficulty_level: templateForm.difficulty_level,
        target_audience: templateForm.target_audience || null,
        estimated_cost: templateForm.estimated_cost || 0,
        updated_at: new Date().toISOString()
      };

      const { error: templateError } = await supabase
        .from('starter_kit_templates')
        .update(templateData)
        .eq('id', editingTemplate.id);

      if (templateError) {
        await logger.auditLog({
          action: 'UPDATE_TEMPLATE_FAILED',
          entity_type: 'STARTER_KIT_TEMPLATE',
          entity_id: editingTemplate.id,
          details: {
            template_name: templateForm.name,
            error: templateError.message
          }
        });
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

      // Log successful template update
      await logger.auditLog({
        action: 'UPDATE_TEMPLATE',
        entity_type: 'STARTER_KIT_TEMPLATE',
        entity_id: editingTemplate.id,
        details: {
          template_name: templateForm.name,
          category: templateForm.category,
          difficulty_level: templateForm.difficulty_level,
          product_count: productEntries.length
        }
      });

      toast.success('Starter kit template updated successfully');
      setEditingTemplate(null);
      setIsEditTemplateOpen(false);
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
      // Fetch template data before deletion for audit logging
      const { data: templateData, error: fetchError } = await supabase
        .from('starter_kit_templates')
        .select('name, category')
        .eq('id', templateId)
        .single();

      const { error } = await supabase
        .from('starter_kit_templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        await logger.auditLog({
          action: 'DELETE_TEMPLATE_FAILED',
          entity_type: 'STARTER_KIT_TEMPLATE',
          entity_id: templateId,
          details: {
            error: error.message
          }
        });
        toast.error(`Failed to delete template: ${error.message}`);
        return;
      }

      // Log successful template deletion
      await logger.auditLog({
        action: 'DELETE_TEMPLATE',
        entity_type: 'STARTER_KIT_TEMPLATE',
        entity_id: templateId,
        details: {
          template_name: templateData?.name,
          category: templateData?.category
        }
      });

      toast.success('Starter kit template deleted successfully');
      fetchTemplates(currentPage, searchTerm, selectedCategory);
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete starter kit template');
    }
  };

  const openEditDialog = (template: StarterKitTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      category: template.category,
      is_active: template.is_active,
      tags: template.tags || [],
      thumbnail_url: template.thumbnail_url || '',
      difficulty_level: template.difficulty_level || 'beginner',
      target_audience: template.target_audience || '',
      estimated_cost: template.estimated_cost || 0
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
    setIsEditTemplateOpen(true);
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

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const addNewTag = (tag: string) => {
    if (tag && !templateForm.tags.includes(tag)) {
      setTemplateForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setTemplateForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const calculateTemplateCost = () => {
    let total = 0;
    Object.entries(selectedProducts).forEach(([productId, config]) => {
      const product = products.find(p => p.id === productId);
      if (product && product.price) {
        total += product.price * config.quantity;
      }
    });
    return total;
  };

  useEffect(() => {
    // Update estimated cost when products change
    const cost = calculateTemplateCost();
    setTemplateForm(prev => ({
      ...prev,
      estimated_cost: cost
    }));
  }, [selectedProducts]);

  useEffect(() => {
    fetchTemplates(currentPage, searchTerm, selectedCategory);
    
    // Set up real-time subscription for starter kit template changes
    const templatesChannel = supabase
      .channel('starter-kit-templates-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'starter_kit_templates' },
        (payload) => {
          console.log('New starter kit template added:', payload.new);
          // Refresh the template list when a new template is added
          fetchTemplates(currentPage, searchTerm, selectedCategory);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'starter_kit_templates' },
        (payload) => {
          console.log('Starter kit template updated:', payload.new);
          // Refresh the template list when a template is updated
          fetchTemplates(currentPage, searchTerm, selectedCategory);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'starter_kit_templates' },
        (payload) => {
          console.log('Starter kit template deleted:', payload.old);
          // Refresh the template list when a template is deleted
          fetchTemplates(currentPage, searchTerm, selectedCategory);
        }
      )
      .subscribe();
      
    const templateProductsChannel = supabase
      .channel('template-products-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'template_products' },
        (payload) => {
          console.log('New template product added:', payload.new);
          // Refresh the template list when a product is added to a template
          fetchTemplates(currentPage, searchTerm, selectedCategory);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'template_products' },
        (payload) => {
          console.log('Template product updated:', payload.new);
          // Refresh the template list when a product in a template is updated
          fetchTemplates(currentPage, searchTerm, selectedCategory);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'template_products' },
        (payload) => {
          console.log('Template product deleted:', payload.old);
          // Refresh the template list when a product is removed from a template
          fetchTemplates(currentPage, searchTerm, selectedCategory);
        }
      )
      .subscribe();

    // Clean up subscriptions on unmount
    return () => {
      supabase.removeChannel(templatesChannel);
      supabase.removeChannel(templateProductsChannel);
    };
  }, [currentPage, selectedCategory, difficultyFilter, selectedTags, sortBy, sortOrder]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchTags();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTemplates(1, searchTerm, selectedCategory);
  };

  const exportTemplate = (template: StarterKitTemplate) => {
    const data = {
      ...template,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `starter-kit-${template.name.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Template exported successfully');
  };

  const duplicateTemplate = (template: StarterKitTemplate) => {
    setTemplateForm({
      name: `${template.name} (Copy)`,
      description: template.description || '',
      category: template.category,
      is_active: template.is_active,
      tags: [...(template.tags || [])],
      thumbnail_url: template.thumbnail_url || '',
      difficulty_level: template.difficulty_level || 'beginner',
      target_audience: template.target_audience || '',
      estimated_cost: template.estimated_cost || 0
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
    setIsAddTemplateOpen(true);
    
    toast.success('Template duplicated');
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
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Starter Kit Template</DialogTitle>
                  <DialogDescription>
                    Build a new starter kit template with products and configuration.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Template Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <Label htmlFor="category">Category *</Label>
                          <Input
                            id="category"
                            value={templateForm.category}
                            onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                            placeholder="e.g., Sports Medicine"
                          />
                        </div>
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="target_audience">Target Audience</Label>
                          <Input
                            id="target_audience"
                            value={templateForm.target_audience}
                            onChange={(e) => setTemplateForm(prev => ({ ...prev, target_audience: e.target.value }))}
                            placeholder="e.g., Physical Therapists, Athletes"
                          />
                        </div>
                        <div>
                          <Label htmlFor="difficulty_level">Difficulty Level</Label>
                          <Select 
                            value={templateForm.difficulty_level} 
                            onValueChange={(value: any) => setTemplateForm(prev => ({ ...prev, difficulty_level: value }))}
                          >
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
                      
                      <div>
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {templateForm.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <button 
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:bg-muted rounded-full p-0.5"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a tag"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addNewTag((e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                          <Button 
                            variant="outline" 
                            onClick={(e) => {
                              const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                              if (input.value) {
                                addNewTag(input.value);
                                input.value = '';
                              }
                            }}
                          >
                            Add
                          </Button>
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
                      <h3 className="font-semibold text-lg">Select Products</h3>
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
                                <div className="text-xs text-muted-foreground">
                                  {product.brand} • {product.category} {product.price ? `• $${product.price.toFixed(2)}` : ''}
                                </div>
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
                  
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Template Preview</h3>
                      <Card>
                        <CardContent className="p-4 space-y-4">
                          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                            {templateForm.thumbnail_url ? (
                              <img 
                                src={templateForm.thumbnail_url} 
                                alt="Template thumbnail" 
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Image className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                            <Input
                              id="thumbnail_url"
                              value={templateForm.thumbnail_url}
                              onChange={(e) => setTemplateForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                              placeholder="https://example.com/image.jpg"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Estimated Cost</Label>
                              <div className="text-2xl font-bold">${templateForm.estimated_cost.toFixed(2)}</div>
                            </div>
                            <div>
                              <Label>Products</Label>
                              <div className="text-2xl font-bold">{Object.keys(selectedProducts).length}</div>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Difficulty</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={
                                templateForm.difficulty_level === 'beginner' ? 'default' :
                                templateForm.difficulty_level === 'intermediate' ? 'secondary' : 'destructive'
                              }>
                                {templateForm.difficulty_level}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="templates" className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
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
                
                <Select value={difficultyFilter} onValueChange={(value: any) => setDifficultyFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split('-');
                  setSortBy(newSortBy as any);
                  setSortOrder(newSortOrder as any);
                }}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">Newest</SelectItem>
                    <SelectItem value="created_at-asc">Oldest</SelectItem>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="estimated_cost-asc">Cost Low-High</SelectItem>
                    <SelectItem value="estimated_cost-desc">Cost High-Low</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
                  {viewMode === 'list' ? <GridIcon className="h-4 w-4" /> : <ListIcon className="h-4 w-4" />}
                </Button>
                
                <Button onClick={handleSearch} variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
              
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-sm font-medium">Active Tags:</span>
                  {selectedTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button 
                        onClick={() => handleTagToggle(tag)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedTags([])}
                    className="h-6 px-2 text-xs"
                  >
                    Clear All
                  </Button>
                </div>
              )}
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {viewMode === 'list' ? (
                    // List View
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Template</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Products</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead>Difficulty</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                        {templates.map((template) => (
                          <TableRow key={template.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {template.thumbnail_url ? (
                                  <img 
                                    src={template.thumbnail_url} 
                                    alt={template.name} 
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{template.name}</div>
                                  {template.description && (
                                    <div className="text-sm text-muted-foreground line-clamp-2">
                                      {template.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{template.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {template.template_products?.length || 0} products
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                ${template.estimated_cost?.toFixed(2) || '0.00'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                template.difficulty_level === 'beginner' ? 'default' :
                                template.difficulty_level === 'intermediate' ? 'secondary' : 'destructive'
                              }>
                                {template.difficulty_level || 'beginner'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={template.is_active ? 'default' : 'secondary'}>
                                {template.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => duplicateTemplate(template)}
                                  title="Duplicate"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(template)}
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => exportTemplate(template)}
                                  title="Export"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" title="Delete">
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
                    </div>
                  ) : (
                    // Grid View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {templates.map((template) => {
                        const totalProducts = template.template_products?.length || 0;
                        const totalCost = template.estimated_cost || 0;

                        return (
                          <Card key={template.id} className="p-4">
                            <div className="space-y-3">
                              {/* Thumbnail */}
                              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                                {template.thumbnail_url ? (
                                  <img 
                                    src={template.thumbnail_url} 
                                    alt={template.name} 
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <Package className="h-8 w-8 text-muted-foreground" />
                                )}
                              </div>
                              
                              {/* Header */}
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <h3 className="font-medium text-sm leading-tight line-clamp-2">{template.name}</h3>
                                  <Badge variant={template.is_active ? "default" : "secondary"} className="text-xs ml-2 flex-shrink-0">
                                    {template.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                                
                                {template.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                                )}
                                
                                <div className="flex flex-wrap gap-1">
                                  <Badge variant="outline" className="text-xs">{template.category}</Badge>
                                  <Badge variant={
                                    template.difficulty_level === 'beginner' ? 'default' :
                                    template.difficulty_level === 'intermediate' ? 'secondary' : 'destructive'
                                  } className="text-xs">
                                    {template.difficulty_level || 'beginner'}
                                  </Badge>
                                </div>
                              </div>

                              {/* Stats */}
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Products</Label>
                                  <div className="font-medium">{totalProducts}</div>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Est. Cost</Label>
                                  <div className="font-medium">${totalCost.toFixed(2)}</div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-9"
                                  onClick={() => duplicateTemplate(template)}
                                  title="Duplicate"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-9"
                                  onClick={() => openEditDialog(template)}
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 px-3" title="Delete">
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
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}

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
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Template Analytics
                  </CardTitle>
                  <CardDescription>
                    Insights and usage statistics for your starter kit templates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Templates</p>
                            <p className="text-2xl font-bold">{templates.length}</p>
                          </div>
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Active Templates</p>
                            <p className="text-2xl font-bold">{templates.filter(t => t.is_active).length}</p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Avg. Products per Template</p>
                            <p className="text-2xl font-bold">
                              {templates.length > 0 
                                ? (templates.reduce((sum, t) => sum + (t.template_products?.length || 0), 0) / templates.length).toFixed(1)
                                : '0.0'}
                            </p>
                          </div>
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Popular Categories</h3>
                    <div className="space-y-3">
                      {categories.map(category => {
                        const count = templates.filter(t => t.category === category).length;
                        return (
                          <div key={category} className="flex items-center justify-between">
                            <span>{category}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Builder Settings
                  </CardTitle>
                  <CardDescription>
                    Configure the starter kit builder preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Display Options</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Thumbnails</Label>
                        <p className="text-sm text-muted-foreground">
                          Display product thumbnails in templates
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Cost Estimates</Label>
                        <p className="text-sm text-muted-foreground">
                          Display estimated costs for templates
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Export Settings</h3>
                    <div>
                      <Label htmlFor="export-format">Default Export Format</Label>
                      <Select defaultValue="json">
                        <SelectTrigger id="export-format">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Template Validation</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Require Description</Label>
                        <p className="text-sm text-muted-foreground">
                          Templates must have a description
                        </p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Require Thumbnail</Label>
                        <p className="text-sm text-muted-foreground">
                          Templates must have a thumbnail image
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Edit Template Dialog */}
      <Dialog open={isEditTemplateOpen} onOpenChange={setIsEditTemplateOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Starter Kit Template</DialogTitle>
            <DialogDescription>
              Update template information and products.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Template Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Template Name *</Label>
                    <Input
                      id="edit-name"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-category">Category *</Label>
                    <Input
                      id="edit-category"
                      value={templateForm.category}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                    />
                  </div>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-target_audience">Target Audience</Label>
                    <Input
                      id="edit-target_audience"
                      value={templateForm.target_audience}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, target_audience: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-difficulty_level">Difficulty Level</Label>
                    <Select 
                      value={templateForm.difficulty_level} 
                      onValueChange={(value: any) => setTemplateForm(prev => ({ ...prev, difficulty_level: value }))}
                    >
                      <SelectTrigger id="edit-difficulty_level">
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
                
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {templateForm.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button 
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:bg-muted rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addNewTag((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <Button 
                      variant="outline" 
                      onClick={(e) => {
                        const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                        if (input.value) {
                          addNewTag(input.value);
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
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
                <h3 className="font-semibold text-lg">Select Products</h3>
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
                          <div className="text-xs text-muted-foreground">
                            {product.brand} • {product.category} {product.price ? `• $${product.price.toFixed(2)}` : ''}
                          </div>
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
                            <Input
                              placeholder="Notes"
                              value={isSelected.notes}
                              onChange={(e) => updateProductConfig(product.id, 'notes', e.target.value)}
                              className="w-24 h-8 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Template Preview</h3>
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      {templateForm.thumbnail_url ? (
                        <img 
                          src={templateForm.thumbnail_url} 
                          alt="Template thumbnail" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Image className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-thumbnail_url">Thumbnail URL</Label>
                      <Input
                        id="edit-thumbnail_url"
                        value={templateForm.thumbnail_url}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Estimated Cost</Label>
                        <div className="text-2xl font-bold">${templateForm.estimated_cost.toFixed(2)}</div>
                      </div>
                      <div>
                        <Label>Products</Label>
                        <div className="text-2xl font-bold">{Object.keys(selectedProducts).length}</div>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Difficulty</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={
                          templateForm.difficulty_level === 'beginner' ? 'default' :
                          templateForm.difficulty_level === 'intermediate' ? 'secondary' : 'destructive'
                        }>
                          {templateForm.difficulty_level}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingTemplate(null);
              setIsEditTemplateOpen(false);
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
    </div>
  );
};

// Helper components for icons not available in lucide-react
const GridIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const CheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const Switch = ({ defaultChecked }: { defaultChecked?: boolean }) => {
  const [checked, setChecked] = useState(defaultChecked || false);
  
  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};