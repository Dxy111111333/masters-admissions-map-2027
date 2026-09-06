"use client";

import { useMemo, useState } from "react";
import { ArrowIcon } from "@/components/Icons";
import { formatCny } from "@/lib/formatters";
import type { Program } from "@/lib/types";

const categoryOptions = ["全部", "Economics", "Finance", "Accounting", "Management", "Marketing", "Analytics", "International Business", "Supply Chain", "MBA"] as const;

function categoryFor(program: Program) {
  const value = `${program.subjectCategory ?? ""} ${program.programNameEn}`.toLowerCase();
  if (/econom|finance|financial|econometric/.test(value)) return value.includes("finance") ? "Finance" : "Economics";
  if (/account/.test(value)) return "Accounting";
  if (/marketing/.test(value)) return "Marketing";
  if (/analytics|information systems|data analytics/.test(value)) return "Analytics";
  if (/supply|logistic|operations/.test(value)) return "Supply Chain";
  if (/international business|global business|international trade/.test(value)) return "International Business";
  if (/mba|master of business administration|executive master/.test(value)) return "MBA";
  if (/management|business/.test(value)) return "Management";
  return "Management";
}

export function UniversityPrograms({ programs }: { programs: Program[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categoryOptions)[number]>("全部");
  const filtered = useMemo(() => programs.filter((program) => {
    const haystack = `${program.programNameEn} ${program.programNameZh ?? ""} ${program.subjectCategory ?? ""}`.toLowerCase();
    return (!query.trim() || haystack.includes(query.trim().toLowerCase())) && (category === "全部" || categoryFor(program) === category);
  }), [category, programs, query]);

  return (
    <section className="university-programs" aria-labelledby="programs-heading">
      <div className="university-programs-heading"><div><span>PROGRAM CATALOG</span><h2 id="programs-heading">选择你感兴趣的专业</h2><p>先选专业，再查看这一专业自己的学术、语言、费用与申请要求。</p></div><strong>{filtered.length} / {programs.length}</strong></div>
      <div className="program-directory-tools"><label><span className="sr-only">搜索专业</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索专业名称 / 关键词"/></label><div className="program-category-tabs" role="tablist" aria-label="专业分类">{categoryOptions.map((item) => <button type="button" role="tab" aria-selected={category === item} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div></div>
      <div className="university-program-grid">
        {filtered.map((program) => <article className="university-program-card" key={program.programId}>
          <div className="program-card-top"><span>{categoryFor(program)}</span><span>{program.verificationStatus === "verified" ? "已核对" : "待复核"}</span></div>
          <h3>{program.programNameEn}</h3>
          {program.programNameZh && <p className="program-card-zh">{program.programNameZh}</p>}
          <p className="program-card-meta">{[program.degreeType, program.durationText ?? program.durationLabel, program.intake].filter(Boolean).join(" · ") || "学制与入学批次以项目官网为准"}</p>
          <div className="program-card-bottom"><strong>{formatCny(program.totalEstimatedCostCny, true)}</strong><a href={`/program/${encodeURIComponent(program.programId)}/`}>查看专业要求 <ArrowIcon /></a></div>
        </article>)}
      </div>
      {!filtered.length && <div className="empty-state"><h3>没有找到对应专业</h3><p>可以清空关键词或切换分类。</p></div>}
    </section>
  );
}
