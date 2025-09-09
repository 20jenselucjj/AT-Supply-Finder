import React from 'react';
import { Helmet } from 'react-helmet-async';
import PageContainer from '@/components/layout/PageContainer';

const About = () => {
  return (
    <PageContainer className="py-10">
      <Helmet>
        <title>About Us | AT Supply Finder</title>
        <meta name="description" content="Learn about AT Supply Finder's mission to help medical professionals find high-quality equipment and supplies at competitive prices." />
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
            About AT Supply Finder
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Empowering medical professionals with the tools and resources they need to provide exceptional care.
          </p>
        </div>
        
        <div className="prose prose-lg max-w-none mx-auto dark:prose-invert">
          <div className="bg-gradient-to-br from-background to-secondary/50 rounded-xl p-8 mb-10 border border-border">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="mb-4">
              At AT Supply Finder, we're dedicated to simplifying the process of finding and comparing high-quality medical supplies and equipment. 
              Our platform connects medical professionals with trusted vendors, providing transparent pricing and comprehensive product information.
            </p>
            <p>
              We believe that access to reliable medical supplies shouldn't be a challenge. Whether you're a seasoned healthcare provider or 
              new to the field, our tools help you make informed decisions quickly and confidently.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="bg-secondary/30 rounded-lg p-6 border border-border">
              <h3 className="text-xl font-semibold mb-3">Our Story</h3>
              <p>
                Founded in 2023 by a team of healthcare professionals and technology experts, AT Supply Finder emerged from a 
                shared frustration with the fragmented landscape of medical supply procurement.
              </p>
              <p className="mt-3">
                After witnessing countless hours wasted comparing products across multiple platforms, we set out to create a 
                centralized solution that would save time and improve outcomes for medical professionals worldwide.
              </p>
            </div>
            
            <div className="bg-secondary/30 rounded-lg p-6 border border-border">
              <h3 className="text-xl font-semibold mb-3">What Sets Us Apart</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Real-time pricing from multiple trusted vendors</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Comprehensive product comparisons</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>AI-powered kit building recommendations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Curated starter kits for various medical scenarios</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-primary/5 to-secondary/30 rounded-xl p-8 mb-10 border border-border">
            <h2 className="text-2xl font-bold mb-4">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Quality Assurance</h3>
                <p className="text-sm text-muted-foreground">
                  We only partner with vendors who meet our stringent quality standards.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Efficiency</h3>
                <p className="text-sm text-muted-foreground">
                  Save valuable time with our streamlined comparison tools.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Community</h3>
                <p className="text-sm text-muted-foreground">
                  Building connections between professionals and trusted suppliers.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-4">Join Our Community</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Whether you're looking to purchase supplies, build custom kits, or stay updated on the latest medical equipment, 
              AT Supply Finder is here to support your professional journey.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a 
                href="/catalog" 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
              >
                Browse Products
              </a>
              <a 
                href="/build" 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4"
              >
                Build a Kit
              </a>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default About;