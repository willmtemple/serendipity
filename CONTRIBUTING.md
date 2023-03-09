# Contributing to Serendipity

This project is still in its infancy, and a lot of work is still required to
bring Serendipity to a place where it can serve as a general-purpose
programming language for everyday use in scripting, software development, etc.

## Maintainership

Welcome to my ([Will Temple](https://wtemple.info)) hobby project. For a few
years this project has been a space for me to experiment with ideas. If you've
made it here and would like to contribute something, please start a discussion
first.

The first step to contributing is to read the [design guide][design].

## Workflow

The project consists of many packages organized as a monorepo. It is managed
using [Rush][rush] (`npm install -g @microsoft/rush`). It is recommended that
new contributors first familiarize themselves with Rush, but the basic setup
is:

1. Clone the Repository using `git`.

2. Run `rush update` to download, install, and link the dependencies.

3. Run `rush build` to build the entire repository.

If you only wish to build a single package (`@serendipity/interpreter` in the
example below), Rush has a command to build only a single package and its
dependencies:

`rush build -t @serendipity/interpreter`

### Using Rush

You should avoid using `npm` commands in the repo unless you are certain of
what you are trying to do. To run a command, use the Rush analogues instead:

- `rushx <command>` instead of `npm run <command>` (to run unit tests, dev
  servers, etc.)
- `rush add -p <package>` instead of `npm install --save <package>`
- `rush build -t <package>` instead of `npm run build` (Rush will make sure the
  dependencies are recompiled if they have changed!)

### Repository Structure

The repository is organized into "categories" that contain individual packages.
Directories in the repository root (except for `/common`) are categories of
packages, and their subdirectories contain packages.

For example:

- `/common` (Rush configuration)
- `/cli` (command-line binaries and tools)
  - `/slipr` (source code of the `slipr` script, including the Lisp reader)
- `/compiler` (components of the compiler)
  - `/common` (types and utilities common to the compiler)
  - `/desugar` (the desugaring compiler pass)
- `/syntax` (packages that define the syntax trees)
  - `/abstract` (abstract, or low-level syntax)
  - `/surface` (surface, or high-level syntax)
  - `/common` (types and utilities common to the syntax packages)
- (etc.)

Each package _should_ have its own `README.md` file with a more comprehensive
description and a clear set of instructions on how to use it.

### Editors

You should consider using an editor that can utilize the TypeScript Language
Server as well as linting/formatting using `eslint` and `prettier`. VS Code
provides these features (see the section below), but most editors can be
customized to support these features.

#### VS Code

Serendipity provides a script to generate a VS Code workspace. You can generate
the `serendipity.code-workspace` file by using the `rush generate-workspace`
command. VS Code users are highly suggested to disable automatic type
acquisition either through the graphical settings UI (labeled: "TypeScript:
Disable Automatic Type Acquisition") or through the `settings.json` file
(`"typescript.disableAutomaticTypeAcquisition": false`).

The workspace is generated using a template file (in `tools/scripts`). To
commit a change to the default workspace, edit this template and regenerate the
workspace using `rush generate-workspace`.

## Platforms

I work on Linux with the latest LTS version of Node. I have no reason to believe
it wouldn't build on macOS. It won't build on Windows and I have no plans to
make it build on Windows. I use POSIX shell commands in the build scripts, so if
you have msysgit, cygwin, or some other POSIX layer installed it may work, I
guess, but you should probably use WSL instead as the Windows file system
performs poorly with large Node projects.

[design]: https://github.com/willmtemple/serendipity/tree/master/DESIGN.md
[rush]: https://rushjs.io/
