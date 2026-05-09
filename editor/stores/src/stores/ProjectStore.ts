import { autorun, makeAutoObservable, observable, set, toJS } from "mobx";

import { defaultProject } from "../defaultProject";
import { expr, isParseNode, node, stmt } from "../parserFactories";

import type { Declaration, Expression, Module, ParseNode, Statement } from "@serendipity/parser";

const KEY_PROJECT = "userProject";
const DOCUMENT_VERSION = 2;

const guid = (function createIdSystem() {
  let id = 0;
  return () => String((id += 1));
})();

export interface Position {
  x: number;
  y: number;
}

export interface EditorMetadata {
  guid: string;
  pos: Position;
}

export interface EditorTopLevel {
  kind: "declaration";
  declaration: ParseNode<Declaration>;
  metadata: { editor: EditorMetadata };
}

interface EditorDetachedSyntaxBase {
  kind: "_editor_detachedsyntax";
  metadata: { editor: EditorMetadata };
}

export interface EditorDetachedExpression extends EditorDetachedSyntaxBase {
  syntaxKind: "expression";
  element: ParseNode<Expression>;
}

export interface EditorDetachedStatements extends EditorDetachedSyntaxBase {
  syntaxKind: "statement";
  element: Array<ParseNode<Statement>>;
}

export type EditorDetachedSyntax = EditorDetachedExpression | EditorDetachedStatements;
export type EditorGlobal = EditorTopLevel | EditorDetachedSyntax;
export type EditorUnregisteredGlobal =
  | ParseNode<Declaration>
  | Omit<EditorTopLevel, "metadata">
  | Omit<EditorDetachedExpression, "metadata">
  | Omit<EditorDetachedStatements, "metadata">;

export interface EditorDocument {
  version: 2;
  items: EditorGlobal[];
  customBlocks: EditorCustomBlockDefinition[];
}

export type EditorCustomBlockKind = "expression" | "statement";

export interface EditorCustomBlockHole {
  id: string;
  name: string;
  syntaxKind: EditorCustomBlockKind;
  typeHint?: string;
}

export interface EditorCustomBlockDefinition {
  id: string;
  name: string;
  syntaxKind: EditorCustomBlockKind;
  holes: EditorCustomBlockHole[];
  template: ParseNode<Expression> | Array<ParseNode<Statement>>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function reviveTupleVariants<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => reviveTupleVariants(item)) as T;
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  const record = value as Record<string, unknown>;
  const revivedEntries = Object.fromEntries(
    Object.entries(record).map(([key, child]) => [key, reviveTupleVariants(child)])
  );

  if (typeof revivedEntries.kind === "string" && "0" in revivedEntries) {
    const tuple: unknown[] = [];
    Object.keys(revivedEntries)
      .filter((key) => /^\d+$/.test(key))
      .sort((left, right) => Number(left) - Number(right))
      .forEach((key) => {
        tuple[Number(key)] = revivedEntries[key];
        delete revivedEntries[key];
      });
    return Object.assign(tuple, revivedEntries) as T;
  }

  return revivedEntries as T;
}

function isEditorDocument(value: unknown): value is EditorDocument {
  return (
    typeof value === "object" &&
    value !== null &&
    ((value as { version?: unknown }).version === 1 || (value as { version?: unknown }).version === DOCUMENT_VERSION) &&
    Array.isArray((value as { items?: unknown }).items)
  );
}

function migrateDocument(value: EditorDocument | { version: 1; items: EditorGlobal[] }): EditorDocument {
  if (value.version === DOCUMENT_VERSION) return value as EditorDocument;
  return {
    version: DOCUMENT_VERSION,
    items: value.items,
    customBlocks: [],
  };
}

function isDetached(value: unknown): value is EditorDetachedSyntax {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { kind?: unknown }).kind === "_editor_detachedsyntax"
  );
}

function isEditorTopLevel(value: unknown): value is EditorTopLevel {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { kind?: unknown }).kind === "declaration" &&
    isParseNode((value as { declaration?: unknown }).declaration)
  );
}

