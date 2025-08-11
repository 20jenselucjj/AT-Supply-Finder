import { getBlogPosts } from "@/lib/blog";

export const generateSitemap = () => {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://wrapwizard.com";
  
  // Static pages
  const staticPages = [
    "",
    "/catalog",
    "/build",
    "/blog"
  ];
  
  // Blog posts
  const blogPosts = getBlogPosts();
  const blogUrls = blogPosts.map(post => `/blog/${post.slug}`);
  
  // Combine all URLs
  const allUrls = [...staticPages, ...blogUrls];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allUrls.map(url => `
  <url>
    <loc>${baseUrl}${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${url === "" ? "1.0" : url.startsWith("/blog/") ? "0.8" : "0.9"}</priority>
  </url>`).join("")}
</urlset>`;
  
  return sitemap;
};

// This would typically be used in a server-side function or API route
// For now, we'll just export the function for potential future use