# Product Title Shortening Fix

## Overview

This document addresses an issue in the AT-Supply-Finder application where product titles are being incorrectly shortened when added via Amazon affiliate links. The current implementation is removing content from the beginning of titles instead of properly truncating from the end, resulting in meaningless product names.

For example:
- Original title: "Band-Aid Brand First Aid Water Block 100% Waterproof Self-Adhesive Tape Roll for Durable Wound Care to Firmly Secure Bandages, 1 in by 10 yd"
- Incorrectly shortened: "le to Firmly Secure Bandages, 1 in by 10 yd"
- Expected result: "Band-Aid Brand First Aid Water Block 100% Waterproof Self-Adhesive Tape Roll..."

## Problem Analysis

The issue is located in the `createConciseName` function in `functions/scrape-amazon-product.js`. When a product title is longer than 50 characters, the function attempts to find key product types and extract content around them. However, the current implementation has a flaw in the substring extraction logic.

Specifically, in lines 95-102 of the function:

```javascript
// Take a substring around the product type
const start = Math.max(0, typeIndex - 20);
const end = Math.min(conciseTitle.length, typeIndex + type.length + 20);
conciseTitle = conciseTitle.substring(start, end).trim();
```

When the product type is found near the end of a long title, this logic can result in removing the beginning portion of the title, which often contains important brand and product information.

Additionally, the function has multiple truncation points that can cause inconsistent behavior:
1. Initial truncation when title > 50 characters
2. Secondary truncation when title > 60 characters
3. Final truncation check at the end of the function

This multiple-pass approach can lead to unexpected results, particularly when the substring extraction logic removes important content from the beginning of titles.

## Solution Design

The fix involves modifying the `createConciseName` function to preserve the beginning of product titles while still shortening them appropriately. The approach will be:

1. Simplify the multiple-pass truncation approach to a single, more predictable method
2. Prioritize preserving the beginning of the title (which typically contains brand and key product information)
3. Only use the "extract around product type" logic when it would preserve more meaningful content
4. Ensure proper truncation with ellipsis when needed

### Detailed Implementation

1. Modify the substring extraction logic to:
   - Check if the product type is found in the first portion of the title
   - If the product type is near the beginning, preserve the beginning and truncate the end
   - If the product type is near the end, use a more intelligent extraction that preserves meaningful content

2. Consolidate the multiple truncation passes into a single pass:
   - Remove the initial truncation at 50 characters
   - Keep only the final truncation at 60 characters
   - Apply smarter logic during the single truncation

3. Update the truncation logic to ensure it always preserves the most important information:
   - Brand name (when present)
   - Primary product identifier
   - Key descriptive terms

## Code Implementation

The fix will modify the `createConciseName` function in `functions/scrape-amazon-product.js` to implement a better title shortening algorithm:

