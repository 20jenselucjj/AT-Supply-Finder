const SiteFooter = () => {
  return (
    <footer className="mt-16 border-t bg-secondary/50">
      <div className="container mx-auto py-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="AT Supply Finder Logo" className="h-10 w-10" />
        <h3 className="text-base font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>AT Supply Finder</h3>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Providing medical professionals with high-quality equipment and supplies at competitive prices. Compare products across trusted vendors and build customized kits for your specific needs.
          </p>
          <div className="mt-4 flex gap-3">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
            </a>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-foreground/80">Products</h4>
          <ul className="space-y-3 text-sm">
            <li><a className="text-muted-foreground transition-colors duration-200 hover:text-primary" href="/catalog">All Products</a></li>
            <li><a className="text-muted-foreground transition-colors duration-200 hover:text-primary" href="/build">Build a Kit</a></li>
            <li><a className="text-muted-foreground transition-colors duration-200 hover:text-primary" href="/catalog?cat=wound-care-dressings">Wound Care</a></li>
            <li><a className="text-muted-foreground transition-colors duration-200 hover:text-primary" href="/catalog?cat=tapes-wraps">Medical Tapes & Wraps</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-foreground/80">Information</h4>
          <ul className="space-y-3 text-sm">
            <li><a className="text-muted-foreground transition-colors duration-200 hover:text-primary" href="/about">About Us</a></li>
            <li><a className="text-muted-foreground transition-colors duration-200 hover:text-primary" href="/contact">Contact</a></li>
            <li><a className="text-muted-foreground transition-colors duration-200 hover:text-primary" href="/affiliate-disclosure">Affiliate Disclosure</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-6 text-center text-xs text-muted-foreground">
        <div className="container mx-auto">
          <p>© {new Date().getFullYear()} AT Supply Finder. All rights reserved.</p>
          <p className="mt-2">As an Amazon Associate, we earn from qualifying purchases. Links to other vendors may also be affiliate links.</p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;