import { OpenRouterService, type GeneratedKit } from '@/lib/ai/openrouter-service';
import { GeminiService } from '@/lib/ai/gemini-service';
import type { Product } from '@/lib/types/types';
import { toast } from 'sonner';

export interface ChatProgressCallback {
  (stage: string, progress: number, message: string): void;
}

export interface ChatContext {
  kitType?: string;
  scenario?: string;
  budget?: number;
  groupSize?: number;
  duration?: string;
  specialNeeds?: string[];
}

export const generateFollowUpQuestions = (query: string, context: any): string => {
  const queryLower = query.toLowerCase();
  const questions = [];
  
  // Group size questions - only ask if not already specified
  if (!context.groupSize && (queryLower.includes('group') || queryLower.includes('team') || queryLower.includes('people') || queryLower.includes('large') || queryLower.includes('small'))) {
    questions.push('• How many people will be using this kit?');
  }
  
  // Context-specific questions
  if (queryLower.includes('work') || queryLower.includes('office') || queryLower.includes('business') || queryLower.includes('company')) {
    if (!context.groupSize) questions.push('• How many people will be covered by this kit?');
    questions.push('• What type of work environment? (office, construction, factory, retail, etc.)');
    questions.push('• Are there any specific workplace hazards to consider?');
  }
  
  if (queryLower.includes('travel') || queryLower.includes('trip')) {
    if (!context.duration) questions.push('• How long will your trip be?');
    if (!context.groupSize) questions.push('• How many people will be traveling?');
    questions.push('• What type of travel? (domestic, international, remote areas)');
  }
  
  if (queryLower.includes('outdoor') || queryLower.includes('camping') || queryLower.includes('hiking')) {
    if (!context.groupSize) questions.push('• How many people will be participating?');
    questions.push('• What outdoor activities will you be doing?');
    questions.push('• How remote will you be from medical facilities?');
  }
  
  if (queryLower.includes('family') || queryLower.includes('home') || queryLower.includes('personal')) {
    if (!context.groupSize) questions.push('• How many people will be using this kit?');
    questions.push('• Are there children involved? If so, what age ranges?');
    questions.push('• Any specific medical conditions or allergies to consider?');
  }
  
  if (queryLower.includes('individual') || queryLower.includes('personal') || queryLower.includes('myself')) {
    questions.push('• What activities or situations will you primarily use this for?');
    questions.push('• Do you have any medical conditions or take medications regularly?');
    questions.push('• Will this be for general use or specific activities?');
  }
  
  // Duration questions - only ask if not already specified
  if (!context.duration && !queryLower.includes('emergency') && !queryLower.includes('immediate')) {
    questions.push('• How long do you need the supplies to last?');
  }
  
  // Budget questions - only ask if not already specified
  if (!context.budget && !queryLower.match(/budget|price|cost|\$\d+/)) {
    questions.push('• Do you have a preferred budget range?');
  }
  
  // Special needs questions
  if (!context.specialNeeds || context.specialNeeds.length === 0) {
    questions.push('• Are there any specific medical conditions, allergies, or special requirements?');
  }
  
  // Default questions if none of the above apply
  if (questions.length === 0) {
    questions.push('• How many people will be using this kit?');
    questions.push('• What specific situation or environment is this for?');
    questions.push('• Any particular medical needs or concerns?');
  }
  
  return `To create the best first aid kit for your needs, I'd like to know a bit more:\n\n${questions.join('\n')}\n\nPlease provide as much detail as you can so I can recommend the right quantities and products for your situation.`;
};

