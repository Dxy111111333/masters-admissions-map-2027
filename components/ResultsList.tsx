import { ProgramRow } from "@/components/ProgramRow";
import type { ProgramMatch, SortOption } from "@/lib/types";

interface ResultsListProps {
  matches: ProgramMatch[];
  sort: SortOption;
  loading: boolean;
  filterQuery: string;
  onSort: (sort: SortOption) => void;
  onReset: () => void;
}

export function ResultsList({ matches, sort, loading, filterQuery, onSort, onReset }: ResultsListProps) {
  return (
    <section className={`results-section${loading ? " is-updating" : ""}`} id="results" aria-busy={loading}>
      <div className="results-heading">
        <div><p className="section-eyebrow">SMART MATCHES</p><h2>推荐项目</h2><p>按公开要求、语言、预算和排名范围做规则匹配，不代表官方录取概率。</p></div>
        <div className="results-tools"><strong aria-live="polite">{matches.length} 个项目</strong><label>排序<select value={sort} onChange={(event) => onSort(event.target.value as SortOption)}><option value="match">综合匹配度</option><option value="qs">QS排名从高到低</option><option value="budget">总预算从低到高</option><option value="duration">学制从短到长</option></select></label></div>
      </div>
      {loading && <div className="updating-bar" role="status"><span/> 正在更新匹配结果…</div>}
      <div className="program-list">
        {matches.length ? matches.map((match) => <ProgramRow match={match} filterQuery={filterQuery} key={match.program.programId}/>) : (
          <div className="empty-state">
            <span className="empty-orbit" aria-hidden="true">◎</span>
            <h3>这组条件暂时没有交集</h3>
            <p>可以尝试扩大 QS 范围、提高总预算，或勾选“QS 未独立列名项目”。</p>
            <button type="button" className="button-primary" onClick={onReset}>恢复默认条件</button>
          </div>
        )}
      </div>
    </section>
  );
}
