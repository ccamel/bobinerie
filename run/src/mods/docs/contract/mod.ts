import { existsSync, readFileSync, writeFileSync } from "node:fs"
import process from "node:process"
import { Project } from "ts-morph"

const contract = process.env.CONTRACT

if (!contract) throw new Error("CONTRACT environment variable required")

const srcPath = `./contracts/${contract}/src/mods/mod.ts`
const readmePath = `./contracts/${contract}/README.md`
const deploymentPath = "./deployment.json"

const project = new Project()
const sourceFile = project.addSourceFileAtPath(srcPath)

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

let docs = "\n"

for (const fn of functions) {
  docs += `### \`${fn.name}(${fn.params.join(", ")})\`\n\n`

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

writeFileSync(readmePath, updatedReadme, "utf-8")

console.log(`✅ Generated docs for ${contract}`)
