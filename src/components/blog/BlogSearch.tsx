import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";

interface BlogSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch: () => void;
}

const BlogSearch = ({ searchTerm, onSearchChange, onSearch }: BlogSearchProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-grow">
        <Input
          placeholder="Search blog posts..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search blog posts"
        />
        <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      <Button type="submit" className="hidden sm:inline-flex">
        Search
      </Button>
    </form>
  );
};

export default BlogSearch;