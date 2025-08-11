import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import { BlogPost, getBlogPosts } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const BlogTag = () => {
  const { tag } = useParams<{ tag: string }>();
  const canonical = typeof window !== "undefined" ? window.location.href : "";
  
  const posts = getBlogPosts();
  
  // Filter posts by tag
  const tagPosts = useMemo(() => {
    if (!tag) return [];
    return posts.filter(post => 
      post.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
    );
  }, [posts, tag]);
  
  if (!tag) {
    return (
      <main className="container mx-auto py-10">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Tag Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The tag you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link to="/blog">Back to Blog</Link>
          </Button>
        </div>
      </main>
    );
  }
  
  return (
    <main className="container mx-auto py-10">
      <Helmet>
        <title>#{tag} - Blog Tag | Wrap Wizard</title>
        <meta name="description" content={`All blog posts tagged with ${tag}`} />
        <link rel="canonical" href={canonical} />
      </Helmet>
      
      <Button asChild variant="outline" className="mb-6">
        <Link to="/blog">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Link>
      </Button>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Posts tagged with #{tag}</h1>
        <p className="text-muted-foreground mt-2">
          All blog posts tagged with {tag}
        </p>
      </div>
      
      {tagPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No posts found with the tag {tag}.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tagPosts.map((post) => (
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
      )}
      
      {/* Posts Count */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        Showing {tagPosts.length} posts
      </div>
    </main>
  );
};

export default BlogTag;