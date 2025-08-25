// Simple fuzzy search implementation
export interface SearchResult<T> {
  item: T;
  score: number;
}

export function fuzzySearch<T>(
  items: T[],
  query: string,
  keys: (keyof T)[]
): SearchResult<T>[] {
  if (!query) return items.map(item => ({ item, score: 0 }));
  
  const queryLower = query.toLowerCase();
  const results: SearchResult<T>[] = [];
  
  for (const item of items) {
    let totalScore = 0;
    let matchCount = 0;
    
    for (const key of keys) {
      const value = item[key];
      if (typeof value === 'string') {
        const valueLower = value.toLowerCase();
        const score = calculateMatchScore(valueLower, queryLower);
        if (score > 0) {
          totalScore += score;
          matchCount++;
        }
      }
    }
    
    // Only include items that have at least one match
    if (matchCount > 0) {
      // Normalize score based on number of matching fields
      const normalizedScore = totalScore / matchCount;
      results.push({ item, score: normalizedScore });
    }
  }
  
  // Sort by score (higher is better)
  return results.sort((a, b) => b.score - a.score);
}

function calculateMatchScore(text: string, query: string): number {
  if (!text || !query) return 0;
  
  // Exact match
  if (text === query) return 100;
  
  // Starts with query
  if (text.startsWith(query)) return 90;
  
  // Contains query
  if (text.includes(query)) return 70;
  
  // Fuzzy match (character by character)
  let score = 0;
  let queryIndex = 0;
  
  for (let i = 0; i < text.length; i++) {
    if (queryIndex < query.length && text[i] === query[queryIndex]) {
      score += 10;
      queryIndex++;
    }
  }
  
  // Bonus for matching all characters
  if (queryIndex === query.length) {
    score += 20;
  }
  
  return score;
}

// Generate search suggestions based on partial matches
export function generateSuggestions<T>(
  items: T[],
  query: string,
  keys: (keyof T)[],
  maxSuggestions: number = 5
): string[] {
  if (!query) return [];
  
  const suggestions = new Set<string>();
  const queryLower = query.toLowerCase();
  
  for (const item of items) {
    for (const key of keys) {
      const value = item[key];
      if (typeof value === 'string') {
        const valueLower = value.toLowerCase();
        // Add suggestions for partial matches
        if (valueLower.includes(queryLower)) {
          suggestions.add(value);
        }
      }
    }
    
    // Limit suggestions
    if (suggestions.size >= maxSuggestions) {
      break;
    }
  }
  
  return Array.from(suggestions).slice(0, maxSuggestions);
}