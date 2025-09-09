import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, ThumbsDown, Verified } from "lucide-react";
import { Review } from "@/lib/types/types";
import { formatDistanceToNow } from "date-fns";

interface ProductReviewsProps {
  reviews: Review[];
  averageRating?: number;
}

const ProductReviews = ({ reviews, averageRating }: ProductReviewsProps) => {
  if (!reviews || reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
        </CardContent>
      </Card>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : i < rating
            ? "fill-yellow-200 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const ratingDistribution = getRatingDistribution();
  const totalReviews = reviews.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Customer Reviews</CardTitle>
        {averageRating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {renderStars(averageRating)}
            </div>
            <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({totalReviews} reviews)</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Distribution */}
        <div className="space-y-2">
          <h4 className="font-medium">Rating Distribution</h4>
          {Object.entries(ratingDistribution)
            .reverse()
            .map(([rating, count]) => {
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="w-8">{rating}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right">{count}</span>
                </div>
              );
            })}
        </div>

        {/* Individual Reviews */}
        <div className="space-y-4">
          <h4 className="font-medium">Reviews</h4>
          {reviews.slice(0, 5).map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{review.userName}</span>
                  {review.verified && (
                    <Badge variant="outline" className="text-xs">
                      <Verified className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(review.date), { addSuffix: true })}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {renderStars(review.rating)}
                </div>
                <span className="text-sm font-medium">{review.title}</span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{review.comment}</p>
              
              {review.totalVotes > 0 && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    {review.helpfulVotes} of {review.totalVotes} found this helpful
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      Helpful
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <ThumbsDown className="w-3 h-3 mr-1" />
                      Not helpful
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {reviews.length > 5 && (
            <Button variant="outline" className="w-full">
              View All {reviews.length} Reviews
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductReviews;