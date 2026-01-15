import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"

const contractsDir = "./contracts"
const readmePath = "./README.md"

const contracts = readdirSync(contractsDir)
  .filter((name) => {
    const stat = statSync(`${contractsDir}/${name}`)
    return stat.isDirectory()
  })
  .map((name) => {
    const contractReadmePath = `${contractsDir}/${name}/README.md`

    try {
      const content = readFileSync(contractReadmePath, "utf-8")
      const lines = content.split("\n")

      let title = name
      let description = ""
      let badges: string[] = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        if (line.startsWith("# ")) {
          const heading = line.slice(2).trim()
          const matches = heading.match(/!\[[^\]]*\]\([^)]+\)/g)
          badges = matches ?? []
          title = heading.replace(/!\[[^\]]*\]\([^)]+\)/g, "").trim() || name
          continue
        }

        if (line && !line.startsWith("#") && !line.startsWith("<!--")) {
          description = line
          break
        }
      }

      return { name, title, description, badges }
    } catch {
      return {
        name,
        title: name,
        description: "No description available",
        badges: [],
      }
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

let list = ""

for (const contract of contracts) {
  list += `- **[${contract.name}](contracts/${contract.name}/README.md)**`
  if (contract.badges.length > 0) list += ` ${contract.badges.join(" ")}`
  list += `\n`
  if (contract.description) list += `  > ${contract.description}`
  else list += `  > Surprise contract!`
  list += `\n\n`
}

const readme = readFileSync(readmePath, "utf-8")
const startMarker = "<!-- CONTRACTS:START -->"
const endMarker = "<!-- CONTRACTS:END -->"

if (!readme.includes(startMarker) || !readme.includes(endMarker))
  throw new Error("README must contain markers")

const before = readme.substring(
  0,
  readme.indexOf(startMarker) + startMarker.length,
)
const after = readme.substring(readme.indexOf(endMarker))

writeFileSync(readmePath, `${before}\n\n${list}${after}`, "utf-8")

console.log(`✅ Generated list of ${contracts.length} contracts`)
