import { describe, expect, it } from "vitest"

import { FakeJiraApi } from "@jira-apis/jira-api"

import { getChangeLogsForIssues } from "../../src/jira/getChangeLogsForIssues"
import { aChangeHistory, anIssueBean, anIssueChangeLog } from "../issues"

describe("getChangeLogsForIssues", () => {
  it("returns empty array when no issues provided", async () => {
    const api = new FakeJiraApi()
    const result = await getChangeLogsForIssues({ api, issues: [] })
    expect(result.get()).toEqual([])
  })

  it("retrieves and groups change logs by issue", async () => {
    const issue1 = anIssueBean({ id: "1", key: "FOO-1" })
    const issue2 = anIssueBean({ id: "2", key: "FOO-2" })
    const issues = [issue1, issue2]

    const changeLogs = [
      anIssueChangeLog({
        issueId: issue1.id,
        changeHistories: [aChangeHistory({ created: new Date("2024-01-01") })],
      }),

      anIssueChangeLog({
        issueId: issue2.id,
        changeHistories: [aChangeHistory({ created: new Date("2024-01-02") })],
      }),
    ]

    const api = new FakeJiraApi({
      issues,
      changeLogs,
    })

    const result = await getChangeLogsForIssues({ api, issues })
    const issuesWithLogs = result.get()

    expect(issuesWithLogs).toEqual([
      {
        issue: issue1,
        changeLog: changeLogs[0],
      },
      {
        issue: issue2,
        changeLog: changeLogs[1],
      },
    ])
  })

  it("respects the batch size parameter", async () => {
    const issue1 = anIssueBean({ id: "1", key: "FOO-1" })
    const issue2 = anIssueBean({ id: "2", key: "FOO-2" })

    const changeLogs = [
      anIssueChangeLog({
        issueId: issue1.id,
        changeHistories: [aChangeHistory({ created: new Date("2024-01-01") })],
      }),

      anIssueChangeLog({
        issueId: issue2.id,
        changeHistories: [aChangeHistory({ created: new Date("2024-01-02") })],
      }),
    ]

    const issues = [issue1, issue2]
    const api = new FakeJiraApi({ issues, changeLogs })

    const results = await getChangeLogsForIssues({ api, issues, batchSize: 1 })

    expect(api.apiCalls.getIssueChangeLogs).toEqual(2)
    expect(results.get()).toEqual([
      {
        issue: issue1,
        changeLog: changeLogs[0],
      },
      {
        issue: issue2,
        changeLog: changeLogs[1],
      },
    ])
  })
})
