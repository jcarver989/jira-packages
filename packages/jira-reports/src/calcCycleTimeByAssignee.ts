import { dateToString } from "@jira-apis/jira-api"
import { TaskWithCycleTime } from "@jira-apis/task-metrics"
import {
  calcCycleTimeHours,
  group,
  isAfter,
  isBefore,
  isOnOrBefore,
  plusDays,
} from "@jira-apis/task-metrics/util"

const maxHoursPerDay = 8 // naive assumption for each dev
const weekendDays = new Set([0, 6])

export interface CycleTimesByAssignee {
  [assignee: string]: {
    hoursWorked: number
    firstTaskStarted: Date
    lastTaskCompleted: Date
  }
}

/** Given a set of tasks, this function counts the total number of hours worked by assignee.
 *
 * The # of hours a tasked was worked on is estimated by subtracting the time of of the task's
 * completion date (or 'now' if the task is still in progress) from the task's start date.
 *
 *  Within a set of tasks, assignees might have multiple tasks "in progress" (WIP) simultaneously.
 *  We crudely account for this via bucketing hours worked by day across tasks, and capping the maximum
 *  credit per day, per developer to 8 hours.
 *
 *  Since tasks are also left in progress until a developer marks them complete, we do not count "weekends". "Weekends"
 *  is in quotes here because developers can live in different timezones, and we DO NOT account for this here (we don't have developer tz
 *  available in Jira).
 *
 */
export function calcCycleTimeByAssignee(props: {
  tasks: TaskWithCycleTime[]
}): CycleTimesByAssignee {
  const { tasks } = props

  const housWorkedByPersonAndDay: {
    [assigneeId: string]: {
      hoursByDate: { [date: string]: number }
      firstTaskStarted: Date
      lastTaskCompleted: Date
    }
  } = {}

  const tasksByAssignee = group(tasks, (_) => [_.assignee?.name!, _])

  Object.values(tasksByAssignee).forEach((tasks) => {
    let firstTaskStarted: Date | undefined
    let lastTaskCompleted: Date | undefined

    const sortedTasks = tasks
      .filter((task) => task.dateStarted)
      .sort((a, b) => a.dateStarted.getTime() - b.dateStarted.getTime())

    sortedTasks.forEach((task) => {
      const started = task.dateStarted
      const completed = (task.dateCompleted ?? task.resolutiondate)!
      let now = started

      if (!firstTaskStarted || isBefore(started, firstTaskStarted)) {
        firstTaskStarted = started
      }

      if (!lastTaskCompleted || isAfter(completed, lastTaskCompleted)) {
        lastTaskCompleted = completed
      }

      while (isOnOrBefore(now, completed)) {
        housWorkedByPersonAndDay[task.assignee?.name!] ||= {
          hoursByDate: {},
          firstTaskStarted,
          lastTaskCompleted,
        }

        if (!weekendDays.has(now.getDay())) {
          const dateStr = dateToString(now)

          const hours = (housWorkedByPersonAndDay[
            task.assignee?.name!!
          ].hoursByDate[dateStr] ||= 0)

          const totalHours = Math.min(
            hours + calcCycleTimeHours(now, completed),
            maxHoursPerDay
          )

          housWorkedByPersonAndDay[task.assignee?.name!].hoursByDate[dateStr] =
            totalHours
        }

        housWorkedByPersonAndDay[task.assignee?.name!].firstTaskStarted =
          firstTaskStarted

        housWorkedByPersonAndDay[task.assignee?.name!].lastTaskCompleted =
          lastTaskCompleted

        now = plusDays(now, 1)
      }
    })
  })

  const results: CycleTimesByAssignee = {}
  Object.keys(housWorkedByPersonAndDay).map((assigneeId) => {
    const { hoursByDate, firstTaskStarted, lastTaskCompleted } =
      housWorkedByPersonAndDay[assigneeId]
    const hoursWorked = Object.values(hoursByDate).reduce((a, b) => a + b, 0)
    results[assigneeId] = {
      hoursWorked,
      firstTaskStarted,
      lastTaskCompleted,
    }
  })

  return results
}
