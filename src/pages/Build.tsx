import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Build = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : "";
  return (
    <main className="container mx-auto py-10">
      <Helmet>
        <title>Build Your Kit | Wrap Wizard</title>
        <meta name="description" content="Select tapes, bandages and more to create your athletic training kit and compare prices across vendors." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <h1 className="text-3xl font-bold mb-4">Build your kit</h1>
      <p className="text-muted-foreground max-w-2xl">
        Soon you’ll be able to add items from the catalog, set quantities, and automatically find the best total across vendors.
      </p>
      <div className="mt-6">
        <Button asChild variant="hero">
          <Link to="/catalog">Add items from Catalog</Link>
        </Button>
      </div>
    </main>
  );
};

export default Build;
