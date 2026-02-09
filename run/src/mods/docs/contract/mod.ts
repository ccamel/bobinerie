import { existsSync, readFileSync, writeFileSync } from "node:fs"
import process from "node:process"
import { Project } from "ts-morph"

const contract = process.env.CONTRACT
const publishedScenarioTag = process.env.DOC_SCENARIO_TAG ?? "@public-doc"

if (!contract) throw new Error("CONTRACT environment variable required")

const srcPath = `./contracts/${contract}/src/mods/mod.ts`
const readmePath = `./contracts/${contract}/README.md`
const deploymentPath = "./deployment.json"
const featurePath = `./contracts/${contract}/contract.feature`

const project = new Project()
const sourceFile = project.addSourceFileAtPath(srcPath)

type ScenarioDoc = {
  name: string
  tags: string[]
  body: string[]
}

type FeatureDoc = {
  name: string
  description: string
  background: string[]
  scenarios: ScenarioDoc[]
}

function parseFeatureFile(content: string): FeatureDoc | undefined {
  const lines = content.split(/\r?\n/)

  let featureName = ""
  const featureDescription: string[] = []
  const background: string[] = []
  const scenarios: ScenarioDoc[] = []

  let section: "feature" | "background" | "scenario" | undefined
  let pendingTags: string[] = []
  let currentScenario: ScenarioDoc | undefined

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith("#")) continue

    if (trimmed.startsWith("@")) {
      const tags = trimmed.split(/\s+/).filter((token) => token.startsWith("@"))
      pendingTags = [...new Set([...pendingTags, ...tags])]
      continue
    }

    const featureMatch = trimmed.match(/^Feature:\s*(.+)$/)
    if (featureMatch) {
      featureName = featureMatch[1]?.trim() ?? ""
      section = "feature"
      currentScenario = undefined
      pendingTags = []
      continue
    }

    if (trimmed.startsWith("Background:")) {
      section = "background"
      currentScenario = undefined
      pendingTags = []
      continue
    }

    const scenarioMatch = trimmed.match(/^(Scenario(?: Outline)?):\s*(.+)$/)
    if (scenarioMatch) {
      const scenario: ScenarioDoc = {
        name: scenarioMatch[2]?.trim() ?? "Unnamed scenario",
        tags: pendingTags,
        body: [trimmed],
      }
      scenarios.push(scenario)
      currentScenario = scenario
      section = "scenario"
      pendingTags = []
      continue
    }

    if (trimmed.startsWith("Rule:")) {
      section = undefined
      currentScenario = undefined
      pendingTags = []
      continue
    }

    if (trimmed.length === 0) {
      if (section === "background" && background.at(-1) !== "")
        background.push("")
      if (
        section === "scenario" &&
        currentScenario &&
        currentScenario.body.at(-1) !== ""
      ) {
        currentScenario.body.push("")
      }
      continue
    }

    if (section === "feature") {
      featureDescription.push(trimmed)
      continue
    }

    if (section === "background") {
      background.push(trimmed)
      continue
    }

    if (section === "scenario" && currentScenario) {
      currentScenario.body.push(trimmed)
    }
  }

  if (!featureName) return undefined

  return {
    name: featureName,
    description: featureDescription.join("\n"),
    background,
    scenarios,
  }
}

type StepDoc = {
  keyword: "Given" | "When" | "Then" | "And" | "But"
  text: string
  table: string[]
}

type NarrativeStepDoc = {
  keyword: "Given" | "When" | "Then" | "And" | "But"
  text: string
  tables: string[][]
}

function parseSteps(lines: string[]): StepDoc[] {
  const steps: StepDoc[] = []
  let current: StepDoc | undefined

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.length === 0) continue
    if (
      trimmed.startsWith("Scenario:") ||
      trimmed.startsWith("Scenario Outline:")
    )
      continue

    const match = trimmed.match(/^(Given|When|Then|And|But)\s+(.+)$/)
    if (match) {
      current = {
        keyword: match[1] as StepDoc["keyword"],
        text: match[2] ?? "",
        table: [],
      }
      steps.push(current)
      continue
    }

    if (trimmed.startsWith("|")) {
      if (current) current.table.push(trimmed)
      continue
    }

    if (current) current.text += ` ${trimmed}`
  }

  return steps
}

