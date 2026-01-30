// commitlint.config.cjs
module.exports = {
  rules: {
    "header-is-single-letter": [2, "always"],
  },
  plugins: [
    {
      rules: {
        "header-is-single-letter": (parsed) => {
          const header = (parsed.header || "").trim()

          if (/^Merge /.test(header)) return [true]

          // Allow "u: ..." format for dependency updates (e.g., dependabot)
          if (/^u: /.test(header)) return [true]

          const ok = /^[dfartpvub]$/.test(header)

          if (ok) return [true]

          return [
            false,
            [
              "Invalid commit message (DAFT convention)",
              "Expected exactly ONE letter: d f a r t p v u b",
              "Or for dependency updates: u: description",
              "",
              "Legend:",
              "  d → development (general code additions or improvements)",
              "  f → bug fixes",
              "  a → architecture and renames (structural changes, refactoring, file moves)",
              "  r → readme and docs (documentation updates)",
              "  t → tests (adding or modifying tests)",
              "  p → deploy on prod (production deployment-related changes)",
              "  v → version change (bumping version numbers)",
              "  u → dependencies updates (single letter or 'u: description' format)",
              "  b → binary packaging (build artifacts, releases, etc.)",
              "",
              "Examples:",
              "  d",
              "  f",
              "  r",
              "  u",
              "  u: bump package-name from 1.0.0 to 2.0.0",
              "",
              "see: https://x.com/hazae41/status/2001986156834267231",
            ].join("\n"),
          ]
        },
      },
    },
  ],
}
