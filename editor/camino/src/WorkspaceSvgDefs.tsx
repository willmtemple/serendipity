export default () => {
  return (
    <defs>
      <filter id="detachedElement">
        <feColorMatrix in="SourceGraphic" type="saturate" values="0.80" />
      </filter>
      <filter id="dropGlow" x="-20%" y="-20%" filterUnits="userSpaceOnUse">
        <feFlood result="flood" floodColor="#FFFFFF" floodOpacity={1} />
        <feComposite in="flood" result="mask" in2="SourceGraphic" operator="in" />
        <feMorphology in="mask" result="dilated" operator="dilate" radius="2" />
        <feGaussianBlur in="dilated" result="blurred" stdDeviation={4} />
        <feMerge>
          <feMergeNode in="blurred" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="dropShadow" filterUnits="userSpaceOnUse">
        <feOffset result="offOut" in="SourceAlpha" dx="1" dy="1" />
        <feGaussianBlur result="blurOut" in="offOut" stdDeviation="3" />
        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
      </filter>
      <pattern id="bgPattern" x={0} y={0} width={50} height={50} patternUnits="userSpaceOnUse">
        <rect x={0} y={0} width={50} height={50} fill="#F0F0F0" />
        <circle cx={25} cy={25} r={2} fill="#AAAAAA" />
      </pattern>
    </defs>
  );
};
