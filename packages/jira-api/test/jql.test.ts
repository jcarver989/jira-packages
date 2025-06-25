import { describe, it, expect } from "vitest"
import { jql } from "../src/jql"
import { IssueType } from "../src/IssueType"
import { StatusCategory } from "../src/StatusCategory"

describe("JQL Builder", () => {
  it("should build a simple project query", () => {
    const query = jql().projectEquals("TEST").build()
    expect(query).toBe("project = TEST")
  })

  it("should combine multiple filters with AND", () => {
    const query = jql()
      .projectEquals("TEST")
      .issueType(IssueType.STORY)
      .build("AND")
    expect(query).toBe(
      ["project = TEST", "AND issuetype IN (Story)"].join("\n")
    )
  })

  it("should combine multiple filters with OR", () => {
    const query = jql()
      .projectEquals("TEST")
      .issueType(IssueType.STORY)
      .build("OR")
    expect(query).toBe(["project = TEST", "OR issuetype IN (Story)"].join("\n"))
  })

  it("should filter by status categories", () => {
    const query = jql()
      .status(StatusCategory.TO_DO, StatusCategory.IN_PROGRESS)
      .build("AND")
    expect(query).toBe('statusCategory IN ("To Do", "In Progress")')
  })

  it("should handle date filters", () => {
    const date = new Date("2024-01-01")
    const query = jql()
      .statusChangedOnOrAfter(date)
      .statusChangedBefore(date)
      .build("AND")
    expect(query).toBe(
      [
        "statusCategoryChangedDate >= 2024-01-01",
        "AND statusCategoryChangedDate < 2024-01-01",
      ].join("\n")
    )
  })

  it("should handle ordering", () => {
    const query = jql()
      .projectEquals("TEST")
      .orderBy("Rank", "DESC")
      .build("AND")
    expect(query).toBe(["project = TEST", "ORDER BY Rank DESC"].join("\n"))
  })

  it("should handle labels", () => {
    const query = jql().labels("important", "urgent").build("AND")
    expect(query).toBe("labels IN (important, urgent)")
  })

  it("should handle parent epics", () => {
    const query = jql().parentEpic("EPIC-1", "EPIC-2").build("AND")
    expect(query).toBe("parentEpic IN (EPIC-1, EPIC-2)")
  })

  it("should handle complex queries", () => {
    const date = new Date("2024-01-01")
    const query = jql()
      .projectEquals("TEST")
      .issueType(IssueType.STORY)
      .status(StatusCategory.TO_DO)
      .createdOnOrAfter(date)
      .labels("important")
      .orderBy("Rank", "ASC")
      .build("AND")

    expect(query).toBe(
      "project = TEST\n" +
        "AND issuetype IN (Story)\n" +
        'AND statusCategory IN ("To Do")\n' +
        "AND created >= 2024-01-01\n" +
        "AND labels IN (important)\n" +
        "ORDER BY Rank ASC"
    )
  })
})
