/** Format integer paise as ₹1,499 (no decimals). Always use this at the edge — never store rupees as floats. */
export function formatINR(paise: number): string {
  const rupees = Math.floor(paise / 100);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(rupees);
}
