import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs"

const contractsDir = "./contracts"
const skillsDir = "./skills"
const readmePath = "./README.md"

type ListItem = {
  name: string
  description: string
  href: string
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (match == null) return {}

  const lines = match[1].split(/\r?\n/)
  const data: Record<string, string> = {}

  for (let index = 0; index < lines.length; index++) {
    const rawLine = lines[index] ?? ""
    const line = rawLine.trimEnd()
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)

    if (keyMatch == null) continue

    const [, key, valueRaw] = keyMatch
    if (key == null || valueRaw == null) continue

    const value = valueRaw.trim()

    if (value === ">" || value === "|") {
      const chunks: string[] = []

      for (index += 1; index < lines.length; index++) {
        const blockLine = lines[index] ?? ""
        if (!blockLine.startsWith("  ")) {
          index -= 1
          break
        }

        const trimmed = blockLine.trim()
        if (trimmed.length > 0) chunks.push(trimmed)
      }

      data[key] = chunks.join(" ").trim()
      continue
    }

    data[key] = value.replace(/^['"]|['"]$/g, "").trim()
  }

  return data
}

function readContracts(): ListItem[] {
  return readdirSync(contractsDir)
    .filter((name) => statSync(`${contractsDir}/${name}`).isDirectory())
    .map((name) => {
      const contractReadmePath = `${contractsDir}/${name}/README.md`

      try {
        const content = readFileSync(contractReadmePath, "utf-8")
        const lines = content.split("\n")
        const description =
          lines
            .find((line) => {
              const trimmed = line.trim()
              return (
                trimmed.length > 0 &&
                !trimmed.startsWith("#") &&
                !trimmed.startsWith("<!--")
              )
            })
            ?.trim() || "No description available"

        return {
          name,
          description,
          href: `contracts/${name}/README.md`,
        }
      } catch {
        return {
          name,
          description: "No description available",
          href: `contracts/${name}/README.md`,
        }
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function readSkills(): ListItem[] {
  if (!existsSync(skillsDir)) return []

  return readdirSync(skillsDir)
    .filter((name) => statSync(`${skillsDir}/${name}`).isDirectory())
    .map((name) => {
      const skillMdPath = `${skillsDir}/${name}/SKILL.md`

      try {
        const content = readFileSync(skillMdPath, "utf-8")
        const frontmatter = parseFrontmatter(content)

        return {
          name,
          description:
            frontmatter.description ||
            "Portable Bobine skill with no description available",
          href: `skills/${name}/SKILL.md`,
        }
      } catch {
        return {
          name,
          description: "Portable Bobine skill with no description available",
          href: `skills/${name}/SKILL.md`,
        }
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function renderList(items: ListItem[]): string {
  let list = ""

  for (const item of items) {
    list += `- **[${item.name}](${item.href})**\n`
    list += `  > ${item.description}\n\n`
  }

  return list
}

function replaceSection(
  readme: string,
  marker: string,
  content: string,
): string {
  const startMarker = `<!-- ${marker}:START -->`
  const endMarker = `<!-- ${marker}:END -->`

  if (!readme.includes(startMarker) || !readme.includes(endMarker))
    throw new Error(`README must contain ${marker} markers`)

  const before = readme.substring(
    0,
    readme.indexOf(startMarker) + startMarker.length,
  )
  const after = readme.substring(readme.indexOf(endMarker))

  return `${before}\n\n${content}${after}`
}

let readme = readFileSync(readmePath, "utf-8")
readme = replaceSection(readme, "CONTRACTS", renderList(readContracts()))
readme = replaceSection(readme, "SKILLS", renderList(readSkills()))
writeFileSync(readmePath, readme, "utf-8")

console.log(
  `✅ Generated list for ${readContracts().length} contracts and ${readSkills().length} skills`,
)
