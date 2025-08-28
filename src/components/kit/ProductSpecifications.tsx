import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Info, Award, Ruler, Weight, Palette, Zap } from "lucide-react";
import { Product, ProductSpecifications as ProductSpecsType } from "@/lib/types";

interface ProductSpecificationsProps {
  product: Product;
  isExpanded?: boolean;
  onToggle?: () => void;
  compact?: boolean; // Add compact prop
}

const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({ 
  product, 
  isExpanded = false, 
  onToggle,
  compact = false // Default to false
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = onToggle ? isExpanded : internalExpanded;
  const handleToggle = onToggle || (() => setInternalExpanded(!internalExpanded));

  const specs = product.specifications;
  if (!specs) return null;

  const getSpecIcon = (key: string) => {
    switch (key) {
      case 'dimensions':
      case 'size':
        return <Ruler className="w-4 h-4" />;
      case 'weight':
        return <Weight className="w-4 h-4" />;
      case 'color':
        return <Palette className="w-4 h-4" />;
      case 'powerSource':
      case 'batteryLife':
        return <Zap className="w-4 h-4" />;
      case 'warranty':
      case 'certifications':
        return <Award className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const formatSpecKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const renderSpecValue = (key: string, value: any) => {
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {item}
            </Badge>
          ))}
        </div>
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  const specEntries = Object.entries(specs).filter(([_, value]) => 
    value !== undefined && value !== null && value !== ''
  );

  const keySpecs = compact ? specEntries.slice(0, 2) : specEntries.slice(0, 3);
  const allSpecs = specEntries; // Define allSpecs variable
  
  if (specEntries.length === 0) return null;

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {/* Key Specifications - Always Visible */}
      <div className={compact ? "grid grid-cols-1 gap-1" : "grid grid-cols-1 gap-2"}>
        {keySpecs.map(([key, value]) => (
          <div key={key} className={`flex items-center justify-between p-1 rounded ${compact ? 'bg-muted/30' : 'bg-muted/50 p-2'}`}>
            <div className="flex items-center gap-1 text-muted-foreground">
              {getSpecIcon(key)}
              <span className={compact ? "text-xs font-medium" : "text-xs font-medium"}>{formatSpecKey(key)}</span>
            </div>
            <div className="text-right max-w-[60%]">
              {renderSpecValue(key, value)}
            </div>
          </div>
        ))}
      </div>

      {/* Toggle Button for Full Specifications - only show if not compact */}
      {!compact && allSpecs.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="w-full text-xs h-8"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              View All Specs ({allSpecs.length})
            </>
          )}
        </Button>
      )}

      {/* Full Specifications - Collapsible - only show if not compact */}
      {!compact && expanded && allSpecs.length > 3 && (
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="w-4 h-4" />
              Complete Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-3">
              {allSpecs.map(([key, value]) => (
                <div key={key} className="flex items-start justify-between py-2 border-b border-muted last:border-0">
                  <div className="flex items-center gap-2 text-muted-foreground min-w-0 flex-1">
                    {getSpecIcon(key)}
                    <span className="text-xs font-medium">{formatSpecKey(key)}</span>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    {renderSpecValue(key, value)}
                  </div>
                </div>
              ))}
            </div>
            
            {product.description && (
              <div className="mt-4 pt-3 border-t border-muted">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Description</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductSpecifications;