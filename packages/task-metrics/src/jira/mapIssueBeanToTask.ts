import { StatusCategory } from "@jira-apis/jira-api"
import { statusCategoryToTaskStatus, Task } from "../tasks"
import { IssueBean } from "@jira-apis/jira-api/jira-cloud"

export function mapIssueBeanToTask(props: {
  issue: IssueBean
  estimationFieldId?: string
}): Task {
  const { issue, estimationFieldId } = props
  const { fields = {} } = issue
  const statusCategory: StatusCategory = fields.status!.statusCategory!.name!
  return {
    id: issue.id!,
    key: issue.key!,
    issueType: fields.issuetype?.name,
    assignee: fields.assignee?.accountId
      ? { id: fields.assignee.accountId, name: fields.assignee?.displayName }
      : undefined,
    summary: fields.summary!,
    estimate: estimationFieldId ? fields![estimationFieldId] : undefined,
    rank: fields.rank!,
    labels: fields.labels ?? [],
    parentKey: fields?.parent?.key,
    created: new Date(fields.created),
    status: statusCategoryToTaskStatus[statusCategory],
    resolution: fields?.resolution?.name,
    resolutiondate: fields?.resolutiondate
      ? new Date(fields.resolutiondate)
      : undefined,
  }
}
