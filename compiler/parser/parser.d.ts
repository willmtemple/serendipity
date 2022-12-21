export * from "./serendipity_parser.gen";
import { Module } from "./serendipity_parser.gen";

export function parse(input: string | Uint8Array): Module;
