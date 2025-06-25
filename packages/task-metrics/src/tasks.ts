/** Internal represntation of a "task", should be abstracted from Jira, Asana...whatever */

import { IssueType, StatusCategory } from "@jira-apis/jira-api"
import { calcCycleTimeHours } from "./util"

export interface Task {
  id: string
  key: string
  issueType: IssueType
  summary: string
  assignee?: { id: string; name: string }
  created: Date
  estimate?: number
  parentKey?: string
  rank?: number
  status: TaskStatus
  resolution?: string
  resolutiondate?: Date
  labels: string[]
}

export type SelectableTask = Task & {
  checked?: boolean
}

export enum TaskStatus {
  TO_DO = "To Do",
  IN_PROGRESS = "In Progress",
  DONE = "Done",
}

export const statusCategoryToTaskStatus: {
  [key in StatusCategory]: TaskStatus
} = {
  [StatusCategory.TO_DO]: TaskStatus.TO_DO,
  [StatusCategory.IN_PROGRESS]: TaskStatus.IN_PROGRESS,
  [StatusCategory.DONE]: TaskStatus.DONE,
}

export type TaskWithCycleTime = Task & CycleTimeFields

export interface Epic {
  key: string
  summary: string
  status: TaskStatus
  created: Date
  assignee?: string
  dueDate?: Date
  labels: string[]
}

export type EpicWithCycleTimeFields = Epic & CycleTimeFields

export interface CycleTimeFields {
  dateStarted: Date
  dateCompleted?: Date
  cycleTimeInHours: number
}

export interface TaskStatusChange {
  timestamp: Date
  from: string
  to: string
}

export function aTask<T extends TaskStatus>(
  props: Partial<Task & { status: T }> = {}
): Task {
  return {
    id: "1",
    key: "FOO-1",
    issueType: IssueType.STORY,
    summary: "A ticket",
    assignee: { id: "assignee-1", name: "Assignee 1" },
    estimate: 1,
    status: TaskStatus.TO_DO,
    created: new Date("2024-01-01T00:00:00"),
    labels: [],
    ...props,
  }
}

export function aTaskWithCycleTime(
  props: Partial<TaskWithCycleTime> = {}
): TaskWithCycleTime {
  const dateStarted = Object.hasOwn(props, "dateStarted")
    ? props.dateStarted
    : new Date("2024-01-01T00:00:00")

  const dateCompleted = Object.hasOwn(props, "dateCompleted")
    ? props.dateCompleted
    : new Date("2024-01-02T02:00:00")

  const cycleTimeEnd = dateCompleted ?? props.resolutiondate

  const cycleTimeInHours =
    props?.cycleTimeInHours ??
    (dateStarted && cycleTimeEnd
      ? calcCycleTimeHours(dateStarted, cycleTimeEnd)
      : 0)

  return {
    ...aTask(),
    status: TaskStatus.DONE,
    ...props,
    dateStarted: dateStarted!,
    dateCompleted,
    cycleTimeInHours,
  }
}

export function anEpic(props: Partial<Epic> = {}): Epic {
  return {
    key: "EPIC-1",
    summary: "An epic",
    status: TaskStatus.TO_DO,
    created: new Date("2024-01-01T00:00:00"),
    labels: [],
    ...props,
  }
}

export function aCompletedEpic(
  props: Partial<EpicWithCycleTimeFields> = {}
): EpicWithCycleTimeFields {
  return {
    ...anEpic(),
    status: TaskStatus.DONE,
    dateStarted: new Date("2024-01-01"),
    dateCompleted: new Date("2024-01-02"),
    cycleTimeInHours: 2,
  }
}
