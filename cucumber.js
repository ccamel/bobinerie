export default {
  default: {
    format: ["progress-bar", "html:reports/cucumber-report.html"],
    formatOptions: { snippetInterface: "async-await" },
    publishQuiet: true,
    parallel: 1, // Sequentialize test execution
  },
}
