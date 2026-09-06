import { ArrowIcon } from "@/components/Icons";
import { formatCny, formatQs } from "@/lib/formatters";
import type { ProgramMatch, University } from "@/lib/types";

const categoryLabels: Record<string, string> = {
  Economics: "经济学",
  Finance: "金融",
  Accounting: "会计",
  Management: "管理",
  Marketing: "市场营销",
  Analytics: "商业分析",
  "International Business": "国际商务",
  "Supply Chain": "供应链",
  MBA: "工商管理",
};

function categoryFor(match: ProgramMatch) {
  const value = `${match.program.subjectCategory ?? ""} ${match.program.programNameEn}`.toLowerCase();
  if (/econom|econometric/.test(value)) return "Economics";
  if (/finance|financial/.test(value)) return "Finance";
  if (/account/.test(value)) return "Accounting";
  if (/marketing/.test(value)) return "Marketing";
  if (/analytics|information systems|data analytics/.test(value)) return "Analytics";
  if (/supply|logistic|operations/.test(value)) return "Supply Chain";
  if (/international business|global business|international trade/.test(value)) return "International Business";
  if (/mba|master of business administration|executive master|management|business/.test(value)) return "Management";
  return "Management";
}

function bestMatch(matches: ProgramMatch[]) {
  return [...matches].sort((a, b) => b.matchScore - a.matchScore)[0] ?? null;
}

export interface UniversityRowProps {
  university: University;
  matchedPrograms: ProgramMatch[];
  totalPrograms: number;
  filterQuery: string;
}

export function UniversityRow({ university, matchedPrograms, totalPrograms, filterQuery }: UniversityRowProps) {
  const best = bestMatch(matchedPrograms);
  const categories = [...new Set(matchedPrograms.map(categoryFor))].slice(0, 4);
  const budgets = matchedPrograms.map(({ program }) => program.totalEstimatedCostCny).filter((value): value is number => value !== null);
  const budgetLabel = budgets.length
    ? budgets.length === 1
      ? formatCny(budgets[0], true)
      : `${formatCny(Math.min(...budgets), true)}–${formatCny(Math.max(...budgets), true)}`
    : "预算待核实";

  return (
    <article className="university-result-row">
      <span className="university-result-code" aria-hidden="true">{university.shortName ?? university.region.slice(0, 3).toUpperCase()}</span>
      <div className="university-result-primary">
        <div className="row-kicker"><span className={`match-label match-${best?.category ?? "匹配"}`}>{best?.category ?? "项目可选"}</span><span>{university.region}</span></div>
        <h3><a href={`/university/${encodeURIComponent(university.id)}/?${filterQuery}`}>{university.nameZh}</a></h3>
        <p className="university-result-en">{university.nameEn ?? university.shortName ?? "University profile"}</p>
        <p className="program-place">{[university.city, university.country].filter(Boolean).join(" · ")}</p>
        <div className="university-subjects" aria-label="已收录方向">
          {categories.map((category) => <span key={category}>{categoryLabels[category] ?? category}</span>)}
        </div>
      </div>

      <div className="university-result-facts" aria-label="院校摘要">
        <div><span>院校排名</span><strong>{formatQs(university.qsRank, university.qsRankLabel)}</strong><small>{university.qsYear ? `${university.qsYear} QS WUR` : "排名未独立列名"}</small></div>
        <div><span>专业目录</span><strong>{matchedPrograms.length} / {totalPrograms}</strong><small>符合当前筛选 / 已收录</small></div>
        <div><span>预算参考</span><strong>{budgetLabel}</strong><small>按专业分别估算</small></div>
      </div>

      <div className="university-result-action">
        <span>进入院校页选择专业</span>
        <a className="detail-button" href={`/university/${encodeURIComponent(university.id)}/?${filterQuery}`}>查看全部专业 <ArrowIcon /></a>
      </div>
    </article>
  );
}
