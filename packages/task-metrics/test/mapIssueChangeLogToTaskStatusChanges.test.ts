import { Changelog, IssueChangeLog } from "@jira-apis/jira-api/jira-cloud"
import { describe, expect, it } from "vitest"

import { mapIssueChangeLogToTaskStatusChanges } from "../src/jira/mapIssueChangeLogToTaskStatusChanges"
import { TaskStatusChange } from "../src/tasks"

describe("mapIssueChangeLogToTaskStatusChanges", () => {
  const toDo = "To Do"
  const inProgress = "In Progress"
  const done = "Done"

  it("should return empty object for empty input", () => {
    const result = mapIssueChangeLogToTaskStatusChanges({
      issueId: "FOO-1",
      changeHistories: [],
    })
    expect(result).toEqual([])
  })

  it("should map single issue changelog correctly", () => {
    const timestamp = new Date("2024-01-01T00:00:00")
    const input: IssueChangeLog = {
      issueId: "task-1",
      changeHistories: [changeLog(timestamp, toDo, inProgress)],
    }

    const result = mapIssueChangeLogToTaskStatusChanges(input)
    expect(result).toEqual([statusChange(timestamp, toDo, inProgress)])
  })

  it("should sort changes by timestamp", () => {
    const timestamp1 = new Date("2024-01-02T00:00:00")
    const timestamp2 = new Date("2024-01-01T00:00:00")
    const input: IssueChangeLog = {
      issueId: "task-1",
      changeHistories: [
        changeLog(timestamp1, inProgress, done),
        changeLog(timestamp2, toDo, inProgress),
      ],
    }

    const result = mapIssueChangeLogToTaskStatusChanges(input)
    expect(result).toEqual([
      statusChange(timestamp2, toDo, inProgress),
      statusChange(timestamp1, inProgress, done),
    ])
  })
})

function changeLog(created: Date, from: string, to: string): Changelog {
  return {
    created,
    items: [
      {
        from,
        to,
        fromString: from,
        toString: to,
      },
    ],
  }
}

function statusChange(
  timestamp: Date,
  from: string,
  to: string
): TaskStatusChange {
  return {
    timestamp,
    from,
    to,
  }
}
