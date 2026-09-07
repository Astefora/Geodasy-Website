export function FloodIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sky / rain */}
      <path
        d="M6 4 L6 8 M10 2 L10 7 M14 4 L14 8 M18 2 L18 7 M22 4 L22 8 M26 2 L26 7"
        stroke="#60A5FA"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Cloud */}
      <path
        d="M8 9 Q7 6 10 6 Q11 3 15 4 Q18 3 19 6 Q22 6 22 9 Z"
        fill="#93C5FD"
        stroke="#3B82F6"
        strokeWidth="1"
      />
      {/* House partially submerged */}
      <path
        d="M10 22 L10 17 L16 13 L22 17 L22 22 Z"
        fill="#D97706"
        stroke="#92400E"
        strokeWidth="1.2"
      />
      <path
        d="M13 22 L13 19 L16 19 L16 22 Z"
        fill="#78350F"
        stroke="#92400E"
        strokeWidth="0.8"
      />
      {/* Roof */}
      <path
        d="M9 17 L16 12 L23 17"
        stroke="#92400E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Water waves */}
      <path
        d="M2 22 Q5 20 8 22 Q11 24 14 22 Q17 20 20 22 Q23 24 26 22 Q29 20 30 22"
        stroke="#2563EB"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M2 25 Q5 23 8 25 Q11 27 14 25 Q17 23 20 25 Q23 27 26 25 Q29 23 30 25"
        stroke="#3B82F6"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Water fill */}
      <path
        d="M2 22 Q5 20 8 22 Q11 24 14 22 Q17 20 20 22 Q23 24 26 22 Q29 20 30 22 L30 30 L2 30 Z"
        fill="#3B82F6"
        opacity="0.20"
      />
    </svg>
  );
}
