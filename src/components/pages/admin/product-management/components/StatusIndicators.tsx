import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Award,
  AlertTriangle
} from 'lucide-react';

interface ProductData {
  id: string;
  name: string;
  category: string;
  brand: string;
  rating?: number | null;
  price?: number | null;
  imageUrl?: string;
  asin?: string;
  affiliateLink?: string;
  dimensions?: string;
  weight?: string;
  material?: string;
  features?: string | string[];
  createdAt?: string;
  updatedAt?: string;
  status?: 'active' | 'inactive' | 'draft' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  amazonStatus?: 'available' | 'unavailable' | 'price_changed' | 'new_listing';
}

// Enhanced Status Badge Component
export const ProductStatusBadge: React.FC<{
  product: ProductData;
  variant?: 'default' | 'compact' | 'detailed'
}> = ({ product, variant = 'default' }) => {
  const getStatusConfig = () => {
    // Determine status based on multiple factors
    if (product.status === 'archived') {
      return {
        label: 'Archived',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <AlertCircle className="h-3 w-3" />,
        priority: 0
      };
    }

    if (product.status === 'draft') {
      return {
        label: 'Draft',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="h-3 w-3" />,
        priority: 1
      };
    }

    if (product.status === 'inactive') {
      return {
        label: 'Inactive',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <Minus className="h-3 w-3" />,
        priority: 2
      };
    }

    // Active status - determine quality based on rating and other factors
    const rating = product.rating || 0;
    const hasImage = !!product.imageUrl;
    const hasAffiliateLink = !!product.affiliateLink;
    const hasCompleteInfo = !!(product.dimensions && product.material && product.features);

    if (rating >= 4.5 && hasImage && hasAffiliateLink && hasCompleteInfo) {
      return {
        label: 'Premium',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <Award className="h-3 w-3" />,
        priority: 3
      };
    }

    if (rating >= 4.0 && hasImage && hasAffiliateLink) {
      return {
        label: 'Excellent',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="h-3 w-3" />,
        priority: 4
      };
    }

    if (rating >= 3.5) {
      return {
        label: 'Good',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Star className="h-3 w-3" />,
        priority: 5
      };
    }

    if (rating >= 2.5) {
      return {
        label: 'Average',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <TrendingUp className="h-3 w-3" />,
        priority: 6
      };
    }

    return {
      label: 'Needs Review',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: <AlertTriangle className="h-3 w-3" />,
      priority: 7
    };
  };

  const config = getStatusConfig();

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.color}`}>
        {config.icon}
        <span className="hidden sm:inline">{config.label}</span>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`gap-1 ${config.color}`}>
          {config.icon}
          {config.label}
        </Badge>
        {product.priority && (
          <PriorityBadge priority={product.priority} size="sm" />
        )}
      </div>
    );
  }

  return (
    <Badge variant="outline" className={`gap-1 ${config.color}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
};

// Priority Badge Component
export const PriorityBadge: React.FC<{
  priority: 'low' | 'medium' | 'high' | 'urgent';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}> = ({ priority, size = 'md', showLabel = false }) => {
  const getPriorityConfig = () => {
    switch (priority) {
      case 'urgent':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertTriangle className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
          label: 'Urgent'
        };
      case 'high':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <TrendingUp className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
          label: 'High'
        };
      case 'medium':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Clock className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
          label: 'Medium'
        };
      case 'low':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <TrendingDown className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />,
          label: 'Low'
        };
    }
  };

  const config = getPriorityConfig();

  if (showLabel) {
    return (
      <Badge variant="outline" className={`gap-1 ${config.color}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center rounded-full ${config.color} p-1`}>
      {config.icon}
    </div>
  );
};

// Stock Status Badge
export const StockStatusBadge: React.FC<{
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  variant?: 'badge' | 'indicator' | 'text';
}> = ({ stockStatus, variant = 'badge' }) => {
  const getStockConfig = () => {
    switch (stockStatus) {
      case 'in_stock':
        return {
          label: 'In Stock',
          color: 'bg-green-100 text-green-800 border-green-200',
          indicator: 'bg-green-500'
        };
      case 'low_stock':
        return {
          label: 'Low Stock',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          indicator: 'bg-yellow-500'
        };
      case 'out_of_stock':
        return {
          label: 'Out of Stock',
          color: 'bg-red-100 text-red-800 border-red-200',
          indicator: 'bg-red-500'
        };
      case 'discontinued':
        return {
          label: 'Discontinued',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          indicator: 'bg-gray-500'
        };
    }
  };

  const config = getStockConfig();

  if (variant === 'indicator') {
    return <div className={`w-2 h-2 rounded-full ${config.indicator}`} />;
  }

  if (variant === 'text') {
    return <span className="text-xs text-muted-foreground">{config.label}</span>;
  }

  return (
    <Badge variant="outline" className={`${config.color}`}>
      {config.label}
    </Badge>
  );
};

// Amazon Status Badge
export const AmazonStatusBadge: React.FC<{
  amazonStatus: 'available' | 'unavailable' | 'price_changed' | 'new_listing';
  size?: 'sm' | 'md' | 'lg';
}> = ({ amazonStatus, size = 'md' }) => {
  const getAmazonConfig = () => {
    switch (amazonStatus) {
      case 'available':
        return {
          label: 'Available',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="h-3 w-3" />
        };
      case 'unavailable':
        return {
          label: 'Unavailable',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertCircle className="h-3 w-3" />
        };
      case 'price_changed':
        return {
          label: 'Price Changed',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <TrendingUp className="h-3 w-3" />
        };
      case 'new_listing':
        return {
          label: 'New Listing',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <Star className="h-3 w-3" />
        };
    }
  };

  const config = getAmazonConfig();

  return (
    <Badge variant="outline" className={`gap-1 ${config.color}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
};

// Quality Score Component
export const QualityScore: React.FC<{
  product: ProductData;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ product, showLabel = true, size = 'md' }) => {
  const calculateScore = (): number => {
    let score = 0;
    let maxScore = 0;

    // Rating (30 points max)
    maxScore += 30;
    if (product.rating) {
      score += Math.min(product.rating / 5 * 30, 30);
    }

    // Image (20 points)
    maxScore += 20;
    if (product.imageUrl) score += 20;

    // Complete information (25 points)
    maxScore += 25;
    let infoScore = 0;
    if (product.dimensions) infoScore += 8;
    if (product.material) infoScore += 8;
    if (product.features) infoScore += 9;
    score += infoScore;

    // Amazon affiliate link (15 points)
    maxScore += 15;
    if (product.affiliateLink) score += 15;

    // Brand presence (10 points)
    maxScore += 10;
    if (product.brand) score += 10;

    return Math.round((score / maxScore) * 100);
  };

  const score = calculateScore();
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  };

  const getScoreColor = () => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = () => {
    if (score >= 90) return 'bg-emerald-100';
    if (score >= 75) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`rounded-full ${getScoreBgColor()} flex items-center justify-center ${sizeClasses[size]}`}>
        <span className={`font-bold ${getScoreColor()}`}>
          {score}
        </span>
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">Quality</span>
      )}
    </div>
  );
};