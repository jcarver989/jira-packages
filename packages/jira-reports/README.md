# @jira-apis/jira-reports

A CLI tool for generating CapEx (Capital Expenditure) reports from Jira data. This package helps organizations track time and effort spent on capital projects by analyzing Jira epics, tasks, and their associated work logs.

## Features

- **CapEx Report Generation**: Generate detailed reports showing time spent by assignees on specific capital projects
- **Date Range Filtering**: Filter reports by start and end dates to match reporting periods
- **Multi-Project Support**: Generate reports across multiple Jira projects simultaneously
- **CSV Output**: Export reports in CSV format for easy analysis and integration
- **Work Hour Estimation**: Intelligent calculation of work hours based on task cycle times
- **Weekend Exclusion**: Automatically excludes weekends from work hour calculations
- **WIP Task Handling**: Properly handles work-in-progress tasks by capping work to the report end date

## Installation

```bash
npm install @jira-apis/jira-reports
```

## Prerequisites

Before using this tool, you need:

1. **Jira API Token**: A Jira API token for basic authentication
2. **Environment Setup**: Set the `JIRA_API_TOKEN_BASIC_AUTH` environment variable
3. **Jira Labels**: Your epics should be labeled with CapEx labels for filtering

### Setting up Environment Variables

```bash
export JIRA_API_TOKEN_BASIC_AUTH="your_jira_api_token_here"
```

## Usage

### Command Line Interface

The package provides a `capex-report` command that can be used directly:

```bash
npx capex-report [options]
```

### Required Options

- `-l, --capex-label <label>`: CapEx label to filter epics by
- `-p, --project-keys <keys>`: Comma-separated list of Jira project keys
- `-s, --start-date <date>`: Start date in ISO format (YYYY-MM-DD)
- `-e, --end-date <date>`: End date in ISO format (YYYY-MM-DD)

### Optional Options

- `-o, --output <filename>`: Output CSV filename (default: "capex-report.csv")

### Examples

#### Basic Usage

```bash
npx capex-report \
  --capex-label "CAPEX-2025" \
  --project-keys "PROJ1,PROJ2,PROJ3" \
  --start-date "2025-01-01" \
  --end-date "2025-01-31" \
  --output "january-capex-report.csv"
```

#### Single Project Report

```bash
npx capex-report \
  --capex-label "Infrastructure" \
  --project-keys "INFRA" \
  --start-date "2025-01-01" \
  --end-date "2025-03-31" \
  --output "q1-infrastructure-report.csv"
```

### Package.json Script

You can also add it as a script in your `package.json`:

```json
{
  "scripts": {
    "capex-report": "capex-report"
  }
}
```

Then run with:

```bash
npm run capex-report -- --capex-label "CAPEX-2025" --project-keys "PROJ1" --start-date "2025-01-01" --end-date "2025-01-31"
```

## Report Output

The generated CSV report contains the following columns:

| Column | Description |
|--------|-------------|
| **Epic Key** | The Jira epic key (e.g., "PROJ-123") |
| **Epic Name** | The summary/title of the epic |
| **Assignee** | The name of the person who worked on tasks |
| **Hours Worked** | Estimated hours worked on tasks within the epic |
| **First Task Started** | Date when the first task was started |
| **Last Task Completed** | Date when the last task was completed |

### Sample Output

```csv
Epic Key, Epic Name, Assignee, Hours Worked, First Task Started, Last Task Completed
PROJ-123, User Authentication System, John Doe, 24.5, 2025-01-15, 2025-01-22
PROJ-123, User Authentication System, Jane Smith, 16.0, 2025-01-16, 2025-01-20
PROJ-456, Payment Gateway Integration, Bob Johnson, 32.0, 2025-01-10, 2025-01-25
```

## How It Works

### 1. Epic Discovery
The tool searches for epics in the specified projects that have the given CapEx label.

### 2. Task Collection
For each epic, it finds all associated tasks (stories, bugs, etc.) that are either completed or in progress.

### 3. Time Calculation
The tool calculates work hours using task cycle times:
- **Start Time**: When a task moved to "In Progress" status
- **End Time**: When a task was completed or resolved (or report end date for WIP tasks)
- **Work Days**: Excludes weekends from calculations
- **Daily Cap**: Limits work hours to 8 hours per person per day to account for parallel work

### 4. Date Filtering
Only includes work that occurred within the specified date range:
- Tasks must have started on or after the start date
- Work is only counted up to the end date (even for ongoing tasks)

### 5. Aggregation
Groups work by epic and assignee, calculating total hours and date ranges for each combination.

## Methodology

This section contains the detailed methodology for how data is calculated in the CapEx reports.

### Data Collection Process

1. **Epic Filtering**: Task data is pulled from Jira via epics labeled with the specified CapEx label (e.g., "2025-capex")

2. **Task Type Inclusion**: Only the following task types are included when counting work:
   - Story
   - Task  
   - Bug
   
   Task types such as "Investigation" are **not included** in work calculations.

3. **Time Calculation**: Since developers do not currently maintain strict timesheets, "Hours worked" per task is computed by subtracting the timestamp when a task was marked "In Progress" from the time it was marked "Done".

4. **Status Category Handling**: Different teams use different custom statuses (e.g., "Code Review", "Acceptance Testing", etc.). To account for this, the tool uses Jira's status categories, which group all custom statuses into three primary categories:
   - **To Do** - Task not yet started
   - **In Progress** - Task being worked on
   - **Done** - Task completed

5. **Overcounting Prevention**: Since developers often mark multiple tickets as "In Progress" simultaneously, simple time subtraction would result in overcounting. To account for this:
   - Each developer receives a **maximum of 8 hours "work credit" per day** across all tasks they've worked on within CapEx-labeled epics
   - **Weekend days are not credited** as developers often leave tasks marked as "In Progress" over weekends

### Assumptions and Limitations

**Naive Assumptions:**

1. **Timezone Assumption**: Developers are currently assumed to be in the same timezone. Date ranges for reporting use UTC dates.

2. **Cross-Epic Work**: A single developer is assumed to not work on tasks simultaneously across multiple epics. If they do, this methodology would overcount work hours.

**Additional Considerations:**

- The 8-hour daily cap is a conservative estimate to prevent overcounting from parallel work
- Weekend exclusion helps account for tasks left in "In Progress" status during non-working days
- Work-in-progress tasks are capped at the report end date to prevent future work from being counted in historical periods

## Programmatic Usage

You can also use the package programmatically:

```typescript
import { BasicAuthApi } from "@jira-apis/jira-api";
import { CapexReport } from "@jira-apis/jira-reports";

const api = new BasicAuthApi("your_api_token");
const capexReport = new CapexReport(api);

const results = await capexReport.run({
  projectKey: "PROJ1",
  capexLabel: "CAPEX-2025",
  startDate: new Date("2025-01-01"),
  endDate: new Date("2025-01-31")
});

console.log(results);
```

## Dependencies

This package depends on:

- **@jira-apis/jira-api**: Core Jira API functionality
- **@jira-apis/task-metrics**: Task and cycle time calculations
- **commander**: Command-line interface

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Local Development

```bash
npm run capex-report -- --help
```

## Contributing

This package is part of the jira-apis monorepo. Please refer to the main repository for contribution guidelines.

## License

Apache-2.0 