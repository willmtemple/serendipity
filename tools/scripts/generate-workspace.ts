// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import fs = require("fs");
import process = require("process");

import rushJson = require("../../rush.json");
import templateProject = require("./template.code-workspace.json");

if (!fs.existsSync("./node_modules")) {
  console.error(
    "Script dependencies are not installed. Did you forget to run rush?"
  );
}

function eslintWorkingDirectory(
  p: typeof rushJson.projects[0]
): typeof templateProject.settings["eslint.workingDirectories"][0] {
  return {
    directory: p.projectFolder,
    changeProcessCWD: true
  };
}

const newWorkspace = { ...templateProject };

const baseFolders = [
  {
    name: "Monorepo Root",
    path: "."
  }
];

newWorkspace.folders = baseFolders.concat(
  rushJson.projects.map(p => ({
    name: p.packageName,
    path: p.projectFolder
  }))
);

newWorkspace.settings["eslint.workingDirectories"] = rushJson.projects.map(
  eslintWorkingDirectory
);

fs.writeFile(
  "../../serendipity.code-workspace",
  JSON.stringify(newWorkspace, null, "  "),
  err => {
    if (err) {
      console.error("Failed to create code workspace:", err);
      process.exit(1);
    }
    console.log("Success.");
  }
);