export const extractContextFromQuery = (query: string): ChatContext => {
  const queryLower = query.toLowerCase();
  
  // Extract kit type
  let kitType: string | undefined;
  if (queryLower.includes('travel') || queryLower.includes('trip') || queryLower.includes('portable')) {
    kitType = 'travel';
  } else if (queryLower.includes('work') || queryLower.includes('office') || queryLower.includes('job')) {
    kitType = 'workplace';
  } else if (queryLower.includes('outdoor') || queryLower.includes('camping') || queryLower.includes('hiking')) {
    kitType = 'outdoor';
  } else if (queryLower.includes('child') || queryLower.includes('baby') || queryLower.includes('kids') || queryLower.includes('pediatric')) {
    kitType = 'pediatric';
  } else if (queryLower.includes('basic') || queryLower.includes('simple') || queryLower.includes('home')) {
    kitType = 'basic';
  }
  
  // Extract scenario
  let scenario: string | undefined;
  if (queryLower.includes('emergency') || queryLower.includes('urgent')) {
    scenario = 'emergency';
  } else if (queryLower.includes('sports') || queryLower.includes('exercise') || queryLower.includes('gym')) {
    scenario = 'sports';
  } else if (queryLower.includes('car') || queryLower.includes('vehicle')) {
    scenario = 'car travel';
  } else if (queryLower.includes('hiking') || queryLower.includes('camping') || queryLower.includes('outdoor')) {
    scenario = 'outdoor adventure';
  }
  
  // Extract budget
  let budget: number | undefined;
  const budgetMatch = queryLower.match(/(?:budget|price|cost|max)\s*(?:of\s*)?\$?(\d+)/);
  if (budgetMatch) {
    budget = parseInt(budgetMatch[1], 10);
  }
  
  // Extract group size
  let groupSize: number | undefined;
  const groupSizeMatch = queryLower.match(/\b(\d+)\s*(people|person|individuals?|members?|users?|family|team|staff|employees?)\b/);
  if (groupSizeMatch) {
    groupSize = parseInt(groupSizeMatch[1], 10);
  } else {
    // Try to infer from context
    if (queryLower.includes('large group') || queryLower.includes('big group')) {
      groupSize = 20; // Default for large group
    } else if (queryLower.includes('small group') || queryLower.includes('few people')) {
      groupSize = 5; // Default for small group
    } else if (queryLower.includes('family')) {
      groupSize = 4; // Default family size
    } else if (queryLower.includes('office') || queryLower.includes('workplace')) {
      groupSize = 15; // Default office size
    }
  }
  
  // Extract duration
  let duration: string | undefined;
  if (queryLower.match(/\b(\d+)\s*(day|days|week|weeks|month|months)\b/)) {
    const durationMatch = queryLower.match(/\b(\d+)\s*(day|days|week|weeks|month|months)\b/);
    if (durationMatch) {
      duration = `${durationMatch[1]} ${durationMatch[2]}`;
    }
  }
  
  // Extract special needs
  const specialNeeds: string[] = [];
  if (queryLower.includes('allerg')) specialNeeds.push('allergies');
  if (queryLower.includes('diabetic') || queryLower.includes('diabetes')) specialNeeds.push('diabetes');
  if (queryLower.includes('asthma')) specialNeeds.push('asthma');
  if (queryLower.includes('heart') || queryLower.includes('cardiac')) specialNeeds.push('cardiac');
  if (queryLower.includes('elderly') || queryLower.includes('senior')) specialNeeds.push('elderly care');
  if (queryLower.includes('children') || queryLower.includes('kids') || queryLower.includes('pediatric')) specialNeeds.push('pediatric');
  
  return { kitType, scenario, budget, groupSize, duration, specialNeeds: specialNeeds.length > 0 ? specialNeeds : undefined };
};

export const needsFollowUpQuestions = (query: string): boolean => {
  const queryLower = query.toLowerCase();
  
  // Check for vague group size indicators
  const groupSizeIndicators = [
    'large group', 'big group', 'many people', 'several people', 'multiple people',
    'group of', 'team', 'family', 'office', 'workplace', 'school', 'class',
    'crowd', 'bunch', 'lot of people', 'everyone', 'staff', 'crew'
  ];
  
  // Check for vague quantity terms without specific numbers
  const vagueQuantityTerms = [
    'large', 'big', 'small', 'comprehensive', 'complete', 'full', 'extensive',
    'minimal', 'basic', 'maximum', 'bulk', 'lots', 'plenty', 'enough'
  ];
  
  // Check for specific number mentions (these don't need follow-up)
  const hasSpecificNumbers = /\b\d+\s*(people|person|individuals?|members?|users?)\b/.test(queryLower);
  
  // If specific numbers are mentioned, no follow-up needed
  if (hasSpecificNumbers) {
    return false;
  }
  
  // Check if any group size or vague quantity indicators are present
  const hasGroupIndicators = groupSizeIndicators.some(indicator => queryLower.includes(indicator));
  const hasVagueQuantity = vagueQuantityTerms.some(term => queryLower.includes(term));
  
  return hasGroupIndicators || hasVagueQuantity;
};

