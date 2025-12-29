// commitlint.config.cjs
module.exports = {
  rules: {
    "header-is-single-letter": [2, "always"],
  },
  plugins: [
    {
      rules: {
        "header-is-single-letter": (parsed) => {
          const header = (parsed.header || "").trim();

          if (/^Merge /.test(header)) return [true];

          const ok = /^[dfartpvub]$/.test(header);
          
          if (ok) return [true];
          
          return [
            false,
            [
              "Invalid commit message (DAFT convention)",
              "Expected exactly ONE letter: d f a r t p v u b",
              "",
              "Legend:",
              "  d: development",
              "  f: bug fixes",
              "  a: architecture and renames",
              "  r: readme and docs",
              "  t: tests",
              "  p: deploy on prod",
              "  v: version change",
              "  u: dependencies updates",
              "  b: binary packaging",
              "",
              "Examples:",
              "  d",
              "  f",
              "  r",
              "",
              "see: https://x.com/hazae41/status/2001986156834267231"
            ].join("\n"),
          ];
        },
      },
    },
  ],
};
