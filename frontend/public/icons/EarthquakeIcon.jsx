export function EarthquakeIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ground base */}
      <rect
        x="2"
        y="24"
        width="28"
        height="4"
        rx="1"
        fill="#8B7355"
        opacity="0.4"
      />
      {/* Crack lines in ground */}
      <path
        d="M10 24 L12 28"
        stroke="#6B5A3E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16 24 L14 28"
        stroke="#6B5A3E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M22 24 L24 28"
        stroke="#6B5A3E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Seismograph wave — jagged pulse line */}
      <polyline
        points="2,16 6,16 8,10 10,22 12,8 14,20 16,13 18,19 20,10 22,20 24,14 26,16 30,16"
        stroke="#3B82F6"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Glow effect center peak */}
      <polyline
        points="10,22 12,8 14,20 16,13 18,19 20,10 22,20"
        stroke="#60A5FA"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
      />
      {/* Radiating circles */}
      <circle
        cx="16"
        cy="24"
        r="2"
        fill="none"
        stroke="#EF4444"
        strokeWidth="1.2"
        opacity="0.7"
      />
      <circle
        cx="16"
        cy="24"
        r="4"
        fill="none"
        stroke="#EF4444"
        strokeWidth="0.8"
        opacity="0.4"
      />
    </svg>
  );
}
