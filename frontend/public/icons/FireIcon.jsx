export function FireIcon({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 2C16 2 24 7 24 15C24 21.6274 19.5228 26 14 26C8.47715 26 5 21.6274 5 15C5 10 9 5 12 3C10.5 7 12 11 14 12C15.5 10 16 2 16 2Z"
        fill="#FF5722"
        stroke="#CC3300"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 9C15.5 9 20 12.5 20 16.5C20 19.5 17.5 22 14.5 22C11.5 22 9.5 19.5 9.5 16.5C9.5 13.5 12 10.5 13.5 9.5C12.5 12 13.5 14 14.5 14.5C15.5 13.5 15.5 9 15.5 9Z"
        fill="#FFC107"
        stroke="#E08800"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Hot embers */}
      <circle cx="20" cy="10" r="1" fill="#FF8C00" opacity="0.8" />
      <circle cx="22" cy="14" r="0.8" fill="#FF5722" opacity="0.6" />
      <circle cx="19" cy="7" r="0.6" fill="#FFC107" opacity="0.7" />
      {/* Ground glow */}
      <ellipse cx="14" cy="27" rx="6" ry="1.5" fill="#FF5722" opacity="0.15" />
    </svg>
  );
}
