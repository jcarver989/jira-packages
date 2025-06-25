export type Days = number
export type Hours = number

export type Time = `${number}${number}:${number}${number}:${number}${number}`

export const oneHourInMs = 1000 * 60 * 60
export const oneDayInMs = oneHourInMs * 24

export function calcCycleTimeHours(startDate: Date, endDate: Date): Hours {
  const cycleTimeInMs = endDate.getTime() - startDate.getTime()
  const cycleTimeInHours = cycleTimeInMs / oneHourInMs

  if (cycleTimeInHours < 1) {
    return 1 // assume all tasks take at least 1 hour
  }

  return Math.round(cycleTimeInHours)
}

export function calcCycleTimeDays(startDate: Date, endDate: Date): Days {
  // +1 because we want to include the start date
  return calcDaysBetween(startDate, endDate) + 1
}

export function calcDaysBetween(startDate: Date, endDate: Date): Days {
  const diff = endDate.getTime() - startDate.getTime()
  const daysBetween = Math.round(diff / oneDayInMs)
  return daysBetween
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isBefore(a: Date, b: Date) {
  return a.getTime() < b.getTime()
}

export function isOnOrBefore(a: Date, b: Date) {
  return a.getTime() <= b.getTime()
}

export function isOnOrAfter(a: Date, b: Date) {
  return a.getTime() >= b.getTime()
}

export function isAfter(a: Date, b: Date) {
  return a.getTime() > b.getTime()
}

export function plusDays(today: Date, days: Days): Date {
  return new Date(today.getTime() + oneDayInMs * days)
}

export function minusDays(today: Date, days: Days): Date {
  return new Date(today.getTime() - oneDayInMs * days)
}

export function plusHours(today: Date, hours: Hours): Date {
  return new Date(today.getTime() + oneHourInMs * hours)
}

export function minusHours(today: Date, hours: Hours): Date {
  return new Date(today.getTime() - oneHourInMs * hours)
}

export const ONE_WEEK: Days = 7
export const ONE_MONTH: Days = 30
export const ONE_QUARTER: Days = 90
