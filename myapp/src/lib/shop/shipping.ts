export const SHIPPING_RATES: Record<string, { cents: number; label: string }> = {
  BE: { cents: 595,  label: 'België' },
  NL: { cents: 895,  label: 'Nederland' },
  OTHER: { cents: 1295, label: 'Overig Europa' },
}

export const FREE_SHIPPING_THRESHOLD_CENTS = 7500 // €75

export function calcShipping(country: string, subtotalCents: number): number {
  if (subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0
  const rate = SHIPPING_RATES[country] ?? SHIPPING_RATES.OTHER
  return rate.cents
}

export function shippingLabel(country: string): string {
  return (SHIPPING_RATES[country] ?? SHIPPING_RATES.OTHER).label
}
