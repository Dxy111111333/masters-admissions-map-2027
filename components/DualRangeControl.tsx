"use client";

interface DualRangeControlProps {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  low: number;
  high: number;
  format: (value: number) => string;
  onChange: (low: number, high: number) => void;
}

export function DualRangeControl({ id, label, min, max, step, low, high, format, onChange }: DualRangeControlProps) {
  const lowPercent = ((low - min) / (max - min)) * 100;
  const highPercent = ((high - min) / (max - min)) * 100;
  return (
    <div className="dual-range-control">
      <div className="range-label"><span>{label}</span><output>{format(low)} — {format(high)}</output></div>
      <div className="dual-range-track" style={{ "--range-low": `${lowPercent}%`, "--range-high": `${highPercent}%` } as React.CSSProperties}>
        <input id={`${id}-low`} aria-label={`${label}下限`} type="range" min={min} max={max} step={step} value={low} onChange={(event) => onChange(Math.min(Number(event.target.value), high), high)}/>
        <input id={`${id}-high`} aria-label={`${label}上限`} type="range" min={min} max={max} step={step} value={high} onChange={(event) => onChange(low, Math.max(Number(event.target.value), low))}/>
      </div>
      <div className="range-scale"><span>{format(min)}</span><span>{format(max)}</span></div>
    </div>
  );
}
