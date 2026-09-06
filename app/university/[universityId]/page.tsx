/* eslint-disable @next/next/no-html-link-for-pages -- static export uses full-page navigation */
import type { Metadata } from "next";
import { ExternalIcon } from "@/components/Icons";
import { SiteHeader } from "@/components/SiteHeader";
import { UniversityPrograms } from "@/components/UniversityPrograms";
import { formatQs } from "@/lib/formatters";
import { getProgramsForUniversity, getUniversity, universities } from "@/lib/programs";

interface UniversityPageProps { params: Promise<{ universityId: string }> }

export function generateStaticParams() { return universities.map((university) => ({ universityId: university.id })); }

export async function generateMetadata({ params }: UniversityPageProps): Promise<Metadata> {
  const university = getUniversity((await params).universityId);
  return { title: university ? `${university.nameZh} · 院校项目` : "院校未找到", description: university ? `${university.nameZh}已收录项目与专业级申请要求。` : "院校数据不存在。", robots: { index: false, follow: false } };
}

export default async function UniversityPage({ params }: UniversityPageProps) {
  const university = getUniversity((await params).universityId);
  if (!university) return <><SiteHeader/><main className="page-shell not-found"><span>404</span><h1>没有找到这所院校</h1><a href="/">返回筛选首页</a></main></>;
  const programs = getProgramsForUniversity(university.id);
  return <>
    <SiteHeader/>
    <main className="university-page page-shell">
      <a className="back-link" href="/#results">← 返回院校与专业筛选</a>
      <section className="university-hero">
        <div><span className="section-eyebrow">UNIVERSITY PROFILE · {university.shortName ?? university.region}</span><h1>{university.nameZh}</h1><p className="university-name-en">{university.nameEn ?? "University profile"}</p><p className="university-location">{[university.city, university.region, university.country].filter(Boolean).join(" · ")}</p></div>
        <aside className="university-rank-card"><span>QS WORLD UNIVERSITY RANKINGS</span><strong>{formatQs(university.qsRank, university.qsRankLabel)}</strong><small>{university.qsRank ? `${university.qsYear} QS WUR · University level` : "当前榜单未独立列名"}</small></aside>
      </section>
      <section className="university-stable-facts" aria-label="院校层稳定信息"><div><span>院校层级</span><strong>{university.universityType ?? "院校类型待核实"}</strong></div><div><span>已收录项目</span><strong>{programs.length} 个</strong><small>经济学与商科相关硕士</small></div><div><span>官方入口</span>{university.universityUrl ? <a href={university.universityUrl} target="_blank" rel="noopener noreferrer">打开院校官网 <ExternalIcon/></a> : <strong>待核实</strong>}</div></section>
      <UniversityPrograms programs={programs}/>
    </main>
  </>;
}
