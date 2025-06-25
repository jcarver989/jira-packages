import {
  BulkChangelogRequestBean,
  IssueBean,
  IssueChangeLog,
  IssueFieldsApi,
  IssuesApi,
  IssueSearchApi,
  Configuration as JiraCloudConfiguration,
  SearchAndReconcileRequestBean,
  StatusDetails,
  WorkflowStatusesApi,
} from "./generated/jira-cloud"
import {
  BacklogApi,
  BoardApi,
  BoardConfigBean,
  GetAllBoards200Response,
  Configuration as JiraSoftwareConfiguration,
  MoveIssuesToBacklogForBoardRequest,
  MoveIssuesToSprintAndRankRequest,
  SprintApi,
  SprintBean,
} from "./generated/jira-software"

import { getPaginatedData, JiraApi } from "./JiraApi"
import { Failure, Result, Success } from "./Result"

export class BasicAuthApi implements JiraApi {
  private issues: IssuesApi
  private issueFields: IssueFieldsApi
  private issueSearch: IssueSearchApi
  private board: BoardApi
  private workflowStatuses: WorkflowStatusesApi
  private backlog: BacklogApi
  private sprint: SprintApi

  constructor(apiToken: string) {
    const configParams = {
      basePath: "https://headspace.atlassian.net",
      headers: {
        Authorization: `Basic ${apiToken}`,
      },
    }

    const cloudConfig = new JiraCloudConfiguration(configParams)
    const softwareConfig = new JiraSoftwareConfiguration(configParams)

    this.issues = new IssuesApi(cloudConfig)
    this.issueFields = new IssueFieldsApi(cloudConfig)
    this.workflowStatuses = new WorkflowStatusesApi(cloudConfig)

    this.issueSearch = new IssueSearchApi(cloudConfig)
    this.board = new BoardApi(softwareConfig)
    this.backlog = new BacklogApi(softwareConfig)
    this.sprint = new SprintApi(softwareConfig)
  }

  async getAllBoards(
    projectKey: string
  ): Promise<Result<GetAllBoards200Response>> {
    try {
      const response = await this.board.getAllBoards({
        projectKeyOrId: projectKey,
      })

      return new Success(response)
    } catch (e) {
      return new Failure(e as Error)
    }
  }

  async getBoardConfig(boardId: number): Promise<Result<BoardConfigBean>> {
    try {
      const response = await this.board.getConfiguration({
        boardId,
      })

      return new Success(response)
    } catch (e) {
      return new Failure(e as Error)
    }
  }

  async moveIssuesToBacklog(
    boardId: number,
    body: MoveIssuesToBacklogForBoardRequest
  ): Promise<Result<void>> {
    try {
      await this.backlog.moveIssuesToBacklogForBoard({
        boardId,
        moveIssuesToBacklogForBoardRequest: body,
      })
      return new Success(undefined)
    } catch (e) {
      return new Failure(e as Error)
    }
  }

  async moveIssuesToSprint(
    sprintId: number,
    body: MoveIssuesToBacklogForBoardRequest
  ): Promise<Result<void>> {
    try {
      await this.sprint.moveIssuesToSprintAndRank({
        sprintId,
        moveIssuesToBacklogForBoardRequest: body,
      })
      return new Success(undefined)
    } catch (e) {
      return new Failure(e as Error)
    }
  }

  async getIssuesInBacklog(boadId: number): Promise<Result<IssueBean[]>> {
    throw new Error("Not implemented")
  }

  async getIssuesForSprint(
    boardId: number,
    sprintId: number,
    jql?: string
  ): Promise<Result<IssueBean[]>> {
    try {
      const response = await this.board.getBoardIssuesForSprint({
        boardId,
        sprintId,
        jql,
      })

      return new Success(response as unknown as IssueBean[])
    } catch (e) {
      return new Failure(e as Error)
    }
  }

  async getSprints(boardId: number): Promise<Result<SprintBean[]>> {
    throw new Error("Not implemented")
  }

  async getWorkflowStatuses(): Promise<Result<StatusDetails[]>> {
    try {
      const response = await this.workflowStatuses.getStatuses()
      return new Success(response)
    } catch (e) {
      return new Failure(e as Error)
    }
  }

  async assignIssue(
    issueKey: string,
    assigneeId: string | null
  ): Promise<Result<void>> {
    try {
      await this.issues.assignIssue({
        issueIdOrKey: issueKey,
        accountId: assigneeId,
      } as any)
      return new Success(undefined)
    } catch (e) {
      return new Failure(e as Error)
    }
  }

  async getIssueChangeLogs(
    body: BulkChangelogRequestBean
  ): Promise<Result<IssueChangeLog[]>> {
    const results = await getPaginatedData(async (nextPageToken) => {
      try {
        const response = await this.issues.getBulkChangelogs({
          bulkChangelogRequestBean: {
            ...body,
            maxResults: 1000,
            nextPageToken,
          },
        })
        const { issueChangeLogs = [] } = response
        return new Success(issueChangeLogs, response.nextPageToken)
      } catch (e) {
        return new Failure<IssueChangeLog[]>(e as Error)
      }
    })

    return results.map((_) => _.flat())
  }

  async searchIssuesWithJql(
    body: SearchAndReconcileRequestBean
  ): Promise<Result<IssueBean[]>> {
    const results = await getPaginatedData(async (nextPageToken) => {
      try {
        const response =
          await this.issueSearch.searchAndReconsileIssuesUsingJqlPost({
            searchAndReconcileRequestBean: {
              ...body,
              maxResults: 1000,
              nextPageToken,
            },
          })

        const issues = response.issues ?? []
        return new Success(issues, response.nextPageToken)
      } catch (e) {
        return new Failure<IssueBean[]>(e as Error)
      }
    })

    return results.map((data) => data.flatMap((issues) => issues ?? []))
  }
}
