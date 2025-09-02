import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { databases, account } from '@/lib/appwrite';
import { toast } from 'sonner';
import { useRBAC } from '@/hooks/use-rbac';
import { logger } from '@/lib/logger';
import { 
  Package, 
  Plus, 
  Download,
  BarChart3,
  FileText,
  Settings,
  Wrench,
  Grid,
  List
} from 'lucide-react';
import { 
  StarterKitTemplate, 
  ProductOption, 
  TemplateForm 
} from './types';
import { TemplateTable } from './TemplateTable';
import { TemplateGrid } from './TemplateGrid';
import { TemplateForm as TemplateFormComponent } from './TemplateForm';
import { TemplateFilters } from './TemplateFilters';

const templatesPerPage = 10;

export const StarterKitBuilderRefactored: React.FC = () => {
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
  const [sortBy, setSortBy] = useState<'$createdAt' | 'name' | 'estimated_cost'>('$createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeTab, setActiveTab] = useState('templates');
  const { isEditorOrAdmin } = useRBAC();
  const [templateToDelete, setTemplateToDelete] = useState<StarterKitTemplate | null>(null);

  const [templateForm, setTemplateForm] = useState<TemplateForm>({
    name: '',
    description: '',
    category: '',
    is_active: true,
    estimated_cost: 0
  });

  const fetchTemplates = async (page = 1, search = '', category = 'all') => {
    try {
      setLoading(true);

      // Build query with filters for Appwrite
      let queries: string[] = [];

      // Apply search filter
      if (search) {
        const searchCondition = `name LIKE '%${search}%' OR description LIKE '%${search}%' OR category LIKE '%${search}%'`;
        queries.push(JSON.stringify({ method: 'search', values: [searchCondition] }));
      }

      // Apply category filter
      if (category !== 'all') {
        queries.push(JSON.stringify({ method: 'equal', attribute: 'category', values: [category] }));
      }

      // Apply sorting
      if (sortBy) {
        if (sortOrder === 'asc') {
          queries.push(JSON.stringify({ method: 'orderAsc', attribute: sortBy }));
        } else {
          queries.push(JSON.stringify({ method: 'orderDesc', attribute: sortBy }));
        }
      }

      // Apply pagination
      const offset = (page - 1) * templatesPerPage;
      queries.push(JSON.stringify({ method: 'limit', values: [templatesPerPage] }));
      queries.push(JSON.stringify({ method: 'offset', values: [offset] }));

      // Fetch templates from Appwrite 'starterKitTemplates' collection
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'starterKitTemplates',
        queries
      );

      // Also get total count for pagination
      const countResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'starterKitTemplates',
        []
      );

      const transformedTemplates = response.documents?.map((template: any) => ({
        id: template.$id,
        name: template.name,
        description: template.description,
        category: template.category,
        is_active: template.isActive,
        estimated_cost: template.estimatedCost,
        created_at: template.$createdAt,
        updated_at: template.$updatedAt
      })) || [];

      setTemplates(transformedTemplates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        isActive: template.is_active,
        estimatedCost: template.estimated_cost,
        createdAt: template.created_at,
        updatedAt: template.updated_at
      })));
      setTotalPages(Math.ceil((countResponse.total || 0) / templatesPerPage));
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch starter kit templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      // Fetch products from Appwrite 'products' collection
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        [JSON.stringify({ method: 'orderAsc', attribute: 'name' })]
      );

      const transformedProducts = response.documents?.map((product: any) => ({
        id: product.$id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        image_url: product.imageUrl,
        price: product.price
      })) || [];

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      // Fetch all templates and extract unique categories
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'starterKitTemplates',
        []
      );

      const uniqueCategories = [...new Set(response.documents.map((item: any) => item.category).filter(Boolean))];
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
        isActive: templateForm.is_active,
        estimatedCost: templateForm.estimated_cost || 0
      };

      const response = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'starterKitTemplates',
        'unique()',
        templateData
      );

      // Log successful template creation
      await logger.auditLog({
        action: 'CREATE_TEMPLATE',
        entity_type: 'STARTER_KIT_TEMPLATE',
        entity_id: response.$id,
        details: {
          template_name: templateForm.name,
          category: templateForm.category
        }
      });

      toast.success('Template created successfully');
      setIsAddTemplateOpen(false);
      resetForm();
      fetchTemplates(currentPage, searchTerm, selectedCategory);
      fetchCategories();
    } catch (error: any) {
      await logger.auditLog({
        action: 'CREATE_TEMPLATE_FAILED',
        entity_type: 'STARTER_KIT_TEMPLATE',
        details: {
          template_name: templateForm.name,
          error: error.message
        }
      });
      console.error('Error creating template:', error);
      toast.error(`Failed to create template: ${error.message}`);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      const templateData = {
        name: templateForm.name,
        description: templateForm.description || null,
        category: templateForm.category,
        isActive: templateForm.is_active,
        estimatedCost: templateForm.estimated_cost || 0,
        updatedAt: new Date().toISOString()
      };

      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'starterKitTemplates',
        editingTemplate.id,
        templateData
      );

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

      toast.success('Template updated successfully');
      setIsEditTemplateOpen(false);
      setEditingTemplate(null);
      resetForm();
      fetchTemplates(currentPage, searchTerm, selectedCategory);
    } catch (error: any) {
      await logger.auditLog({
        action: 'UPDATE_TEMPLATE_FAILED',
        entity_type: 'STARTER_KIT_TEMPLATE',
        entity_id: editingTemplate.id,
        details: {
          template_name: templateForm.name,
          error: error.message
        }
      });
      console.error('Error updating template:', error);
      toast.error(`Failed to update template: ${error.message}`);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      // Fetch template data before deletion for audit logging
      const template = await databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'starterKitTemplates',
        templateId
      );

      const templateData = {
        name: template.name,
        category: template.category
      };

      await databases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'starterKitTemplates',
        templateId
      );

      // Log successful template deletion
      await logger.auditLog({
        action: 'DELETE_TEMPLATE',
        entityType: 'STARTER_KIT_TEMPLATE',
        entityId: templateId,
        details: {
          template_name: templateData.name,
          category: templateData.category
        }
      });

      toast.success('Template deleted successfully');
      fetchTemplates(currentPage, searchTerm, selectedCategory);
    } catch (error: any) {
      await logger.auditLog({
        action: 'DELETE_TEMPLATE_FAILED',
        entityType: 'STARTER_KIT_TEMPLATE',
        entityId: templateId,
        details: {
          error: error.message
        }
      });
      console.error('Error deleting template:', error);
      toast.error(`Failed to delete template: ${error.message}`);
    }
  };

  const handleEditTemplate = (template: StarterKitTemplate) => {
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

  const handleDuplicateTemplate = async (template: StarterKitTemplate) => {
    try {
      const duplicatedTemplate = {
        name: `${template.name} (Copy)`,
        description: template.description,
        category: template.category,
        isActive: false, // New duplicated templates are inactive by default
        estimatedCost: template.estimated_cost
      };

      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'starterKitTemplates',
        'unique()',
        duplicatedTemplate
      );

      toast.success('Template duplicated successfully');
      fetchTemplates(currentPage, searchTerm, selectedCategory);
    } catch (error: any) {
      console.error('Error duplicating template:', error);
      toast.error(`Failed to duplicate template: ${error.message}`);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTemplates(1, searchTerm, selectedCategory);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setCurrentPage(1);
    fetchTemplates(1, '', 'all');
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  const confirmDeleteTemplate = () => {
    if (templateToDelete) {
      handleDeleteTemplate(templateToDelete.id);
      setTemplateToDelete(null);
    }
  };

  const closeDeleteDialog = () => {
    setTemplateToDelete(null);
  };

  useEffect(() => {
    fetchTemplates(currentPage, searchTerm, selectedCategory);
    fetchCategories();
    fetchProducts();
  }, [currentPage, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Starter Kit Builder
          </CardTitle>
          <CardDescription>
            Create and manage starter kit templates for different use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="builder" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Kit Builder
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="templates" className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-2">
                  <Button onClick={() => setIsAddTemplateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <List className="h-4 w-4 mr-2" />
                        List View
                      </>
                    ) : (
                      <>
                        <Grid className="h-4 w-4 mr-2" />
                        Grid View
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Showing {templates.length} templates
                </div>
              </div>
              
              <TemplateFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                categories={categories}
                onSearch={handleSearch}
                onResetFilters={handleResetFilters}
              />
              
              {viewMode === 'list' ? (
                <TemplateTable
                  templates={templates}
                  onEditTemplate={handleEditTemplate}
                  onDeleteTemplate={(template) => setTemplateToDelete(template)}
                  onDuplicateTemplate={handleDuplicateTemplate}
                  loading={loading}
                />
              ) : (
                <TemplateGrid
                  templates={templates}
                  onEditTemplate={handleEditTemplate}
                  onDeleteTemplate={(template) => setTemplateToDelete(template)}
                  onDuplicateTemplate={handleDuplicateTemplate}
                  loading={loading}
                />
              )}
              
              <div className="flex items-center justify-between mt-4">
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
            </TabsContent>
            
            <TabsContent value="builder" className="space-y-4">
              <div className="text-center py-10">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Kit Builder</h3>
                <p className="text-muted-foreground">
                  The kit builder functionality would be implemented here.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <TemplateFormComponent
        isOpen={isAddTemplateOpen}
        onClose={() => {
          setIsAddTemplateOpen(false);
          resetForm();
        }}
        onSubmit={handleAddTemplate}
        templateForm={templateForm}
        setTemplateForm={setTemplateForm}
        isEditing={false}
      />
      
      <TemplateFormComponent
        isOpen={isEditTemplateOpen}
        onClose={() => {
          setIsEditTemplateOpen(false);
          setEditingTemplate(null);
          resetForm();
        }}
        onSubmit={handleUpdateTemplate}
        templateForm={templateForm}
        setTemplateForm={setTemplateForm}
        isEditing={true}
      />
      
      <AlertDialog open={!!templateToDelete} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTemplate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};