import { surfaceExample } from "./examples";
import { writeGlobal } from "../lib/printer/surface";

process.stdout.write(surfaceExample.globals.map(writeGlobal).join("\n\n") + "\n\n");
