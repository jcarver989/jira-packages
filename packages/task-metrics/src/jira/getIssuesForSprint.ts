import { collectResponses, Failure, JiraApi, Result } from "@jira-apis/jira-api"
import { IssueBean } from "@jira-apis/jira-api/jira-cloud"
import { SprintBean } from "@jira-apis/jira-api/jira-software"

export interface SprintWithIssues {
  sprint: SprintBean
  issues: IssueBean[]
}

export async function getIssuesForSprint(props: {
  api: JiraApi
  boardId: number
  sprint: SprintBean
}): Promise<Result<SprintWithIssues>> {
  const { api, boardId, sprint } = props
  const issues = await api.getIssuesForSprint(boardId, sprint.id!)
  return issues.map((issues) => ({ sprint, issues }))
}

export async function getSprintsForBoard(props: {
  api: JiraApi
  boardId: number
}): Promise<Result<SprintWithIssues[]>> {
  const { api, boardId } = props
  const sprints = await api.getSprints(boardId)

  if (!sprints.ok) {
    return new Failure(sprints.error)
  }

  const promises = sprints.data.map(async (sprint) =>
    getIssuesForSprint({ api, boardId, sprint })
  )

  const results = await Promise.all(promises)
  return collectResponses(results)
}
