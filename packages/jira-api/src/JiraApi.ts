import {
  BulkChangelogRequestBean,
  IssueBean,
  IssueChangeLog,
  SearchAndReconcileRequestBean,
  StatusDetails,
} from "./generated/jira-cloud/index"
import {
  BoardConfigBean,
  GetAllBoards200Response,
  MoveIssuesToBacklogForBoardRequest,
  SprintBean,
} from "./generated/jira-software/index"
import { Failure, Result, Success } from "./Result"

export interface JiraApi {
  getAllBoards(projectKey: string): Promise<Result<GetAllBoards200Response>>
  getBoardConfig(boardId: number): Promise<Result<BoardConfigBean>>
  getWorkflowStatuses(): Promise<Result<StatusDetails[]>>
  getIssuesInBacklog(boadId: number): Promise<Result<IssueBean[]>>
  getSprints(boardId: number): Promise<Result<SprintBean[]>>

  getIssuesForSprint(
    boardId: number,
    sprintId: number,
    jql?: string
  ): Promise<Result<IssueBean[]>>

  searchIssuesWithJql(
    body: SearchAndReconcileRequestBean
  ): Promise<Result<IssueBean[]>>

  getIssueChangeLogs(
    body: BulkChangelogRequestBean
  ): Promise<Result<IssueChangeLog[]>>

  moveIssuesToBacklog(
    boardId: number,
    body: MoveIssuesToBacklogForBoardRequest
  ): Promise<Result<void>>

  moveIssuesToSprint(
    sprintId: number,
    body: MoveIssuesToBacklogForBoardRequest
  ): Promise<Result<void>>

  assignIssue(
    issueKey: string,
    assigneeId: string | null
  ): Promise<Result<void>>
}

export async function getPaginatedData<T>(
  getData: (nextPageToken?: string) => Promise<Result<T>>
): Promise<Result<T[]>> {
  let done = false
  let nextPageToken: string | undefined = undefined
  const data: T[] = []

  while (!done) {
    const response = await getData(nextPageToken)
    if (!response.ok) {
      return new Failure(response.error)
    }

    data.push(response.data)

    if (response.nextPageToken) {
      nextPageToken = response.nextPageToken
    } else {
      done = true
    }
  }

  return new Success(data)
}

export function getNextStartAt(
  startAt: number,
  totalItems: number,
  nItemsReturned: number
): string | undefined {
  const remaining = totalItems - (startAt + nItemsReturned)
  return remaining > 0 ? (startAt + (nItemsReturned - 1)).toString() : undefined
}
