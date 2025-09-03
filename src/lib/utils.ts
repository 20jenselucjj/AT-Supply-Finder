import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Basic currency formatter (USD for now) centralizing logic for easier future i18n.
export function formatCurrency(value: number, currency: string = 'USD', locale: string = 'en-US') {
  if (isNaN(value)) return ''
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
  } catch {
    return `$${value.toFixed(2)}`
  }
}

export function formatPercent(delta: number) {
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}%`
}

// Category mapping from build page system to database system and vice versa
export const CATEGORY_MAPPING = {
  // From build page category IDs to database category names
  "wound-care-dressings": "First Aid & Wound Care",
  "tapes-wraps": "Taping & Bandaging",
  "antiseptics-ointments": "Antiseptics & Ointments",
  "pain-relief": "Over-the-Counter Medication",
  "instruments-tools": "Instruments & Tools",
  "trauma-emergency": "Emergency Care",
  "ppe": "Personal Protection Equipment (PPE)",
  "information-essentials": "Documentation & Communication",
  "hot-cold-therapy": "Hot & Cold Therapy",
  "hydration-nutrition": "Hydration & Nutrition",
  "miscellaneous": "Miscellaneous & General"
} as const;

export const REVERSE_CATEGORY_MAPPING = {
  // From database category names to build page category IDs
  "First Aid & Wound Care": "wound-care-dressings",
  "Taping & Bandaging": "tapes-wraps",
  "Antiseptics & Ointments": "antiseptics-ointments",
  "Over-the-Counter Medication": "pain-relief",
  "Instruments & Tools": "instruments-tools",
  "Emergency Care": "trauma-emergency",
  "Personal Protection Equipment (PPE)": "ppe",
  "Documentation & Communication": "information-essentials",
  "Hot & Cold Therapy": "hot-cold-therapy",
  "Hydration & Nutrition": "hydration-nutrition",
  "Miscellaneous & General": "miscellaneous"
} as const;

// Function to convert from build page category ID to database category name
export function convertToDatabaseCategory(buildPageCategoryId: string): string {
  return CATEGORY_MAPPING[buildPageCategoryId as keyof typeof CATEGORY_MAPPING] || buildPageCategoryId;
}

// Function to convert from database category name to build page category ID
export function convertToBuildPageCategory(databaseCategoryName: string): string {
  return REVERSE_CATEGORY_MAPPING[databaseCategoryName as keyof typeof REVERSE_CATEGORY_MAPPING] || databaseCategoryName;
}
