/**
 * Defines the surface syntax of the language.
 *
 * The surface syntax is the touchpoint for interactivity. This syntax should be
 * exactly the same as the structure that users actually interact with in the editor.
 */

/**
 * All parsed nodes are SyntaxObject instances.
 */
export interface SyntaxObject {
  /** Generic key-value store for object metadata. For use by, e.g. the text parser. */
  metadata?: { [k: string]: any };
}
