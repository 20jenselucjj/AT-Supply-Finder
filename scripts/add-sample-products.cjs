const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const sampleProducts = [
  // Taping & Bandaging
  {
    name: "Johnson & Johnson Coach Athletic Tape",
    category: "Taping & Bandaging",
    brand: "Johnson & Johnson",
    rating: 4.5,
    price: 12.99,
    image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
    features: ["1.5 inch width", "Rigid support", "Easy tear", "Latex-free"],
    dimensions: "1.5\" x 15 yards",
    weight: "0.3 lbs",
    material: "Cotton cloth with zinc oxide adhesive",
    affiliate_link: "https://amazon.com/sample-link-1"
  },
  {
    name: "Mueller Kinesiology Tape",
    category: "Taping & Bandaging",
    brand: "Mueller",
    rating: 4.3,
    price: 8.95,
    image_url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
    features: ["Elastic support", "Breathable", "Water resistant", "Multiple colors"],
    dimensions: "2\" x 16.4 feet",
    weight: "0.2 lbs",
    material: "Cotton with acrylic adhesive",
    affiliate_link: "https://amazon.com/sample-link-2"
  },
  {
    name: "3M Coban Self-Adherent Wrap",
    category: "Taping & Bandaging",
    brand: "3M",
    rating: 4.7,
    price: 15.49,
    image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400",
    features: ["Self-adherent", "No clips needed", "Breathable", "Latex-free"],
    dimensions: "3\" x 5 yards",
    weight: "0.4 lbs",
    material: "Nonwoven material with cohesive properties",
    affiliate_link: "https://amazon.com/sample-link-3"
  },
  {
    name: "Cramer Team Colors Underwrap",
    category: "Taping & Bandaging",
    brand: "Cramer",
    rating: 4.2,
    price: 6.75,
    image_url: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400",
    features: ["Pre-wrap foam", "Protects skin", "Easy application", "Multiple colors"],
    dimensions: "2.75\" x 30 yards",
    weight: "0.15 lbs",
    material: "Polyurethane foam",
    affiliate_link: "https://amazon.com/sample-link-4"
  },

  // First Aid & Wound Care
  {
    name: "Curad Sterile Gauze Pads",
    category: "First Aid & Wound Care",
    brand: "Curad",
    rating: 4.4,
    price: 9.99,
    image_url: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400",
    features: ["Sterile", "Absorbent", "Non-adherent", "Multiple sizes"],
    dimensions: "4\" x 4\" (25 count)",
    weight: "0.5 lbs",
    material: "100% cotton gauze",
    affiliate_link: "https://amazon.com/sample-link-5"
  },
  {
    name: "Band-Aid Flexible Fabric Bandages",
    category: "First Aid & Wound Care",
    brand: "Band-Aid",
    rating: 4.6,
    price: 7.49,
    image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
    features: ["Flexible fabric", "Strong adhesion", "Comfortable", "Assorted sizes"],
    dimensions: "Assorted sizes (100 count)",
    weight: "0.3 lbs",
    material: "Flexible fabric with adhesive",
    affiliate_link: "https://amazon.com/sample-link-6"
  },
  {
    name: "Neosporin Original Antibiotic Ointment",
    category: "First Aid & Wound Care",
    brand: "Neosporin",
    rating: 4.5,
    price: 5.97,
    image_url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
    features: ["Triple antibiotic", "Prevents infection", "Promotes healing", "Travel size"],
    dimensions: "1 oz tube",
    weight: "0.1 lbs",
    material: "Topical antibiotic ointment",
    affiliate_link: "https://amazon.com/sample-link-7"
  },
  {
    name: "Alcohol Prep Pads",
    category: "First Aid & Wound Care",
    brand: "Dynarex",
    rating: 4.3,
    price: 4.99,
    image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400",
    features: ["70% isopropyl alcohol", "Sterile", "Individual packets", "Antiseptic"],
    dimensions: "Medium size (100 count)",
    weight: "0.4 lbs",
    material: "Non-woven pad with 70% alcohol",
    affiliate_link: "https://amazon.com/sample-link-8"
  },

  // Instruments & Tools
  {
    name: "Trauma Shears EMT Scissors",
    category: "Instruments & Tools",
    brand: "Madison Supply",
    rating: 4.4,
    price: 11.95,
    image_url: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400",
    features: ["Stainless steel", "Serrated edge", "Comfortable grip", "Fluoride coated"],
    dimensions: "7.25 inches",
    weight: "0.3 lbs",
    material: "Stainless steel with polymer handles",
    affiliate_link: "https://amazon.com/sample-link-9"
  },
  {
    name: "SAM Splint 36 Inch",
    category: "Instruments & Tools",
    brand: "SAM Medical",
    rating: 4.8,
    price: 18.99,
    image_url: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400",
    features: ["Moldable", "Radiolucent", "Reusable", "Lightweight"],
    dimensions: "36\" x 4.25\"",
    weight: "0.3 lbs",
    material: "Aluminum core with foam padding",
    affiliate_link: "https://amazon.com/sample-link-10"
  },
  {
    name: "Nitrile Examination Gloves",
    category: "Instruments & Tools",
    brand: "Medline",
    rating: 4.5,
    price: 19.99,
    image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
    features: ["Latex-free", "Powder-free", "Textured fingertips", "Disposable"],
    dimensions: "Medium (100 count)",
    weight: "1.2 lbs",
    material: "Nitrile rubber",
    affiliate_link: "https://amazon.com/sample-link-11"
  },
  {
    name: "Precision Tweezers Set",
    category: "Instruments & Tools",
    brand: "Tweezerman",
    rating: 4.6,
    price: 14.99,
    image_url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
    features: ["Stainless steel", "Precision tips", "Multiple angles", "Professional grade"],
    dimensions: "4.5 inches (set of 3)",
    weight: "0.2 lbs",
    material: "Stainless steel",
    affiliate_link: "https://amazon.com/sample-link-12"
  },

  // Hot & Cold Therapy
  {
    name: "Instant Cold Compress",
    category: "Hot & Cold Therapy",
    brand: "First Aid Only",
    rating: 4.2,
    price: 2.99,
    image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400",
    features: ["Instant activation", "Single use", "No refrigeration needed", "Stays cold 20+ minutes"],
    dimensions: "6\" x 9\"",
    weight: "0.4 lbs",
    material: "Ammonium nitrate and water",
    affiliate_link: "https://amazon.com/sample-link-13"
  },
  {
    name: "Reusable Hot/Cold Gel Pack",
    category: "Hot & Cold Therapy",
    brand: "TheraPearl",
    rating: 4.7,
    price: 12.95,
    image_url: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400",
    features: ["Reusable", "Flexible when frozen", "Microwave safe", "Non-toxic gel"],
    dimensions: "11\" x 4\"",
    weight: "0.8 lbs",
    material: "Non-toxic gel in durable fabric",
    affiliate_link: "https://amazon.com/sample-link-14"
  },
  {
    name: "Cramer Atomic Balm Analgesic",
    category: "Hot & Cold Therapy",
    brand: "Cramer",
    rating: 4.4,
    price: 8.49,
    image_url: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400",
    features: ["Warming analgesic", "Fast acting", "Professional strength", "Non-greasy"],
    dimensions: "2.75 oz tube",
    weight: "0.2 lbs",
    material: "Topical analgesic cream",
    affiliate_link: "https://amazon.com/sample-link-15"
  },

  // Injury Prevention & Rehab
  {
    name: "Compression Knee Sleeve",
    category: "Injury Prevention & Rehab",
    brand: "Bauerfeind",
    rating: 4.6,
    price: 89.95,
    image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
    features: ["Medical grade compression", "Breathable knit", "Anatomical fit", "Moisture wicking"],
    dimensions: "Large (various sizes available)",
    weight: "0.3 lbs",
    material: "Compressive knit fabric",
    affiliate_link: "https://amazon.com/sample-link-16"
  },
  {
    name: "Foam Padding Roll",
    category: "Injury Prevention & Rehab",
    brand: "Mueller",
    rating: 4.3,
    price: 16.99,
    image_url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
    features: ["Protective padding", "Adhesive backing", "Customizable", "Shock absorbing"],
    dimensions: "1/4\" thick x 6\" wide x 2 yards",
    weight: "0.5 lbs",
    material: "Closed-cell foam with adhesive",
    affiliate_link: "https://amazon.com/sample-link-17"
  },
  {
    name: "Elastic Compression Bandage",
    category: "Injury Prevention & Rehab",
    brand: "ACE",
    rating: 4.4,
    price: 7.99,
    image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400",
    features: ["Adjustable compression", "Reusable", "Breathable", "Velcro closure"],
    dimensions: "4\" x 5 feet",
    weight: "0.3 lbs",
    material: "Elastic cotton blend",
    affiliate_link: "https://amazon.com/sample-link-18"
  },

  // Over-the-Counter Medication
  {
    name: "Ibuprofen Pain Reliever",
    category: "Over-the-Counter Medication",
    brand: "Advil",
    rating: 4.5,
    price: 9.99,
    image_url: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400",
    features: ["200mg tablets", "Fast acting", "Anti-inflammatory", "Pain relief"],
    dimensions: "100 count bottle",
    weight: "0.4 lbs",
    material: "Ibuprofen tablets",
    affiliate_link: "https://amazon.com/sample-link-19"
  },
  {
    name: "Acetaminophen Extra Strength",
    category: "Over-the-Counter Medication",
    brand: "Tylenol",
    rating: 4.6,
    price: 8.49,
    image_url: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400",
    features: ["500mg caplets", "Fast relief", "Fever reducer", "Easy to swallow"],
    dimensions: "100 count bottle",
    weight: "0.4 lbs",
    material: "Acetaminophen caplets",
    affiliate_link: "https://amazon.com/sample-link-20"
  },

  // Protective Equipment & Safety
  {
    name: "Safety Glasses",
    category: "Protective Equipment & Safety",
    brand: "3M",
    rating: 4.4,
    price: 12.99,
    image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
    features: ["Impact resistant", "Anti-fog coating", "UV protection", "Comfortable fit"],
    dimensions: "One size fits most",
    weight: "0.2 lbs",
    material: "Polycarbonate lenses",
    affiliate_link: "https://amazon.com/sample-link-21"
  },
  {
    name: "CPR Face Shield",
    category: "Protective Equipment & Safety",
    brand: "Laerdal",
    rating: 4.7,
    price: 4.95,
    image_url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
    features: ["One-way valve", "Disposable", "Compact keychain", "Barrier protection"],
    dimensions: "Compact keychain size",
    weight: "0.05 lbs",
    material: "Plastic with one-way valve",
    affiliate_link: "https://amazon.com/sample-link-22"
  },

  // Documentation & Communication
  {
    name: "Waterproof Injury Report Forms",
    category: "Documentation & Communication",
    brand: "Cramer",
    rating: 4.2,
    price: 15.99,
    image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400",
    features: ["Waterproof paper", "Carbonless copies", "Legal documentation", "Professional format"],
    dimensions: "8.5\" x 11\" (50 forms)",
    weight: "0.8 lbs",
    material: "Waterproof synthetic paper",
    affiliate_link: "https://amazon.com/sample-link-23"
  },
  {
    name: "Emergency Contact Cards",
    category: "Documentation & Communication",
    brand: "First Aid Only",
    rating: 4.1,
    price: 6.99,
    image_url: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400",
    features: ["Wallet size", "Durable plastic", "Emergency info", "Medical alerts"],
    dimensions: "Credit card size (25 pack)",
    weight: "0.2 lbs",
    material: "Durable plastic cards",
    affiliate_link: "https://amazon.com/sample-link-24"
  },

  // Hydration & Nutrition
  {
    name: "Electrolyte Powder Packets",
    category: "Hydration & Nutrition",
    brand: "Gatorade",
    rating: 4.3,
    price: 12.99,
    image_url: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400",
    features: ["Rapid rehydration", "Essential electrolytes", "Individual packets", "Multiple flavors"],
    dimensions: "20 packet box",
    weight: "0.6 lbs",
    material: "Electrolyte powder mix",
    affiliate_link: "https://amazon.com/sample-link-25"
  },
  {
    name: "Energy Gel Packets",
    category: "Hydration & Nutrition",
    brand: "GU Energy",
    rating: 4.4,
    price: 24.99,
    image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
    features: ["Quick energy", "Easy to digest", "Caffeine options", "Portable"],
    dimensions: "24 gel packet box",
    weight: "1.2 lbs",
    material: "Carbohydrate energy gel",
    affiliate_link: "https://amazon.com/sample-link-26"
  },

  // Miscellaneous & General
  {
    name: "Athletic Training Kit Bag",
    category: "Miscellaneous & General",
    brand: "Mueller",
    rating: 4.5,
    price: 49.99,
    image_url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
    features: ["Multiple compartments", "Durable construction", "Shoulder strap", "Easy organization"],
    dimensions: "18\" x 12\" x 8\"",
    weight: "2.5 lbs",
    material: "Heavy-duty nylon with reinforced stitching",
    affiliate_link: "https://amazon.com/sample-link-27"
  },
  {
    name: "Disposable Towels",
    category: "Miscellaneous & General",
    brand: "Scott",
    rating: 4.2,
    price: 8.99,
    image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400",
    features: ["Absorbent", "Disposable", "Lint-free", "Multi-purpose"],
    dimensions: "Roll of 55 towels",
    weight: "1.0 lbs",
    material: "Non-woven disposable material",
    affiliate_link: "https://amazon.com/sample-link-28"
  }
];

async function addSampleProducts() {
  try {
    console.log('Adding sample products to database...');
    
    const { data, error } = await supabase
      .from('products')
      .insert(sampleProducts);
    
    if (error) {
      console.error('Error adding products:', error);
      return;
    }
    
    console.log(`Successfully added ${sampleProducts.length} sample products!`);
    console.log('Categories covered:');
    const categories = [...new Set(sampleProducts.map(p => p.category))];
    categories.forEach(cat => {
      const count = sampleProducts.filter(p => p.category === cat).length;
      console.log(`  - ${cat}: ${count} products`);
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

if (require.main === module) {
  addSampleProducts();
}

module.exports = { addSampleProducts, sampleProducts };