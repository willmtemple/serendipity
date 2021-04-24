import { observer } from "mobx-react";
import React from "react";

export function syntax<T>(
  name: string | undefined,
  base: (props: T, ref: React.ForwardedRef<never>) => React.ReactElement<unknown>
) {
  const wrapped = observer(React.forwardRef(base));
  wrapped.displayName = name ?? (base.name || "Anonymous (Syntax)");

  return wrapped;
}
