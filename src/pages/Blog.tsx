import { Helmet } from "react-helmet-async";
import PageContainer from "@/components/layout/PageContainer";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { BlogPost, getBlogPosts } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BlogSearch from "@/components/blog/BlogSearch";
import TagCloud from "@/components/blog/TagCloud";
import Pagination from "@/components/blog/Pagination";

const Blog = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : "";
  const posts = getBlogPosts();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;
  
  // Get all unique categories
  const categories = useMemo(() => {
    const allCategories = posts.flatMap(post => post.categories);
    const uniqueCategories = Array.from(new Set(allCategories));
    return ["all", ...uniqueCategories];
  }, [posts]);
  
  // Filter posts based on search, category, and tag
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = searchTerm === "" ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === "all" ||
        post.categories.includes(selectedCategory);
      
      const matchesTag = selectedTag === null ||
        post.tags.includes(selectedTag);
      
      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [posts, searchTerm, selectedCategory, selectedTag]);
  
  // Paginate filtered posts
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    return filteredPosts.slice(startIndex, startIndex + postsPerPage);
  }, [filteredPosts, currentPage, postsPerPage]);
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  
  return (
    <main className="py-10">
      <PageContainer>
      <Helmet>
  <title>Blog – Athletic Training Tips | AT Supply Finder</title>
        <meta name="description" content="Learn about athletic training, injury prevention, and tape techniques from our expert blog posts." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Athletic Training Blog</h1>
          <p className="text-muted-foreground mt-2">
            Tips, techniques, and expert advice for athletes and trainers
          </p>
        </div>
      </div>
      
      {/* Search and Filter Section */}
      <section className="mb-8">
        <div className="grid gap-4 md:grid-cols-3 mb-4">
          <div className="md:col-span-2">
            <BlogSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSearch={() => {}} // Search happens automatically as user types
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2" aria-label="Filter by category">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === selectedCategory ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedCategory(category);
                setSelectedTag(null);
              }}
              aria-pressed={category === selectedCategory}
              aria-label={`Filter by ${category}`}
            >
              {category === "all" ? "All Categories" : category}
            </Button>
          ))}
        </div>
        
        <TagCloud
          selectedTag={selectedTag}
          onTagSelect={(tag) => {
            setSelectedTag(tag);
            if (tag !== null) {
              setSelectedCategory("all");
            }
          }}
        />
      </section>
      
      {/* Blog Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No blog posts match your filters. Try adjusting your search or category selection.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedPosts.map((post) => (
              <Card key={post.id} className="flex flex-col overflow-hidden">
                {post.featuredImage && (
                  <div className="w-full h-48 overflow-hidden">
                    <img
                      src={post.featuredImage.url}
                      alt={post.featuredImage.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <time dateTime={post.publishedAt.toISOString()}>
                      {post.publishedAt.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                    <span className="mx-2">•</span>
                    <span>{post.readingTime} min read</span>
                  </div>
                  
                  <h2 className="text-xl font-bold mb-2">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="hover:text-primary transition-colors"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  
                  <p className="text-muted-foreground mb-4 flex-grow">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {post.categories.map((category) => (
                      <span
                        key={category}
                        className="px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
      
      {/* Posts Count */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        Showing {paginatedPosts.length} of {filteredPosts.length} posts
      </div>
      </PageContainer>
    </main>
  );
};

export default Blog;