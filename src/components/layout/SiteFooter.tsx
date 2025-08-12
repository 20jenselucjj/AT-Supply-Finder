const SiteFooter = () => {
  return (
    <footer className="mt-16 border-t">
      <div className="container mx-auto py-10 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3">Wrap Wizard</h3>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Compare athletic training materials across vendors and build the perfect kit.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><a className="transition-colors duration-200 hover:underline hover:text-primary" href="/catalog">Catalog</a></li>
            <li><a className="transition-colors duration-200 hover:underline hover:text-primary" href="/build">Build a Kit</a></li>
            <li><a className="transition-colors duration-200 hover:underline hover:text-primary" href="/blog">Blog</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Affiliate disclosure</h4>
          <p className="text-sm text-muted-foreground">
            As an Amazon Associate, we earn from qualifying purchases. Links to other vendors may also be affiliate links.
          </p>
        </div>
      </div>
      <div className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Wrap Wizard. All rights reserved.
      </div>
    </footer>
  );
};

export default SiteFooter;
