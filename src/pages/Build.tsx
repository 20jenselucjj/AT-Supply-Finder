import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useKit } from "@/context/kit-context";
import KitItem from "@/components/kit/KitItem";
import KitSummary from "@/components/kit/KitSummary";

const Build = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : "";
  const { kit } = useKit();
  
  return (
    <main className="container mx-auto py-10">
      <Helmet>
        <title>Build Your Kit | Wrap Wizard</title>
        <meta name="description" content="Select tapes, bandages and more to create your athletic training kit and compare prices across vendors." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Build your kit</h1>
        {kit.length > 0 && (
          <Button asChild variant="outline">
            <Link to="/catalog">Add More Items</Link>
          </Button>
        )}
      </div>
      
      {kit.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Your kit is empty. Add items from the catalog to build your perfect athletic training kit.
          </p>
          <Button asChild variant="hero">
            <Link to="/catalog">Add items from Catalog</Link>
          </Button>
        </div>
      ) : (
        <div>
          <div className="space-y-4">
            {kit.map((item) => (
              <KitItem key={item.id} item={item} />
            ))}
          </div>
          <KitSummary />
        </div>
      )}
    </main>
  );
};

export default Build;
