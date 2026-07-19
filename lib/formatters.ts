export function formatCny(value: number | null, compact = false) {
  if (value === null) return "待核实";
  if (compact) return `${(value / 10_000).toFixed(value % 10_000 === 0 ? 0 : 1)} 万元`;
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 0 }).format(value);
}

export function formatOriginal(value: number | null, currency: string) {
  if (value === null) return "原币金额待核实";
  return `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
}

export function formatQs(rank: number | null, label: string | null) {
  return rank === null ? "未独立列名" : `QS ${label ?? rank}`;
}
