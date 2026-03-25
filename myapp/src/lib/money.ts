const FORMATTER = new Intl.NumberFormat('nl-BE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
})

export function formatEuro(cents: number): string {
  return FORMATTER.format(cents / 100)
}
