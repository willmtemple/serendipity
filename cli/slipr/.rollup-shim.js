const { join } = require("path");

require("ts-node").register({
  compilerOptions: {
    module: "CommonJS",
    esModuleInterop: true
  }
});

module.exports = require(join(__dirname, "rollup.config.ts"));
