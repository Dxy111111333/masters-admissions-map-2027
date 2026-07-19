import { BudgetDonut } from "@/components/BudgetDonut";
import { formatCny, formatOriginal } from "@/lib/formatters";
import type { Program } from "@/lib/types";

export function BudgetBreakdown({ program }: { program: Program }) {
  const incompleteItems = program.costBreakdown.filter((item) => item.amountCny === null);
  return (
    <section className="detail-section budget-section" id="budget-detail">
      <div className="detail-section-heading"><div><span>FULL-PERIOD BUDGET</span><h2>预算明细</h2></div><p>以下金额覆盖完整学制，并同时保留原币与人民币口径。</p></div>
      <div className="budget-summary-card">
        <div><span>完整学制预计总成本</span><strong>{formatCny(program.totalEstimatedCostCny)}</strong><small>{formatOriginal(program.totalEstimatedCost, program.tuitionCurrency)} · {program.durationLabel ?? "学制信息不完整"}</small></div>
        <dl><div><dt>费用期间</dt><dd>{program.durationLabel ?? "信息不完整"}</dd></div><div><dt>原始币种</dt><dd>{program.tuitionCurrency}</dd></div><div><dt>人民币估算</dt><dd>{program.exchangeRate === null ? "汇率信息不完整" : `1 ${program.tuitionCurrency} ≈ ${program.exchangeRate} CNY`}</dd></div></dl>
      </div>
      {incompleteItems.length > 0 && <p className="budget-warning">费用信息不完整：{incompleteItems.map((item) => item.label).join("、")}未单独记录，图中不按 0 元处理；总额仅沿用现有完整学制估算。</p>}
      <details className="budget-disclosure" open><summary>查看各项费用分布 <span aria-hidden="true">＋</span></summary><BudgetDonut items={program.costBreakdown}/></details>
    </section>
  );
}
