import {
  BasicAuthApi,
  getEpicsJql,
  getIssuesJql,
  Result,
  StatusCategory,
} from "@jira-apis/jira-api"
import { IssueBean } from "@jira-apis/jira-api/jira-cloud"
import { Epic, TaskWithCycleTime } from "@jira-apis/task-metrics"
import {
  defaultEpicFields,
  defaultIssueFields,
  getJiraConfig,
  getTasksWithCycleTimes,
  mapIssueBeanToEpic,
} from "@jira-apis/task-metrics/jira"
import {
  group,
  groupSingle,
  isOnOrAfter,
  isOnOrBefore,
} from "@jira-apis/task-metrics/util"
import { calcCycleTimeByAssignee } from "./calcCycleTimeByAssignee.js"

export interface CapexReportRow {
  epicKey: string
  epicName: string
  assignee: string
  hoursWorked: number
  firstTaskStarted: Date
  lastTaskCompleted: Date
}

export class CapexReport {
  constructor(private api: BasicAuthApi) {}

  async run(props: {
    projectKey: string
    capexLabel: string
    startDate: Date
    endDate: Date
  }): Promise<CapexReportRow[]> {
    const { projectKey, capexLabel, startDate, endDate } = props
    const config = await getJiraConfig({ api: this.api, projectKey })
    const epics = await this.getCapexEpics(projectKey, capexLabel)
    const issues = await this.getCapexIssues(epics.get())
    const epicKeys = epics.get().map((_) => _.key)

    if (epicKeys.length === 0) {
      throw new Error(`${projectKey} has no epics with the label ${capexLabel}`)
    }

    const tasks = await getTasksWithCycleTimes(
      this.api,
      config.get(),
      issues.get()
    )

    const filteredTasks = this.filterTasks({
      tasks: tasks.get(),
      startDate,
      endDate,
    })

    return this.generateCapexReport({
      epics: epics.get(),
      tasks: filteredTasks,
    })
  }

  private generateCapexReport(props: {
    epics: Epic[]
    tasks: TaskWithCycleTime[]
  }): CapexReportRow[] {
    const { tasks, epics } = props

    const epicsByKey = groupSingle(epics, (_) => [_.key!, _])
    const tasksByEpicKey = group(tasks, (_) => [_.parentKey!, _])

    const report: CapexReportRow[] = Object.entries(tasksByEpicKey).flatMap(
      ([epicKey, tasks]) => {
        const epic = epicsByKey[epicKey]
        const cycleTimes = calcCycleTimeByAssignee({ tasks })
        const rows = Object.entries(cycleTimes).map(
          ([
            assignee,
            { hoursWorked, firstTaskStarted, lastTaskCompleted },
          ]) => ({
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

  private filterTasks(props: {
    tasks: TaskWithCycleTime[]
    startDate: Date
    endDate: Date
  }): TaskWithCycleTime[] {
    const { tasks, startDate, endDate } = props

    const filteredTasks = tasks.flatMap((task) => {
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

    return filteredTasks
  }

  private async getCapexIssues(epics: Epic[]): Promise<Result<IssueBean[]>> {
    const epicKeys = epics.map((_) => _.key)
    const issues = await this.api.searchIssuesWithJql({
      jql: getIssuesJql()
        .parentEpic(...epicKeys)
        .status(StatusCategory.DONE, StatusCategory.IN_PROGRESS)
        .build("AND"),
      fields: defaultIssueFields,
    })

    return issues
  }

  private async getCapexEpics(
    projectKey: string,
    capexLabel: string
  ): Promise<Result<Epic[]>> {
    const capexJql = getEpicsJql()
      .projectEquals(projectKey)
      .labels(capexLabel)
      .build("AND")

    const epicIssues = await this.api.searchIssuesWithJql({
      jql: capexJql,
      fields: defaultEpicFields,
    })

    const epics = epicIssues.map((issues) =>
      issues.map((issue) => mapIssueBeanToEpic({ issue }))
    )

    return epics
  }
}
