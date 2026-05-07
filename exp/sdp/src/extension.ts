import vscode, { languages, window, TextEdit } from "vscode";

export function activate(ctx: vscode.ExtensionContext) {
  console.log("Extension activated.");

  const disposable = vscode.commands.registerCommand("sdp.helloWorld", () => {
    window.showInformationMessage("Cool beans!");
  });

  ctx.subscriptions.push(disposable);
}

languages.registerDocumentFormattingEditProvider("sdp", {
  provideDocumentFormattingEdits(document, options, token): TextEdit[] {
    window.showErrorMessage("Formatting is not implemented.");
    return [];
  },
});
