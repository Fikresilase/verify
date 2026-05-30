export function parseSettledAmount(settledAmount: string) {
  const amount = Number(settledAmount.replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}
