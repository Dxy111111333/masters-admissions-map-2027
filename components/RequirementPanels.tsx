import { ExternalIcon } from "@/components/Icons";
import type { Program } from "@/lib/types";

interface RequirementEntry { title: string; value: string | null; url: string | null; sourceLabel: string }

function SourceLink({ url, label }: { url: string | null; label: string }) {
  return url ? <a className="requirement-source" href={url} target="_blank" rel="noopener noreferrer">{label} <ExternalIcon /></a> : null;
}

export function RequirementPanels({ program }: { program: Program }) {
  const requirements: RequirementEntry[] = [
    { title: "学术成绩要求", value: program.academicRequirement, url: program.officialAcademicRequirementUrl, sourceLabel: "查看学术要求官网" },
    { title: "本科专业背景要求", value: program.backgroundRequirement === program.academicRequirement ? null : program.backgroundRequirement, url: program.officialAcademicRequirementUrl, sourceLabel: "查看专业背景官网" },
    { title: "先修课程要求", value: program.prerequisiteCourses, url: program.officialAcademicRequirementUrl, sourceLabel: "查看先修课程官网" },
    { title: "工作或实习经历要求", value: program.workExperienceRequirement, url: program.officialWorkExperienceUrl, sourceLabel: "查看经历要求官网" },
    { title: "申请材料", value: program.applicationMaterials, url: program.officialDocumentRequirementUrl, sourceLabel: "查看材料清单官网" },
    { title: "推荐信要求", value: program.recommendationRequirement, url: program.officialDocumentRequirementUrl, sourceLabel: "查看推荐信官网" },
    { title: "个人陈述要求", value: program.personalStatementRequirement, url: program.officialDocumentRequirementUrl, sourceLabel: "查看文书要求官网" },
    { title: "作品集或特殊要求", value: program.portfolioRequirement, url: program.officialDocumentRequirementUrl, sourceLabel: "查看特殊要求官网" },
  ].filter((item) => item.value);

  return (
    <section className="detail-section requirements-section" id="requirements">
      <div className="detail-section-heading"><div><span>ENTRY REQUIREMENTS</span><h2>入学要求</h2></div><p>每项均尽量保留官网表达，并在相邻位置附上来源入口。</p></div>
      <div className="requirement-list">
        <details className="requirement-panel" open>
          <summary><span>语言成绩要求</span><small>{program.languageRequirementRaw ?? "官网未提供可结构化分数"}</small></summary>
          <div className="requirement-body">
            {program.languageRequirements.length > 0 ? <div className="language-requirement-grid">{program.languageRequirements.map((item) => {
              const values = Object.values(item.sectionMinimums ?? {}).filter((value) => value !== null);
              const sectionCopy = values.length && new Set(values).size === 1 ? `各单项不低于 ${values[0]}` : item.sectionMinimum === null ? "单项要求见官网细则" : `各单项不低于 ${item.sectionMinimum}`;
              return <article key={item.test}><span>{item.test === "TOEFL" ? "TOEFL iBT" : item.test === "PTE" ? "PTE Academic" : item.test === "DET" ? "Duolingo English Test" : "IELTS Academic"}</span><strong>{item.overall}</strong><small>{sectionCopy}</small></article>;
            })}</div> : <p>当前官网资料未给出可结构化的语言分数，请直接打开官方语言要求核对。</p>}
            {program.languageRequirementDetails && <p>{program.languageRequirementDetails}</p>}
            {program.languagePolicyFacts.length > 0 && <dl className="policy-facts">{program.languagePolicyFacts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd className={`fact-${fact.tone}`}>{fact.value}</dd></div>)}</dl>}
            <SourceLink url={program.officialLanguageRequirementUrl} label="查看官方语言要求"/>
          </div>
        </details>

        {requirements.map((requirement, index) => <details className="requirement-panel" key={requirement.title} open={index < 2}><summary><span>{requirement.title}</span><small>展开查看</small></summary><div className="requirement-body"><p>{requirement.value}</p>{requirement.title === "学术成绩要求" && program.gradeRequirementSourceLabel && <p className="grade-source-note">统一尺度参考：{program.gradeRequirementSourceLabel}；来源层级：{program.gradeRequirementSourceType === "official" ? "院校官方" : program.gradeRequirementSourceType === "national_guidance" ? "国家或地区指导" : "一般参考，需结合院校审核"}。</p>}<SourceLink url={requirement.url} label={requirement.sourceLabel}/></div></details>)}

        <details className="requirement-panel deadline-panel" open>
          <summary><span>申请时间与截止日期</span><small>{program.applicationDeadlines.length ? `${program.applicationDeadlines.length} 条时间信息` : "官网未提供结构化日期"}</small></summary>
          <div className="requirement-body">
            {program.applicationDeadlines.length ? <div className="deadline-list">{program.applicationDeadlines.map((deadline, index) => <article key={`${deadline.roundName}-${index}`}><div><strong>{deadline.roundName}</strong><span>{deadline.deadlineType}</span></div><p>{deadline.deadlineDate}</p><dl><div><dt>适用人群</dt><dd>{deadline.applicantType}</dd></div><div><dt>入学批次</dt><dd>{deadline.intake ?? "以项目官网为准"}</dd></div></dl>{deadline.officialUrl && <SourceLink url={deadline.officialUrl} label="查看截止日期官网"/>}</article>)}</div> : <p>当前官网资料未给出可结构化日期，建议在准备申请前再次核对专业页面。</p>}
          </div>
        </details>
      </div>
    </section>
  );
}
