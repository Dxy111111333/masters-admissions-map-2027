/* eslint-disable @next/next/no-html-link-for-pages -- static export uses full-page navigation */
import type { Metadata } from "next";
import { BackToResults } from "@/components/BackToResults";
import { BudgetBreakdown } from "@/components/BudgetBreakdown";
import { ExternalIcon } from "@/components/Icons";
import { RequirementPanels } from "@/components/RequirementPanels";
import { SiteHeader } from "@/components/SiteHeader";
import { formatCny, formatOriginal, formatQs } from "@/lib/formatters";
import { parseFilterState, serializeFilterState } from "@/lib/filter-state";
import { getProgram } from "@/lib/programs";

interface ProgramPageProps {
  params: Promise<{ programId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: ProgramPageProps): Promise<Metadata> {
  const { programId } = await params;
  const program = getProgram(programId);
  return {
    title: program ? `${program.universityNameZh} · ${program.programNameEn}` : "项目未找到",
    description: program ? `${program.region}硕士项目的入学要求、语言成绩、完整学制预算与官方链接。` : "项目数据不存在。",
    robots: { index: false, follow: false },
  };
}

export default async function ProgramPage({ params, searchParams }: ProgramPageProps) {
  const { programId } = await params;
  const program = getProgram(programId);
  if (!program) return <><SiteHeader/><main className="page-shell not-found"><span>404</span><h1>没有找到这个项目</h1><a href="/">返回筛选首页</a></main></>;

  const filterQuery = serializeFilterState(parseFilterState(await searchParams));
  const rawLinks = [
    ["院校官方网站", program.officialUniversityUrl],
    ["专业官方页面", program.officialProgramUrl],
    ["官方入学要求", program.officialRequirementUrl],
    ["学费与费用说明", program.officialFeeUrl],
    ["奖学金说明", program.officialScholarshipUrl],
    ["QS 排名页面", program.qsUrl],
  ] as const;
  const seen = new Set<string>();
  const officialLinks = rawLinks.filter(([, url]) => url && !seen.has(url) && seen.add(url));

  return (
    <>
      <SiteHeader/>
      <main className="detail-page page-shell">
        <BackToResults fallbackQuery={filterQuery}/>
        <section className="program-hero">
          <div className="program-hero-main">
            <div className="detail-status"><span>{program.subjectArea ?? "硕士项目"}</span></div>
            <h1>{program.universityNameZh}</h1>
            <p className="detail-program-name">{program.programNameEn}</p>
            <p>{[program.city, program.region].filter(Boolean).join(" · ")}</p>
          </div>
          <aside className="qs-ticket"><span>QS WORLD UNIVERSITY RANKINGS</span><strong>{program.qsRankLabel ?? "—"}</strong><small>{program.qsRank === null ? "未独立列名" : `${program.qsYear} 世界大学排名`}</small></aside>
        </section>

        <section className="study-structure" aria-label="学制与毕业要求">
          <div><span>学制</span><h2>{program.durationLabel ?? "官网未注明"}</h2><p>{program.durationMonths ? `${program.durationMonths} 个月 · ` : ""}{program.studyMode ?? "学习模式以官网为准"}</p></div>
          <div><span>学分</span><h2>{program.credits ?? "官网未注明"}</h2><p>{program.courseStructure ?? "课程结构请查看专业官网"}</p></div>
          <div><span>毕业要求</span><h2>{program.completionRequirement ? "按培养方案完成" : "官网未注明"}</h2><p>{program.completionRequirement ?? "请在专业官网或培养方案中进一步核对"}</p></div>
        </section>

        <section className="core-facts" aria-label="项目核心信息">
          <div><span>学位类型</span><strong>{program.degreeType ?? "待核实"}</strong><small>{program.studyMode ?? "学习模式待核实"}</small></div>
          <div><span>标准学制</span><strong>{program.durationLabel ?? "待核实"}</strong><small>{program.durationMonths ? `${program.durationMonths} 个月` : "月份待核实"}</small></div>
          <div><span>QS 排名</span><strong>{formatQs(program.qsRank, program.qsRankLabel)}</strong><small>{program.qsYear} QS WUR</small></div>
          <div className="fact-budget"><span>预计总预算</span><strong>{formatCny(program.totalEstimatedCostCny, true)}</strong><small>{formatOriginal(program.totalEstimatedCost, program.tuitionCurrency)}</small></div>
        </section>

        <div className="detail-layout">
          <div><RequirementPanels program={program}/><BudgetBreakdown program={program}/></div>
          <aside className="application-rail">
            {program.officialApplicationUrl && <div className="apply-card"><span>OFFICIAL APPLICATION</span><h2>从大学官方入口开始申请</h2><p>链接已核对为院校官方域名；将于新标签页打开。</p><a className="apply-button" href={program.officialApplicationUrl} target="_blank" rel="noopener noreferrer">立即申请 / Apply Now <ExternalIcon /></a></div>}
            <div className="official-links"><h3>官方链接</h3>{officialLinks.map(([label, url]) => <a href={url ?? undefined} target="_blank" rel="noopener noreferrer" key={label}>{label}<ExternalIcon /></a>)}</div>
          </aside>
        </div>
      </main>
    </>
  );
}
