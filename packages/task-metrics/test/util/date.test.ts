import { describe, expect, it } from "vitest"
import {
  calcCycleTimeDays,
  calcCycleTimeHours,
  isOnOrAfter,
  isOnOrBefore,
  isSameDay,
  minusDays,
  minusHours,
  plusDays,
  plusHours,
} from "../../src/util/date"

import { dateToString } from "@jira-apis/jira-api"

describe("calcCycleTime", () => {
  it("should count cycle time of task that starts and finishes within the same hour as 1 hour", () => {
    const date = new Date("2024-01-01")
    expect(calcCycleTimeHours(date, date)).toEqual(1)
  })

  it("should calc cycle time of 1 hour", () => {
    const date1 = new Date("2024-01-01T00:00:00.000Z")
    const date2 = new Date("2024-01-01T01:00:00.000Z")
    expect(calcCycleTimeHours(date1, date2)).toEqual(1)
  })

  it("should count task that starts on day 1 and finishes on day 30 as 30 days of cyle time", () => {
    const date1 = new Date("2024-01-01T00:00:00.000Z")
    const date2 = new Date("2024-01-30T00:00:00.000Z")
    expect(calcCycleTimeHours(date1, date2)).toEqual(29 * 24)
  })

  it("should calc cycle time in days", () => {
    const date1 = new Date("2024-01-01")
    const date2 = new Date("2024-01-02")
    expect(calcCycleTimeDays(date1, date2)).toEqual(2)
  })
})

describe("date math", () => {
  const jan1 = new Date("2024-01-01")
  const jan2 = new Date("2024-01-02")

  const hour1 = new Date("2024-01-01T01:00:00.000Z")
  const hour2 = new Date("2024-01-01T02:00:00.000Z")

  it("should plusDays", () => {
    expect(plusDays(jan1, 1)).toEqual(jan2)
  })

  it("should minusDays", () => {
    expect(minusDays(jan2, 1)).toEqual(jan1)
  })

  it("should plus hours", () => {
    expect(plusHours(hour1, 1)).toEqual(hour2)
  })

  it("should minus hours", () => {
    expect(minusHours(hour2, 1)).toEqual(hour1)
  })

  it("should isSameDay", () => {
    expect(isSameDay(jan1, jan1)).toEqual(true)
    expect(isSameDay(jan1, jan2)).toEqual(false)
  })

  it("should isOnOrBefore", () => {
    expect(isOnOrBefore(jan1, jan1)).toEqual(true)
    expect(isOnOrBefore(jan1, jan2)).toEqual(true)
    expect(isOnOrBefore(jan2, jan1)).toEqual(false)
  })

  it("should isOnOrAfter", () => {
    expect(isOnOrAfter(jan1, jan1)).toEqual(true)
    expect(isOnOrAfter(jan1, jan2)).toEqual(false)
    expect(isOnOrAfter(jan2, jan1)).toEqual(true)
  })
})

describe("dateToString", () => {
  it("should stringify a date", () => {
    const dateString = "2024-01-01"
    const date = new Date(dateString)
    expect(dateToString(date)).toEqual(dateString)
  })
})
