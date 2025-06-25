import { Failure, JiraApi, Result, Success } from "@jira-apis/jira-api"
import { IssueBean } from "@jira-apis/jira-api/jira-cloud"
import { calcTaskCycleTime } from "../calcTaskCycleTime"
import { TaskWithCycleTime } from "../tasks"
import { getChangeLogsForIssues } from "./getChangeLogsForIssues"
import { JiraConfig } from "./getJiraConfig"
import { mapIssueBeanToTask } from "./mapIssueBeanToTask"
import { mapIssueChangeLogToTaskStatusChanges } from "./mapIssueChangeLogToTaskStatusChanges"

export async function getTasksWithCycleTimes(
  api: JiraApi,
  config: JiraConfig,
  issues: IssueBean[]
): Promise<Result<TaskWithCycleTime[]>> {
  const issuesWithChangeLogs = await getChangeLogsForIssues({ api, issues })

  if (!issuesWithChangeLogs.ok) {
    return new Failure(issuesWithChangeLogs.error)
  }

  const { estimationFieldId, taskStartedStatusIds, taskCompletedStatusIds } =
    config

  const tasks: TaskWithCycleTime[] = issuesWithChangeLogs.data.flatMap(
    ({ issue, changeLog }) => {
      const task = mapIssueBeanToTask({ issue, estimationFieldId })
      const changes = mapIssueChangeLogToTaskStatusChanges(changeLog)
      const cycleTime = calcTaskCycleTime({
        task,
        changes,
        taskStartedStatusIds,
        taskCompletedStatusIds,
      })

      return cycleTime ? [{ ...task, ...cycleTime }] : []
    }
  )

  return new Success(tasks)
}
