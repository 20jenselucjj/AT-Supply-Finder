import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid, List } from 'lucide-react';
import { ProductViewToggleProps } from './types';

export const ProductViewToggle: React.FC<ProductViewToggleProps> = ({
  viewMode,
  setViewMode
}) => {
  return (
    <div className="flex gap-2">
      <Button
        variant={viewMode === 'grid' ? 'default' : 'outline'}
        size="icon"
        onClick={() => setViewMode('grid')}
      >
        <Grid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'outline'}
        size="icon"
        onClick={() => setViewMode('list')}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
};