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
