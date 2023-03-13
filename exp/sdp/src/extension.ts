import vscode, { languages, TextEdit } from "vscode";

export function activate(ctx: vscode.ExtensionContext) {
  console.log("Extension activated.");

  const disposable = vscode.commands.registerCommand("sdp.helloworld", () => {
    console.log("Command executed.");
  });

  ctx.subscriptions.push(disposable);
}

languages.registerDocumentFormattingEditProvider("sdp", {
  provideDocumentFormattingEdits(document, options, token): TextEdit[] {
    throw new Error("Not implemented");
    return [];
  },
});
