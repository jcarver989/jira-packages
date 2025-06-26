# Jira APIs Monorepo

A collection of TypeScript packages for working with Jira data, from low-level API bindings to high-level reporting tools.

## Packages

This monorepo contains three complementary packages that work together to provide a complete solution for Jira data analysis and reporting:

### 📡 [@jira-apis/jira-api](./packages/jira-api)

**TypeScript bindings for the Jira REST API**

- Type-safe API bindings generated from Jira's official OpenAPI specifications
- JQL query builder with fluent API
- Support for both Jira Cloud and Jira Software APIs
- Built-in error handling with Result pattern
- Authentication and pagination support

```bash
npm install @jira-apis/jira-api
```

[📖 View detailed documentation](./packages/jira-api/README.md)

---

### 📊 [@jira-apis/task-metrics](./packages/task-metrics)

**Calculate cycle time metrics and task analytics**

- Framework-agnostic task representation
- Cycle time calculation with complex workflow support
- Date and time utilities for metric calculations
- Jira integration built on @jira-apis/jira-api

```bash
npm install @jira-apis/task-metrics
```

[📖 View detailed documentation](./packages/task-metrics/README.md)

---

### 📈 [@jira-apis/jira-reports](./packages/jira-reports)

**CLI tool for generating business reports from Jira data**

- CapEx (Capital Expenditure) report generation
- CSV export for analysis and integration
- Multi-project and date range filtering
- Command-line interface for automation

```bash
npm install @jira-apis/jira-reports
```

[📖 View detailed documentation](./packages/jira-reports/README.md)

## Architecture

The packages are designed to work together in a layered architecture:

```
@jira-apis/jira-reports     (CLI reporting tools)
         ↓
@jira-apis/task-metrics     (Metrics calculation)
         ↓  
@jira-apis/jira-api         (Core API bindings)
         ↓
    Jira REST APIs          (Atlassian services)
```

## Quick Start

### 1. Basic API Usage

```typescript
import { BasicAuthApi } from '@jira-apis/jira-api';

const jira = new BasicAuthApi('your-base64-token');
const boards = await jira.getAllBoards('PROJECT_KEY');
```

### 2. Calculate Task Metrics

```typescript
import { calcTaskCycleTime } from '@jira-apis/task-metrics';
import { getTasksWithCycleTimes } from '@jira-apis/task-metrics/jira';

const tasksWithMetrics = await getTasksWithCycleTimes(api, config, issues);
```

### 3. Generate Reports

```bash
npx @jira-apis/jira-reports capex-report \
  --capex-label "CAPEX-2025" \
  --project-keys "PROJ1,PROJ2" \
  --start-date "2025-01-01" \
  --end-date "2025-01-31"
```

## Development

This is a TypeScript monorepo using npm workspaces.

### Setup

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Run all tests
npm test
```

### Package Scripts

Each package includes standard scripts:

```bash
# Build a specific package
npm run build --workspace=@jira-apis/jira-api

# Test a specific package  
npm test --workspace=@jira-apis/task-metrics

# Release a package (builds and publishes)
npm run release --workspace=@jira-apis/jira-reports
```

### Project Structure

```
jira-packages/
├── packages/
│   ├── jira-api/           # Core API bindings
│   ├── task-metrics/       # Metrics calculation
│   └── jira-reports/       # CLI reporting tools
├── package.json            # Workspace configuration
└── tsconfig.base.json      # Shared TypeScript config
```

## Authentication

All packages that interact with Jira require authentication. The recommended approach is using Basic Auth with an API token:

1. Generate an API token in your Atlassian account settings
2. Create a base64-encoded string: `base64(email:api_token)`
3. Set the environment variable: `JIRA_API_TOKEN_BASIC_AUTH=your_token`

## Use Cases

- **API Integration**: Use `@jira-apis/jira-api` to build custom Jira integrations
- **Analytics**: Use `@jira-apis/task-metrics` to analyze team performance and cycle times
- **Reporting**: Use `@jira-apis/jira-reports` for business reporting and CapEx tracking
- **Data Export**: Extract Jira data for analysis in external tools

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Update documentation as needed
6. Submit a pull request

## License

All packages are licensed under the ISC License.

