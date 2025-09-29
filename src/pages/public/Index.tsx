import React from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from '@/components/pages/home/Hero';
import CategoryGrid from '@/components/pages/home/CategoryGrid';
import StarterKitDisplay from '@/components/pages/home/StarterKitDisplay';

const Index = () => {
  return (
    <div className="animate-fade-in">
      <Helmet>
        <title>First Aid Kit Builder | Compare & Save</title>
        <meta name="description" content="Find high-quality medical equipment and supplies from trusted vendors. Compare prices and build your first aid kit with essential medical supplies." />
      </Helmet>

      <Hero />

      <div className="section-padding">
        <CategoryGrid />
      </div>

      <section className="container mx-auto py-20 px-4">
        <div className="bg-gradient-to-br from-background to-secondary/70 rounded-xl shadow-lg p-10 border border-border padding-container animate-fade-in">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent inline-block" style={{ fontFamily: 'var(--font-heading)' }}>
              First Aid Kit Builder
            </h2>
            <p className="text-muted-foreground mb-10 text-lg">
              Our platform is designed specifically for building comprehensive first aid kits with essential medical supplies.
              We partner with trusted vendors to ensure you have access to premium products at competitive prices.
            </p>

            <div className="grid md:grid-cols-3 gap-8 text-center mt-12">
              <div className="p-6 pro-card stagger-item bg-gradient-to-br from-background to-secondary/50 rounded-lg border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1">
                <div className="bg-primary/20 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-3">Medical Grade Quality</h3>
                <p className="text-sm text-muted-foreground">All products meet medical standards for first aid and emergency response situations.</p>
              </div>

              <div className="p-6 pro-card stagger-item bg-gradient-to-br from-background to-secondary/50 rounded-lg border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1">
                <div className="bg-primary/20 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-3">Competitive Pricing</h3>
                <p className="text-sm text-muted-foreground">Compare prices across vendors to ensure you get the best value for your budget.</p>
              </div>

              <div className="p-6 pro-card stagger-item bg-gradient-to-br from-background to-secondary/50 rounded-lg border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1">
                <div className="bg-primary/20 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-3">First Aid Expert Curated</h3>
                <p className="text-sm text-muted-foreground">Products selected by first aid experts with years of emergency response experience.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StarterKitDisplay />
    </div>
  );
};

export default Index;