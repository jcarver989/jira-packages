import { collectResponses, JiraApi, Result, Success } from "@jira-apis/jira-api"
import { IssueBean, IssueChangeLog } from "@jira-apis/jira-api/jira-cloud"
import { chunk } from "../util/array"

export interface IssueWithChangeLog {
  issue: IssueBean
  changeLog: IssueChangeLog
}

export async function getChangeLogsForIssues(props: {
  api: JiraApi
  issues: IssueBean[]
  batchSize?: number
}): Promise<Result<IssueWithChangeLog[]>> {
  const { api, issues, batchSize = 500 } = props

  if (issues.length === 0) {
    return new Success([])
  }

  const issueKeys = issues.map((_) => _.key!)
  const promises = chunk(issueKeys, batchSize).map((issueKeys) =>
    api.getIssueChangeLogs({ issueIdsOrKeys: issueKeys })
  )

  const results = await Promise.all(promises)
  const changeLogResponses = collectResponses(results)

  return changeLogResponses.map((changeLogs) => {
    const changeLogsByIssueId = groupIssueChangeLogByIssueId(changeLogs.flat())
    const issuesWithChangeLogs: IssueWithChangeLog[] = issues.map((issue) => ({
      issue,
      changeLog: changeLogsByIssueId[issue.id!] ?? [],
    }))

    return issuesWithChangeLogs
  })
}

function groupIssueChangeLogByIssueId(changeLogs: IssueChangeLog[]): {
  [issueId: string]: IssueChangeLog
} {
  const mergedLog: { [issueId: string]: IssueChangeLog } = {}
  changeLogs.forEach((log) => {
    const id = log.issueId!
    mergedLog[id] ||= { issueId: id, changeHistories: [] }

    const changeHistory = log.changeHistories ?? []
    changeHistory.forEach((change) =>
      mergedLog[id].changeHistories!.push(change)
    )
  })

  return mergedLog
}
