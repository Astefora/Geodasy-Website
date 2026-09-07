export function LandslideIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2 28 L12 8 L22 28 Z" fill="#A78BFA" opacity="0.15" />
      <path
        d="M2 28 L12 8 L22 28"
        stroke="#7C3AED"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M14 12 Q19 10 22 14 Q25 18 22 22 Q18 25 14 22 Q10 19 11 15 Q12 12 14 12Z"
        fill="#78716C"
        stroke="#44403C"
        strokeWidth="1.5"
      />
      <rect
        x="24"
        y="16"
        width="4"
        height="4"
        rx="1"
        fill="#A8A29E"
        stroke="#78716C"
        strokeWidth="1"
        transform="rotate(20 26 18)"
      />
      <rect
        x="22"
        y="22"
        width="3"
        height="3"
        rx="0.8"
        fill="#A8A29E"
        stroke="#78716C"
        strokeWidth="0.8"
        transform="rotate(-15 23 23)"
      />
      <rect
        x="26"
        y="21"
        width="2.5"
        height="2.5"
        rx="0.6"
        fill="#D6D3D1"
        stroke="#78716C"
        strokeWidth="0.7"
        transform="rotate(30 27 22)"
      />
      <circle cx="28" cy="18" r="1" fill="#D6D3D1" />
      <circle cx="25" cy="25" r="0.8" fill="#A8A29E" />
      <circle cx="29" cy="24" r="0.7" fill="#D6D3D1" />
      <ellipse cx="24" cy="26" rx="4" ry="2" fill="#D6D3D1" opacity="0.35" />
      <path
        d="M2 28 L30 28"
        stroke="#78716C"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11 14 L8 16 M12 17 L9 19 M13 20 L10 22"
        stroke="#7C3AED"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
