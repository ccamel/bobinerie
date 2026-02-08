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

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

const badgeMarkdownToHtml = (badge: string): string => {
  const match = badge.match(/!\[([^\]]*)\]\(([^)]+)\)/)

  if (match == null) return ""

  const [, alt, src] = match
  return `<img alt="${escapeHtml(alt)}" src="${escapeHtml(src)}" />`
}

const columns = 2
const rows: (typeof contracts)[] = []

for (let i = 0; i < contracts.length; i += columns) {
  rows.push(contracts.slice(i, i + columns))
}

let list = `<table>\n`

for (const row of rows) {
  list += `<tr>\n`

  for (const contract of row) {
    const href = `contracts/${contract.name}/README.md`
    const title = escapeHtml(contract.title || contract.name)
    const description = escapeHtml(contract.description || "Surprise contract!")
    const badgeHtml = contract.badges
      .map(badgeMarkdownToHtml)
      .filter((badge) => badge.length > 0)
      .join(" ")

    list += `<td width="${Math.floor(100 / columns)}%" valign="top">\n`
    list += `<h3><a href="${href}">${title}</a></h3>\n`
    list += `<p><strong>${description}</strong></p>\n`
    if (badgeHtml.length > 0) list += `<p>${badgeHtml}</p>\n`
    list += `<p>\u300b<a href="${href}">open doc</a></p>\n`
    list += `</td>\n`
  }

  if (row.length < columns) {
    const missing = columns - row.length
    for (let i = 0; i < missing; i++)
      list += `<td width="${Math.floor(100 / columns)}%" valign="top"></td>\n`
  }

  list += `</tr>\n`
}

list += `</table>\n`

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

writeFileSync(readmePath, `${before}\n\n${list}\n${after}`, "utf-8")

console.log(`✅ Generated list of ${contracts.length} contracts`)
