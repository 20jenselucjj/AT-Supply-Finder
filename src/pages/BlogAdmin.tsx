import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBlogPosts } from "@/lib/blog";
import PostEditor from "@/components/blog/PostEditor";
import { ArrowLeft } from "lucide-react";

const BlogAdmin = () => {
  const posts = getBlogPosts();
  
  return (
    <main className="container mx-auto py-10">
      <Helmet>
        <title>Blog Admin | Wrap Wizard</title>
        <meta name="description" content="Manage blog posts for Wrap Wizard" />
      </Helmet>
      
      <Button asChild variant="outline" className="mb-6">
        <Link to="/blog">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Link>
      </Button>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Blog Admin</h1>
          <p className="text-muted-foreground mt-2">
            Manage your blog posts
          </p>
        </div>
        <Button asChild>
          <Link to="/blog/admin/new">Create New Post</Link>
        </Button>
      </div>
      
      <div className="grid gap-6">
        <PostEditor />
        
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Existing Posts</h2>
          
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No blog posts yet. Create your first post above!
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {posts.map((post) => (
                <Card key={post.id} className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{post.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Published on {post.publishedAt.toLocaleDateString()} by {post.author.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default BlogAdmin;