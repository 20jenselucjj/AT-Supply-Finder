import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { databases } from "@/lib/api/appwrite";
import { Query } from "appwrite";
import { 
  Bandage, 
  Syringe, 
  Shield, 
  Thermometer, 
  Pill, 
  Package,
  Scissors,
  FileText
} from "lucide-react";

const baseCategoriesConfig = [
  {
    name: "Wound Care & Dressings",
    description: "Bandages, gauze, and dressings for wound treatment.",
    icon: Bandage,
    slug: "wound-care-dressings",
    dbCategory: "First Aid & Wound Care",
    popular: true,
  },
  {
    name: "Tapes & Wraps",
    description: "Medical tapes and elastic wraps for support and securing dressings.",
    icon: Package,
    slug: "tapes-wraps",
    dbCategory: "Taping & Bandaging",
    popular: false,
  },
  {
    name: "Antiseptics & Ointments",
    description: "Cleaning solutions and ointments for wound care.",
    icon: Syringe,
    slug: "antiseptics-ointments",
    dbCategory: "Antiseptics & Ointments",
    popular: true,
  },
  {
    name: "Pain & Symptom Relief",
    description: "Medications for pain and common symptoms.",
    icon: Pill,
    slug: "pain-relief",
    dbCategory: "Over-the-Counter Medication",
    popular: false,
  },
  {
    name: "Instruments & Tools",
    description: "Essential tools for first aid treatment.",
    icon: Scissors,
    slug: "instruments-tools",
    dbCategory: "Instruments & Tools",
    popular: false,
  },
  {
    name: "Trauma & Emergency",
    description: "Supplies for emergency situations and serious injuries.",
    icon: Shield,
    slug: "trauma-emergency",
    dbCategory: "Emergency Care",
    popular: false,
  },
  {
    name: "Personal Protection Equipment (PPE)",
    description: "Gloves, masks, and sanitizers for protection.",
    icon: Shield,
    slug: "ppe",
    dbCategory: "Personal Protection Equipment (PPE)",
    popular: true,
  },
  {
    name: "First Aid Information & Essentials",
    description: "Guides and essentials for first aid preparedness.",
    icon: FileText,
    slug: "information-essentials",
    dbCategory: "Documentation & Communication",
    popular: false,
  },
];

// Using custom CSS animations instead of Framer Motion

const CategoryGrid = () => {
  const [categories, setCategories] = useState(baseCategoriesConfig.map(cat => ({ ...cat, priceFrom: "Loading...", loading: true })));

  // Fetch minimum price for each category
  const fetchCategoryPricing = async () => {
    console.log('Starting to fetch category pricing...');
    
    // Map display category names to database category names
    const categoryMapping: Record<string, string> = {
      "Wound Care & Dressings": "First Aid & Wound Care",
      "Antiseptics & Ointments": "Antiseptics & Ointments",
      "Tapes & Wraps": "Taping & Bandaging",
      "Instruments & Tools": "Instruments & Tools",
      "Pain & Symptom Relief": "Over-the-Counter Medication",
      "Trauma & Emergency": "Emergency Care",
      "Personal Protection Equipment (PPE)": "Personal Protection Equipment (PPE)",
      "First Aid Information & Essentials": "Documentation & Communication",
      "Hot & Cold Therapy": "Hot & Cold Therapy",
      "Hydration & Nutrition": "Hydration & Nutrition",
      "Miscellaneous & General": "Miscellaneous & General"
    };
    
    const updatedCategories = await Promise.all(
      baseCategoriesConfig.map(async (category) => {
        try {
          const databaseCategory = categoryMapping[category.name] || category.dbCategory;
          console.log(`Fetching products for category: ${category.name} (DB: ${databaseCategory})`);
          // Query products for this category
          const response = await databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'products',
            [
              Query.equal('category', databaseCategory),
              Query.limit(50)
            ]
          );
          console.log(`Response for ${category.name}:`, response);

          if (response.documents && response.documents.length > 0) {
            // Collect all prices from both direct price field and offers array
            const allPrices: number[] = [];
            
            response.documents.forEach((product: any) => {
              // Add direct price if available
              if (product.price && product.price > 0) {
                allPrices.push(product.price);
              }
              
              // Add prices from offers array if available
              if (product.offers && Array.isArray(product.offers)) {
                product.offers.forEach((offer: any) => {
                  if (offer.price && offer.price > 0) {
                    allPrices.push(offer.price);
                  }
                });
              }
            });
            
            if (allPrices.length > 0) {
              const minPrice = Math.min(...allPrices);
              const maxPrice = Math.max(...allPrices);
              
              // Show range if min and max are different, otherwise show single price
              const priceDisplay = minPrice === maxPrice 
                ? `$${minPrice.toFixed(2)}`
                : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
              
              return {
                ...category,
                priceFrom: priceDisplay,
                loading: false
              };
            }
          }
          
          // Fallback if no products found
          return {
            ...category,
            priceFrom: "View Products",
            loading: false
          };
        } catch (error) {
          console.error(`Error fetching pricing for ${category.name}:`, error);
          return {
            ...category,
            priceFrom: "View Products",
            loading: false
          };
        }
      })
    );
    
    setCategories(updatedCategories);
  };

  useEffect(() => {
    fetchCategoryPricing();
  }, []);

  return (
    <div className="container mx-auto py-16 bg-gradient-to-br from-background to-secondary/70 rounded-xl border border-border shadow-md padding-container">
      <div className="max-w-2xl mb-12">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent inline-block" style={{ fontFamily: 'var(--font-heading)' }}>First Aid Categories</h2>
        <p className="text-muted-foreground mt-4" style={{ fontFamily: 'var(--font-body)' }}>
          Essential medical supplies organized by category for quick access.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
        {categories.map(({ name, description, icon: Icon, slug, priceFrom, popular, loading }) => (
          <Link to={`/catalog?cat=${slug}`} key={name}>
            <div className="h-full relative pro-card animate-scale">
              {popular && (
                <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-xs px-4 py-1.5 rounded-full z-10 font-medium shadow-md border border-primary/30 animate-pulse">
                  ★ Popular
                </div>
              )}
              <Card className="p-6 h-full border border-border hover:border-primary/30 transition-all duration-300 bg-gradient-to-br from-background to-secondary/50 hover:shadow-md transform hover:-translate-y-1">
                <div className="flex items-start gap-5">
                  <div
                    className="p-4 rounded-lg shadow-sm flex items-center justify-center"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Icon className="text-primary-foreground h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {description}
                    </p>
                    <div className="text-sm font-semibold text-primary bg-primary/10 inline-block px-3 py-1 rounded-full">
                      {loading ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : (
                        priceFrom.startsWith('$') ? `From ${priceFrom}` : priceFrom
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;