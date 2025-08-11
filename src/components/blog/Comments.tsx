import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
}

const Comments = () => {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: "Alex Johnson",
      content: "Great article! I've been using athletic tape for years but never knew about the different types. This was very informative.",
      createdAt: new Date("2025-08-01")
    },
    {
      id: "2",
      author: "Sam Wilson",
      content: "Thanks for the detailed comparison between tape and braces. I've been debating which to use for my ankle issues.",
      createdAt: new Date("2025-08-02")
    }
  ]);
  
  const [newComment, setNewComment] = useState({
    author: "",
    content: ""
  });
  
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newComment.author.trim() && newComment.content.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        author: newComment.author,
        content: newComment.content,
        createdAt: new Date()
      };
      
      setComments([comment, ...comments]);
      setNewComment({ author: "", content: "" });
    }
  };
  
  return (
    <div className="mt-12 pt-8 border-t">
      <h2 className="text-2xl font-bold mb-6">Comments ({comments.length})</h2>
      
      {/* Add Comment Form */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Add a Comment</h3>
        <form onSubmit={handleAddComment} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="author">Name</Label>
            <Input
              id="author"
              value={newComment.author}
              onChange={(e) => setNewComment({...newComment, author: e.target.value})}
              placeholder="Your name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              value={newComment.content}
              onChange={(e) => setNewComment({...newComment, content: e.target.value})}
              placeholder="Share your thoughts..."
              rows={4}
              required
            />
          </div>
          
          <div className="flex justify-end">
            <Button type="submit">Post Comment</Button>
          </div>
        </form>
      </Card>
      
      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold">{comment.author}</h4>
                <time 
                  dateTime={comment.createdAt.toISOString()}
                  className="text-sm text-muted-foreground"
                >
                  {comment.createdAt.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </time>
              </div>
              <p className="text-muted-foreground">{comment.content}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;