function mergeNarrativeSteps(steps: StepDoc[]): NarrativeStepDoc[] {
  const merged: NarrativeStepDoc[] = []

  for (const step of steps) {
    const previous = merged.at(-1)

    if ((step.keyword === "And" || step.keyword === "But") && previous) {
      const connector = step.keyword === "And" ? "and" : "but"
      previous.text += `; ${connector} ${step.text}`
      if (step.table.length > 0) previous.tables.push(step.table)
      continue
    }

    merged.push({
      keyword: step.keyword,
      text: step.text,
      tables: step.table.length > 0 ? [step.table] : [],
    })
  }

  return merged
}

function formatStepText(text: string): string {
  const withDoubleQuoted = text.replace(/"([^"]*)"/g, (_, value: string) => {
    const escaped = value.replaceAll("`", "\\`")
    return `\`"${escaped}"\``
  })

  return withDoubleQuoted.replace(/'([^'\n]*)'/g, (_, value: string) => {
    const escaped = value.replaceAll("`", "\\`")
    return `\`'${escaped}'\``
  })
}

function renderSteps(steps: StepDoc[]): string {
  let docs = ""
  const narrativeSteps = mergeNarrativeSteps(steps)

  for (const step of narrativeSteps) {
    docs += `- **${step.keyword}** ${formatStepText(step.text)}\n`

    for (const table of step.tables) {
      docs += "\n"
      docs += "  ```gherkin\n"
      for (const row of table) docs += `  ${row}\n`
      docs += "  ```\n"
    }

    docs += "\n"
  }

  return docs
}

function renderFeatureDocs(): string {
  if (!existsSync(featurePath)) return "\nNo interaction scenarios found.\n\n"

  const raw = readFileSync(featurePath, "utf-8")
  const feature = parseFeatureFile(raw)

  if (!feature) return "\nUnable to parse interaction scenarios.\n\n"

  const publishedScenarios = feature.scenarios.filter((scenario) =>
    scenario.tags.includes(publishedScenarioTag),
  )

  let docs = "\n"
  if (feature.description.length > 0) docs += `${feature.description}\n\n`
  docs += `These walkthroughs come from \`contract.feature\` scenarios tagged \`${publishedScenarioTag}\`.\n\n`

  if (publishedScenarios.length === 0) {
    docs += "No published interaction guide yet.\n\n"
    return docs
  }

  if (feature.background.length > 0) {
    docs += "### Shared Setup\n\n"
    docs += "This setup is applied before each published scenario.\n\n"
    docs += "Here are the steps:\n\n"
    docs += renderSteps(parseSteps(feature.background))
  }

  for (const [index, scenario] of publishedScenarios.entries()) {
    const scenarioSteps = parseSteps(scenario.body)

    docs += `### ${index + 1}. ${scenario.name}\n\n`
    docs +=
      "This scenario demonstrates a practical interaction sequence for this contract.\n\n"
    docs += "Here are the steps of the scenario:\n\n"
    docs += renderSteps(scenarioSteps)
  }

  return docs
}

