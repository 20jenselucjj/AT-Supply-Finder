// Mock first aid products for sandbox environment
export const mockAthleticProducts = [
  {
    asin: 'B07MOCK001',
    title: 'Mueller Athletic Tape - White Zinc Oxide Tape for Sports Injuries',
    brand: 'Mueller',
    category: 'Athletic Training',
    imageUrl: 'https://via.placeholder.com/300x300?text=Athletic+Tape',
    features: ['Zinc oxide adhesive', 'Strong support', 'Easy tear', 'Water resistant'],
    dimensions: '1.5" x 15 yards',
    weight: '0.5 lbs',
    material: 'Cotton blend with zinc oxide adhesive'
  },
  {
    asin: 'B07MOCK002', 
    title: 'Kinesiology Tape - Elastic Sports Tape for Muscle Support',
    brand: 'KT Tape',
    category: 'Athletic Training',
    imageUrl: 'https://via.placeholder.com/300x300?text=Kinesiology+Tape',
    features: ['Elastic support', 'Water resistant', 'Latex free', '24/7 wear'],
    dimensions: '2" x 16.4 feet',
    weight: '0.3 lbs',
    material: '97% cotton, 3% spandex'
  },
  {
    asin: 'B07MOCK003',
    title: 'Pre-Wrap Athletic Tape Underwrap - Foam Padding',
    brand: 'Cramer',
    category: 'Athletic Training', 
    imageUrl: 'https://via.placeholder.com/300x300?text=Pre-Wrap',
    features: ['Soft foam padding', 'Protects skin', 'Easy application', 'Lightweight'],
    dimensions: '2.75" x 30 yards',
    weight: '0.2 lbs',
    material: 'Polyurethane foam'
  },
  {
    asin: 'B07MOCK004',
    title: 'Elastic Bandage Wrap - Compression Support for Injuries',
    brand: 'ACE',
    category: 'Athletic Training',
    imageUrl: 'https://via.placeholder.com/300x300?text=Elastic+Bandage',
    features: ['Adjustable compression', 'Reusable', 'Breathable', 'Easy application'],
    dimensions: '4" x 5 yards',
    weight: '0.4 lbs', 
    material: 'Cotton and elastic blend'
  },
  {
    asin: 'B07MOCK005',
    title: 'Cohesive Bandage - Self-Adhesive Athletic Wrap',
    brand: 'Coban',
    category: 'Athletic Training',
    imageUrl: 'https://via.placeholder.com/300x300?text=Cohesive+Bandage',
    features: ['Self-adhesive', 'No clips needed', 'Flexible', 'Sweat resistant'],
    dimensions: '2" x 5 yards',
    weight: '0.3 lbs',
    material: 'Non-woven fabric with cohesive adhesive'
  }
];

// Transform mock items to match expected format
export const transformMockItems = (items, maxResults) => {
  return items.slice(0, maxResults).map(item => ({
    asin: item.asin,
    title: item.title,
    brand: item.brand,
    category: item.category,
    imageUrl: item.imageUrl,
    features: item.features,
    dimensions: item.dimensions,
    weight: item.weight,
    material: item.material,
    manufacturer: item.brand,
    modelNumber: `${item.brand}-${item.asin.slice(-3)}`,
    colorName: 'White',
    sizeName: 'Standard'
  }));
};