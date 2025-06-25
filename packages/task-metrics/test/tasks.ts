import { StatusCategory } from "@jira-apis/jira-api"
import { IssueBean } from "@jira-apis/jira-api/jira-cloud"

const estimationFieldId = "customfield_10026"
export function anIssueBean(props: Partial<IssueBean> = {}): IssueBean {
  return {
    id: "1",
    key: "FOO-1",
    ...props,
    fields: {
      issuetype: { name: "Story" },
      assignee: { accountId: "assignee-1", displayName: "John Doe" },
      summary: "Test Issue",
      [estimationFieldId]: 3, // estimation field
      rank: "1000",
      status: {
        statusCategory: {
          name: StatusCategory.TO_DO,
        },
      },
      created: "2024-01-01T00:00:00",
      ...props.fields,
    },
  }
}
