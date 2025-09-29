/**
 * Utility functions for processing product data
 */

/**
 * Extracts count, pack, or pieces information from product name or features
 * @param text - The text to search for count/pack/pcs information
 * @returns Object containing the extracted information
 */
export function extractCountInfo(text: string | string[] | any): {
  count?: string;
  pack?: string;
  pieces?: string;
  display?: string;
} {
  if (!text) return {};

  // Convert to string if it's an array or other type
  let textStr: string;
  if (Array.isArray(text)) {
    textStr = text.join(' ');
  } else if (typeof text === 'string') {
    textStr = text;
  } else {
    textStr = String(text);
  }

  const lowerText = textStr.toLowerCase();
  
  // Patterns to match count, pack, or pieces information
  const patterns = [
    // Count patterns
    /(\d+)\s*count/i,
    /count\s*of\s*(\d+)/i,
    /(\d+)\s*ct\b/i,
    
    // Pack patterns
    /(\d+)\s*pack/i,
    /pack\s*of\s*(\d+)/i,
    /(\d+)\s*pk\b/i,
    /value\s*pack\s*(\d+)/i,
    
    // Pieces patterns
    /(\d+)\s*pcs?\b/i,
    /(\d+)\s*pieces?/i,
    /(\d+)\s*pc\b/i,
  ];

  for (const pattern of patterns) {
    const match = textStr.match(pattern);
    if (match) {
      const number = match[1];
      const fullMatch = match[0];
      
      // Determine the type based on the matched text
      if (/count|ct\b/i.test(fullMatch)) {
        return { count: number, display: `${number} Count` };
      } else if (/pack|pk\b/i.test(fullMatch)) {
        return { pack: number, display: `${number} Pack` };
      } else if (/pcs?|pieces?|pc\b/i.test(fullMatch)) {
        return { pieces: number, display: `${number} Pieces` };
      }
    }
  }

  return {};
}

/**
 * Formats features text for better display
 * @param features - Raw features string
 * @returns Array of formatted feature items
 */
export function formatFeatures(features: string): string[] {
  if (!features) return [];
  
  // Split by common delimiters and clean up
  const featureItems = features
    .split(/\.{2,}|\.\.|\.\s*(?=[A-Z])|;/)
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => {
      // Remove trailing periods and clean up
      return item.replace(/\.$/, '').trim();
    })
    .filter(item => item.length > 0);

  return featureItems;
}

/**
 * Gets the primary count/pack/pieces information for display
 * @param product - Product object
 * @returns Formatted count information or null
 */
export function getProductCountInfo(product: any): string | null {
  // First check the dedicated count field
  if (product.count) {
    return `${product.count} Count`;
  }

  // Extract from product name
  const nameInfo = extractCountInfo(product.name || '');
  if (nameInfo.display) {
    return nameInfo.display;
  }

  // Extract from features as fallback
  const featuresInfo = extractCountInfo(product.features || '');
  if (featuresInfo.display) {
    return featuresInfo.display;
  }

  return null;
}