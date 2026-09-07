export function VolcanoIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Lava glow at base */}
      <ellipse cx="16" cy="29" rx="10" ry="2" fill="#FF5722" opacity="0.25" />
      {/* Volcano mountain body */}
      <path
        d="M2 28 L11 14 L16 10 L21 14 L30 28 Z"
        fill="#78716C"
        stroke="#57534E"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Snow cap / crater highlight */}
      <path
        d="M13 13 L16 10 L19 13 Q17 12 16 11.5 Q15 12 13 13Z"
        fill="#E5E7EB"
        opacity="0.6"
      />
      {/* Crater */}
      <ellipse
        cx="16"
        cy="10"
        rx="3"
        ry="1.5"
        fill="#1C1917"
        stroke="#44403C"
        strokeWidth="0.8"
      />
      {/* Lava eruption */}
      <path
        d="M16 10 Q14 5 13 2"
        stroke="#FF5722"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M16 10 Q18 4 19 1"
        stroke="#FF8C00"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M16 10 Q16 5 17 3"
        stroke="#FFC107"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* Lava blobs */}
      <circle cx="13" cy="2" r="1.5" fill="#FF5722" />
      <circle cx="19" cy="1.5" r="1.2" fill="#FF8C00" />
      <circle cx="17" cy="3" r="1" fill="#FFC107" />
      {/* Smoke puff */}
      <circle cx="15" cy="3" r="2" fill="#9CA3AF" opacity="0.3" />
      <circle cx="17" cy="2" r="1.5" fill="#9CA3AF" opacity="0.25" />
      <circle cx="19" cy="3.5" r="1.8" fill="#9CA3AF" opacity="0.2" />
      {/* Lava flow on slope */}
      <path
        d="M18 15 Q20 18 19 22 Q18 25 20 27"
        stroke="#FF5722"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
