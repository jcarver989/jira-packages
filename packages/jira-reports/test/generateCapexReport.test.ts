import { minusDays, plusDays, plusHours } from "@jira-apis/task-metrics/util"
import { describe, expect, it } from "vitest"
import { anEpic, aTaskWithCycleTime } from "@jira-apis/task-metrics"
import { generateCapexReport } from "../src/generateCapexReport"

describe("generateCapexReport", () => {
  const jan1_2025 = new Date("2025-01-01T00:00:00")
  const jan2_2025 = new Date("2025-01-02T00:00:00")
  const jan31_2025 = new Date("2025-01-31T23:00:00")

  const startDate = jan1_2025
  const endDate = jan31_2025

  it("should work with empty arrays", () => {
    const results = generateCapexReport({
      epics: [],
      tasks: [],
      startDate,
      endDate,
    })
    expect(results).toEqual([])
  })

  it("should calc the amount of time a dev worked on a task within an epic", () => {
    const epics = [anEpic({ key: "epic-1", summary: "summary-1" })]
    const tasks = [
      aTaskWithCycleTime({
        assignee: { id: "Bob", name: "Bob" },
        parentKey: epics[0].key,
        dateStarted: jan1_2025,
        dateCompleted: plusHours(jan1_2025, 3),
      }),
    ]
    const results = generateCapexReport({ epics, tasks, startDate, endDate })

    expect(results).toEqual([
      {
        assignee: "Bob",
        epicKey: epics[0].key,
        epicName: epics[0].summary,
        hoursWorked: 3,
        firstTaskStarted: jan1_2025,
        lastTaskCompleted: plusHours(jan1_2025, 3),
      },
    ])
  })

  it("should not count work on tasks that started before startDate", () => {
    const epics = [anEpic({ key: "epic-1", summary: "summary-1" })]
    const task1Start = minusDays(jan1_2025, 1)
    const tasks = [
      aTaskWithCycleTime({
        assignee: { id: "Bob", name: "Bob" },
        parentKey: epics[0].key,
        dateStarted: task1Start,
        dateCompleted: plusHours(task1Start, 5),
      }),
    ]
    const results = generateCapexReport({ epics, tasks, startDate, endDate })

    expect(results).toEqual([])
  })

  it("should not count work on tasks that started after end date", () => {
    const epics = [anEpic({ key: "epic-1", summary: "summary-1" })]
    const task1Start = plusDays(endDate, 1)
    const tasks = [
      aTaskWithCycleTime({
        assignee: { id: "Bob", name: "Bob" },
        parentKey: epics[0].key,
        dateStarted: task1Start,
        dateCompleted: plusHours(task1Start, 5),
      }),
    ]
    const results = generateCapexReport({ epics, tasks, startDate, endDate })

    expect(results).toEqual([])
  })

  it("should count work for WIP task that has not finished yet, up until current end date", () => {
    const startDate = new Date("2025-01-01T00:00:00")
    const endDate = new Date("2025-01-05T00:00:00")

    const epics = [anEpic({ key: "epic-1", summary: "summary-1" })]

    const tasks = [
      aTaskWithCycleTime({
        assignee: { id: "Bob", name: "Bob" },
        parentKey: epics[0].key,
        dateStarted: startDate,
        dateCompleted: plusDays(endDate, 10),
      }),
    ]
    const results = generateCapexReport({ epics, tasks, startDate, endDate })

    expect(results).toEqual([
      {
        assignee: "Bob",
        epicKey: "epic-1",
        epicName: "summary-1",
        firstTaskStarted: startDate,
        lastTaskCompleted: endDate,
        hoursWorked: 24, // Jan 4 and 5 were Sat + Sun, so we only count Jan 1-3
      },
    ])
  })

  it("should calc the amount of time a dev worked on tasks accross multiple epics", () => {
    const epics = [
      anEpic({ key: "epic-1", summary: "summary-1" }),
      anEpic({ key: "epic-2", summary: "summary-2" }),
    ]

    const tasks = [
      aTaskWithCycleTime({
        assignee: { id: "Bob", name: "Bob" },
        parentKey: epics[0].key,
        dateStarted: jan1_2025,
        dateCompleted: plusHours(jan1_2025, 3),
      }),

      aTaskWithCycleTime({
        assignee: { id: "Bob", name: "Bob" },
        parentKey: epics[1].key,
        dateStarted: jan2_2025,
        dateCompleted: plusHours(jan2_2025, 5),
      }),
    ]
    const results = generateCapexReport({ epics, tasks, startDate, endDate })

    expect(results).toEqual([
      {
        assignee: "Bob",
        epicKey: epics[0].key,
        epicName: epics[0].summary,
        hoursWorked: 3,
        firstTaskStarted: jan1_2025,
        lastTaskCompleted: plusHours(jan1_2025, 3),
      },

      {
        assignee: "Bob",
        epicKey: epics[1].key,
        epicName: epics[1].summary,
        hoursWorked: 5,

        firstTaskStarted: jan2_2025,
        lastTaskCompleted: plusHours(jan2_2025, 5),
      },
    ])
  })
})
