import {
  Failure,
  JiraApi,
  Result,
  StatusCategory,
  Success,
} from "@jira-apis/jira-api"

export interface JiraConfig {
  projectKey: string
  boardId: number
  estimationFieldId: string
  taskStartedStatusIds: Set<string>
  taskCompletedStatusIds: Set<string>
}

export interface GetJiraConfigProps {
  api: JiraApi
  projectKey: string
}

export async function getJiraConfig(
  props: GetJiraConfigProps
): Promise<Result<JiraConfig>> {
  const { api, projectKey } = props
  const boards = await api.getAllBoards(projectKey)
  const boardId = boards.map((_) => _.values![0].id!)

  if (!boardId.ok) {
    return new Failure(boardId.error)
  }

  const [estimationFieldResponse, statusesResponse] = await Promise.all([
    getEstimationFieldId(api, boardId.data),
    getIssueStatuses(api),
  ])

  if (!estimationFieldResponse.ok) {
    return new Failure(estimationFieldResponse.error)
  }

  if (!statusesResponse.ok) {
    return new Failure(statusesResponse.error)
  }

  const estimationFieldId = estimationFieldResponse.data
  const { taskStartedStatusIds, taskCompletedStatusIds } = statusesResponse.data

  return new Success({
    projectKey,
    boardId: boardId.data,
    estimationFieldId: estimationFieldId!,
    taskStartedStatusIds: new Set(taskStartedStatusIds),
    taskCompletedStatusIds: new Set(taskCompletedStatusIds),
  })
}

async function getEstimationFieldId(
  jiraApi: JiraApi,
  boardId: number
): Promise<Result<string | undefined>> {
  const response = await jiraApi.getBoardConfig(boardId)
  return response.map((_) => _.estimation?.field?.fieldId)
}

async function getIssueStatuses(jiraApi: JiraApi) {
  const workflowStausesResponse = await jiraApi.getWorkflowStatuses()
  const response = workflowStausesResponse.map((statuses) => {
    const taskStartedStatusIds: string[] = []
    const taskCompletedStatusIds: string[] = []

    statuses.forEach(({ id, statusCategory }) => {
      if (id && statusCategory?.name === StatusCategory.IN_PROGRESS) {
        taskStartedStatusIds.push(id)
      } else if (id && statusCategory?.name === StatusCategory.DONE) {
        taskCompletedStatusIds.push(id)
      }
    })

    return { taskStartedStatusIds, taskCompletedStatusIds }
  })

  return response
}
