import { describe, it, expect } from "vitest"
import { mapIssueBeanToEpic } from "../../src/jira/mapIssueBeanToEpic"
import { StatusCategory } from "@jira-apis/jira-api"
import { TaskStatus } from "../../src/tasks"
import { anIssueBean } from "../tasks"

describe("mapIssueBeanToEpic", () => {
  it("should map Jira object to epic", () => {
    const issue = anIssueBean({
      key: "epic-1",
      fields: {
        assignee: undefined,
        summary: "An Epic",
        created: new Date("2024-01-01T00:00:00"),
        duedate: "2024-03-01",
        status: {
          statusCategory: {
            name: StatusCategory.TO_DO,
          },
        },
      },
    })
    const epic = mapIssueBeanToEpic({ issue })

    expect(epic).toEqual({
      key: "epic-1",
      created: new Date("2024-01-01T00:00:00"),
      dueDate: new Date("2024-03-01T23:59:00"),
      status: TaskStatus.TO_DO,
      summary: "An Epic",
      labels: [],
    })
  })

  it("maps an issues labels", () => {
    const issue = anIssueBean({ fields: { labels: ["foo", "bar"] } })
    const epic = mapIssueBeanToEpic({ issue })
    expect(epic.labels).toEqual(["foo", "bar"])
  })

  it("transforms duedate to a datetime that represents the end of the day in the local timezone of the Jira server", () => {
    const issue = anIssueBean({
      fields: {
        labels: ["foo", "bar"],
        duedate: "2024-01-01",
      },
    })
    const epic = mapIssueBeanToEpic({ issue })
    expect(epic.dueDate).toEqual(new Date("2024-01-01T23:59:00"))
  })
})
