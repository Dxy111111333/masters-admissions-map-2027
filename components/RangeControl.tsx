interface RangeControlProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  output: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function RangeControl({ id, label, value, min, max, step, output, disabled, onChange }: RangeControlProps) {
  const progress = ((value - min) / (max - min)) * 100;
  return (
    <label className={`range-control${disabled ? " is-disabled" : ""}`} htmlFor={id}>
      <span className="range-head"><span>{label}</span><output htmlFor={id}>{output}</output></span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        style={{ "--range-progress": `${progress}%` } as React.CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="range-scale" aria-hidden="true"><span>{min}</span><span>{max}</span></span>
    </label>
  );
}
