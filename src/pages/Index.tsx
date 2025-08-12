import { Helmet } from "react-helmet-async";
import Hero from "@/components/home/Hero";
import CategoryGrid from "@/components/home/CategoryGrid";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : "";
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Wrap Wizard",
    url: canonical,
    potentialAction: {
      "@type": "SearchAction",
      target: `${canonical}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main>
      <Helmet>
        <title>Athletic Wrap & Bandage Picker | Wrap Wizard</title>
        <meta name="description" content="Compare prices across vendors and build your athletic training kit: tapes, bandages, pre-wrap and more." />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <Hero />
      <CategoryGrid />
      
      {/* Blog Preview Section */}
      <section className="container mx-auto py-12">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-4">Latest from our Blog</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get expert tips on athletic training, injury prevention, and tape techniques
          </p>
        </div>
        
        <div className="text-center">
          <Button asChild variant="hero" className="px-6 py-3 text-base">
            <Link to="/blog">Read Our Blog</Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Index;