function makeTopLevel(declaration: ParseNode<Declaration>, pos: Position = { x: 0, y: 0 }): EditorTopLevel {
  return observable({
    kind: "declaration",
    declaration,
    metadata: { editor: { guid: guid(), pos } },
  }) as EditorTopLevel;
}

function nodeValueKind(value: unknown): string | undefined {
  if (isParseNode(value)) return nodeValueKind(value.value);
  if (typeof value === "object" && value !== null && "kind" in value) {
    return String((value as { kind: unknown }).kind);
  }
  return undefined;
}

function isHole(value: unknown): boolean {
  return nodeValueKind(value) === "Hole" || nodeValueKind(value) === "@hole";
}

function installEmergencyDebugClearStorage() {
  if (typeof window === "undefined") return;
  const target = window as unknown as {
    Debug?: { project?: Record<string, unknown> };
  };
  target.Debug = target.Debug ?? {};
  target.Debug.project = target.Debug.project ?? {};
  target.Debug.project.clearStorage = () => localStorage.removeItem(KEY_PROJECT);
}

export class ProjectStore {
  public document: EditorDocument = { version: DOCUMENT_VERSION, items: [], customBlocks: [] };

  private byGUID: Record<string, object> = {};
  private metadata = new WeakMap<object, EditorMetadata>();

  constructor() {
    makeAutoObservable(this);
    const storedData = localStorage.getItem(KEY_PROJECT);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      if (!isEditorDocument(parsed)) {
        installEmergencyDebugClearStorage();
        throw new Error(
          "Stored Camino project is incompatible with the parser editor model. Run window.Debug.project.clearStorage() and reload."
        );
      }
      set(this.document, migrateDocument(parsed));
    } else {
      set(this.document, this.createDefaultDocument());
    }

    this.loadGUIDTable();

