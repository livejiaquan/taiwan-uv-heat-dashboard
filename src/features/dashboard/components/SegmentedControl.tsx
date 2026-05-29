interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: Array<{ key: T; label: string }>;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-ink-500">{label}</p>
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-ink-100 bg-ink-100/70 p-1">
        {options.map((option) => (
          <button
            key={option.key}
            className={`segment-button ${value === option.key ? "is-active" : ""}`}
            onClick={() => onChange(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
