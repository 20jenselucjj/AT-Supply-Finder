import { getBlogPosts } from "@/lib/blog";

export const generateRSS = () => {
  const posts = getBlogPosts();
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://wrapwizard.com";
  
  const rssItems = posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.excerpt}]]></description>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid>${siteUrl}/blog/${post.slug}</guid>
      <pubDate>${post.publishedAt.toUTCString()}</pubDate>
      <category><![CDATA[${post.categories.join("]]><![CDATA[")}]]></category>
    </item>
  `).join("");
  
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AT Supply Finder Blog</title>
    <description>Athletic training tips, injury prevention, and tape techniques</description>
    <link>${siteUrl}/blog</link>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;
  
  return rss;
};

// This would typically be used in a server-side function or API route
// For now, we'll just export the function for potential future use