import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import { BlogPost, getBlogPostBySlug, getRelatedPosts } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Clock, Calendar, User } from "lucide-react";
import SocialShare from "@/components/blog/SocialShare";
import Comments from "@/components/blog/Comments";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = getBlogPostBySlug(slug || "");
  
  const relatedPosts = useMemo(() => {
    return post ? getRelatedPosts(post) : [];
  }, [post]);
  
  if (!post) {
    return (
      <main className="container mx-auto py-10">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/blog">Back to Blog</Link>
          </Button>
        </div>
      </main>
    );
  }
  
  // Convert markdown-like content to HTML
  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('# ')) {
          return `<h1 class="text-3xl font-bold mt-8 mb-4">${line.substring(2)}</h1>`;
        } else if (line.startsWith('## ')) {
          return `<h2 class="text-2xl font-bold mt-6 mb-3">${line.substring(3)}</h2>`;
        } else if (line.startsWith('### ')) {
          return `<h3 class="text-xl font-bold mt-5 mb-2">${line.substring(4)}</h3>`;
        } else if (line.startsWith('- ')) {
          return `<li class="ml-4">${line.substring(2)}</li>`;
        } else if (line.startsWith('1. ')) {
          return `<li class="ml-4">${line.substring(3)}</li>`;
        } else if (line.trim() === '') {
          return '<br/>';
        } else if (line.includes('[catalog]')) {
          return line.replace('[catalog]', `<a href="/catalog" class="text-primary hover:underline">catalog</a>`);
        } else {
          return `<p class="mb-4">${line}</p>`;
        }
      })
      .join('');
  };
  
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/blog/${post.slug}` : "";
  
  return (
    <main className="container mx-auto py-10">
      <Helmet>
        <title>{post.seo.title}</title>
        <meta name="description" content={post.seo.description} />
        <meta name="keywords" content={post.seo.keywords.join(', ')} />
        <link rel="canonical" href={canonical} />
        {post.featuredImage && (
          <meta property="og:image" content={post.featuredImage.url} />
        )}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.publishedAt.toISOString()} />
        <meta property="article:modified_time" content={post.updatedAt.toISOString()} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      
      <Button asChild variant="outline" className="mb-6">
        <Link to="/blog">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Link>
      </Button>
      
      <article className="max-w-3xl mx-auto">
        {post.featuredImage && (
          <div className="w-full h-64 md:h-96 rounded-lg overflow-hidden mb-6">
            <img 
              src={post.featuredImage.url} 
              alt={post.featuredImage.alt}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center">
              <User className="mr-1 h-4 w-4" />
              <span>{post.author.name}</span>
            </div>
            
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              <time dateTime={post.publishedAt.toISOString()}>
                {post.publishedAt.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </time>
            </div>
            
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              <span>{post.readingTime} min read</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {post.categories.map((category) => (
              <span 
                key={category} 
                className="px-3 py-1 text-sm rounded-full bg-secondary text-secondary-foreground"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
        
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
        />
        
        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
          
          <SocialShare
            title={post.title}
            url={canonical}
            excerpt={post.excerpt}
          />
        </div>
      </article>
      
      <Comments />
      
      {/* Related Posts Section */}
      {relatedPosts.length > 0 && (
        <section className="max-w-3xl mx-auto mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((relatedPost) => (
              <Card key={relatedPost.id} className="flex flex-col overflow-hidden">
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold mb-2">
                    <Link 
                      to={`/blog/${relatedPost.slug}`} 
                      className="hover:text-primary transition-colors"
                    >
                      {relatedPost.title}
                    </Link>
                  </h3>
                  
                  <p className="text-muted-foreground text-sm mb-4 flex-grow">
                    {relatedPost.excerpt}
                  </p>
                  
                  <div className="flex items-center text-xs text-muted-foreground">
                    <time dateTime={relatedPost.publishedAt.toISOString()}>
                      {relatedPost.publishedAt.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </time>
                    <span className="mx-2">•</span>
                    <span>{relatedPost.readingTime} min read</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default BlogPost;