```javascript
function createConciseName(title, brand) {
  if (!title) return '';
  
  // Remove brand name if it's at the beginning
  let conciseTitle = title;
  if (brand) {
    const brandRegex = new RegExp('^' + brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\s*', 'i');
    conciseTitle = title.replace(brandRegex, '');
  }
  
  // Remove common phrases that make titles too long
  const phrasesToRemove = [
    'First Aid and Wound Care Supplies',
    'First Aid Supplies',
    'Wound Care Supplies',
    'Wound Care',
    'All-One Size',
    'Assorted Sizes',
    'Various Sizes',
    'Multi-Pack',
    'Multipack',
    'Count',
    'Pack of',
    'Package of',
    'Set of',
    'Assorted',
    'Flexible',
    'Adhesive',
    'Fabric',
    'Plastic',
    'Disposable',
    'Single Use',
    'Sterile',
    'Non-Sterile',
    'Latex Free',
    'Latex-Free',
    'Hypoallergenic',
    'for ',
    'with ',
    'and ',
    'Individually Wrapped',
    'Individually Packed',
    'Bulk',
    'Economy',
    'Value Pack',
    // Add more specific phrases to remove
    '100 Count',
    '200 Count',
    '50 Count',
    '30 Count',
    '10 Count',
    'Each',
    'per Pack',
    'per Box'
  ];
  
  for (const phrase of phrasesToRemove) {
    const regex = new RegExp('\\s*[,\\-\\(\\)]*\\s*' + phrase.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&') + '[\\s\\,\\-\\(\\)]*', 'gi');
    conciseTitle = conciseTitle.replace(regex, ' ');
  }
  
  // Remove extra spaces and trim
  conciseTitle = conciseTitle.replace(/\s+/g, ' ').trim();
  
  // Improved logic for handling long titles
  if (conciseTitle.length > 60) {
    // Try to find the main product type
    const productTypes = [
      'Bandages', 'Bandage', 'Tape', 'Gauze', 'Wipes', 'Gloves', 'Thermometer',
      'Pack', 'Kit', 'Set', 'Pads', 'Dressings', 'Dressing', 'Wraps', 'Wrap',
      'Tablets', 'Capsules', 'Gel', 'Cream', 'Solution', 'Spray', 'Ointment',
      'Shears', 'Scissors', 'Tweezers', 'Pins', 'Mask', 'Sanitizer', 'Blanket',
      'Antiseptic', 'Hydrogen Peroxide', 'Alcohol', 'Cleanser', 'Wash',
      // Add more specific product types
      'Adhesive Bandages', 'Fabric Bandages', 'Foam Dressings', 'Gel Dressings',
      'Medical Tape', 'Athletic Tape', 'Elastic Bandage', 'Compression Bandage'
    ];
    
    let bestTitle = conciseTitle;
    let foundProductType = false;
    
    for (const type of productTypes) {
      const typeIndex = conciseTitle.toLowerCase().indexOf(type.toLowerCase());
      if (typeIndex !== -1) {
        foundProductType = true;
        // If product type is in the first part, preserve beginning
        if (typeIndex < 30) {
          // Keep the beginning and truncate the end
          if (conciseTitle.length > 57) {
            bestTitle = conciseTitle.substring(0, 57) + '...';
          } else {
            bestTitle = conciseTitle;
          }
        } else {
          // Product type is later in title, try to include context around it
          const start = Math.max(0, typeIndex - 20);
          const end = Math.min(conciseTitle.length, typeIndex + type.length + 20);
          const extracted = conciseTitle.substring(start, end).trim();
          
          // If this extraction is better (shorter but contains the product type), use it
          if (extracted.length <= 60 && extracted.length < bestTitle.length) {
            if (extracted.length > 57) {
              bestTitle = extracted.substring(0, 57) + '...';
            } else {
              bestTitle = extracted;
            }
          } else {
            // Otherwise, just truncate from the beginning
            if (conciseTitle.length > 57) {
              bestTitle = conciseTitle.substring(0, 57) + '...';
            } else {
              bestTitle = conciseTitle;
            }
          }
        }
        break;
      }
    }
    
    // If no product type found, just truncate from the beginning
    if (!foundProductType) {
      if (conciseTitle.length > 57) {
        bestTitle = conciseTitle.substring(0, 57) + '...';
      } else {
        bestTitle = conciseTitle;
      }
    }
    
    conciseTitle = bestTitle;
  }
  
  // Add brand back if it was removed and the title is very short
  if (brand && conciseTitle.length < 10) {
    conciseTitle = brand + ' ' + conciseTitle;
  }
  
  // Ensure we always return a valid name
  const finalTitle = conciseTitle.trim();
  if (!finalTitle || finalTitle.length === 0) {
    return 'Unnamed Product';
  }
  
  return finalTitle;
}
```

## Testing Strategy

Test cases to verify the fix:
1. Original problematic case: "Band-Aid Brand First Aid Water Block 100% Waterproof Self-Adhesive Tape Roll for Durable Wound Care to Firmly Secure Bandages, 1 in by 10 yd"
   - Should result in: "Band-Aid Brand First Aid Water Block 100% Waterproof Self-Adhesive Tape Roll..."
   
2. Short titles: Should remain unchanged
3. Titles with product types at the beginning: Should preserve the beginning
4. Titles with product types at the end: Should intelligently preserve meaningful content
5. Very long titles without clear product types: Should truncate with ellipsis while preserving the beginning
6. Titles where brand name is at the beginning: Should preserve the brand name
7. Titles with special characters and numbers: Should handle appropriately
8. Edge cases with extremely long titles: Should handle gracefully

## Expected Outcomes

After implementing this fix:
- Product titles will be properly shortened while preserving important identifying information
- Users will be able to identify products more easily in the admin panel
- The product management experience will be improved with clearer product names
- No data will be lost during the title processing
- Title shortening will be consistent and predictable across all products
- Brand names will be preserved when they appear at the beginning of product titles