// Copyright (c) Serendipity Project Contributors
// Licensed under the GNU General Public License version 3 or later.

/// <reference lib="dom" />

export {
  DefaultProjectStore as Project,
  EditorDetachedSyntax,
  EditorDetachedExpression,
  EditorDetachedStatements,
  EditorGlobal
} from "./stores/ProjectStore";
export { DefaultPrefsStore as Prefs } from "./stores/PrefsStore";
export { useStores, StoreProvider } from "./hook";
