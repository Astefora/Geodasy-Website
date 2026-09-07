export function DroughtIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sun */}
      <circle
        cx="16"
        cy="10"
        r="5"
        fill="#F59E0B"
        stroke="#D97706"
        strokeWidth="1.2"
      />
      {/* Sun rays */}
      <line
        x1="16"
        y1="2"
        x2="16"
        y2="4"
        stroke="#F59E0B"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="16"
        x2="16"
        y2="18"
        stroke="#F59E0B"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="10"
        x2="6"
        y2="10"
        stroke="#F59E0B"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="10"
        x2="26"
        y2="10"
        stroke="#F59E0B"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="10.3"
        y1="4.3"
        x2="9"
        y2="3"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="21.7"
        y1="15.7"
        x2="23"
        y2="17"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="21.7"
        y1="4.3"
        x2="23"
        y2="3"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="10.3"
        y1="15.7"
        x2="9"
        y2="17"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Cracked dry earth */}
      <path
        d="M2 22 L30 22"
        stroke="#92400E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Main cracks */}
      <path
        d="M6 22 L8 26 L10 28"
        stroke="#78350F"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 22 L9 25"
        stroke="#92400E"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M14 22 L15 26 L13 29"
        stroke="#78350F"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 22 L17 25"
        stroke="#92400E"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M22 22 L24 25 L22 28"
        stroke="#78350F"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26 22 L27 26"
        stroke="#92400E"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Ground fill with crack pattern */}
      <path d="M2 22 L30 22 L30 30 L2 30 Z" fill="#D97706" opacity="0.12" />
      {/* Dead tree stump */}
      <rect
        x="14"
        y="18"
        width="4"
        height="4"
        rx="0.5"
        fill="#92400E"
        stroke="#78350F"
        strokeWidth="0.8"
      />
      <path
        d="M14 18 L12 15 M16 18 L16 14 M18 18 L20 15"
        stroke="#92400E"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
