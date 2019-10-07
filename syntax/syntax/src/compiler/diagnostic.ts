// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { SyntaxObject } from "..";

export type Diagnostic = UnboundIdentifierError;

interface SyntaxDiagnostic {
  syntaxObject: SyntaxObject;
}

export interface UnboundIdentifierError extends SyntaxDiagnostic {
  kind: "unboundidentifier";
  identifier: string;
}
