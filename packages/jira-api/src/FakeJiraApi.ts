import {
  BulkChangelogRequestBean,
  IssueBean,
  IssueChangeLog,
  SearchAndReconcileRequestBean,
  StatusDetails,
} from "./generated/jira-cloud"
import {
  BoardConfigBean,
  GetAllBoards200Response,
  GetAllBoards200ResponseValuesInner,
  MoveIssuesToBacklogForBoardRequest,
  SprintBean,
} from "./generated/jira-software"
import { JiraApi } from "./JiraApi"
import { Result, Success } from "./Result"

export interface FakeJiraApiProps {
  boards?: GetAllBoards200ResponseValuesInner[]
  boardConfigs?: Map<number, BoardConfigBean>
  statuses?: StatusDetails[]
  issues?: IssueBean[]
  sprints?: Map<number, SprintBean[]>
  changeLogs?: IssueChangeLog[]
}

export class FakeJiraApi implements JiraApi {
  public readonly apiCalls: { [key in keyof JiraApi]: number } = {
    getAllBoards: 0,
    getBoardConfig: 0,
    getIssueChangeLogs: 0,
    getIssuesForSprint: 0,
    getIssuesInBacklog: 0,
    getSprints: 0,
    getWorkflowStatuses: 0,
    searchIssuesWithJql: 0,
    moveIssuesToBacklog: 0,
    moveIssuesToSprint: 0,
    assignIssue: 0,
  }

  private boards: GetAllBoards200ResponseValuesInner[]
  private boardConfigs: Map<number, BoardConfigBean>
  private statuses: StatusDetails[]
  private issues: IssueBean[]
  private sprints: Map<number, SprintBean[]>
  private changeLogs: IssueChangeLog[]

  constructor(props: FakeJiraApiProps = {}) {
    const {
      boards = [],
      boardConfigs = new Map(),
      statuses = [],
      issues = [],
      sprints = new Map(),
      changeLogs = [],
    } = props

    this.boards = boards
    this.boardConfigs = boardConfigs
    this.statuses = statuses
    this.issues = issues
    this.sprints = sprints
    this.changeLogs = changeLogs
  }

  async getAllBoards(
    projectKey: string
  ): Promise<Result<GetAllBoards200Response>> {
    this.apiCalls.getAllBoards += 1
    return new Success({ values: this.boards })
  }

  async getBoardConfig(boardId: number): Promise<Result<BoardConfigBean>> {
    const config = this.boardConfigs.get(boardId)
    this.apiCalls.getBoardConfig += 1
    return new Success(config || ({} as BoardConfigBean))
  }

  async getWorkflowStatuses(): Promise<Result<StatusDetails[]>> {
    this.apiCalls.getWorkflowStatuses += 1
    return new Success(this.statuses)
  }

  async getIssuesInBacklog(boardId: number): Promise<Result<IssueBean[]>> {
    this.apiCalls.getIssuesInBacklog += 1
    return new Success(this.issues.filter((issue) => !issue.fields?.sprint))
  }

  async getSprints(boardId: number): Promise<Result<SprintBean[]>> {
    this.apiCalls.getSprints += 1
    return new Success(this.sprints.get(boardId) || [])
  }

  async getIssuesForSprint(
    boardId: number,
    sprintId: number,
    jql?: string
  ): Promise<Result<IssueBean[]>> {
    const sprintIssues = this.issues.filter(
      (issue) => issue.fields?.sprint?.id === sprintId
    )
    this.apiCalls.getIssuesForSprint += 1
    return new Success(sprintIssues)
  }

  async searchIssuesWithJql(
    body: SearchAndReconcileRequestBean
  ): Promise<Result<IssueBean[]>> {
    this.apiCalls.searchIssuesWithJql += 1
    return new Success(this.issues)
  }

  async getIssueChangeLogs(
    body: BulkChangelogRequestBean
  ): Promise<Result<IssueChangeLog[]>> {
    const keysOrIdsSet = new Set(body.issueIdsOrKeys)
    const ids = this.issues
      .filter(
        (_) => keysOrIdsSet.has(_.id ?? "") || keysOrIdsSet.has(_.key ?? "")
      )
      .map((_) => _.id!)

    const idsSet = new Set(ids)
    const logs = this.changeLogs.filter((_) => idsSet.has(_.issueId ?? ""))
    this.apiCalls.getIssueChangeLogs += 1
    return new Success(logs)
  }

  async moveIssuesToBacklog(
    boardId: number,
    body: MoveIssuesToBacklogForBoardRequest
  ): Promise<Result<void>> {
    this.apiCalls.moveIssuesToBacklog += 1
    return new Success(undefined)
  }

  async moveIssuesToSprint(
    sprintId: number,
    body: MoveIssuesToBacklogForBoardRequest
  ): Promise<Result<void>> {
    this.apiCalls.moveIssuesToSprint += 1
    return new Success(undefined)
  }

  async assignIssue(
    issueKey: string,
    assigneeId: string | null
  ): Promise<Result<void>> {
    this.apiCalls.assignIssue += 1
    return new Success(undefined)
  }
}
