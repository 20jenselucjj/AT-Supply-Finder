// Utility functions for product management

export const extractASINFromLink = (url: string): string | null => {
  try {
    // Common Amazon URL patterns
    const patterns = [
      /\/dp\/([A-Z0-9]{10})/i,
      /\/gp\/product\/([A-Z0-9]{10})/i,
      /\/product\/([A-Z0-9]{10})/i,
      /asin=([A-Z0-9]{10})/i,
      /\/([A-Z0-9]{10})(?:\/|\?|$)/i
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  } catch (error) {
    console.error('Error extracting ASIN:', error);
    return null;
  }
};

export const formatProductForDisplay = (product: any) => {
  // Map database categories to friendly names
  const categoryMapping: Record<string, string> = {
    "First Aid & Wound Care": "Wound Care & Dressings",
    "Antiseptics & Ointments": "Antiseptics & Ointments",
    "Taping & Bandaging": "Tapes & Wraps",
    "Instruments & Tools": "Instruments & Tools",
    "Over-the-Counter Medication": "Pain & Symptom Relief",
    "Emergency Care": "Trauma & Emergency",
    "Personal Protection Equipment (PPE)": "Personal Protection Equipment (PPE)",
    "Documentation & Communication": "First Aid Information & Essentials",
    "Hot & Cold Therapy": "Hot & Cold Therapy",
    "Hydration & Nutrition": "Hydration & Nutrition",
    "Miscellaneous & General": "Miscellaneous & General"
  };

  return {
    ...product,
    category: categoryMapping[product.category] || product.category,
    features: Array.isArray(product.features) 
      ? product.features 
      : typeof product.features === 'string' 
        ? product.features.split('..').filter((f: string) => f.trim()) 
        : []
  };
};

export const formatProductForDatabase = (product: any) => {
  // Map friendly category names back to database format
  const reverseCategoryMapping: Record<string, string> = {
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

  return {
    name: product.name,
    category: reverseCategoryMapping[product.category] || product.category,
    brand: product.brand,
    price: product.price ? parseFloat(product.price) : null,
    dimensions: product.dimensions || null,
    weight: product.weight || null,
    material: product.material || null,
    features: product.features || null,
    imageUrl: product.image_url || null,
    asin: product.asin || null,
    affiliateLink: product.affiliate_link || null
  };
};