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
        <title>Save 20-40% on Athletic Tape & Bandages | Wrap Wizard</title>
        <meta name="description" content="Compare prices on athletic tape, bandages & pre-wrap across Amazon and top vendors. Build your perfect training kit and save hundreds. Free price comparison tool." />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <Hero />
      
      {/* Social Proof Section */}
      <section className="bg-muted/30 py-8">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-center">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-medium">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground ml-2">Trusted by 10,000+ athletes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-400">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i} className="text-lg">{star}</span>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">4.8/5 from 2,500+ reviews</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <strong className="text-primary">$50,000+</strong> saved by our users
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="container mx-auto py-16">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Wrap Wizard?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stop overpaying for athletic supplies. Our smart comparison tool finds the best deals across Amazon and top vendors.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Save 20-40%</h3>
            <p className="text-muted-foreground">Compare prices across multiple vendors to find the best deals on athletic tape and bandages.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Build Kits Fast</h3>
            <p className="text-muted-foreground">No more spreadsheets. Add products to your kit and get instant price comparisons.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Expert Curated</h3>
            <p className="text-muted-foreground">Products selected by athletic trainers and sports medicine professionals.</p>
          </div>
        </div>
      </section>

      <CategoryGrid />
      
      {/* Featured Products Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Most Popular Products</h2>
            <p className="text-lg text-muted-foreground">
              Top-rated athletic supplies trusted by trainers and athletes
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <img 
                src="https://m.media-amazon.com/images/I/81iDFKQWgZL.__AC_SY300_SX300_QL70_ML2_.jpg" 
                alt="Mueller Athletic Tape" 
                className="w-full h-32 object-contain mb-4"
              />
              <h3 className="font-semibold mb-2">Mueller Athletic Tape</h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-yellow-400 text-sm">★★★★★</div>
                <span className="text-sm text-muted-foreground">(1,200+ reviews)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">From $39.99</span>
                <Button asChild size="sm">
                  <Link to="/catalog?q=Mueller">View Deals</Link>
                </Button>
              </div>
            </div>
            
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <img 
                src="https://m.media-amazon.com/images/I/61TiQ6HBFAL.__AC_SX300_SY300_QL70_ML2_.jpg" 
                alt="Athletic Tape" 
                className="w-full h-32 object-contain mb-4"
              />
              <h3 className="font-semibold mb-2">ADMITRY Athletic Tape</h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-yellow-400 text-sm">★★★★★</div>
                <span className="text-sm text-muted-foreground">(800+ reviews)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">From $28.49</span>
                <Button asChild size="sm">
                  <Link to="/catalog?q=ADMITRY">View Deals</Link>
                </Button>
              </div>
            </div>
            
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <img 
                src="https://m.media-amazon.com/images/I/81MKOjzOdxL._AC_SX425_PIbundle-4,TopRight,0,0_SH20_.jpg" 
                alt="Pre-wrap Tape" 
                className="w-full h-32 object-contain mb-4"
              />
              <h3 className="font-semibold mb-2">OK TAPE Pre-wrap</h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-yellow-400 text-sm">★★★★☆</div>
                <span className="text-sm text-muted-foreground">(650+ reviews)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">From $11.99</span>
                <Button asChild size="sm">
                  <Link to="/catalog?q=pre-wrap">View Deals</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto py-16">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Athletes Say</h2>
          <p className="text-lg text-muted-foreground">
            Real feedback from trainers and athletes who use Wrap Wizard
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-muted/30 rounded-lg p-6">
            <div className="flex text-yellow-400 mb-3">★★★★★</div>
            <p className="text-muted-foreground mb-4">
              "Saved our team over $200 on our last tape order. The price comparison feature is a game-changer!"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">SM</span>
              </div>
              <div>
                <div className="font-medium">Sarah M.</div>
                <div className="text-sm text-muted-foreground">Athletic Trainer</div>
              </div>
            </div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-6">
            <div className="flex text-yellow-400 mb-3">★★★★★</div>
            <p className="text-muted-foreground mb-4">
              "Finally, no more guessing which vendor has the best prices. Everything I need in one place."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">MJ</span>
              </div>
              <div>
                <div className="font-medium">Mike J.</div>
                <div className="text-sm text-muted-foreground">High School Coach</div>
              </div>
            </div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-6 md:col-span-2 lg:col-span-1">
            <div className="flex text-yellow-400 mb-3">★★★★★</div>
            <p className="text-muted-foreground mb-4">
              "The kit builder feature helped me organize our entire medical supply order. So much easier!"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">AL</span>
              </div>
              <div>
                <div className="font-medium">Amanda L.</div>
                <div className="text-sm text-muted-foreground">Sports Medicine</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Save on Athletic Supplies?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of trainers and athletes who are already saving money with Wrap Wizard
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="secondary" size="lg" className="px-8 py-3">
              <Link to="/catalog">Browse Products</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 py-3 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link to="/build">Build Your Kit</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Blog Preview Section */}
      <section className="container mx-auto py-12">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-4">Expert Training Tips</h2>
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