    let firstRun = true;
    autorun(() => {
      const json = JSON.stringify(toJS(this.document));
      if (!firstRun) localStorage.setItem(KEY_PROJECT, json);
      firstRun = false;
    });
  }

  get program(): EditorDocument {
    return this.document;
  }

  get globals(): EditorGlobal[] {
    return this.document.items;
  }

  get canonicalProgram(): Module {
    return this.toParserModule();
  }

  public toParserModule(): Module {
    const declarations = toJS(this.document.items)
      .filter(isEditorTopLevel)
      .map((item) => item.declaration);
    const expanded = this.expandCustomBlocks(declarations);
    this.assertNoEditorHoles(expanded);
    return reviveTupleVariants({ declarations: expanded });
  }

  public clearStorage() {
    localStorage.removeItem(KEY_PROJECT);
  }

  public clear() {
    this.document.items = [];
    this.byGUID = {};
    this.metadata = new WeakMap();
  }

  public reset() {
    this.document = this.createDefaultDocument();
    this.loadGUIDTable();
  }

  public rmNode(idx: number) {
    const item = this.document.items[idx];
    if (item) this.rmNodeByGUID(this.metadataFor(item).guid);
  }

  public rmNodeByGUID(id: string) {
    this.document.items = this.document.items.filter((item) => this.metadataFor(item).guid !== id);
    delete this.byGUID[id];
  }

  public addDeclaration(declaration: ParseNode<Declaration>, pos?: Position): string {
    return this.addTopLevel(makeTopLevel(clone(declaration), pos));
  }

  public addDetachedExpression(element: ParseNode<Expression>, pos?: Position): string {
    return this.addTopLevel({
      kind: "_editor_detachedsyntax",
      syntaxKind: "expression",
      element: clone(element),
      metadata: { editor: { guid: guid(), pos: pos ?? { x: 0, y: 0 } } },
    });
  }

  public addDetachedStatements(element: Array<ParseNode<Statement>>, pos?: Position): string {
    return this.addTopLevel({
      kind: "_editor_detachedsyntax",
      syntaxKind: "statement",
      element: clone(element),
      metadata: { editor: { guid: guid(), pos: pos ?? { x: 0, y: 0 } } },
    });
  }

  public addGlobal(newGlobal: EditorUnregisteredGlobal, pos?: Position): string {
    if (isParseNode<Declaration>(newGlobal)) return this.addDeclaration(newGlobal, pos);
    if ((newGlobal as { kind?: unknown }).kind === "declaration") {
      return this.addDeclaration((newGlobal as Omit<EditorTopLevel, "metadata">).declaration, pos);
    }
    if (isDetached(newGlobal)) {
      return newGlobal.syntaxKind === "expression"
        ? this.addDetachedExpression(newGlobal.element, pos)
        : this.addDetachedStatements(newGlobal.element, pos);
    }
    throw new Error("Unsupported editor global");
  }

  public insertInto(vid: string, into: string, key: string, idx?: number) {
    let parent = this.byGUID[into];
    let detached = this.byGUID[vid] as EditorDetachedSyntax | undefined;
    if (!parent || !detached || detached.kind !== "_editor_detachedsyntax") {
      this.loadGUIDTable();
      parent = this.byGUID[into];
      detached = this.byGUID[vid] as EditorDetachedSyntax | undefined;
    }
    if (!detached || detached.kind !== "_editor_detachedsyntax") {
      detached = this.document.items.find(
        (item): item is EditorDetachedSyntax =>
          item.kind === "_editor_detachedsyntax" && this.metadataFor(item).guid === vid
      );
    }
    if (!parent || !detached || detached.kind !== "_editor_detachedsyntax") {
      throw new Error("Cannot insert detached syntax: missing source or target");
    }

    const replacement = detached.syntaxKind === "expression" ? detached.element : detached.element;
    this.writeChild(parent, key, replacement, idx, detached.syntaxKind);
    this.rmNodeByGUID(vid);
  }

  public detachExpression(id: string, key: string, pos: Position, idx?: number): string | undefined {
    const parent = this.byGUID[id];
    const target = this.readChild<ParseNode<Expression>>(parent, key, idx);
    if (!target) throw new Error("No such expression target");
    if (isHole(target)) return;

    const replacement = node(expr.hole());
    this.writeChild(parent, key, replacement, idx, "expression");
    this.loadSyntaxObject(replacement);
    return this.addDetachedExpression(target, pos);
  }

  public detachStatement(id: string, key: string, pos: Position, idx?: number): string {
    const parent = this.byGUID[id];
    const target = this.readChild<ParseNode<Statement> | Array<ParseNode<Statement>>>(parent, key, idx);
    if (!target) throw new Error("No such statement target");

    const detached = Array.isArray(target) ? target : [target];
    const replacement = node(stmt.hole());
    this.writeChild(parent, key, idx === undefined ? [replacement] : replacement, idx, "statement");
    return this.addDetachedStatements(detached, pos);
  }

  public dump() {
    return toJS(this.document);
  }

  public getText(): string {
    return JSON.stringify(this.toParserModule(), undefined, 2);
  }

  public bump(idx: number) {
    if (idx + 1 < this.document.items.length) {
      const item = this.document.items.splice(idx, 1);
      this.document.items.push(item[0]!);
    }
  }

  public updatePos(id: string, pos: Position) {
    const item = this.byGUID[id];
    if (item) this.metadataFor(item).pos = pos;
    else console.warn("No such guid exists", id, pos);
  }

  public metadataFor(node: object): EditorMetadata {
    if ("metadata" in node && (node as { metadata?: { editor?: EditorMetadata } }).metadata?.editor) {
      return (node as { metadata: { editor: EditorMetadata } }).metadata.editor;
    }
    const existing = this.metadata.get(node);
    if (existing) return existing;
    const next = { guid: guid(), pos: { x: 0, y: 0 } };
    this.metadata.set(node, next);
    this.byGUID[next.guid] = node;
    return next;
  }

  public loadGUID(node: object): string {
    return this.metadataFor(node).guid;
  }

  private addTopLevel<T extends EditorGlobal>(item: T): string {
    const observableItem = observable(item) as T;
    this.document.items.push(observableItem);
    this.loadSyntaxObject(observableItem);
    return this.metadataFor(observableItem).guid;
  }

  private createDefaultDocument(): EditorDocument {
    return {
      version: DOCUMENT_VERSION,
      customBlocks: [],
      items: defaultProject.declarations.map((declaration, idx) =>
        makeTopLevel(clone(declaration), { x: 80, y: 80 + idx * 150 })
      ),
    };
  }

  private readChild<T>(parent: unknown, key: string, idx?: number): T | undefined {
    if (!parent || typeof parent !== "object") return undefined;
    const value = (parent as Record<string, unknown>)[key];
    if (idx !== undefined && Array.isArray(value)) return value[idx] as T;
    return value as T;
  }

  private writeChild(parent: unknown, key: string, value: unknown, idx: number | undefined, mode: "expression" | "statement") {
    if (!parent || typeof parent !== "object") throw new Error("Cannot write child of missing parent");
    const target = parent as Record<string, unknown>;
    const current = target[key];

    if (idx !== undefined) {
      if (!Array.isArray(current)) throw new Error(`Cannot write indexed child ${key}`);
      if (mode === "statement" && Array.isArray(value)) current.splice(idx, 1, ...value);
      else current[idx] = value;
      this.loadSyntaxObject(value);
      return;
    }

    target[key] = value;
    this.loadSyntaxObject(value);
  }

  public deleteChild(parentId: string, key: string, idx: number | undefined, mode: "expression" | "statement") {
    const parent = this.byGUID[parentId];
    if (!parent) throw new Error("Cannot delete child of missing parent");
    const replacement = mode === "expression" ? node(expr.hole()) : node(stmt.hole());
    this.writeChild(parent, key, replacement, idx, mode);
  }

  public placeSyntax(parentId: string, key: string, value: ParseNode<Expression> | ParseNode<Statement> | Array<ParseNode<Statement>>, idx: number | undefined, mode: "expression" | "statement") {
    const parent = this.byGUID[parentId];
    if (!parent) throw new Error("Cannot place syntax into missing parent");
    this.writeChild(parent, key, clone(value), idx, mode);
  }

  public addCustomBlock(definition: Omit<EditorCustomBlockDefinition, "id">): string {
    const id = guid();
    this.document.customBlocks.push({ ...clone(definition), id });
    return id;
  }

  public expandCustomBlocks<T>(value: T): T {
    return value;
  }

  private assertNoEditorHoles(value: unknown) {
    if (isParseNode(value) && (value.value as { kind?: string }).kind === "Hole") {
      throw new Error("Program still contains expression holes");
    }
    if (Array.isArray(value)) {
      value.forEach((item) => this.assertNoEditorHoles(item));
      return;
    }
    if (typeof value === "object" && value !== null) {
      Object.values(value).forEach((child) => this.assertNoEditorHoles(child));
    }
  }

  private loadSyntaxObject(value: unknown) {
    if (Array.isArray(value)) {
      value.forEach((child) => this.loadSyntaxObject(child));
      return;
    }
    if (typeof value !== "object" || value === null) return;

    const object = value as object;
    if (nodeValueKind(object) || isParseNode(object) || isEditorTopLevel(object) || isDetached(object)) {
      const meta = this.metadataFor(object);
      this.byGUID[meta.guid] = object;
    }

    Object.entries(object)
      .filter(([key]) => key !== "metadata" && key !== "range")
      .forEach(([, child]) => this.loadSyntaxObject(child));
  }

  private loadGUIDTable() {
    this.byGUID = {};
    this.metadata = new WeakMap();
    this.document.items.forEach((item) => {
      this.metadataFor(item);
      this.loadSyntaxObject(item);
    });
  }
}

export const DefaultProjectStore = new ProjectStore();
