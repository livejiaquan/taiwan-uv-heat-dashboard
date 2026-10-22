import { useId } from "react";

export function BrandMark() {
  const id = useId();
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7b500" />
          <stop offset="1" stopColor="#e8590c" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
      <circle cx="16" cy="17" r="6" fill="#ffffff" />
      <path
        d="M16 5v3M6.5 9.5l2 2M25.5 9.5l-2 2M4 17h3M25 17h3"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M5 25h22" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
