export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <circle cx="16" cy="17" r="6" fill="var(--surface)" />
      <path
        d="M16 5v3M6.5 9.5l2 2M25.5 9.5l-2 2M4 17h3M25 17h3"
        stroke="var(--surface)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
