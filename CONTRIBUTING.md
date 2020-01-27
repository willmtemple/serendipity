# Contributing to Serendipity

This project is still in its infancy, and a lot of work is still required to
bring Serendipity to a place where it can serve as a general-purpose
programming language for everyday use in scripting, software development, etc.

## Maintainership

Currently, I ([Will Temple](https://wtemple.info)) am the project's sole
maintainer in my free time. Contributions of implementation code, design
suggestions, artwork, documentation, experience reports, test cases, example
programs, and of course error reports are all welcome. Please create a new
issue or pull request.

I am unlikely to accept large contributions without first having a
comprehensive discussion about its impact on the project's design goals. If you
are considering implementing a new feature, please use the issue form to start
a design discussion first to ensure that your contributions will be aligned
with Serendipity's design goals. Otherwise, your contribution may be rejected.

The first step to contributing is to read the [design guide][design].

### Disclaimer of Affiliation

Will is an employee of Microsoft. His opinions do not necessarily reflect the
opinions of Microsoft. The Serendipity Project is not affiliated with Microsoft
or any other institution.

### Licensure

Serendipity follows a traditional free-software contribution model.

When you contribute to a Serendipity package, you agree to incorporate it under
the terms of the license of that package. No further contributor license
agreement or copyright assignment will be required, and you will continue to
own the copyright on your contributions.

### Conduct

All are welcome to participate in the Serendipity project. All participants
are asked to assume the best intentions from others and to critique, clarify,
and debate in a spirited, but positive manner. Conduct that demeans or excludes
any contributor from participation on the basis of their person will not be
tolerated [[1]](#endnote-1).

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
- (and more)

Each package _should_ have its own `README.md` file with a more comprehensive
description and a clear set of instructions on how to use it.

### Editors

You should consider using an editor that can utilize the TypeScript Language
Server as well as linting/formatting using `eslint` and `prettier`. VS Code
provides these features (see the section below), but most editors can be
customized to support these features.

#### VS Code

A VS Code workspace is provided in the repository as
[`/serendipity.code-workspace`][workspace]. VS Code users are highly suggested
to disable automatic type acquisition either through the graphical settings UI
(labeled: "TypeScript: Disable Automatic Type Acquisition") or through the
`settings.json` file (`"typescript.disableAutomaticTypeAcquisition": false`).

Do not manually edit the workspace. Instead edit the template file in
`tools/scripts` and regenerate the workspace using `rush generate-workspace`.

## Platforms

Serendipity is developed on Linux with the latest LTS version of Node. I have
no reason to believe that it would not work on Windows 10 or macOS or that it
would not work on Node LTS 10 and Node 13. However, I don't currently test on
any platforms other than what's locally installed on my computers.

In theory, Serendipity should always build and run on active LTS versions of
Node on Linux, Windows, and macOS. We will not support versions of Node that
have exceeded their end-of-life.

### Windows

Users of msysgit on Windows 10 build 1607 and later are advised to free
themselves of their 260-character tether by setting the `longpaths` option
(`git config --system core.longtpaths true`) and setting a registry key:

__Warning__: I don't use Windows, and so I don't test this registry setting.
Proceed at your own risk.

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem]
"LongPathsEnabled"="dword:1"

```

Users of Windows versions older than Windows 10 build 1607 are advised to
update or, if updating is not a possibility due to the age and/or capabilities
of your hardware, to consider installing a distrbution of Linux as an
alternative.

<a id="endnote-1"></a>
__[1]__: see [The Paradox of Tolerance](https://en.wikipedia.org/wiki/Paradox_of_tolerance)

[design]: https://github.com/willmtemple/serendipity/tree/master/DESIGN.md
[rush]: https://rushjs.io/
[workspace]: https://github.com/willmtemple/serendipity/tree/master/serendipity.code-workspace