const functions = sourceFile
  .getFunctions()
  .filter((fn) => fn.isExported())
  .map((fn) => {
    const name = fn.getName()
    const params = fn.getParameters().map((p) => p.getName())
    const jsdoc = fn.getJsDocs()[0]

    let description = ""
    const paramDocs = new Map<string, string>()
    let returnDoc = ""

    if (jsdoc) {
      description = jsdoc.getDescription().trim()

      for (const tag of jsdoc.getTags()) {
        const tagName = tag.getTagName()

        if (tagName === "param") {
          const comment = tag.getComment()
          const paramName = tag.compilerNode.name?.getText()
          if (paramName && comment)
            paramDocs.set(
              paramName,
              typeof comment === "string"
                ? comment
                : comment.map((c) => c.text).join(""),
            )
        }

        if (tagName === "returns") {
          const comment = tag.getComment()
          if (comment)
            returnDoc =
              typeof comment === "string"
                ? comment
                : comment.map((c) => c.text).join("")
        }
      }
    }

    return { name, params, description, paramDocs, returnDoc }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

let docs = "\n"

for (const fn of functions) {
  docs += `### 🔹 \`${fn.name}(${fn.params.join(", ")})\`\n\n`

  if (fn.description) docs += `${fn.description}\n\n`

  if (fn.paramDocs.size > 0) {
    docs += "**Parameters:**\n\n"
    for (const [name, desc] of fn.paramDocs) docs += `- \`${name}\` - ${desc}\n`
    docs += "\n"
  }

  if (fn.returnDoc) {
    docs += "**Returns:**\n\n"
    docs += `${fn.returnDoc}\n\n`
  }
}

// Generate deployment addresses section
let deploymentDocs = "\n"

if (existsSync(deploymentPath)) {
  const deployment = JSON.parse(readFileSync(deploymentPath, "utf-8"))

  if (deployment.bobines) {
    const addresses = []

    for (const [bobine, data] of Object.entries(deployment.bobines)) {
      if (data.contracts?.[contract]?.address) {
        addresses.push({ bobine, address: data.contracts[contract].address })
      }
    }

    if (addresses.length > 0) {
      deploymentDocs += "## Deployments\n\n"
      for (const { bobine, address } of addresses) {
        deploymentDocs += `- **${bobine}**: \`${address}\`\n`
      }
      deploymentDocs += "\n"
    }
  }
}

const readme = readFileSync(readmePath, "utf-8")
const startMarker = "<!-- METHODS:START -->"
const endMarker = "<!-- METHODS:END -->"
const deploymentStartMarker = "<!-- DEPLOYMENTS:START -->"
const deploymentEndMarker = "<!-- DEPLOYMENTS:END -->"
const featuresStartMarker = "<!-- FEATURES:START -->"
const featuresEndMarker = "<!-- FEATURES:END -->"

if (!readme.includes(startMarker) || !readme.includes(endMarker))
  throw new Error("README must contain METHODS markers")

// Update methods section
const before = readme.substring(
  0,
  readme.indexOf(startMarker) + startMarker.length,
)
const after = readme.substring(readme.indexOf(endMarker))

let updatedReadme = `${before}\n${docs}${after}`

// Update deployments section if markers exist
if (
  updatedReadme.includes(deploymentStartMarker) &&
  updatedReadme.includes(deploymentEndMarker)
) {
  const deploymentBefore = updatedReadme.substring(
    0,
    updatedReadme.indexOf(deploymentStartMarker) + deploymentStartMarker.length,
  )
  const deploymentAfter = updatedReadme.substring(
    updatedReadme.indexOf(deploymentEndMarker),
  )
  updatedReadme = `${deploymentBefore}\n${deploymentDocs}${deploymentAfter}`
}

const hasFeaturesStart = updatedReadme.includes(featuresStartMarker)
const hasFeaturesEnd = updatedReadme.includes(featuresEndMarker)

if (hasFeaturesStart !== hasFeaturesEnd)
  throw new Error("README has incomplete FEATURES markers")

if (hasFeaturesStart && hasFeaturesEnd) {
  const featuresBefore = updatedReadme.substring(
    0,
    updatedReadme.indexOf(featuresStartMarker) + featuresStartMarker.length,
  )
  const featuresAfter = updatedReadme.substring(
    updatedReadme.indexOf(featuresEndMarker),
  )
  const featureDocs = renderFeatureDocs()
  updatedReadme = `${featuresBefore}\n${featureDocs}${featuresAfter}`
}

writeFileSync(readmePath, updatedReadme, "utf-8")

console.log(`✅ Generated docs for ${contract}`)
