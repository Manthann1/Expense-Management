// Currency conversion utilities

export interface ExchangeRate {
  from: string
  to: string
  rate: number
  lastUpdated: string
}

// Mock exchange rates - in production, fetch from API like exchangerate-api.com
const mockExchangeRates: Record<string, Record<string, number>> = {
  USD: {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    INR: 83.12,
    CAD: 1.35,
    AUD: 1.52,
  },
  EUR: {
    USD: 1.09,
    EUR: 1,
    GBP: 0.86,
    INR: 90.45,
    CAD: 1.47,
    AUD: 1.65,
  },
  GBP: {
    USD: 1.27,
    EUR: 1.16,
    GBP: 1,
    INR: 105.23,
    CAD: 1.71,
    AUD: 1.92,
  },
  INR: {
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
    INR: 1,
    CAD: 0.016,
    AUD: 0.018,
  },
  CAD: {
    USD: 0.74,
    EUR: 0.68,
    GBP: 0.58,
    INR: 61.57,
    CAD: 1,
    AUD: 1.13,
  },
  AUD: {
    USD: 0.66,
    EUR: 0.61,
    GBP: 0.52,
    INR: 54.68,
    CAD: 0.89,
    AUD: 1,
  },
}

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) {
    return amount
  }

  const rate = mockExchangeRates[fromCurrency]?.[toCurrency]
  if (!rate) {
    console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`)
    return amount
  }

  return amount * rate
}

export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) {
    return 1
  }

  return mockExchangeRates[fromCurrency]?.[toCurrency] || 1
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const supportedCurrencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
]
