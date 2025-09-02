import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useKit } from "@/context/kit-context";

export interface FirstAidCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories: string[];
  required: boolean;
  estimatedItems: number;
}

export const FIRST_AID_CATEGORIES: FirstAidCategory[] = [
  {
    id: "wound-care-dressings",
    name: "Wound Care & Dressings",
    description: "Essential supplies for treating cuts, scrapes, and wounds",
    icon: "🩹",
    subcategories: [
      "Assorted adhesive bandages (e.g., Band-Aids, various sizes, knuckle, fingertip)",
      "Sterile gauze pads (various sizes, e.g., 2x2, 3x3, 4x4)",
      "Non-adherent pads",
      "Sterile eye pads",
      "Rolled gauze bandages",
      "Liquid bandages/skin adhesive"
    ],
    required: false,
    estimatedItems: 6
  },
  {
    id: "tapes-wraps",
    name: "Tapes & Wraps",
    description: "Medical tapes and wraps for securing dressings and providing support",
    icon: "🧵",
    subcategories: [
      "Medical adhesive tape",
      "Elastic bandages/wraps (e.g., ACE bandages)",
      "Cohesive wrap (self-adhering bandage)",
      "Athletic tape (for sprains and support)",
      "Pre-wrap"
    ],
    required: false,
    estimatedItems: 5
  },
  {
    id: "antiseptics-ointments",
    name: "Antiseptics & Ointments",
    description: "Products for cleaning wounds and preventing infection",
    icon: "🧴",
    subcategories: [
      "Antibiotic ointment packets",
      "Antiseptic wipes or towelettes",
      "Alcohol prep pads",
      "Hydrogen peroxide or wound wash solution",
      "Burn gel or cream",
      "Hydrocortisone cream (for skin irritation)"
    ],
    required: false,
    estimatedItems: 6
  },
  {
    id: "pain-relief",
    name: "Pain & Symptom Relief",
    description: "Medications for pain and other common symptoms",
    icon: "💊",
    subcategories: [
      "Over-the-counter pain relievers (e.g., Ibuprofen, Acetaminophen)",
      "Antihistamines (for allergies)",
      "Antacids (for upset stomach)",
      "Oral rehydration salts or tablets",
      "Sting and bite relief swabs"
    ],
    required: false,
    estimatedItems: 5
  },
  {
    id: "instruments-tools",
    name: "Instruments & Tools",
    description: "Essential tools for first aid treatment",
    icon: "🛠️",
    subcategories: [
      "Trauma shears or medical scissors",
      "Tweezers (fine-point)",
      "Safety pins",
      "Single-use splinters probes/lancets",
      "A digital thermometer",
      "Small flashlight or penlight",
      "Resuscitation/CPR face shield"
    ],
    required: false,
    estimatedItems: 7
  },
  {
    id: "trauma-emergency",
    name: "Trauma & Emergency",
    description: "Supplies for emergency situations and serious injuries",
    icon: "🚨",
    subcategories: [
      "Instant cold packs",
      "Emergency blanket (shock/hypothermia)",
      "Triangular bandages (for slings)",
      "Splints (e.g., Sam Splint)",
      "Tourniquet (for severe bleeding)",
      "Duct tape (for improvised repairs)"
    ],
    required: false,
    estimatedItems: 6
  },
  {
    id: "ppe",
    name: "Personal Protection Equipment (PPE)",
    description: "Equipment to protect yourself and others from contamination",
    icon: "🛡️",
    subcategories: [
      "Nitrile or vinyl gloves (multiple pairs)",
      "Medical face masks",
      "Hand sanitizer",
      "Biohazard waste bags"
    ],
    required: false,
    estimatedItems: 4
  },
  {
    id: "information-essentials",
    name: "First Aid Information & Essentials",
    description: "Important information and essentials for first aid",
    icon: "📋",
    subcategories: [
      "A concise first aid guide or booklet",
      "Waterproof paper and pen",
      "Emergency contact information cards",
      "Medication log"
    ],
    required: false,
    estimatedItems: 4
  },
  {
    id: "hot-cold-therapy",
    name: "Hot & Cold Therapy",
    description: "Products for treating injuries with heat and cold therapy",
    icon: "🧊",
    subcategories: [
      "Instant cold compress",
      "Reusable hot/cold gel packs",
      "Topical analgesic creams",
      "Heat wraps"
    ],
    required: false,
    estimatedItems: 4
  },
  {
    id: "hydration-nutrition",
    name: "Hydration & Nutrition",
    description: "Emergency hydration and nutrition supplies",
    icon: "💧",
    subcategories: [
      "Electrolyte powder packets",
      "Energy gel packets",
      "Emergency water tablets",
      "Glucose tablets"
    ],
    required: false,
    estimatedItems: 4
  },
  {
    id: "miscellaneous",
    name: "Miscellaneous & General",
    description: "Additional supplies and storage solutions",
    icon: "📦",
    subcategories: [
      "Athletic training kit bag",
      "Disposable towels",
      "Plastic bags for waste",
      "Emergency whistle"
    ],
    required: false,
    estimatedItems: 4
  }
];

