# @jira-apis/jira-api

TypeScript bindings for the Jira REST API, generated from their official OpenAPI specifications.

## Features

- **Type-safe** - Full TypeScript support with generated types from OpenAPI specs
- **Complete API Coverage** - Supports both Jira Cloud and Jira Software APIs
- **JQL Builder** - Fluent API for building Jira Query Language (JQL) statements
- **Result Pattern** - Built-in error handling with Result types
- **Pagination Support** - Automatic handling of paginated responses
- **Authentication** - Basic auth support with extensible architecture

## Installation

```bash
npm install @jira-apis/jira-api
```

## Quick Start

### Basic Authentication

```typescript
import { BasicAuthApi } from '@jira-apis/jira-api';

const jira = new BasicAuthApi('your-base64-encoded-token');

// Get all boards for a project
const boardsResult = await jira.getAllBoards('PROJECT_KEY');
if (boardsResult.ok) {
  console.log(boardsResult.data);
}
```

### JQL Query Builder

```typescript
import { jql, IssueType, StatusCategory } from '@jira-apis/jira-api';

// Build complex JQL queries with a fluent API
const query = jql()
  .projectEquals('MY_PROJECT')
  .issueType(IssueType.STORY, IssueType.BUG)
  .status(StatusCategory.IN_PROGRESS)
  .createdOnOrAfter(new Date('2024-01-01'))
  .orderBy('Rank', 'ASC')
  .build();

// Use the query with the API
const searchResult = await jira.searchIssuesWithJql({
  jql: query,
  fields: ['summary', 'status', 'assignee']
});
```

## API Reference

### JiraApi Interface

The main interface provides methods for common Jira operations:

```typescript
interface JiraApi {
  // Board operations
  getAllBoards(projectKey: string): Promise<Result<GetAllBoards200Response>>
  getBoardConfig(boardId: number): Promise<Result<BoardConfigBean>>
  
  // Issue operations
  getIssuesForSprint(boardId: number, sprintId: number, jql?: string): Promise<Result<IssueBean[]>>
  searchIssuesWithJql(body: SearchAndReconcileRequestBean): Promise<Result<IssueBean[]>>
  getIssueChangeLogs(body: BulkChangelogRequestBean): Promise<Result<IssueChangeLog[]>>
  assignIssue(issueKey: string, assigneeId: string | null): Promise<Result<void>>
  
  // Sprint operations
  getSprints(boardId: number): Promise<Result<SprintBean[]>>
  moveIssuesToBacklog(boardId: number, body: MoveIssuesToBacklogForBoardRequest): Promise<Result<void>>
  moveIssuesToSprint(sprintId: number, body: MoveIssuesToBacklogForBoardRequest): Promise<Result<void>>
  
  // Workflow operations
  getWorkflowStatuses(): Promise<Result<StatusDetails[]>>
}
```

### JQL Builder

Build type-safe JQL queries with a fluent interface:

```typescript
import { jql, IssueType, StatusCategory } from '@jira-apis/jira-api';

const query = jql()
  .projectEquals('PROJ')              // project = PROJ
  .issueType(IssueType.STORY)         // issuetype IN (Story)
  .status(StatusCategory.TO_DO)       // statusCategory IN ("To Do")
  .statusChangedOnOrAfter(new Date()) // statusCategoryChangedDate >= 2024-01-01
  .parentEpic('EPIC-1')               // parentEpic IN (EPIC-1)
  .labels('urgent', 'important')      // labels IN (urgent, important)
  .orderBy('Rank', 'DESC')            // ORDER BY Rank DESC
  .build('AND');                      // Combine with AND (default)
```

### Result Pattern

All API methods return a `Result<T>` type for consistent error handling:

```typescript
const result = await jira.getAllBoards('PROJECT');

if (result.ok) {
  // Success - access data
  console.log(result.data);
} else {
  // Error - handle failure
  console.error(result.error);
}
```

## Advanced Usage

### Direct API Access

You can also import and use the generated APIs directly:

```typescript
// Jira Cloud APIs
import { IssuesApi, Configuration } from '@jira-apis/jira-api/jira-cloud';

// Jira Software APIs  
import { BoardApi, SprintApi } from '@jira-apis/jira-api/jira-software';

const config = new Configuration({
  basePath: 'https://your-domain.atlassian.net',
  headers: {
    'Authorization': 'Basic your-token'
  }
});

const issuesApi = new IssuesApi(config);
```

### Pagination

Use the built-in pagination helper for large datasets:

```typescript
import { getPaginatedData } from '@jira-apis/jira-api';

const allData = await getPaginatedData(async (nextPageToken) => {
  return await jira.searchIssuesWithJql({
    jql: 'project = MY_PROJECT',
    nextPageToken,
    maxResults: 1000
  });
});
```

### Testing

For testing purposes, you can use the `FakeJiraApi` implementation:

```typescript
import { FakeJiraApi } from '@jira-apis/jira-api';

const fakeJira = new FakeJiraApi();
// Use in tests without making real API calls
```

## Types and Enums

The package exports commonly used types and enums:

```typescript
import { 
  IssueType,      // STORY, BUG, TASK, EPIC, etc.
  StatusCategory, // TO_DO, IN_PROGRESS, DONE
  SprintState     // CLOSED, ACTIVE, FUTURE
} from '@jira-apis/jira-api';
```

## Error Handling

All errors are wrapped in the Result pattern. API errors, network issues, and validation errors are consistently handled:

```typescript
const result = await jira.searchIssuesWithJql({ jql: 'invalid jql' });

if (!result.ok) {
  switch (result.error.name) {
    case 'ValidationError':
      console.log('Invalid JQL syntax');
      break;
    case 'AuthenticationError':
      console.log('Check your API token');
      break;
    default:
      console.log('Unexpected error:', result.error.message);
  }
}
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Code Generation

The API bindings are generated from Jira's OpenAPI specifications using:

```bash
./codegen.sh
```

## License

ISC

## Contributing

This package is generated from Jira's official OpenAPI specifications. For API-related issues, please refer to [Atlassian's Jira REST API documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/). 