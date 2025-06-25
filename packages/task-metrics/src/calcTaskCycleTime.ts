import { calcCycleTimeHours } from "./util/date"
import { CycleTimeFields, Task, TaskStatusChange } from "./tasks"

const completedResolutions = new Set(["Done", "Deployed", "N/A"])
const unapplicableResolutions = new Set([
  "Duplicate",
  "No Fix",
  "Won't Fix",
  "Won't Do",
])

export function calcTaskCycleTime(props: {
  task: Task
  changes: TaskStatusChange[]
  taskStartedStatusIds: Set<string>
  taskCompletedStatusIds: Set<string>
  getTime?: () => Date
}): CycleTimeFields | undefined {
  const {
    task,
    changes,
    taskStartedStatusIds,
    taskCompletedStatusIds,
    getTime = () => new Date(),
  } = props

  if (task.resolution && unapplicableResolutions.has(task.resolution)) {
    return undefined
  }

  let cycleTimeInHours = 0
  let firstStarted: Date | undefined = undefined
  let lastStarted: Date | undefined = undefined
  let dateCompleted: Date | undefined = undefined

  for (let i = 0; i < changes.length; i++) {
    const c = changes[i]

    const movedToInProgress = taskStartedStatusIds.has(c.to)
    const movedFromInProgress = taskStartedStatusIds.has(c.from)

    const movedToComplete = taskCompletedStatusIds.has(c.to)
    const movedFromComplete = taskCompletedStatusIds.has(c.from)

    if (movedToInProgress) {
      lastStarted = c.timestamp
      if (!firstStarted) {
        firstStarted = c.timestamp
      }
    }

    if (movedFromInProgress && !(movedToInProgress || movedToComplete)) {
      cycleTimeInHours += lastStarted
        ? calcCycleTimeHours(lastStarted, c.timestamp)
        : 0
    }

    if (movedToComplete && !movedFromComplete) {
      dateCompleted = c.timestamp
      cycleTimeInHours += lastStarted
        ? calcCycleTimeHours(lastStarted, c.timestamp)
        : 0
    } else if (
      task.resolution &&
      completedResolutions.has(task.resolution) &&
      task.resolutiondate
    ) {
      dateCompleted = task.resolutiondate
      cycleTimeInHours += lastStarted
        ? calcCycleTimeHours(lastStarted, c.timestamp)
        : 0
    }
  }

  // Handle edge case where developers completed a task
  // and forgot to mark it as started -- assume task
  // started and was completed in same day
  if (!firstStarted && dateCompleted) {
    firstStarted = dateCompleted
    cycleTimeInHours = 1
  }

  if (!firstStarted) {
    return undefined
  }

  if (!dateCompleted) {
    cycleTimeInHours += lastStarted
      ? calcCycleTimeHours(lastStarted, getTime())
      : 0
  }

  return {
    dateStarted: firstStarted,
    dateCompleted,
    cycleTimeInHours,
  }
}
