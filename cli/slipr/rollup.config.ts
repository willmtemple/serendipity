// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import type { RollupOptions } from "rollup";

import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import wasm from "@rollup/plugin-wasm";
import sourcemap from "rollup-plugin-sourcemaps";

const config: RollupOptions = {
  input: "dist-esm/bin/slipr.js",
  output: {
    file: "dist/bin/slipr.js",
    format: "cjs",
    sourcemap: true,
  },
  context: "this",
  external: [
    "fs", "os", "path", "child_process", "crypto", "@serendipity/parser"
  ],
  plugins: [
    sourcemap(),
    nodeResolve({
      preferBuiltins: true,
    }),
    commonjs(),
    wasm(),
  ],
};

export default config;
