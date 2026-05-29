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
    <div className="control-group" role="group" aria-label={label}>
      <span className="control-label">{label}</span>
      <div className="flex min-w-0 flex-1 flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`segment-button ${value === option.key ? "is-active" : ""}`}
            aria-pressed={value === option.key}
            onClick={() => onChange(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
