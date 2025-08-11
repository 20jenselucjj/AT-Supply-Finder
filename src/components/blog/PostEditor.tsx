import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const PostEditor = () => {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [categories, setCategories] = useState("");
  const [tags, setTags] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would save the post
    console.log({
      title,
      excerpt,
      content,
      authorName,
      categories: categories.split(",").map(c => c.trim()),
      tags: tags.split(",").map(t => t.trim())
    });
    alert("Post saved! (This is a demo - in a real app, this would save to a database)");
  };
  
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Blog Post</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief summary of the post"
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="author">Author Name</Label>
          <Input
            id="author"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Author name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="categories">Categories</Label>
          <Input
            id="categories"
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            placeholder="Comma-separated categories (e.g., Injury Prevention, Tape Techniques)"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Comma-separated tags (e.g., ankle, prevention, taping)"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your blog post content here. Use # for headings, - for lists, etc."
            rows={15}
            required
          />
        </div>
        
        <div className="flex justify-end">
          <Button type="submit">Save Post</Button>
        </div>
      </form>
    </Card>
  );
};

export default PostEditor;