import * as React from "react";

import "../../styles/useIcons.css";

type IconType = "fas" | "fab";

const DEFAULT_KIND = "fas";

export const Icon: React.FC<{ kind?: IconType; name: string }> = props => (
  <i className={`${props.kind ?? DEFAULT_KIND} fa-${props.name}`}></i>
);
