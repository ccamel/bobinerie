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

          const ok = /^[dfartpvub]$/.test(header)

          if (ok) return [true]

          return [
            false,
            [
              "Invalid commit message (DAFT convention)",
              "Expected exactly ONE letter: d f a r t p v u b",
              "",
              "Legend:",
              "  d → development (general code additions or improvements)",
              "  f → bug fixes",
              "  a → aarchitecture and renames (structural changes, refactoring, file moves)",
              "  r → readme and docs (documentation updates)",
              "  t → tests (adding or modifying tests)",
              "  p → deploy on prod (production deployment-related changes)",
              "  v → version change (bumping version numbers)",
              "  u → dependencies updates",
              "  b → binary packaging (build artifacts, releases, etc.)",
              "",
              "Examples:",
              "  d",
              "  f",
              "  r",
              "",
              "see: https://x.com/hazae41/status/2001986156834267231",
            ].join("\n"),
          ]
        },
      },
    },
  ],
}
