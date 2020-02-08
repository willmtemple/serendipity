import * as React from "react";

import Workspace from "./Workspace";

import * as debug from "./util/Debug";

import { StoreProvider } from "./hooks/stores";

// The debug module exports a namespace on the window, so we declare it
//   globally here to be able to use it anywhere
declare global {
  // tslint:disable-next-line: interface-name
  interface Window {
    Debug: typeof debug;
  }
}

window.Debug = debug;

export const Editor = () => {
  return (
    <StoreProvider>
      <Workspace />
    </StoreProvider>
  );
};
