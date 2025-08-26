import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, Search, UserPlus, Upload, Download } from 'lucide-react';
import { SearchAndActionsProps } from './types';

export const SearchAndActions: React.FC<SearchAndActionsProps> = ({
  searchTerm,
  setSearchTerm,
  onSearch,
  onCreateUser,
  onImportUsers,
  onExportUsers,
  hasActiveFilters,
  onResetFilters
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      <div className="flex-1 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={onSearch} variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
        <Button 
          variant={hasActiveFilters ? "default" : "outline"} 
          size="icon"
          onClick={onResetFilters}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={onImportUsers}>
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <Button variant="outline" onClick={onExportUsers}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button onClick={onCreateUser} className="whitespace-nowrap">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
    </div>
  );
};