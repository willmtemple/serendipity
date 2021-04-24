// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import type { RollupOptions } from "rollup";

import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const config : RollupOptions = {
  input: 'dist-esm/bin/slipr.js',
  output: {
    file: 'dist/bin/slipr.js',
    format: "cjs",
  },
  context: "this",
  external: ["fs", "os", "path", "child_process", "crypto"],
  plugins: [
    nodeResolve({
      preferBuiltins: true,
    }),
    commonjs()
  ]
};

export default config;