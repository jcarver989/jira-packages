import { StatusCategory } from "@jira-apis/jira-api"
import { IssueBean } from "@jira-apis/jira-api/jira-cloud"
import { Epic, statusCategoryToTaskStatus } from "../tasks"

export function mapIssueBeanToEpic(props: { issue: IssueBean }): Epic {
  const { issue } = props
  const { key, fields = {} } = issue
  const statusCategory: StatusCategory = fields.status!.statusCategory!.name!

  return {
    key: key!,
    summary: fields?.summary,
    assignee: fields?.assignee?.displayName,
    labels: fields?.labels ?? [],
    // Jira duedate field is a date string "2024-01-01"
    // without a time component :'( -- so we assume it's at the end of the day
    // and that the timezone is in the local timezone of the Jira server
    dueDate: fields?.duedate
      ? new Date(`${fields.duedate}T23:59:00`)
      : undefined,
    created: new Date(fields.created),
    status: statusCategoryToTaskStatus[statusCategory],
  }
}
