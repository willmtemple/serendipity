import { languages, TextEdit } from "vscode";

languages.registerDocumentFormattingEditProvider("sdp", {
  provideDocumentFormattingEdits(document, options, token): TextEdit[] {
    return [];
  },
});
