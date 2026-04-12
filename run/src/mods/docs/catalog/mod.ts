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

type CatalogItem = {
  name: string
  title: string
  description: string
  href: string
  badges: string[]
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function badgeMarkdownToHtml(badge: string): string {
  const match = badge.match(/!\[([^\]]*)\]\(([^)]+)\)/)

  if (match == null) return ""

  const [, alt, src] = match
  return `<img alt="${escapeHtml(alt)}" src="${escapeHtml(src)}" />`
}

function formatTitle(name: string): string {
  return name
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ")
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

function parseHeading(content: string): string | undefined {
  const match = content.match(/^#\s+(.+)$/m)
  return match?.[1]?.trim()
}

function readContracts(): CatalogItem[] {
  return readdirSync(contractsDir)
    .filter((name) => statSync(`${contractsDir}/${name}`).isDirectory())
    .map((name) => {
      const contractReadmePath = `${contractsDir}/${name}/README.md`

      try {
        const content = readFileSync(contractReadmePath, "utf-8")
        const lines = content.split("\n")

        let title = name
        let description = ""
        let badges: string[] = []

        for (const rawLine of lines) {
          const line = rawLine.trim()

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

        return {
          name,
          title,
          description: description || "No description available",
          href: `contracts/${name}/README.md`,
          badges,
        }
      } catch {
        return {
          name,
          title: formatTitle(name),
          description: "No description available",
          href: `contracts/${name}/README.md`,
          badges: [],
        }
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function readSkills(): CatalogItem[] {
  if (!existsSync(skillsDir)) return []

  return readdirSync(skillsDir)
    .filter((name) => statSync(`${skillsDir}/${name}`).isDirectory())
    .map((name) => {
      const skillPath = `${skillsDir}/${name}`
      const skillMdPath = `${skillPath}/SKILL.md`

      try {
        const skillContent = readFileSync(skillMdPath, "utf-8")
        const frontmatter = parseFrontmatter(skillContent)

        return {
          name,
          title:
            parseHeading(skillContent) || formatTitle(frontmatter.name || name),
          description:
            frontmatter.description ||
            "Portable Bobine skill with no description yet.",
          href: `skills/${name}/SKILL.md`,
          badges: [
            "![portable skill](https://img.shields.io/badge/portable-skill-1D3557)",
          ],
        }
      } catch {
        return {
          name,
          title: formatTitle(name),
          description: "Portable Bobine skill with no description yet.",
          href: `skills/${name}/SKILL.md`,
          badges: [
            "![portable skill](https://img.shields.io/badge/portable-skill-1D3557)",
          ],
        }
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function renderTable(items: CatalogItem[]): string {
  const columns = 2
  const rows: CatalogItem[][] = []

  for (let i = 0; i < items.length; i += columns)
    rows.push(items.slice(i, i + columns))

  let table = `<table>\n`

  for (const row of rows) {
    table += `<tr>\n`

    for (const item of row) {
      const badgeHtml = item.badges
        .map(badgeMarkdownToHtml)
        .filter((badge) => badge.length > 0)
        .join(" ")

      table += `<td width="${Math.floor(100 / columns)}%" valign="top">\n`
      table += `<h3><a href="${item.href}">${escapeHtml(item.title)}</a></h3>\n`
      table += `<p><strong>${escapeHtml(item.description)}</strong></p>\n`
      if (badgeHtml.length > 0) table += `<p>${badgeHtml}</p>\n`
      table += `<p>\u300b<a href="${item.href}">open doc</a></p>\n`
      table += `</td>\n`
    }

    for (let index = row.length; index < columns; index++) {
      table += `<td width="${Math.floor(100 / columns)}%" valign="top"></td>\n`
    }

    table += `</tr>\n`
  }

  table += `</table>\n`
  return table
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

  return `${before}\n\n${content}\n${after}`
}

let readme = readFileSync(readmePath, "utf-8")

readme = replaceSection(readme, "CONTRACTS", renderTable(readContracts()))
readme = replaceSection(readme, "SKILLS", renderTable(readSkills()))

writeFileSync(readmePath, readme, "utf-8")

console.log(
  `✅ Generated catalog for ${readContracts().length} contracts and ${readSkills().length} skills`,
)
