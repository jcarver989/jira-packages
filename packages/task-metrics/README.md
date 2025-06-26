# @jira-apis/task-metrics

A TypeScript library for calculating cycle time metrics from Jira tasks and other project management tools.

## Overview

This package provides utilities to:
- Calculate cycle times for tasks and epics
- Map Jira issues to internal task representations
- Track task status changes and transitions
- Provide date/time utilities for metric calculations
- Abstract task metrics from specific project management tools

## Installation

```bash
npm install @jira-apis/task-metrics
```

## Usage

### Basic Task Cycle Time Calculation

```typescript
import { calcTaskCycleTime, Task, TaskStatusChange } from '@jira-apis/task-metrics';

const task: Task = {
  id: "1",
  key: "PROJ-123",
  issueType: IssueType.STORY,
  summary: "Implement feature X",
  status: TaskStatus.DONE,
  created: new Date("2024-01-01"),
  labels: []
};

const statusChanges: TaskStatusChange[] = [
  { from: "To Do", to: "In Progress", timestamp: new Date("2024-01-01T09:00:00") },
  { from: "In Progress", to: "Done", timestamp: new Date("2024-01-03T17:00:00") }
];

const taskStartedStatusIds = new Set(["In Progress", "In Review"]);
const taskCompletedStatusIds = new Set(["Done", "Deployed"]);

const cycleTime = calcTaskCycleTime({
  task,
  changes: statusChanges,
  taskStartedStatusIds,
  taskCompletedStatusIds
});

console.log(cycleTime);
// Output: { dateStarted: Date, dateCompleted: Date, cycleTimeInHours: 56 }
```

### Working with Jira Integration

```typescript
import { getTasksWithCycleTimes, getJiraConfig } from '@jira-apis/task-metrics/jira';
import { JiraApi } from '@jira-apis/jira-api';

const api = new JiraApi(/* config */);
const config = await getJiraConfig(api);
const issues = /* fetch issues from Jira */;

const tasksWithCycleTimes = await getTasksWithCycleTimes(api, config, issues);

if (tasksWithCycleTimes.ok) {
  tasksWithCycleTimes.data.forEach(task => {
    console.log(`${task.key}: ${task.cycleTimeInHours} hours`);
  });
}
```

### Date Utilities

```typescript
import { calcCycleTimeHours, calcCycleTimeDays, plusDays } from '@jira-apis/task-metrics/util';

const startDate = new Date("2024-01-01");
const endDate = new Date("2024-01-05");

const hoursWorked = calcCycleTimeHours(startDate, endDate);
const daysWorked = calcCycleTimeDays(startDate, endDate);
const nextWeek = plusDays(startDate, 7);
```

## API Reference

### Core Types

#### `Task`
Represents an internal task abstracted from any project management tool:
- `id: string` - Unique identifier
- `key: string` - Human-readable key (e.g., "PROJ-123")
- `issueType: IssueType` - Type of issue (Story, Bug, Epic, etc.)
- `summary: string` - Task description
- `assignee?: { id: string; name: string }` - Assigned user
- `created: Date` - Creation date
- `status: TaskStatus` - Current status
- `labels: string[]` - Associated labels

#### `TaskWithCycleTime`
Extends `Task` with cycle time metrics:
- `dateStarted: Date` - When work began
- `dateCompleted?: Date` - When work finished (if completed)
- `cycleTimeInHours: number` - Total cycle time in hours

#### `TaskStatus`
Enum with standard task states:
- `TO_DO` - "To Do"
- `IN_PROGRESS` - "In Progress" 
- `DONE` - "Done"

### Core Functions

#### `calcTaskCycleTime(props)`
Calculates cycle time for a task based on status changes.

**Parameters:**
- `task: Task` - The task to calculate cycle time for
- `changes: TaskStatusChange[]` - Array of status transitions
- `taskStartedStatusIds: Set<string>` - Status IDs that indicate work has started
- `taskCompletedStatusIds: Set<string>` - Status IDs that indicate work is complete
- `getTime?: () => Date` - Optional function to get current time (for testing)

**Returns:** `CycleTimeFields | undefined`

### Jira Integration (`/jira` export)

#### `getTasksWithCycleTimes(api, config, issues)`
Retrieves tasks with calculated cycle times from Jira issues.

#### `mapIssueBeanToTask({ issue, estimationFieldId })`
Maps a Jira issue to the internal Task representation.

#### `getChangeLogsForIssues({ api, issues })`
Fetches change logs for Jira issues to track status transitions.

### Utilities (`/util` export)

#### Date Functions
- `calcCycleTimeHours(startDate, endDate)` - Calculate hours between dates
- `calcCycleTimeDays(startDate, endDate)` - Calculate days between dates
- `isSameDay(a, b)` - Check if dates are on same day
- `plusDays(date, days)` - Add days to a date
- `minusDays(date, days)` - Subtract days from a date
- `plusHours(date, hours)` - Add hours to a date
- `minusHours(date, hours)` - Subtract hours from a date

#### Array Functions
- Various utility functions for array manipulation

## Features

- **Framework Agnostic**: Abstract task representation works with any project management tool
- **Flexible Cycle Time Calculation**: Handles complex workflows with pauses, reopens, and multiple status transitions
- **Jira Integration**: Built-in support for Jira Cloud via `@jira-apis/jira-api`
- **TypeScript Support**: Full type safety with comprehensive type definitions
- **Comprehensive Testing**: Well-tested with Vitest

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test -- --watch
```

## License

ISC

## Dependencies

- `@jira-apis/jira-api` - Jira API integration

## Package Exports

This package provides multiple entry points:

- Main: Core task and cycle time functionality
- `/util`: Date and array utilities
- `/jira`: Jira-specific integration functions 