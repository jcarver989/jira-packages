import { describe, expect, it } from "vitest"
import { calcCycleTimeByAssignee } from "../src/calcCycleTimeByAssignee"
import { aTaskWithCycleTime } from "@jira-apis/task-metrics"

describe("calcCycleTimeByAssignee", () => {
  it("should not fail on empty array", () => {
    calcCycleTimeByAssignee({ tasks: [] })
  })

  it("should not fail if hours are zero", () => {
    const jan1 = new Date("2024-01-01T00:00:00")

    const results = calcCycleTimeByAssignee({
      tasks: [
        aTaskWithCycleTime({
          dateStarted: undefined,
          dateCompleted: undefined,
          assignee: { id: "Bob", name: "Bob" },
        }),
      ],
    })

    expect(results).toEqual({})
  })

  it("should count a max of 8 hours of work in a single day", () => {
    const jan1 = new Date("2024-01-01T00:00:00")
    const jan2 = new Date("2024-01-01T23:00:00")

    const results = calcCycleTimeByAssignee({
      tasks: [
        aTaskWithCycleTime({
          dateStarted: jan1,
          dateCompleted: jan2,
          assignee: { id: "Bob", name: "Bob" },
        }),
      ],
    })

    expect(results).toEqual({
      Bob: { hoursWorked: 8, firstTaskStarted: jan1, lastTaskCompleted: jan2 },
    })
  })

  it("should count a individual hours worked on single task correctly", () => {
    const hour0 = new Date("2024-01-01T00:00:00")
    const hour1 = new Date("2024-01-01T03:00:00")

    const results = calcCycleTimeByAssignee({
      tasks: [
        aTaskWithCycleTime({
          dateStarted: hour0,
          dateCompleted: hour1,
          assignee: { id: "Bob", name: "Bob" },
        }),
      ],
    })

    expect(results).toEqual({
      Bob: {
        hoursWorked: 3,
        firstTaskStarted: hour0,
        lastTaskCompleted: hour1,
      },
    })
  })

  it("should not count work where the clock was left running over the weekend", () => {
    const hour0 = new Date("2023-12-30T00:00:00") // Saturday
    const hour1 = new Date("2024-01-01T03:00:00") // Monday (we worked from hour: 0 -> hour: 3)

    const results = calcCycleTimeByAssignee({
      tasks: [
        aTaskWithCycleTime({
          dateStarted: hour0,
          dateCompleted: hour1,
          assignee: { id: "Bob", name: "Bob" },
        }),
      ],
    })

    expect(results).toEqual({
      Bob: {
        hoursWorked: 3,
        firstTaskStarted: hour0,
        lastTaskCompleted: hour1,
      },
    })
  })

  it("should count a max of 16 hours of work over 2 days", () => {
    const jan1 = new Date("2024-01-01T00:00:00")
    const jan2 = new Date("2024-01-02T23:00:00")

    const results = calcCycleTimeByAssignee({
      tasks: [
        aTaskWithCycleTime({
          dateStarted: jan1,
          dateCompleted: jan2,
          assignee: { id: "Bob", name: "Bob" },
        }),
      ],
    })

    expect(results).toEqual({
      Bob: { hoursWorked: 16, firstTaskStarted: jan1, lastTaskCompleted: jan2 },
    })
  })

  it("should not double count two tasks that were WIP over the same time period", () => {
    const jan1 = new Date("2024-01-01T00:00:00")
    const jan2 = new Date("2024-01-01T23:00:00")

    const results = calcCycleTimeByAssignee({
      tasks: [
        aTaskWithCycleTime({
          key: "task-1",
          dateStarted: jan1,
          dateCompleted: jan2,
          assignee: { id: "Bob", name: "Bob" },
        }),

        aTaskWithCycleTime({
          key: "task-2",
          dateStarted: jan1,
          dateCompleted: jan2,
          assignee: { id: "Bob", name: "Bob" },
        }),
      ],
    })

    expect(results).toEqual({
      Bob: { hoursWorked: 8, firstTaskStarted: jan1, lastTaskCompleted: jan2 },
    })
  })

  it("should handle multiple assignees working simultaneously", () => {
    const jan1 = new Date("2024-01-01T00:00:00")
    const jan2 = new Date("2024-01-01T23:00:00")

    const results = calcCycleTimeByAssignee({
      tasks: [
        aTaskWithCycleTime({
          dateStarted: jan1,
          dateCompleted: jan2,
          assignee: { id: "Bob", name: "Bob" },
        }),

        aTaskWithCycleTime({
          dateStarted: jan1,
          dateCompleted: jan2,
          assignee: { id: "Alice", name: "Alice" },
        }),
      ],
    })

    expect(results).toEqual({
      Bob: { hoursWorked: 8, firstTaskStarted: jan1, lastTaskCompleted: jan2 },
      Alice: {
        hoursWorked: 8,
        firstTaskStarted: jan1,
        lastTaskCompleted: jan2,
      },
    })
  })

  it("should handle tasks with undefined dateCompleted but valid resolutiondate", () => {
    const jan1 = new Date("2024-01-01T00:00:00")
    const jan1End = new Date("2024-01-01T04:00:00")

    const results = calcCycleTimeByAssignee({
      tasks: [
        aTaskWithCycleTime({
          dateStarted: jan1,
          dateCompleted: undefined,
          resolutiondate: jan1End,
          resolution: "Done",
          assignee: { id: "Bob", name: "Bob" },
        }),
      ],
    })

    expect(results).toEqual({
      Bob: {
        hoursWorked: 4,
        firstTaskStarted: jan1,
        lastTaskCompleted: jan1End,
      },
    })
  })

  it("should handle overlapping tasks with different durations", () => {
    const jan1 = new Date("2024-01-01T00:00:00")
    const jan1Mid = new Date("2024-01-01T04:00:00")
    const jan1End = new Date("2024-01-01T08:00:00")

    const results = calcCycleTimeByAssignee({
      tasks: [
        aTaskWithCycleTime({
          dateStarted: jan1,
          dateCompleted: jan1End,
          assignee: { id: "Bob", name: "Bob" },
        }),

        aTaskWithCycleTime({
          dateStarted: jan1,
          dateCompleted: jan1Mid,
          assignee: { id: "Bob", name: "Bob" },
        }),
      ],
    })

    expect(results).toEqual({
      Bob: {
        hoursWorked: 8,
        firstTaskStarted: jan1,
        lastTaskCompleted: jan1End,
      },
    })
  })

  it("should handle tasks spanning multiple weeks", () => {
    const dec25 = new Date("2023-12-25T00:00:00") // Monday
    const jan5 = new Date("2024-01-05T23:59:59") // Friday

    const results = calcCycleTimeByAssignee({
      tasks: [
        aTaskWithCycleTime({
          dateStarted: dec25,
          dateCompleted: jan5,
          assignee: { id: "Bob", name: "Bob" },
        }),
      ],
    })

    // 10 working days (excluding weekends) * 8 hours = 80 hours
    expect(results).toEqual({
      Bob: {
        hoursWorked: 80,
        firstTaskStarted: dec25,
        lastTaskCompleted: jan5,
      },
    })
  })

  it("should handle tasks that only span weekend days", () => {
    const saturday = new Date("2023-12-09T09:00:00")
    const sunday = new Date("2023-12-10T17:00:00")

    const results = calcCycleTimeByAssignee({
      tasks: [
        aTaskWithCycleTime({
          dateStarted: saturday,
          dateCompleted: sunday,
          assignee: { id: "Bob", name: "Bob" },
        }),
      ],
    })

    // No hours should be counted since both days are weekends
    // This test ensures the reduce() call doesn't fail on empty hoursByDate
    expect(results).toEqual({
      Bob: {
        hoursWorked: 0,
        firstTaskStarted: saturday,
        lastTaskCompleted: sunday,
      },
    })
  })
})
