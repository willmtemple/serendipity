import nodeResolve from "@rollup/plugin-node-resolve";

export default {
  input: "dist-esm/src/index.js",
  output: {
    file: "dist/index.js",
    format: "cjs",
  },
  external: ["fs", "os", "path", "child_process", "crypto"],
  plugins: [
    nodeResolve({
      preferBuiltins: true,
    }),
  ],
};

