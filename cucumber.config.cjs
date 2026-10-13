module.exports = {
  default: {
    paths: ["contracts/**/contract.feature"],
    import: ["run/src/mods/test/support/**/*.ts"],
    format: ["progress-bar"],
    formatOptions: { snippetInterface: "async-await" },
  },
}
