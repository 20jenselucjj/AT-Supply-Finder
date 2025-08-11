import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  TwitterLogoIcon, 
  LinkedInLogoIcon, 
  Link2Icon,
  EnvelopeClosedIcon 
} from "@radix-ui/react-icons";

interface SocialShareProps {
  title: string;
  url: string;
  excerpt: string;
}

const SocialShare = ({ title, url, excerpt }: SocialShareProps) => {
  const shareToTwitter = () => {
    const text = `${title} ${url}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };
  
  const shareToLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedinUrl, '_blank');
  };
  
  const shareViaEmail = () => {
    const subject = `Check out this article: ${title}`;
    const body = `I thought you might enjoy this article: ${title}\n\n${excerpt}\n\nRead more: ${url}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  
  const copyLink = () => {
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };
  
  return (
    <div className="flex flex-wrap gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={shareToTwitter}
        aria-label="Share on Twitter"
      >
        <TwitterLogoIcon className="h-4 w-4 mr-2" />
        Twitter
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={shareToLinkedIn}
        aria-label="Share on LinkedIn"
      >
        <LinkedInLogoIcon className="h-4 w-4 mr-2" />
        LinkedIn
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={shareViaEmail}
        aria-label="Share via email"
      >
        <EnvelopeClosedIcon className="h-4 w-4 mr-2" />
        Email
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={copyLink}
        aria-label="Copy link"
      >
        <Link2Icon className="h-4 w-4 mr-2" />
        Copy Link
      </Button>
    </div>
  );
};

export default SocialShare;