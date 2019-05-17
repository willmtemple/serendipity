import { SyntaxObject } from "../lang/syntax/surface";

export type Diagnostic = 
    UnboundIdentifierError;

interface SyntaxDiagnostic {
    syntaxObject: SyntaxObject
}

export interface UnboundIdentifierError extends SyntaxDiagnostic {
    kind: "unboundidentifier"
    identifier: string,
}