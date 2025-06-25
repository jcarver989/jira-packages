import { describe, expect, it } from "vitest"
import { calcTaskCycleTime } from "../../src/calcTaskCycleTime"
import { aTask, TaskStatus, TaskStatusChange } from "../../src/tasks"
import { plusHours } from "../../src/util/date"

describe("calcTaskCycleTime", () => {
  const backlogStatus = "Backlog"

  const inProgressStatus = "In Progress"
  const inQAStatus = "In QA"

  const deployedStatus = "Deployed"
  const completedStatus = "Completed"

  const taskStartedStatusIds = new Set([inProgressStatus, inQAStatus])
  const taskCompletedStatusIds = new Set([deployedStatus, completedStatus])

  it("should return undefined for tasks that have no status changes", () => {
    const task = aTask({ status: TaskStatus.DONE })
    const changes: TaskStatusChange[] = []

    const taskWithCycleTime = calcTaskCycleTime({
      task,
      changes,
      taskStartedStatusIds,
      taskCompletedStatusIds,
    })

    expect(taskWithCycleTime).toEqual(undefined)
  })

  it("should calc 1 hour cycle time for task that was completed without being started", () => {
    const jan1 = new Date("2024-01-01T00:00:00")
    const task = aTask({ status: TaskStatus.DONE })
    const changes: TaskStatusChange[] = [
      { from: inProgressStatus, to: completedStatus, timestamp: jan1 },
    ]

    const taskWithCycleTime = calcTaskCycleTime({
      task,
      changes,
      taskStartedStatusIds,
      taskCompletedStatusIds,
    })

    expect(taskWithCycleTime).toEqual({
      dateStarted: jan1,
      dateCompleted: jan1,
      cycleTimeInHours: 1,
    })
  })

  it("should calc cycle time for task that was started and completed on different days", () => {
    const task = aTask({ status: TaskStatus.DONE })
    const jan1 = new Date("2024-01-01")
    const jan5 = new Date("2024-01-05")

    const changes: TaskStatusChange[] = [
      { from: backlogStatus, to: inProgressStatus, timestamp: jan1 },
      { from: inProgressStatus, to: completedStatus, timestamp: jan5 },
    ]

    const taskWithCycleTime = calcTaskCycleTime({
      task,
      changes,
      taskStartedStatusIds,
      taskCompletedStatusIds,
    })

    expect(taskWithCycleTime).toEqual({
      dateStarted: jan1,
      dateCompleted: jan5,
      cycleTimeInHours: 4 * 24,
    })
  })

  it("should calc cycle time for tasks that have started but not completed yet", () => {
    const task = aTask()
    const jan1 = new Date("2024-01-01T00:00:00")
    const now = new Date("2024-01-02T00:00:00")

    const changes: TaskStatusChange[] = [
      { from: backlogStatus, to: inProgressStatus, timestamp: jan1 },
    ]

    const taskWithCycleTime = calcTaskCycleTime({
      task,
      changes,
      taskStartedStatusIds,
      taskCompletedStatusIds,
      getTime: () => now,
    })

    expect(taskWithCycleTime).toEqual({
      dateStarted: jan1,
      dateCompleted: undefined,
      cycleTimeInHours: 24,
    })
  })

  it("should calc cycle time for tasks that starts, paused and starts again", () => {
    const task = aTask()
    const hour0 = new Date("2024-01-01T00:00:00")
    const hour1 = plusHours(hour0, 1)
    const hour2 = plusHours(hour0, 2)
    const hour3 = plusHours(hour0, 3)
    const hour4 = plusHours(hour0, 4)

    const changes: TaskStatusChange[] = [
      { from: backlogStatus, to: inProgressStatus, timestamp: hour0 },
      { from: inProgressStatus, to: backlogStatus, timestamp: hour1 }, // count 1 hour of work, and pause clock
      { from: backlogStatus, to: inProgressStatus, timestamp: hour3 }, // start clock again
      { from: inProgressStatus, to: completedStatus, timestamp: hour4 }, // count another 1 hour
    ]

    const taskWithCycleTime = calcTaskCycleTime({
      task,
      changes,
      taskStartedStatusIds,
      taskCompletedStatusIds,
      getTime: () => hour4,
    })

    expect(taskWithCycleTime).toEqual({
      dateStarted: hour0,
      dateCompleted: hour4,
      cycleTimeInHours: 2,
    })
  })

  it("should calc cycle time using first start date and last completed date", () => {
    const task = aTask({ status: TaskStatus.DONE })
    const jan1 = new Date("2024-01-01T00:00:00")
    const jan5 = new Date("2024-01-05T00:00:00")
    const jan11 = new Date("2024-01-11T00:00:00")
    const jan15 = new Date("2024-01-15T00:00:00")

    const changes: TaskStatusChange[] = [
      { from: backlogStatus, to: inProgressStatus, timestamp: jan1 }, // start
      { from: inProgressStatus, to: completedStatus, timestamp: jan5 }, // close after 5 days of work
      { from: completedStatus, to: inProgressStatus, timestamp: jan11 }, // reopen
      { from: inProgressStatus, to: completedStatus, timestamp: jan15 }, // close after another 5 days of work
    ]

    const taskWithCycleTime = calcTaskCycleTime({
      task,
      changes,
      taskStartedStatusIds,
      taskCompletedStatusIds,
    })

    expect(taskWithCycleTime).toEqual({
      dateStarted: jan1,
      dateCompleted: jan15,
      cycleTimeInHours: 24 * 4 + 24 * 4,
    })
  })

  it("should not overcount completed time if task is in a completed state and moves to another completed state", () => {
    const taskStartedStatusIds = new Set(["1"])
    const taskCompletedStatusIds = new Set(["2", "3"])

    const jan1 = new Date("2024-01-01")
    const jan5 = new Date("2024-01-05")
    const jan10 = new Date("2024-01-10")

    const changes: TaskStatusChange[] = [
      { from: "0", to: "1", timestamp: jan1 }, // start
      { from: "1", to: "2", timestamp: jan5 }, // completed
      { from: "2", to: "3", timestamp: jan10 }, // different completed status
    ]

    const task = aTask({ status: TaskStatus.DONE })
    const taskWithCycleTime = calcTaskCycleTime({
      task,
      changes,
      taskStartedStatusIds,
      taskCompletedStatusIds,
    })

    expect(taskWithCycleTime).toEqual({
      dateStarted: jan1,
      dateCompleted: jan5,
      cycleTimeInHours: 4 * 24,
    })
  })

  // Add this test after the existing tests
  it("should properly calculate hours when task moves directly to completed", () => {
    const task = aTask()
    const hour0 = new Date("2024-01-01T00:00:00")
    const hour2 = plusHours(hour0, 2)

    const changes: TaskStatusChange[] = [
      { from: backlogStatus, to: inProgressStatus, timestamp: hour0 },
      { from: inProgressStatus, to: completedStatus, timestamp: hour2 },
    ]

    const taskWithCycleTime = calcTaskCycleTime({
      task,
      changes,
      taskStartedStatusIds,
      taskCompletedStatusIds,
    })

    expect(taskWithCycleTime).toEqual({
      dateStarted: hour0,
      dateCompleted: hour2,
      cycleTimeInHours: 2,
    })
  })

  it("should not double count time when task moves between completed states with resolution", () => {
    const task = aTask({
      status: TaskStatus.DONE,
    })
    const jan1 = new Date("2024-01-01T00:00:00")
    const jan5 = new Date("2024-01-05T00:00:00")
    const jan10 = new Date("2024-01-10T00:00:00")

    const changes: TaskStatusChange[] = [
      { from: backlogStatus, to: inProgressStatus, timestamp: jan1 },
      { from: inProgressStatus, to: completedStatus, timestamp: jan5 },
      { from: completedStatus, to: deployedStatus, timestamp: jan10 },
    ]

    const taskWithCycleTime = calcTaskCycleTime({
      task,
      changes,
      taskStartedStatusIds,
      taskCompletedStatusIds,
    })

    expect(taskWithCycleTime).toEqual({
      dateStarted: jan1,
      dateCompleted: jan5,
      cycleTimeInHours: 4 * 24,
    })
  })
})
