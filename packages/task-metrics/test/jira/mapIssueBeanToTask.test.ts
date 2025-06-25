import { StatusCategory } from "@jira-apis/jira-api"
import { describe, expect, it } from "vitest"
import { mapIssueBeanToTask } from "../../src/jira/mapIssueBeanToTask"
import { TaskStatus } from "../../src/tasks"
import { anIssueBean } from "../tasks"

const estimationFieldId = "customfield_10026"

describe("mapIssueBeanToTask", () => {
  it("maps a basic issue to a task", () => {
    const issue = anIssueBean()
    const task = mapIssueBeanToTask({
      issue,
      estimationFieldId,
    })

    expect(task).toEqual({
      id: "1",
      key: "FOO-1",
      issueType: "Story",
      assignee: { id: "assignee-1", name: "John Doe" },
      summary: "Test Issue",
      estimate: 3,
      rank: "1000",
      created: new Date("2024-01-01T00:00:00"),
      status: TaskStatus.TO_DO,
      parentKey: undefined,
      resolution: undefined,
      resolutiondate: undefined,
      labels: [],
    })
  })

  it("maps an issues labels", () => {
    const issue = anIssueBean({ fields: { labels: ["foo", "bar"] } })
    const task = mapIssueBeanToTask({
      issue,
      estimationFieldId,
    })

    expect(task.labels).toEqual(["foo", "bar"])
  })

  it("maps a done issue with resolution details", () => {
    const issue = anIssueBean({
      fields: {
        status: {
          statusCategory: {
            name: StatusCategory.DONE,
          },
        },
        resolution: { name: "Done" },
        resolutiondate: "2024-01-02T00:00:00.000Z",
      },
    })

    const task = mapIssueBeanToTask({ issue, estimationFieldId })
    expect(task.status).toBe(TaskStatus.DONE)
    expect(task.resolution).toBe("Done")
    expect(task.resolutiondate).toEqual(new Date("2024-01-02T00:00:00.000Z"))
  })

  it("maps an issue with a parent", () => {
    const issue = anIssueBean({
      fields: {
        parent: { key: "EPIC-1" },
      },
    })

    const task = mapIssueBeanToTask({ issue, estimationFieldId })
    expect(task.parentKey).toBe("EPIC-1")
  })
})
