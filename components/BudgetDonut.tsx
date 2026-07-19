"use client";

import { useState } from "react";
import { formatCny } from "@/lib/formatters";
import type { CostItem } from "@/lib/types";

const colors: Record<string, string> = { tuition: "#0f5d67", accommodation: "#de8b57", living: "#e0b94e", insurance: "#9b7fb7", visa: "#d9696a", transport: "#61a78f", other: "#7696c8" };

export function BudgetDonut({ items }: { items: CostItem[] }) {
  const known = items.filter((item) => item.amountCny !== null && item.amountCny > 0);
  const total = known.reduce((sum, item) => sum + (item.amountCny ?? 0), 0);
  const [activeKey, setActiveKey] = useState(known[0]?.key ?? "");
  const segments = known.map((item, index) => {
    const percentage = total ? ((item.amountCny ?? 0) / total) * 100 : 0;
    const offset = known.slice(0, index).reduce((sum, previous) => sum + (total ? ((previous.amountCny ?? 0) / total) * 100 : 0), 0);
    return { item, percentage, offset };
  });
  const active = known.find((item) => item.key === activeKey) ?? known[0];
  return (
    <div className="budget-chart-wrap">
      <div className="budget-donut" role="img" aria-label="完整学制预算构成环形图">
        <svg viewBox="0 0 120 120">
          <circle className="donut-base" cx="60" cy="60" r="46" pathLength="100"/>
          {segments.map(({ item, percentage, offset }) => <circle key={item.key} className="donut-segment" cx="60" cy="60" r="46" pathLength="100" stroke={colors[item.key] ?? "#789"} strokeDasharray={`${percentage} ${100 - percentage}`} strokeDashoffset={-offset} onMouseEnter={() => setActiveKey(item.key)} onFocus={() => setActiveKey(item.key)} tabIndex={0}><title>{item.label}：{formatCny(item.amountCny)}（{percentage.toFixed(1)}%）</title></circle>)}
        </svg>
        <div className="donut-centre"><small>{active?.label ?? "暂无数据"}</small><strong>{formatCny(active?.amountCny ?? null, true)}</strong><span>{active && total ? `${(((active.amountCny ?? 0) / total) * 100).toFixed(1)}%` : "—"}</span></div>
      </div>
      <div className="budget-legend">{items.map((item) => <button type="button" className={activeKey === item.key ? "is-active" : ""} onMouseEnter={() => setActiveKey(item.key)} onFocus={() => setActiveKey(item.key)} key={item.key}><i style={{ background: colors[item.key] ?? "#789" }}/><span>{item.label}</span><strong>{formatCny(item.amountCny)}</strong><small>{item.amountCny && total ? `${((item.amountCny / total) * 100).toFixed(1)}%` : "信息不完整"}</small></button>)}</div>
    </div>
  );
}
