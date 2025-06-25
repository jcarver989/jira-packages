export function dateToString(date: Date): string {
  return date.toISOString().split("T")[0]
}
