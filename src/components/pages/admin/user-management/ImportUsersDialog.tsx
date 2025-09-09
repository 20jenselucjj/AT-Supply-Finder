import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Users } from 'lucide-react';
import { toast } from 'sonner';

interface ImportUsersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (users: any[]) => void;
}

export const ImportUsersDialog: React.FC<ImportUsersDialogProps> = ({ isOpen, onClose, onImport }) => {
  const [importMethod, setImportMethod] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [textData, setTextData] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    try {
      if (importMethod === 'file' && file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonData = JSON.parse(e.target?.result as string);
            onImport(jsonData);
            toast.success('Users imported successfully');
            onClose();
          } catch (error) {
            toast.error('Invalid JSON format in file');
          }
        };
        reader.readAsText(file);
      } else if (importMethod === 'text' && textData) {
        try {
          const jsonData = JSON.parse(textData);
          onImport(jsonData);
          toast.success('Users imported successfully');
          onClose();
        } catch (error) {
          toast.error('Invalid JSON format in text');
        }
      } else {
        toast.error('Please provide data to import');
      }
    } catch (error) {
      toast.error('Failed to import users');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Users
          </DialogTitle>
          <DialogDescription>
            Import users from a JSON file or paste JSON data directly
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={importMethod === 'file' ? 'default' : 'outline'}
              onClick={() => setImportMethod('file')}
            >
              <FileText className="h-4 w-4 mr-2" />
              File Upload
            </Button>
            <Button
              variant={importMethod === 'text' ? 'default' : 'outline'}
              onClick={() => setImportMethod('text')}
            >
              <Users className="h-4 w-4 mr-2" />
              Text Input
            </Button>
          </div>
          
          {importMethod === 'file' ? (
            <div>
              <Label htmlFor="import-file">Upload JSON File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a JSON file containing user data
              </p>
            </div>
          ) : (
            <div>
              <Label htmlFor="import-text">Paste JSON Data</Label>
              <Textarea
                id="import-text"
                placeholder='[{"email": "user@example.com", "role": "user"}, ...]'
                value={textData}
                onChange={(e) => setTextData(e.target.value)}
                className="mt-1 min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste JSON array of user objects
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport}>
            Import Users
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};