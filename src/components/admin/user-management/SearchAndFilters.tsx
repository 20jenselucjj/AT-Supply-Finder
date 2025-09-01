import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Filter,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { FilterOptions } from './types';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onSearch: () => void;
  onRefresh: () => void;
  onToggleFilters: () => void;
  hasActiveFilters: boolean;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  onSearchTermChange,
  onSearch,
  onRefresh,
  onToggleFilters,
  hasActiveFilters
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by email..."
          className="pl-10 dark:text-slate-900 dark:bg-slate-100 dark:placeholder:text-slate-500"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onToggleFilters}
          className={hasActiveFilters ? "border-primary" : ""}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 h-2 w-2 rounded-full bg-primary"></span>
          )}
        </Button>
        
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};