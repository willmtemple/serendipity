import * as debug from "./util/Debug";
// The debug module exports a namespace on the window, so we declare it
//   globally here to be able to use it anywhere
declare global {
  // tslint:disable-next-line: interface-name
  interface Window {
    Debug: typeof debug;
  }
}

window.Debug = debug;

export { Workspace } from "./Workspace";

