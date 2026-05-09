import * as React from "react";

export interface InteractionState {
  hoveredGuid: string | null;
  selectedGuid: string | null;
  snapParentGuid: string | null;
  snapTarget: {
    kind: "expression" | "statement";
    parentGuid: string;
    key: string;
    idx?: number;
  } | null;
}

export const InteractionContext = React.createContext<InteractionState>({
  hoveredGuid: null,
  selectedGuid: null,
  snapParentGuid: null,
  snapTarget: null,
});

export function useInteractionState() {
  return React.useContext(InteractionContext);
}
