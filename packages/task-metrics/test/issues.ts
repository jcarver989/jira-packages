import {
  Changelog,
  IssueBean,
  IssueChangeLog,
} from "@jira-apis/jira-api/jira-cloud"

export function anIssueBean(props: Partial<IssueBean> = {}): IssueBean {
  return {
    id: "issue-1",
    key: "TEST-1",
    ...props,
  }
}

export function aChangeHistory(props: Partial<Changelog> = {}): Changelog {
  return {
    id: "change-1",
    author: { accountId: "user-1" },
    created: new Date("2024-01-01T00:00:00.000Z"),
    items: [
      {
        from: "Backlog",
        to: "To Do",
        fromString: "Backlog",
        toString: "To Do",
      },
    ],
    ...props,
  }
}

export function anIssueChangeLog(
  props: Partial<IssueChangeLog> = {}
): IssueChangeLog {
  return {
    issueId: "issue-1",
    changeHistories: [aChangeHistory()],
    ...props,
  }
}
