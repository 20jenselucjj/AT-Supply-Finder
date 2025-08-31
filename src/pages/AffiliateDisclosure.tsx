import React from 'react';
import { Helmet } from 'react-helmet-async';
import PageContainer from '@/components/layout/PageContainer';

const AffiliateDisclosure = () => {
  return (
    <PageContainer className="py-10">
      <Helmet>
        <title>Affiliate Disclosure | AT Supply Finder</title>
        <meta name="description" content="Learn about our affiliate relationships and how we may earn commissions from product recommendations." />
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
            Affiliate Disclosure
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transparency about our affiliate relationships and compensation.
          </p>
        </div>
        
        <div className="prose prose-lg max-w-none mx-auto dark:prose-invert">
          <div className="bg-gradient-to-br from-background to-secondary/50 rounded-xl p-8 mb-8 border border-border">
            <h2 className="text-2xl font-bold mb-4">Affiliate Relationships</h2>
            <p className="mb-4">
              AT Supply Finder is a participant in the Amazon Services LLC Associates Program, 
              an affiliate advertising program designed to provide a means for sites to earn advertising fees 
              by advertising and linking to Amazon.com and affiliated websites.
            </p>
            <p>
              We may also participate in other affiliate programs where we may earn commissions from purchases 
              made through our links at no additional cost to you.
            </p>
          </div>
          
          <div className="bg-secondary/30 rounded-lg p-6 mb-8 border border-border">
            <h3 className="text-xl font-semibold mb-3">How This Works</h3>
            <ul className="space-y-3">
              <li className="flex">
                <span className="font-semibold mr-2">•</span>
                <span>
                  When you click on affiliate links on our website and make a purchase, we may earn a commission.
                </span>
              </li>
              <li className="flex">
                <span className="font-semibold mr-2">•</span>
                <span>
                  This helps support our platform and allows us to continue providing valuable content and tools.
                </span>
              </li>
              <li className="flex">
                <span className="font-semibold mr-2">•</span>
                <span>
                  We only recommend products that we believe in and that we think will be valuable to our users.
                </span>
              </li>
              <li className="flex">
                <span className="font-semibold mr-2">•</span>
                <span>
                  Our recommendations are based on research, professional experience, and user feedback.
                </span>
              </li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-br from-primary/5 to-secondary/30 rounded-xl p-8 mb-8 border border-border">
            <h2 className="text-2xl font-bold mb-4">Our Commitment to Transparency</h2>
            <p className="mb-4">
              We are committed to maintaining the trust of our users and being transparent about our affiliate relationships. 
              Here's what you can expect from us:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="border-l-4 border-primary pl-4 py-1">
                <h4 className="font-semibold mb-2">Honest Reviews</h4>
                <p className="text-sm text-muted-foreground">
                  Our product recommendations are based on genuine research and professional experience.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4 py-1">
                <h4 className="font-semibold mb-2">No Additional Cost</h4>
                <p className="text-sm text-muted-foreground">
                  Affiliate commissions do not increase the price you pay for products.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4 py-1">
                <h4 className="font-semibold mb-2">Clear Disclosure</h4>
                <p className="text-sm text-muted-foreground">
                  We clearly mark all affiliate links with appropriate disclosure.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4 py-1">
                <h4 className="font-semibold mb-2">Product Focus</h4>
                <p className="text-sm text-muted-foreground">
                  We prioritize product quality and value over potential commissions.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-secondary/30 rounded-lg p-6 mb-8 border border-border">
            <h3 className="text-xl font-semibold mb-3">Amazon Associate Program</h3>
            <p className="mb-3">
              As an Amazon Associate, we earn from qualifying purchases. This means when you click on an Amazon link 
              on our site and make a purchase, we may receive a small commission at no extra cost to you.
            </p>
            <p>
              Amazon and the Amazon logo are trademarks of Amazon.com, Inc. or its affiliates.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-background to-secondary/50 rounded-xl p-8 border border-border">
            <h2 className="text-2xl font-bold mb-4">Questions or Concerns</h2>
            <p className="mb-4">
              If you have any questions about our affiliate relationships or disclosure policy, 
              please don't hesitate to contact us.
            </p>
            <div className="mt-6">
              <a 
                href="/contact" 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
              >
                Contact Us
              </a>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default AffiliateDisclosure;