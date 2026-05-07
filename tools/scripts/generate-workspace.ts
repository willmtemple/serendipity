// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import fs = require("fs");
import path = require("path");
import process = require("process");

import templateProject = require("./template.code-workspace.json");

if (!fs.existsSync("./node_modules")) {
  console.error(
    "Script dependencies are not installed. Did you forget to run pnpm install?"
  );
}

interface WorkspaceProject {
  packageName: string;
  projectFolder: string;
}

const workspaceRoots = [
  "cli",
  "compiler",
  "editor",
  "runtime",
  "syntax",
  "tools",
  "lib",
  "exp"
];

function discoverProjects(): WorkspaceProject[] {
  return workspaceRoots.flatMap(root => {
    if (!fs.existsSync(root)) return [];

    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(root, entry.name))
      .filter(projectFolder => fs.existsSync(path.join(projectFolder, "package.json")))
      .map(projectFolder => {
        const packageJson = JSON.parse(
          fs.readFileSync(path.join(projectFolder, "package.json"), "utf8")
        );

        return { packageName: packageJson.name, projectFolder };
      })
      .filter(project => project.packageName);
  });
}

function eslintWorkingDirectory(p: WorkspaceProject): typeof templateProject.settings["eslint.workingDirectories"][0] {
  return {
    directory: p.projectFolder,
    changeProcessCWD: true
  };
}

const newWorkspace = { ...templateProject };
const projects = discoverProjects();

const baseFolders = [
  {
    name: "Monorepo Root",
    path: "."
  }
];

newWorkspace.folders = baseFolders.concat(
  projects.map(p => ({
    name: p.packageName,
    path: p.projectFolder
  }))
);

newWorkspace.settings["eslint.workingDirectories"] = projects.map(eslintWorkingDirectory);

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
