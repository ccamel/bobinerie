module.exports = {
  default: {
    paths: ["contracts/**/*.feature"],
    import: ["run/src/mods/test/support/**/*.ts"],
    format: ["progress-bar", "html:reports/cucumber-report.html"],
    formatOptions: { snippetInterface: "async-await" },
    publishQuiet: true,
    parallel: 1,
  },
}
