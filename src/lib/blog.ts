export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  publishedAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'archived';
  categories: string[];
  tags: string[];
  featuredImage?: {
    url: string;
    alt: string;
  };
  readingTime: number;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

// Mock blog posts data
export const mockBlogPosts: BlogPost[] = [
  {
    id: "1",
    slug: "preventing-ankle-injuries",
    title: "Preventing Ankle Injuries: A Complete Guide",
    excerpt: "Learn effective techniques and products to prevent common ankle injuries in athletes.",
    content: `# Preventing Ankle Injuries: A Complete Guide

Ankle injuries are among the most common sports-related injuries, affecting millions of athletes each year. Whether you're a professional athlete or a weekend warrior, understanding how to prevent these injuries is crucial for maintaining peak performance and avoiding time away from your sport.

## Understanding Ankle Injuries

Ankle injuries typically occur when the foot twists, rolls, or turns beyond its normal range of motion. The most common types include:

- **Ankle Sprains**: Stretching or tearing of ligaments
- **Fractures**: Breaks in the bones of the ankle
- **Tendon Injuries**: Damage to the tendons that support the ankle

## Prevention Strategies

### 1. Proper Warm-Up and Conditioning

Always begin your activity with a thorough warm-up that includes:

- Light cardio to increase blood flow
- Dynamic stretching focusing on the ankles
- Balance and proprioception exercises

### 2. Using the Right Equipment

Quality athletic tape and bandages can provide additional support to vulnerable ankles. When selecting products, consider:

- **Ankle Braces**: For additional stability during high-risk activities
- **Kinesiology Tape**: For muscle support and proprioceptive feedback
- **Cohesive Bandages**: For compression and support without adhesion to skin

### 3. Technique and Training

Proper technique is essential for injury prevention:

- Focus on landing mechanics during jumping activities
- Practice balance exercises on unstable surfaces
- Strengthen the muscles around the ankle joint

## Product Recommendations

For ankle injury prevention, consider building a kit with:

- High-quality athletic tape for ankle taping
- Cohesive bandages for compression
- Ankle braces for additional support
- Kinesiology tape for muscle support

Browse our [catalog](/catalog) to find the best products for your prevention kit.

## When to Seek Professional Help

If you experience persistent pain, swelling, or instability in your ankle, consult with a healthcare professional. Early intervention can prevent minor issues from becoming major injuries.

Remember, prevention is always better than cure. By taking proactive steps to protect your ankles, you can enjoy your sport with greater confidence and reduced risk of injury.`,
    author: {
      name: "Dr. Sarah Johnson",
      bio: "Sports Medicine Specialist with 15 years of experience in athletic injury prevention."
    },
    publishedAt: new Date("2025-07-15"),
    updatedAt: new Date("2025-07-15"),
    status: "published",
    categories: ["Injury Prevention"],
    tags: ["ankle", "injury prevention", "sports medicine", "taping"],
    readingTime: 5,
    seo: {
      title: "Preventing Ankle Injuries: A Complete Guide | Wrap Wizard",
      description: "Learn effective techniques and products to prevent common ankle injuries in athletes.",
      keywords: ["ankle injury", "prevention", "sports medicine", "taping", "athletic tape"]
    }
  },
  {
    id: "2",
    slug: "choosing-right-athletic-tape",
    title: "Choosing the Right Athletic Tape for Your Needs",
    excerpt: "A comprehensive guide to understanding the different types of athletic tape and their applications.",
    content: `# Choosing the Right Athletic Tape for Your Needs

With so many different types of athletic tape available, selecting the right one for your specific needs can be overwhelming. This guide will help you understand the key differences between tape types and how to choose the best option for your application.

## Types of Athletic Tape

### 1. Zinc Oxide Tape (Traditional Athletic Tape)

This is the most common type of athletic tape, known for its:

- **High tensile strength**: Provides excellent support and stability
- **Rigid structure**: Limits joint movement effectively
- **Water resistance**: Stays in place even during intense activity
- **Versatility**: Suitable for most taping applications

Best for: Ankle sprain prevention, joint stabilization, acute injury management

### 2. Kinesiology Tape

Designed to mimic human skin elasticity, kinesiology tape offers:

- **Stretchability**: Expands with muscle movement
- **Breathability**: Allows air circulation to prevent skin irritation
- **Water resistance**: Stays in place during swimming or sweating
- **Proprioceptive feedback**: Helps with muscle activation and joint awareness

Best for: Muscle support, reducing swelling, improving performance

### 3. Cohesive Bandage (Self-Adherent Wrap)

This tape sticks to itself but not to skin or hair:

- **No adhesion to skin**: Easy removal without pain
- **Compression**: Provides consistent pressure
- **Reusable**: Can be repositioned during application
- **Versatile**: Can be used as a securing layer over other tapes

Best for: Compression, securing other tapes, padding

### 4. Pre-Wrap (Underwrap)

Used as a base layer before applying other tapes:

- **Skin protection**: Prevents irritation from adhesive tapes
- **Absorbency**: Soaks up sweat to improve tape adhesion
- **Cushioning**: Provides padding for bony prominences
- **Easy removal**: Gentle on skin

Best for: Base layer for all taping applications

## How to Choose the Right Tape

### Consider Your Activity

Different sports have different demands:

- **High-impact sports** (basketball, football): Require rigid support tapes
- **Endurance sports** (running, cycling): Benefit from breathable, flexible options
- **Water sports** (swimming, water polo): Need water-resistant materials

### Consider Your Body Part

- **Ankles and wrists**: Often need rigid support
- **Knees and elbows**: May benefit from kinesiology tape
- **Muscle groups**: Kinesiology tape is ideal for muscle support

### Consider Your Skin Sensitivity

- **Sensitive skin**: Pre-wrap and hypoallergenic tapes are essential
- **Normal skin**: Most tape types are suitable
- **Previous skin reactions**: Avoid tapes with known allergens

## Building Your Kit

For a versatile taping kit, consider including:

- Zinc oxide tape in various widths (1", 1.5", 2")
- Kinesiology tape in multiple colors
- Cohesive bandage for compression
- Pre-wrap for skin protection
- Scissors for cutting tape

Browse our [catalog](/catalog) to find the best tape products for your kit.

## Application Tips

1. **Clean and dry skin** before applying any tape
2. **Remove jewelry** that might interfere with application
3. **Apply pre-wrap** as a base layer for sensitive areas
4. **Use proper tension** - not too tight to restrict circulation
5. **Check fit** after application to ensure comfort and effectiveness

By understanding the different types of athletic tape and their applications, you can make informed decisions that will enhance your performance and reduce injury risk.`,
    author: {
      name: "Mike Thompson",
      bio: "Certified Athletic Trainer with expertise in taping techniques and sports injury prevention."
    },
    publishedAt: new Date("2025-07-22"),
    updatedAt: new Date("2025-07-22"),
    status: "published",
    categories: ["Tape Techniques"],
    tags: ["athletic tape", "kinesiology tape", "cohesive bandage", "pre-wrap", "taping techniques"],
    readingTime: 7,
    seo: {
      title: "Choosing the Right Athletic Tape for Your Needs | Wrap Wizard",
      description: "A comprehensive guide to understanding the different types of athletic tape and their applications.",
      keywords: ["athletic tape", "kinesiology tape", "cohesive bandage", "pre-wrap", "taping techniques"]
    }
  },
  {
    id: "3",
    slug: "tape-vs-braces",
    title: "Tape vs. Braces: Which is Better for Injury Prevention?",
    excerpt: "Comparing the effectiveness of athletic tape and braces for preventing sports injuries.",
    content: `# Tape vs. Braces: Which is Better for Injury Prevention?

Athletes and trainers often debate whether athletic tape or braces provide better protection against injuries. Both have their advantages and disadvantages, and the best choice often depends on the specific situation, individual needs, and type of activity.

## Understanding Athletic Tape

Athletic tape has been used in sports medicine for decades. It's a versatile tool that can be applied in various patterns to provide support, limit harmful movement, and enhance proprioception.

### Advantages of Athletic Tape

1. **Customizable Support**: Can be applied in specific patterns for individual needs
2. **Immediate Application**: Can be applied quickly before activity
3. **Cost-Effective**: Generally less expensive than braces
4. **Lightweight**: Adds minimal weight to the athlete
5. **Versatility**: Can be used on various body parts

### Disadvantages of Athletic Tape

1. **Application Skill Required**: Proper application requires training and practice
2. **Time-Consuming**: Each application must be done fresh
3. **Durability**: May loosen during extended activity
4. **Skin Irritation**: Can cause allergic reactions in some individuals
5. **Removal**: Can be painful, especially for sensitive skin

## Understanding Braces

Braces are manufactured devices designed to provide support and stability to specific joints. They come in various designs, from simple sleeves to complex hinged braces.

### Advantages of Braces

1. **Consistent Support**: Provides the same level of support every time
2. **Ease of Use**: Simply slip on, no special application skills needed
3. **Durability**: Designed to last through multiple uses
4. **Adjustability**: Many feature adjustable compression and support levels
5. **Reusability**: Can be used multiple times

### Disadvantages of Braces

1. **Cost**: Generally more expensive than tape
2. **Bulkiness**: Can be bulky and restrictive
3. **Limited Customization**: One-size-fits-all approach may not suit everyone
4. **Maintenance**: Require cleaning and care between uses
5. **Heat Retention**: May cause overheating during intense activity

## When to Choose Tape

Athletic tape may be the better choice when:

- **Custom Support is Needed**: For unique injury patterns or anatomical variations
- **Proprioceptive Training**: When enhancing joint awareness is a goal
- **Budget Constraints**: When cost is a primary concern
- **Lightweight Requirements**: For activities where minimal weight is crucial
- **Professional Application**: When a trained professional will apply the tape

## When to Choose Braces

Braces may be the better choice when:

- **Consistent Support is Needed**: For daily activities or long-term management
- **Ease of Use is Important**: For athletes who self-manage their care
- **Durability is Required**: For extended use or harsh conditions
- **Skin Sensitivity**: For individuals who react to tape adhesives
- **Rehabilitation**: During recovery when consistent support is crucial

## Combining Both Approaches

In many cases, the best approach isn't choosing between tape and braces, but rather using them together:

- **Brace as Base**: Wear a brace for consistent support
- **Tape for Enhancement**: Add tape for additional support in high-risk situations
- **Situational Use**: Use braces for daily activities and tape for specific events

## Product Recommendations

For those who prefer tape:
- High-quality zinc oxide tape for rigid support
- Kinesiology tape for muscle support
- Pre-wrap for skin protection
- Cohesive bandage for compression

For those who prefer braces:
- Ankle braces for stability
- Knee braces for support
- Wrist braces for repetitive motion activities

Browse our [catalog](/catalog) to find the best products for your prevention strategy.

## Making the Decision

The choice between tape and braces should be based on:

1. **Professional Assessment**: Consult with a healthcare provider or athletic trainer
2. **Activity Demands**: Consider the specific requirements of your sport or activity
3. **Personal Preferences**: Factor in comfort and ease of use
4. **Budget**: Consider both initial and ongoing costs
5. **Previous Experience**: Use past experiences to guide future decisions

Remember, both tape and braces are tools in the injury prevention toolkit. The most effective approach often involves using the right tool for the right situation, and sometimes using multiple tools together for optimal protection.`,
    author: {
      name: "Dr. Emily Rodriguez",
      bio: "Physical Therapist specializing in sports injury prevention and rehabilitation."
    },
    publishedAt: new Date("2025-07-29"),
    updatedAt: new Date("2025-07-29"),
    status: "published",
    categories: ["Injury Prevention"],
    tags: ["tape", "braces", "injury prevention", "sports medicine", "comparison"],
    readingTime: 8,
    seo: {
      title: "Tape vs. Braces: Which is Better for Injury Prevention? | Wrap Wizard",
      description: "Comparing the effectiveness of athletic tape and braces for preventing sports injuries.",
      keywords: ["tape", "braces", "injury prevention", "sports medicine", "comparison"]
    }
  }
];

export const getBlogPosts = (): BlogPost[] => {
  return mockBlogPosts.filter(post => post.status === 'published');
};

export const getBlogPostBySlug = (slug: string): BlogPost | undefined => {
  return mockBlogPosts.find(post => post.slug === slug && post.status === 'published');
};

export const getRelatedPosts = (currentPost: BlogPost, limit: number = 3): BlogPost[] => {
  // Simple algorithm to find related posts based on categories and tags
  const related = mockBlogPosts
    .filter(post => 
      post.id !== currentPost.id && 
      post.status === 'published' &&
      (post.categories.some(cat => currentPost.categories.includes(cat)) ||
       post.tags.some(tag => currentPost.tags.includes(tag)))
    )
    .sort(() => Math.random() - 0.5) // Randomize for demo purposes
    .slice(0, limit);
  
  return related;
};