import { BasicAuthApi } from "@jira-apis/jira-api"
import { inspect } from "util"
import { getEnvVar } from "./getEnvVar.js"
import { writeFileSync } from "fs"

export async function main() {
  const apiKey = getEnvVar("JIRA_API_TOKEN_BASIC_AUTH")
  const api = new BasicAuthApi(apiKey)
  const result = await api.getWorkflowStatuses()

  const statuses = result.get()

  const categories = new Set<string>()
  statuses.forEach((s) => {
    if (s.statusCategory) {
      categories.add(s.statusCategory.name!)
    } else {
      console.log(s)
    }
  })

  console.log(Array.from(categories))

  writeFileSync("./statuses.json", JSON.stringify(statuses), {
    encoding: "utf-8",
  })
}

main()
