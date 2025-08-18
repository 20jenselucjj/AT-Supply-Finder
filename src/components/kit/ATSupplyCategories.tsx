import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useKit } from "@/context/kit-context";

export interface ATSupplyCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories: string[];
  required: boolean;
  estimatedItems: number;
}

export const AT_SUPPLY_CATEGORIES: ATSupplyCategory[] = [
  {
    id: "taping-bandaging",
    name: "Taping & Bandaging",
    description: "Essential taping and wrapping supplies for injury prevention and support",
    icon: "🩹",
    subcategories: [
      "White athletic tape (multiple sizes)",
      "Elastic adhesive tape (Kinesiology tape)",
      "Cohesive wrap (Vetrap)",
      "Underwrap (pre-wrap)",
      "Elastic bandages (ACE bandages, various sizes)",
      "Adhesive spray (tuffner)",
      "Tape remover"
    ],
    required: false,
    estimatedItems: 7
  },
  {
    id: "first-aid-wound-care",
    name: "First Aid & Wound Care",
    description: "Comprehensive wound care and first aid supplies",
    icon: "🏥",
    subcategories: [
      "Sterile gauze pads (multiple sizes)",
      "Sterile dressings and non-adherent pads",
      "Assortment of adhesive bandages (Band-Aids, various shapes and sizes)",
      "Butterfly closures/adhesive skin closures",
      "Sterile cotton balls and cotton swabs",
      "Antibiotic ointment/cream",
      "Antiseptic wipes or solution (alcohol pads, hydrogen peroxide)",
      "Saline solution for wound irrigation",
      "Hand sanitizer"
    ],
    required: false,
    estimatedItems: 9
  },
  {
    id: "instruments-tools",
    name: "Instruments & Tools",
    description: "Essential tools and instruments for athletic training",
    icon: "🔧",
    subcategories: [
      "Bandage scissors/trauma shears",
      "Tape cutters",
      "Tweezers",
      "Splints (Sam Splint)",
      "Safety pins",
      "Small mirror",
      "Penlight/flashlight",
      "Gloves (latex-free/nitrile)"
    ],
    required: false,
    estimatedItems: 8
  },
  {
    id: "hot-cold-therapy",
    name: "Hot & Cold Therapy",
    description: "Temperature therapy supplies for injury treatment",
    icon: "🧊",
    subcategories: [
      "Instant cold packs",
      "Reusable cold/hot gel packs",
      "Ice bags",
      "Cold spray"
    ],
    required: false,
    estimatedItems: 4
  },
  {
    id: "injury-prevention-rehab",
    name: "Injury Prevention & Rehab",
    description: "Preventive care and rehabilitation supplies",
    icon: "💪",
    subcategories: [
      "Pre-wrap",
      "Compression sleeves",
      "Protective padding (foam)",
      "Nasal plugs/sponges",
      "Petroleum jelly or friction-reducing lube",
      "Elastic wraps for compression"
    ],
    required: false,
    estimatedItems: 6
  },
  {
    id: "otc-medication",
    name: "Over-the-Counter Medication",
    description: "Basic medications for common issues (check local regulations)",
    icon: "💊",
    subcategories: [
      "Pain relievers (Ibuprofen, Acetaminophen)",
      "Antihistamines",
      "Antacids"
    ],
    required: false,
    estimatedItems: 3
  },
  {
    id: "protective-equipment-safety",
    name: "Protective Equipment & Safety",
    description: "Safety and protective equipment for emergency situations",
    icon: "🛡️",
    subcategories: [
      "CPR mask/barrier",
      "Biohazard waste bags",
      "Sunscreen",
      "Insect repellent",
      "Emergency blanket"
    ],
    required: false,
    estimatedItems: 5
  },
  {
    id: "documentation-communication",
    name: "Documentation & Communication",
    description: "Record keeping and communication tools",
    icon: "📋",
    subcategories: [
      "Pen and paper",
      "Emergency action plan",
      "Medical history and emergency contact forms for athletes"
    ],
    required: false,
    estimatedItems: 3
  },
  {
    id: "hydration-nutrition",
    name: "Hydration & Nutrition",
    description: "Hydration and nutritional support supplies",
    icon: "💧",
    subcategories: [
      "Oral rehydration solution or tablets",
      "Energy gels or snacks",
      "Water bottles or cooler"
    ],
    required: false,
    estimatedItems: 3
  },
  {
    id: "miscellaneous-general",
    name: "Miscellaneous & General",
    description: "Additional useful supplies for comprehensive coverage",
    icon: "🎒",
    subcategories: [
      "Eye wash solution",
      "Sanitary napkins/tampons",
      "Duct tape or super glue for quick repairs",
      "Small plastic bags (for ice, biohazard waste, etc.)",
      "Spare shoelaces"
    ],
    required: false,
    estimatedItems: 5
  }
];

interface ATSupplyCategoriesProps {
  onCategorySelect: (categoryId: string) => void;
}

const ATSupplyCategories = ({ onCategorySelect }: ATSupplyCategoriesProps) => {
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
      // Map product categories to AT supply categories
      const categoryMapping: Record<string, string> = {
        "Taping & Bandaging": "taping-bandaging",
        "First Aid & Wound Care": "first-aid-wound-care",
        "Instruments & Tools": "instruments-tools",
        "Hot & Cold Therapy": "hot-cold-therapy",
        "Injury Prevention & Rehab": "injury-prevention-rehab",
        "Over-the-Counter Medication": "otc-medication",
        "Protective Equipment & Safety": "protective-equipment-safety",
        "Documentation & Communication": "documentation-communication",
        "Hydration & Nutrition": "hydration-nutrition",
        "Miscellaneous & General": "miscellaneous-general"
      };
      
      return Object.entries(categoryMapping).some(([productCategory, mappedId]) => 
        mappedId === categoryId && item.category === productCategory
      );
    }).length;
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Build Your Athletic Training Kit</h2>
        <p className="text-muted-foreground">
          Select components for each category to build a comprehensive athletic training supply kit.
          
        </p>
      </div>

      <div className="grid gap-4">
        {AT_SUPPLY_CATEGORIES.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const itemCount = getCategoryItemCount(category.id);
          const hasItems = itemCount > 0;
          const selectedItems = kit.filter(item => {
            const categoryMapping: Record<string, string> = {
              "Taping & Bandaging": "taping-bandaging",
              "First Aid & Wound Care": "first-aid-wound-care",
              "Instruments & Tools": "instruments-tools",
              "Hot & Cold Therapy": "hot-cold-therapy",
              "Injury Prevention & Rehab": "injury-prevention-rehab",
              "Over-the-Counter Medication": "otc-medication",
              "Protective Equipment & Safety": "protective-equipment-safety",
              "Documentation & Communication": "documentation-communication",
              "Hydration & Nutrition": "hydration-nutrition",
              "Miscellaneous & General": "miscellaneous-general"
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

export default ATSupplyCategories;