export const generateFirstAidKit = async (
  userQuery: string,
  products: Product[],
  context: ChatContext,
  onProgress?: ChatProgressCallback
): Promise<GeneratedKit> => {
  const openRouterService = new OpenRouterService({ 
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
    model: 'x-ai/grok-4-fast:free'
  });

  const geminiService = new GeminiService({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash'
  });

  // Search for relevant products using enhanced RAG
  const relevantProducts = await openRouterService.searchProducts(userQuery, products);
  
  // Try to generate kit using OpenRouter first
  let generatedKit: GeneratedKit;
  try {
    generatedKit = await openRouterService.generateFirstAidKit({
      userQuery,
      availableProducts: relevantProducts.slice(0, 50), // Limit for API efficiency
      kitType: context.kitType as any,
      scenario: context.scenario,
      budget: context.budget,
      duration: context.duration,
      specialNeeds: context.specialNeeds
    });
  } catch (openRouterError) {
    console.warn('OpenRouter failed, falling back to Gemini 2.5 Pro:', openRouterError);
    // Notify user about the fallback
    onProgress?.('fallback', 30, 'OpenRouter unavailable, switching to Gemini 2.5 Pro...');
    
    // Fallback to Gemini service
    try {
      generatedKit = await geminiService.generateFirstAidKit({
        userQuery,
        availableProducts: relevantProducts.slice(0, 50), // Limit for API efficiency
        kitType: context.kitType as any,
        scenario: context.scenario,
        budget: context.budget
      });
    } catch (geminiError) {
      console.warn('Gemini failed, falling back to rule-based generation:', geminiError);
      onProgress?.('fallback', 50, 'AI services unavailable, using rule-based generation...');
      
      // Final fallback to rule-based generation
      try {
        generatedKit = openRouterService.generateFallbackKit({
          userQuery,
          availableProducts: relevantProducts.slice(0, 50),
          kitType: context.kitType as any,
          scenario: context.scenario,
          budget: context.budget,
          groupSize: context.groupSize
        });
      } catch (ruleBasedError) {
        console.error('All AI services failed:', ruleBasedError);
        throw new Error('Failed to generate first aid kit with all available methods. Please try again later.');
      }
    }
  }

  return generatedKit;
};

export const generateTrainingKit = async (
  userQuery: string,
  products: Product[],
  sportType?: string,
  skillLevel?: string,
  budget?: number,
  groupSize?: number,
  duration?: string,
  specialNeeds?: string[],
  onProgress?: ChatProgressCallback
): Promise<GeneratedKit> => {
  const openRouterService = new OpenRouterService({ 
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
    model: 'x-ai/grok-4-fast:free'
  });

  const geminiService = new GeminiService({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash'
  });

  // Search for relevant products using enhanced RAG
  const relevantProducts = await openRouterService.searchProducts(userQuery, products);
  
  // Try to generate training kit using OpenRouter first
  let generatedKit: GeneratedKit;
  try {
    generatedKit = await openRouterService.generateTrainingKit({
      userQuery,
      availableProducts: relevantProducts.slice(0, 50), // Limit for API efficiency
      sportType,
      skillLevel,
      budget,
      groupSize,
      duration,
      specialNeeds,
      onProgress
    });
  } catch (openRouterError) {
    console.warn('OpenRouter failed, falling back to Gemini 2.5 Pro for training kit:', openRouterError);
    // Notify user about the fallback
    onProgress?.('fallback', 30, 'OpenRouter unavailable, switching to Gemini 2.5 Pro for training kit...');
    
    // Fallback to Gemini service
    try {
      generatedKit = await geminiService.generateTrainingKit({
        userQuery,
        availableProducts: relevantProducts.slice(0, 50), // Limit for API efficiency
        sportType,
        skillLevel,
        budget,
        groupSize,
        duration,
        specialNeeds,
        onProgress
      });
    } catch (geminiError) {
      console.warn('Gemini failed, falling back to rule-based generation for training kit:', geminiError);
      onProgress?.('fallback', 50, 'AI services unavailable, using rule-based generation for training kit...');
      
      // Final fallback to rule-based generation
      try {
        generatedKit = openRouterService.generateFallbackKit({
          userQuery,
          availableProducts: relevantProducts.slice(0, 50),
          kitType: 'basic' as any,
          scenario: sportType,
          budget
        });
      } catch (ruleBasedError) {
        console.error('All AI services failed for training kit:', ruleBasedError);
        throw new Error('Failed to generate training kit with all available methods. Please try again later.');
      }
    }
  }

  return generatedKit;
};