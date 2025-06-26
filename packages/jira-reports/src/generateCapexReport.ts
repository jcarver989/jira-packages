import { Epic, TaskWithCycleTime } from "@jira-apis/task-metrics"
import {
  group,
  groupSingle,
  isOnOrAfter,
  isOnOrBefore,
} from "@jira-apis/task-metrics/util"
import { calcCycleTimeByAssignee } from "./calcCycleTimeByAssignee.js"

export interface ReportRow {
  epicKey: string
  epicName: string
  assignee: string
  hoursWorked: number
  firstTaskStarted: Date
  lastTaskCompleted: Date
}

export function generateCapexReport(props: {
  epics: Epic[]
  tasks: TaskWithCycleTime[]
  startDate: Date
  endDate: Date
}): ReportRow[] {
  const { epics, startDate, endDate } = props

  const tasks = props.tasks.flatMap((task) => {
    if (task.dateStarted && isOnOrAfter(task.dateStarted, startDate)) {
      const completedOrResolved =
        task.dateCompleted ?? task.resolutiondate ?? new Date()

      return [
        {
          ...task,
          // clamps end date to the end of the reporting period
          // so we don't count work in March for Feb if the end date is in Feb
          dateCompleted: isOnOrBefore(completedOrResolved, endDate)
            ? completedOrResolved
            : endDate,
          resolutiondate: undefined,
          resolution: undefined,
        },
      ]
    }

    return []
  })

  const epicsByKey = groupSingle(epics, (_) => [_.key!, _])
  const tasksByEpicKey = group(tasks, (_) => [_.parentKey!, _])

  const report: ReportRow[] = Object.entries(tasksByEpicKey).flatMap(
    ([epicKey, tasks]) => {
      const epic = epicsByKey[epicKey]
      const cycleTimes = calcCycleTimeByAssignee({ tasks })
      const rows = Object.entries(cycleTimes).map(
        ([assignee, { hoursWorked, firstTaskStarted, lastTaskCompleted }]) => ({
          epicKey,
          epicName: epic.summary,
          assignee,
          hoursWorked,
          firstTaskStarted,
          lastTaskCompleted,
        })
      )

      return rows
    }
  )

  return report
}
