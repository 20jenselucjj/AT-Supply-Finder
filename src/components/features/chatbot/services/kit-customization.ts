import { GeneratedKit } from '@/lib/ai/openrouter-service';
import { databases } from '@/lib/api/appwrite';
import { toast } from 'sonner';

interface PreferenceData {
  action: 'add' | 'remove' | 'update';
  kitName: string;
  productId: string | null;
  timestamp: string;
}

export const handleBuildKit = (kit: GeneratedKit, navigate: (path: string) => void) => {
  // Create kit data for URL parameters
  const kitData = kit.items.map(item => ({
    id: item.product_id,
    name: item.product_name,
    brand: item.product_brand,
    category: item.product_category,
    // Set both imageUrl and product_image_url for compatibility
    imageUrl: item.product_image_url || '/placeholder.svg',
    product_image_url: item.product_image_url || '/placeholder.svg',
    image_url: item.product_image_url || '/placeholder.svg', // Add this for consistency
    price: item.price,
    quantity: item.quantity,
    description: `${item.product_name} - ${item.reasoning}`,
    asin: item.asin, // Add ASIN property for Amazon cart functionality
    // Add offers array for proper link handling
    offers: item.offers && item.offers.length > 0 
      ? item.offers 
      : [{
          name: 'Amazon',
          url: `https://www.amazon.com/dp/${item.asin || 'B0'}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`,
          price: item.price || 0,
          lastUpdated: new Date().toISOString()
        }]
  }));

  // Create deep link URL with kit data
  const kitParam = encodeURIComponent(JSON.stringify(kitData));
  const buildUrl = `/build?kit=${kitParam}&ai=true`;
  
  // Navigate to build page with kit data
  navigate(buildUrl);
  toast.success(`Generated first aid kit with ${kit.items.length} items! Opening Build page...`);
};

export const handleCustomizeKit = async (
  kit: GeneratedKit,
  action: 'add' | 'remove' | 'update',
  user: any,
  productId?: string,
  newQuantity?: number
) => {
  // Track user preferences
  const preferenceData: PreferenceData = {
    action,
    kitName: kit.name,
    productId: productId || null,
    timestamp: new Date().toISOString()
  };
  
  // Store preferences in localStorage
  try {
    const existingPreferences = JSON.parse(localStorage.getItem('chatbot-preferences') || '[]');
    existingPreferences.push(preferenceData);
    localStorage.setItem('chatbot-preferences', JSON.stringify(existingPreferences.slice(-100))); // Keep last 100 preference items
  } catch (error) {
    console.warn('Failed to save preferences:', error);
  }
  
  // Save preferences to Appwrite for authenticated users
  if (user) {
    try {
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'chatPreferences',
        'unique()',
        {
          userId: user.$id,
          action,
          kitName: kit.name,
          productId: productId || null,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      console.warn('Failed to save preferences to Appwrite:', error);
    }
  }
  
  // Create a copy of the kit to modify
  const updatedKit = { ...kit };
  
  switch (action) {
    case 'add':
      // In a real implementation, we would show a product selector here
      toast.info('In a full implementation, this would open a product selector');
      break;
      
    case 'remove':
      if (productId) {
        updatedKit.items = updatedKit.items.filter(item => item.product_id !== productId);
        toast.success('Item removed from kit');
        return updatedKit;
      }
      break;
      
    case 'update':
      if (productId && newQuantity !== undefined) {
        updatedKit.items = updatedKit.items.map(item => {
          if (item.product_id === productId) {
            return {
              ...item,
              quantity: newQuantity
            };
          }
          return item;
        });
        toast.success('Item quantity updated');
        return updatedKit;
      }
      break;
  }
  
  return kit;
};

export const saveCustomizationToAppwrite = async (
  kit: GeneratedKit,
  action: 'add' | 'remove' | 'update',
  user: any,
  productId?: string
) => {
  if (user) {
    try {
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'chatPreferences',
        'unique()',
        {
          userId: user.$id,
          action,
          kitName: kit.name,
          productId: productId || null,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      console.warn('Failed to save preferences to Appwrite:', error);
    }
  }
};

export const handleFeedback = async (
  messageId: string,
  feedback: 'helpful' | 'not-helpful'
) => {
  // Store feedback in localStorage for future learning
  try {
    const feedbackData = {
      messageId,
      feedback,
      timestamp: new Date().toISOString()
    };
    
    const existingFeedback = JSON.parse(localStorage.getItem('chatbot-feedback') || '[]');
    existingFeedback.push(feedbackData);
    localStorage.setItem('chatbot-feedback', JSON.stringify(existingFeedback.slice(-50))); // Keep last 50 feedback items
  } catch (error) {
    console.warn('Failed to save feedback:', error);
  }
  
  // Show confirmation
  toast.success(feedback === 'helpful' ? 'Thanks for your feedback!' : 'Thanks, we\'ll improve our recommendations.');
};

export const saveFeedbackToAppwrite = async (
  messageId: string,
  feedback: 'helpful' | 'not-helpful',
  user: any
) => {
  if (user) {
    try {
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'chatFeedback',
        'unique()',
        {
          userId: user.$id,
          messageId,
          feedback,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      console.warn('Failed to save feedback to Appwrite:', error);
    }
  }
};