#!/usr/bin/env node

import { BasicAuthApi, dateToString } from "@jira-apis/jira-api"
import { writeFileSync } from "fs"
import { CapexReport, CapexReportRow } from "./CapexReport.js"
import { getEnvVar } from "./getEnvVar.js"
import { Command } from "commander"

const program = new Command()

program
  .name("capex-report")
  .description("Generate a CapEx report from Jira data")
  .version("1.0.0")
  .requiredOption("-l, --capex-label <label>", "CapEx label to filter by")
  .requiredOption(
    "-p, --project-keys <keys>",
    "Comma-separated list of project keys"
  )
  .requiredOption(
    "-s, --start-date <date>",
    "Start date (ISO format: YYYY-MM-DD)"
  )
  .requiredOption("-e, --end-date <date>", "End date (ISO format: YYYY-MM-DD)")
  .option("-o, --output <filename>", "Output CSV filename", "capex-report.csv")

async function main() {
  program.parse()
  const options = program.opts()

  const capexLabel: string = options.capexLabel
  const projectKeys: string[] = options.projectKeys
    .split(",")
    .map((key: string) => key.trim())
  const startDate = new Date(`${options.startDate}T00:00:00Z`)
  const endDate = new Date(`${options.endDate}T00:00:00Z`)
  const outputFile: string = options.output

  // Validate dates
  if (isNaN(startDate.getTime())) {
    console.error(
      `Invalid start date: ${options.startDate}. Please use YYYY-MM-DD format.`
    )
    process.exit(1)
  }

  if (isNaN(endDate.getTime())) {
    console.error(
      `Invalid end date: ${options.endDate}. Please use YYYY-MM-DD format.`
    )
    process.exit(1)
  }

  if (startDate >= endDate) {
    console.error("Start date must be before end date.")
    process.exit(1)
  }

  console.log(`Generating CapEx report with:`)
  console.log(`  Label: ${capexLabel}`)
  console.log(`  Projects: ${projectKeys.join(", ")}`)
  console.log(`  Date range: ${options.startDate} to ${options.endDate}`)
  console.log(`  Output: ${outputFile}`)

  const apiKey = getEnvVar("JIRA_API_TOKEN_BASIC_AUTH")
  const api = new BasicAuthApi(apiKey)
  const capexReport = new CapexReport(api)

  const promises = projectKeys.map((key) =>
    capexReport.run({ projectKey: key, capexLabel, startDate, endDate })
  )
  const reportRows = await Promise.all(promises)

  const headerRow = [
    "Epic Key",
    "Epic Name",
    "Assignee",
    "Hours Worked",
    "First Task Started",
    "Last Task Completed",
  ]

  const csvRows = reportRows
    .flat()
    .filter(
      (row: CapexReportRow) =>
        row.assignee !== undefined && row.assignee !== "undefined"
    ) // should move into report class
    .map((row: CapexReportRow) =>
      [
        row.epicKey,
        row.epicName,
        row.assignee,
        row.hoursWorked,
        dateToString(row.firstTaskStarted),
        dateToString(row.lastTaskCompleted),
      ].join(", ")
    )

  const report = [headerRow.join(", "), ...csvRows].join("\n")
  writeFileSync(outputFile, report, { encoding: "utf-8" })

  console.log(`\nReport generated successfully: ${outputFile}`)
  console.log(`Total rows: ${csvRows.length}`)
}

main().catch((error) => {
  console.error("Error generating report:", error)
  process.exit(1)
})
