const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10" becomes "Oct 26" */
export function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  return `${MONTHS[Number(m) - 1]} ${year.slice(2)}`;
}

/** One decimal place: 9 becomes "9.0", 8.5 becomes "8.5" */
export function formatAverage(value: number): string {
  return value.toFixed(1);
}

export function pluralEntries(count: number): string {
  return `${count} ${count === 1 ? "entry" : "entries"}`;
}
