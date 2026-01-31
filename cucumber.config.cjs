module.exports = {
  default: {
    paths: ["contracts/**/contract.feature"],
    import: ["run/src/mods/test/support/**/*.ts"],
    format: ["progress-bar", "html:reports/cucumber-report.html"],
    formatOptions: { snippetInterface: "async-await" },
    parallel: 1,
  },
}
