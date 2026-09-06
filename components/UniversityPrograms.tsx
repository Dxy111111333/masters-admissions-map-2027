"use client";

import { useMemo, useState } from "react";
import { ArrowIcon, ExternalIcon } from "@/components/Icons";
import { formatCny, formatQs } from "@/lib/formatters";
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
          <div className="program-card-facts" aria-label="专业核心字段">
            <div><span>学制</span><strong>{program.durationText ?? program.durationLabel ?? "待核实"}</strong><small>{program.academicYear ?? program.intake ?? "入学批次待核实"}</small></div>
            <div><span>学分</span><strong>{program.credits ?? "待核实"}</strong><small>{program.completionRequirement ? "按培养方案完成" : "毕业要求见详情"}</small></div>
            <div><span>院校排名</span><strong>{formatQs(program.qsRank, program.qsRankLabel)}</strong><small>{program.qsYear ? `${program.qsYear} QS WUR` : "未独立列名"}</small></div>
            <div><span>预算</span><strong>{formatCny(program.totalEstimatedCostCny, true)}</strong><small>完整学制估算</small></div>
          </div>
          <div className="program-card-requirements">
            <div><span>语言</span><p>{program.languageRequirementRaw ?? "按项目官网核对"}</p></div>
            <div><span>学术 / GPA</span><p>{program.academicRequirementOriginal ?? program.academicRequirement ?? "按项目官网核对"}</p></div>
            <div><span>申请时间</span><p>{program.applicationDeadline ?? program.admissionCycle ?? "申请日期待公布"}</p></div>
          </div>
          <details className="program-card-costs"><summary>查看预算明细</summary><div>{program.costBreakdown.length ? program.costBreakdown.map((item) => <p key={item.key}><span>{item.label}</span><strong>{formatCny(item.amountCny, true)}</strong></p>) : <p>暂无完整预算明细</p>}</div></details>
          <div className="program-card-bottom"><strong>{formatCny(program.totalEstimatedCostCny, true)}</strong><div><a href={`/program/${encodeURIComponent(program.programId)}/`}>查看专业要求 <ArrowIcon /></a>{program.officialApplicationUrl && <a className="program-apply-link" href={program.officialApplicationUrl} target="_blank" rel="noopener noreferrer">立即申请 <ExternalIcon /></a>}</div></div>
        </article>)}
      </div>
      {!filtered.length && <div className="empty-state"><h3>没有找到对应专业</h3><p>可以清空关键词或切换分类。</p></div>}
    </section>
  );
}