interface FirstAidCategoriesProps {
  onCategorySelect: (categoryId: string) => void;
}

const FirstAidCategories = ({ onCategorySelect }: FirstAidCategoriesProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { kit } = useKit();

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryItemCount = (categoryId: string) => {
    return kit.filter(item => {
      // Map product categories to first aid categories
      const categoryMapping: Record<string, string> = {
        "First Aid & Wound Care": "wound-care-dressings",
        "Taping & Bandaging": "tapes-wraps",
        "Over-the-Counter Medication": "pain-relief",
        "Instruments & Tools": "instruments-tools",
        "Emergency Care": "trauma-emergency",
        "Documentation & Communication": "information-essentials",
        "Hot & Cold Therapy": "trauma-emergency",
        "Health Monitoring": "instruments-tools"
      };
      
      return Object.entries(categoryMapping).some(([productCategory, mappedId]) => 
        mappedId === categoryId && item.category === productCategory
      );
    }).length;
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Build Your Professional Kit</h2>
        <p className="text-muted-foreground">
          Select components for each category to build a comprehensive professional kit.
        </p>
      </div>

      <div className="grid gap-4">
        {FIRST_AID_CATEGORIES.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const itemCount = getCategoryItemCount(category.id);
          const hasItems = itemCount > 0;
          const selectedItems = kit.filter(item => {
            const categoryMapping: Record<string, string> = {
              "First Aid & Wound Care": "wound-care-dressings",
              "Taping & Bandaging": "tapes-wraps",
              "Over-the-Counter Medication": "pain-relief",
              "Instruments & Tools": "instruments-tools",
              "Emergency Care": "trauma-emergency",
              "Documentation & Communication": "information-essentials",
              "Hot & Cold Therapy": "trauma-emergency",
              "Health Monitoring": "instruments-tools"
            };
            
            return Object.entries(categoryMapping).some(([productCategory, mappedId]) => 
              mappedId === category.id && item.category === productCategory
            );
          });

          return (
            <Card key={category.id} className={`transition-all duration-200 ${
              hasItems ? 'ring-2 ring-primary/20 bg-primary/5' : 'hover:shadow-md'
            }`}>
              <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleCategory(category.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        {category.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {hasItems && (
                          <Badge variant="default" className="text-xs">
                            {selectedItems.reduce((total, item) => total + item.quantity, 0)} items
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCategorySelect(category.id);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {hasItems ? 'Modify' : 'Choose'}
                    </Button>
                    <div className="p-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {selectedItems.length > 0 ? (
                      <>
                        <h4 className="font-medium text-sm text-muted-foreground mb-3">
                          Selected items in this category:
                        </h4>
                        <div className="grid gap-2 text-sm">
                          {selectedItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-green-50 border border-green-200">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-600"></span>
                                <span>{item.name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 className="font-medium text-sm text-muted-foreground mb-3">
                          Typical items in this category:
                        </h4>
                        <div className="grid gap-2 text-sm">
                          {category.subcategories.map((subcategory, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                              <span className="w-2 h-2 rounded-full bg-primary/60"></span>
                              <span>{subcategory}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FirstAidCategories;