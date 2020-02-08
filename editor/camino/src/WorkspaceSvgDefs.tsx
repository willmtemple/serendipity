import * as React from "react";

export default () => {
  return (
    <defs>
      <filter id="f_BlockShadow">
        <feOffset result="offOut" in="SourceAlpha" dx="3" dy="3" />
        <feGaussianBlur result="blurOut" in="offOut" stdDeviation="2" />
        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
      </filter>
      <filter id="detachedElement">
        <feColorMatrix in="SourceGraphic" type="saturate" values="0.12" />
      </filter>
      <filter id="dropGlow">
        <feFlood result="flood" floodColor="#FFFFFF" floodOpacity={1} />
        <feComposite in="flood" result="mask" in2="SourceGraphic" operator="in" />
        <feMorphology in="mask" result="dilated" operator="dilate" radius="2" />
        <feGaussianBlur in="dilated" result="blurred" stdDeviation={5} />
        <feMerge>
          <feMergeNode in="blurred" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <pattern id="bgPattern" x={0} y={0} width={50} height={50} patternUnits="userSpaceOnUse">
        <rect x={0} y={0} width={50} height={50} fill="#F0F0F0" />
        <circle cx={25} cy={25} r={2} fill="#AAAAAA" />
      </pattern>
    </defs>
  );
};
