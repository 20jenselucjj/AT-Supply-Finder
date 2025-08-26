import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { StarterKitTemplate, TemplateGridProps } from './types';

export const TemplateGrid: React.FC<TemplateGridProps> = ({
  templates,
  onEditTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  loading
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <Card key={template.id} className="flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <Badge variant={template.is_active ? 'default' : 'secondary'}>
                {template.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2">
              {template.description || 'No description provided'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <Badge variant="outline">{template.category}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Estimated Cost</span>
                <span className="font-medium">
                  {template.estimated_cost ? `$${template.estimated_cost.toFixed(2)}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">
                  {format(new Date(template.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditTemplate(template)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDuplicateTemplate(template)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeleteTemplate(template)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
      {templates.length === 0 && (
        <div className="col-span-full text-center py-10 text-muted-foreground">
          No templates found
        </div>
      )}
    </div>
  );
};