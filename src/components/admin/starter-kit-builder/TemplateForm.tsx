import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Package, FileText } from 'lucide-react';
import { TemplateFormProps } from './types';

export const TemplateForm: React.FC<TemplateFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  templateForm,
  setTemplateForm,
  isEditing
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isEditing ? 'Edit Template' : 'Add New Template'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edit the details of your starter kit template.' 
              : 'Create a new starter kit template.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name *
            </Label>
            <div className="col-span-3">
              <Input
                id="name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Template name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category *
            </Label>
            <div className="col-span-3">
              <Input
                id="category"
                value={templateForm.category}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Athletic Training, Physical Therapy"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right flex items-start pt-2">
              <FileText className="h-4 w-4 mr-1" />
              Description
            </Label>
            <div className="col-span-3">
              <Textarea
                id="description"
                value={templateForm.description}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Template description"
                rows={3}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="estimatedCost" className="text-right">
              Est. Cost ($)
            </Label>
            <div className="col-span-3">
              <Input
                id="estimatedCost"
                type="number"
                value={templateForm.estimatedCost}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isActive" className="text-right">
              Active
            </Label>
            <div className="col-span-3">
              <Switch
                id="isActive"
                checked={templateForm.isActive}
                onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            {isEditing ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};