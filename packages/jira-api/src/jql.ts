import { dateToString } from "./dateToString"
import { IssueType } from "./IssueType"
import { StatusCategory } from "./StatusCategory"

export type OrderField = "Rank"
export type OrderDirection = "ASC" | "DESC"

export class JqlStatement {
  private filters: string[] = []
  private ordering: string = ""
  constructor() {}

  projectEquals(projectKey: string): this {
    this.filters.push(`project = ${projectKey}`)
    return this
  }

  status(...statusCategories: StatusCategory[]): this {
    const statuses = statusCategories.map((_) => `"${_}"`).join(", ")
    this.filters.push(`statusCategory IN (${statuses})`)
    return this
  }

  statusChangedOnOrBefore(date: Date): this {
    this.filters.push(`statusCategoryChangedDate <= ${dateToString(date)}`)
    return this
  }

  statusChangedOnOrAfter(date: Date): this {
    this.filters.push(`statusCategoryChangedDate >= ${dateToString(date)}`)
    return this
  }

  statusChangedBefore(date: Date): this {
    this.filters.push(`statusCategoryChangedDate < ${dateToString(date)}`)
    return this
  }

  statusChangedAfter(date: Date): this {
    this.filters.push(`statusCategoryChangedDate > ${dateToString(date)}`)
    return this
  }

  issueType(...issueTypes: IssueType[]): this {
    this.filters.push(`issuetype IN (${issueTypes.join(", ")})`)
    return this
  }

  parentEpic(...epicKeys: string[]): this {
    this.filters.push(`parentEpic IN (${epicKeys.join(", ")})`)
    return this
  }

  createdOnOrAfter(date: Date): this {
    this.filters.push(`created >= ${dateToString(date)}`)
    return this
  }

  orderBy(field: OrderField, direction: OrderDirection = "ASC"): this {
    this.ordering = `ORDER BY ${field} ${direction}`
    return this
  }

  labels(...labels: string[]): this {
    this.filters.push(`labels IN (${labels.join(", ")})`)
    return this
  }

  build(operator: "AND" | "OR" = "AND"): string {
    const filters = this.filters.join(`\n${operator} `)
    return [filters, this.ordering].join("\n").trim()
  }
}

export function jql(): JqlStatement {
  return new JqlStatement()
}

export function getIssuesJql(): JqlStatement {
  return jql().issueType(IssueType.BUG, IssueType.STORY, IssueType.TASK)
}

export function getEpicsJql(): JqlStatement {
  return jql().issueType(IssueType.EPIC)
}
