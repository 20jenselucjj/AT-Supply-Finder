import { Helmet } from "react-helmet-async";
import Hero from "@/components/home/Hero";
import CategoryGrid from "@/components/home/CategoryGrid";

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
    </main>
  );
};

export default Index;
