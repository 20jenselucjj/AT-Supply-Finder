import React from 'react';
import { motion } from 'framer-motion';
import { Package2, Package, DollarSign, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GeneratedKit } from '@/lib/ai/openrouter-service';
interface KitPreviewProps {
  kit: GeneratedKit;
  handleBuildKit: (kit: GeneratedKit) => void;
  isMobile: boolean;
}

const KitPreview: React.FC<KitPreviewProps> = ({
  kit,
  handleBuildKit,
  isMobile
}) => {
  return (
    <motion.div 
      className="mt-4 space-y-3"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ delay: 0.2 }}
    >
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Package2 className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Medical Kit: {kit.name}</span>
        </div>
          
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span>{kit.items.length} items</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>${kit.totalPrice.toFixed(2)}</span>
          </div>
        </div>
          
        <div className="flex flex-wrap gap-1 mb-3">
          {kit.items.slice(0, 3).map((item, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs truncate max-w-[100px] rounded-full" 
              title={item.product_name}
            >
              {item.product_name}
            </Badge>
          ))}
          {kit.items.length > 3 && (
            <Badge variant="outline" className="text-xs flex-shrink-0 rounded-full">
              +{kit.items.length - 3} more
            </Badge>
          )}
        </div>
          
        <div className="flex gap-2 mb-3">
          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              size="sm"
              onClick={() => handleBuildKit(kit)}
              className="
                w-full text-xs h-8 bg-primary hover:bg-primary/90 rounded-lg
                transition-all duration-200 hover:shadow-md
                relative overflow-hidden group
              "
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <ExternalLink className="h-3 w-3 mr-2 flex-shrink-0 relative z-10" />
              <span className="truncate relative z-10">Build This Kit</span>
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default KitPreview;