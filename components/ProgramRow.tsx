import { ArrowIcon, ExternalIcon, InfoIcon } from "@/components/Icons";
import { formatCny, formatQs } from "@/lib/formatters";
import type { MatchSignal, ProgramMatch } from "@/lib/types";

function SignalPill({ signal }: { signal: MatchSignal }) {
  return <span className={`signal-pill signal-${signal.state}`} title={signal.detail}>{signal.label}</span>;
}

export function ProgramRow({ match, filterQuery }: { match: ProgramMatch; filterQuery: string }) {
  const { program } = match;
  const routeCodes: Record<string, string> = { 中国香港: "HKG", 中国澳门: "MFM", 英国: "UK", 新西兰: "NZ", 湾区校区: "GBA" };
  return (
    <article className="program-row">
      <span className="program-route-code" aria-hidden="true">{routeCodes[program.region] ?? "INTL"}</span>
      <div className="program-primary">
        <div className="row-kicker"><span className={`match-label match-${match.category}`}>{match.category}</span><span>{program.subjectArea ?? program.degreeType ?? "硕士项目"}</span></div>
        <h3>{program.universityNameZh}</h3>
        <p className="program-name">{program.programNameEn}</p>
        <p className="program-place">{[program.region, program.city].filter(Boolean).join(" · ")}</p>
      </div>

      <div className="program-facts" aria-label="项目核心信息">
        <div className="qs-fact"><span>QS 世界排名</span><strong>{formatQs(program.qsRank, program.qsRankLabel)}</strong><small>{program.qsYear} QS WUR</small></div>
        <div><span>学制</span><strong>{program.durationLabel ?? "待核实"}</strong><small>{program.degreeType ?? "学位类型待核实"}</small></div>
        <div><span>预计总预算</span><strong>{formatCny(program.totalEstimatedCostCny, true)}</strong><small>完整学制 · 人民币估算</small></div>
      </div>

      <div className="program-actions">
        <div className="signal-list"><SignalPill signal={match.academic}/><SignalPill signal={match.language}/><SignalPill signal={match.budget}/></div>
        <a className="detail-button" href={`/program/${encodeURIComponent(program.programId)}/?${filterQuery}`}>查看详情 <ArrowIcon /></a>
      </div>

      <details className="quick-view">
        <summary><InfoIcon /> 快速看重点</summary>
        <div className="quick-grid">
          {program.academicRequirement && <div><span>学术要求</span><p>{program.academicRequirement}</p></div>}
          {program.languageRequirementRaw && <div><span>语言要求</span><p>{program.languageRequirementRaw}</p></div>}
          {program.applicationDeadline && <div><span>申请截止</span><p>{program.applicationDeadline}</p></div>}
          {program.officialProgramUrl && <a href={program.officialProgramUrl} target="_blank" rel="noopener noreferrer">专业官网 <ExternalIcon /></a>}
        </div>
      </details>
    </article>
  );
}
