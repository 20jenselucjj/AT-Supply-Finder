import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { getBlogPosts } from "@/lib/blog";

interface TagCloudProps {
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

const TagCloud = ({ selectedTag, onTagSelect }: TagCloudProps) => {
  const posts = getBlogPosts();
  
  // Get all unique tags and their frequencies
  const tagData = useMemo(() => {
    const tagMap = new Map<string, number>();
    
    posts.forEach(post => {
      post.tags.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    
    // Convert to array and sort by frequency
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // Limit to top 20 tags
  }, [posts]);
  
  if (tagData.length === 0) return null;
  
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-3">Popular Tags</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedTag === null ? "secondary" : "outline"}
          size="sm"
          onClick={() => onTagSelect(null)}
        >
          All Tags
        </Button>
        
        {tagData.map(([tag, count]) => (
          <Button
            key={tag}
            variant={selectedTag === tag ? "secondary" : "outline"}
            size="sm"
            onClick={() => onTagSelect(tag)}
          >
            {tag} <span className="ml-1 text-xs">({count})</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TagCloud;