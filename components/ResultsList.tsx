"use client";

import { useMemo, useState } from "react";
import { UniversityRow } from "@/components/UniversityRow";
import { getUniversity, getUniversityProgramCount } from "@/lib/programs";
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
  const [query, setQuery] = useState("");
  const universityMatches = useMemo(() => {
    const grouped = new Map<string, ProgramMatch[]>();
    for (const match of matches) grouped.set(match.program.universityId, [...(grouped.get(match.program.universityId) ?? []), match]);
    const rows = [...grouped.entries()].flatMap(([universityId, matchedPrograms]) => {
      const university = getUniversity(universityId);
      return university ? [{ university, matchedPrograms, totalPrograms: getUniversityProgramCount(universityId) }] : [];
    });
    const normalized = query.trim().toLowerCase();
    return rows.filter(({ university }) => !normalized || `${university.nameZh} ${university.nameEn ?? ""} ${university.shortName ?? ""} ${university.region}`.toLowerCase().includes(normalized));
  }, [matches, query]);

  return (
    <section className={`results-section${loading ? " is-updating" : ""}`} id="results" aria-busy={loading}>
      <div className="results-heading">
        <div><p className="section-eyebrow">SMART MATCHES · UNIVERSITY LEVEL</p><h2>推荐院校</h2><p>首页先看学校；进入院校页后，再从该校已收录的经济学与商科专业中做选择。费用、语言和入学要求始终按专业分别计算。</p></div>
        <div className="results-tools"><strong aria-live="polite">{universityMatches.length} 所院校</strong><label>排序<select value={sort} onChange={(event) => onSort(event.target.value as SortOption)}><option value="match">综合匹配度</option><option value="qs">QS排名从高到低</option><option value="budget">总预算从低到高</option><option value="duration">学制从短到长</option></select></label></div>
      </div>
      <div className="university-search-bar"><label><span>搜索院校</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入学校中文名、英文名或地区"/></label><small>{matches.length} 个专业符合当前筛选</small></div>
      {loading && <div className="updating-bar" role="status"><span/> 正在更新匹配结果…</div>}
      <div className="university-list">
        {universityMatches.length ? universityMatches.map(({ university, matchedPrograms, totalPrograms }) => <UniversityRow university={university} matchedPrograms={matchedPrograms} totalPrograms={totalPrograms} filterQuery={filterQuery} key={university.id}/>) : (
          <div className="empty-state">
            <span className="empty-orbit" aria-hidden="true">◎</span>
            <h3>{matches.length ? "没有找到这所院校" : "这组条件暂时没有交集"}</h3>
            <p>{matches.length ? "可以换一个学校名称、英文简称或地区关键词。" : "可以尝试扩大 QS 范围、提高总预算，或勾选“QS 未独立列名项目”。"}</p>
            <button type="button" className="button-primary" onClick={onReset}>恢复默认条件</button>
          </div>
        )}
      </div>
    </section>
  );
}
