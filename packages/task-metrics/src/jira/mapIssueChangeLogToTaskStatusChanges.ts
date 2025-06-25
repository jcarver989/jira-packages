import { IssueChangeLog } from "@jira-apis/jira-api/jira-cloud"
import { TaskStatusChange } from "../tasks"

export function mapIssueChangeLogToTaskStatusChanges(
  changeLog: IssueChangeLog
): TaskStatusChange[] {
  const { changeHistories = [] } = changeLog
  changeHistories.sort(
    (a, b) => new Date(a.created!).getTime() - new Date(b.created!).getTime()
  )

  return changeHistories.map((change) => {
    const timestamp = new Date(change.created!)
    const { to, from } = change.items![0]
    return {
      timestamp,
      from: from!,
      to: to!,
    }
  })
}
