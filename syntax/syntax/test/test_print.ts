// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { surfaceExample } from "./examples";
import { writeGlobal } from "../lib/printer/surface";

import * as process from "process";

process.stdout.write(surfaceExample.globals.map(writeGlobal).join("\n\n") + "\n\n");
