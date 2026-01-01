import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import process from "node:process"
import { Project, SyntaxKind, ts, VariableDeclarationKind } from "ts-morph"

const readmePath = "./contracts/sigil/README.md"
const examplesDir = "./contracts/sigil/examples"
const contractPath = "./contracts/sigil/src/mods/mod.ts"

const [countArg, columnsArg] = process.argv.slice(2)
const count = Number.parseInt(countArg ?? "4", 10)
const columns = Number.parseInt(columnsArg ?? "2", 10)

if (!Number.isFinite(count) || count <= 0)
  throw new Error("COUNT must be a positive integer")
if (!Number.isFinite(columns) || columns <= 0)
  throw new Error("COLUMNS must be a positive integer")

const encoder = new TextEncoder()

function toHex(bytes: Uint8Array): string {
  let out = ""
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0")
  return out
}

async function seedForIndex(index: number): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`sigil:example:${index}`),
  )
  return toHex(new Uint8Array(digest)).slice(0, 32)
}

function loadRender() {
  const project = new Project()
  const sourceFile = project.addSourceFileAtPath(contractPath)
  const constStatements = sourceFile
    .getVariableStatements()
    .filter(
      (statement) =>
        statement.getDeclarationKind() === VariableDeclarationKind.Const &&
        statement.getDeclarations().every((decl) => {
          const initializer = decl.getInitializer()
          if (!initializer) return false
          const kind = initializer.getKind()
          return (
            kind === SyntaxKind.StringLiteral ||
            kind === SyntaxKind.NoSubstitutionTemplateLiteral ||
            kind === SyntaxKind.NumericLiteral
          )
        }),
    )
    .map((statement) => statement.getText())
  const renderNode = sourceFile
    .getDescendantsOfKind(SyntaxKind.ModuleDeclaration)
    .find((node) => node.getName() === "render")
  if (!renderNode) throw new Error("Missing namespace render")
  const transpiled = ts.transpileModule(
    `${constStatements.join("\n")}\n${renderNode.getText()}`,
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2019,
        module: ts.ModuleKind.None,
      },
    },
  )
  const render = new Function(`${transpiled.outputText}\nreturn render;`)() as {
    svg: (seed32hex: string, tag: string) => string
  }
  if (typeof render.svg !== "function")
    throw new Error("render.svg is not available")
  return render
}

const render = loadRender()

type Example = {
  name: string
  seed: string
  tag: string
}

function buildGallery(examples: Example[], columns: number): string {
  const rows: string[] = []
  for (let i = 0; i < examples.length; i += columns) {
    const row = examples.slice(i, i + columns)
    const images = row.map(
      (example) =>
        `<img src="./examples/${example.name}" width="128" height="128" alt="${example.name}"/>`,
    )
    rows.push(`  ${images.join(" ")}`)
  }

  return `<div align="center">\n${rows.join("<br/>\n")}\n</div>`
}

function buildDocs(examples: Example[], columns: number): string {
  return `${buildGallery(examples, columns)}\n`
}

async function main() {
  mkdirSync(examplesDir, { recursive: true })

  const examples: Example[] = []
  for (let i = 1; i <= count; i++) {
    const seed = await seedForIndex(i)
    const tag = `sigil example ${i}`
    const name = `sigil-${i}.svg`
    const svg = render.svg(seed, tag, "0")
    writeFileSync(join(examplesDir, name), svg, "utf-8")
    examples.push({ name, seed, tag })
  }

  const readme = readFileSync(readmePath, "utf-8")
  const startMarker = "<!-- SIGIL_EXAMPLES:START -->"
  const endMarker = "<!-- SIGIL_EXAMPLES:END -->"

  if (!readme.includes(startMarker) || !readme.includes(endMarker))
    throw new Error("README must contain SIGIL_EXAMPLES markers")

  const before = readme.substring(
    0,
    readme.indexOf(startMarker) + startMarker.length,
  )
  const after = readme.substring(readme.indexOf(endMarker))

  const docs = `\n${buildDocs(examples, columns)}`

  writeFileSync(readmePath, `${before}${docs}${after}`, "utf-8")

  console.log(`Generated ${examples.length} sigil examples`)
}

await main()
