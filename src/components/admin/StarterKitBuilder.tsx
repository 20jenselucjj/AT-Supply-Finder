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
  Copy, 
  Download,
  Filter,
  Search,
  BarChart3,
  FileText,
  Settings,
  Wrench
} from 'lucide-react';

interface StarterKitTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  estimated_cost?: number;
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
    estimated_cost: 0
  });

  const templatesPerPage = 10;

  const fetchTemplates = async (page = 1, search = '', category = 'all') => {
    try {
      setLoading(true);

      let query = supabase
        .from('starter_kit_templates')
        .select('*', { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' })
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

  const resetForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      category: '',
      is_active: true,
      estimated_cost: 0
    });
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

      // Log successful template creation
      await logger.auditLog({
        action: 'CREATE_TEMPLATE',
        entity_type: 'STARTER_KIT_TEMPLATE',
        entity_id: template.id,
        details: {
          template_name: templateForm.name,
          category: templateForm.category
        }
      });

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
        is_active: templateForm.is_active,
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

      // Log successful template update
      await logger.auditLog({
        action: 'UPDATE_TEMPLATE',
        entity_type: 'STARTER_KIT_TEMPLATE',
        entity_id: editingTemplate.id,
        details: {
          template_name: templateForm.name,
          category: templateForm.category
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
      estimated_cost: template.estimated_cost || 0
    });
    setIsEditTemplateOpen(true);
  };

  const duplicateTemplate = (template: StarterKitTemplate) => {
    setTemplateForm({
      name: `${template.name} (Copy)`,
      description: template.description || '',
      category: template.category,
      is_active: template.is_active,
      estimated_cost: template.estimated_cost || 0
    });
    setIsAddTemplateOpen(true);
    
    toast.success('Template duplicated');
  };

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
          fetchTemplates(currentPage, searchTerm, selectedCategory);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'starter_kit_templates' },
        (payload) => {
          console.log('Starter kit template updated:', payload.new);
          fetchTemplates(currentPage, searchTerm, selectedCategory);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'starter_kit_templates' },
        (payload) => {
          console.log('Starter kit template deleted:', payload.old);
          fetchTemplates(currentPage, searchTerm, selectedCategory);
        }
      )
      .subscribe();

    // Clean up subscriptions on unmount
    return () => {
      supabase.removeChannel(templatesChannel);
    };
  }, [currentPage, selectedCategory, sortBy, sortOrder]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
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
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Starter Kit Template</DialogTitle>
                  <DialogDescription>
                    Build a new starter kit template with products and configuration.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
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
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="active"
                      checked={templateForm.is_active}
                      onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_active: checked as boolean }))}
                    />
                    <Label htmlFor="active">Active Template</Label>
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
                
                <Button onClick={handleSearch} variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
              
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
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{template.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                ${template.estimated_cost?.toFixed(2) || '0.00'}
                              </div>
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
                        const totalCost = template.estimated_cost || 0;

                        return (
                          <Card key={template.id} className="p-4">
                            <div className="space-y-3">
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
                                </div>
                              </div>

                              {/* Stats */}
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <div className="font-medium">${totalCost.toFixed(2)}</div>
                                  <div className="text-xs text-muted-foreground">Est. Cost</div>
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
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Categories</p>
                            <p className="text-2xl font-bold">{categories.length}</p>
                          </div>
                          <BarChart3 className="h-8 w-8 text-muted-foreground" />
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
                        <Label>Show Cost Estimates</Label>
                        <p className="text-sm text-muted-foreground">
                          Display estimated costs for templates
                        </p>
                      </div>
                      <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </div>
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
                        </SelectContent>
                      </Select>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Starter Kit Template</DialogTitle>
            <DialogDescription>
              Update template information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={templateForm.description}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
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

export default StarterKitBuilder;