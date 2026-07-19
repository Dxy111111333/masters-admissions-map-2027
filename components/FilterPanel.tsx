"use client";

import { SlidersIcon } from "@/components/Icons";
import { DualRangeControl } from "@/components/DualRangeControl";
import { RangeControl } from "@/components/RangeControl";
import { RegionMultiSelect } from "@/components/RegionMultiSelect";
import { defaultFilters, gradeScales, languageScales, ukHonoursLabels } from "@/lib/filter-state";
import { gradeEquivalents } from "@/lib/matching";
import type { FilterState, GradeScale, LanguageTest } from "@/lib/types";

interface FilterPanelProps {
  filters: FilterState;
  regions: Array<{ name: string; count: number; code: string; nameEn: string }>;
  onChange: (next: FilterState) => void;
  onToggleRegion: (region: string) => void;
  onViewResults: () => void;
}

export function FilterPanel({ filters, regions, onChange, onToggleRegion, onViewResults }: FilterPanelProps) {
  const changeGradeScale = (scale: GradeScale) => onChange({ ...filters, gradeScale: scale, gradeValue: gradeScales[scale].defaultValue });
  const changeLanguage = (test: LanguageTest) => {
    const next = languageScales[test];
    onChange({ ...filters, languageTest: test, languageScore: next.defaultValue, languageSections: { reading: next.sectionDefault, writing: next.sectionDefault, listening: next.sectionDefault, speaking: next.sectionDefault } });
  };
  const grade = gradeScales[filters.gradeScale];
  const language = languageScales[filters.languageTest];
  const gradeOutput = filters.gradeScale === "uk_honours" ? ukHonoursLabels[filters.gradeValue] : String(filters.gradeValue);
  const sectionLabels = { reading: "阅读", writing: "写作", listening: "听力", speaking: "口语" } as const;

  return (
    <section className="filter-panel" aria-labelledby="filter-heading">
      <div className="filter-panel-heading" id="filter-heading"><span><SlidersIcon /> 个性化筛选</span><small>条件会实时更新下方结果</small></div>
      <div className="filter-content">
        <section className="filter-section region-filter">
          <div className="filter-title"><h3>国家或地区</h3></div>
          <RegionMultiSelect regions={regions} selected={filters.regions} onToggle={onToggleRegion} onClear={() => onChange({ ...filters, regions: [] })}/>
        </section>

        <section className="filter-section academic-filter">
          <div className="filter-title"><h3>当前成绩</h3></div>
          <div className="segmented grade-tabs" aria-label="成绩体系">
            {(Object.keys(gradeScales) as GradeScale[]).map((scale) => <button type="button" key={scale} aria-pressed={filters.gradeScale === scale} onClick={() => changeGradeScale(scale)}>{gradeScales[scale].label}</button>)}
          </div>
          <RangeControl id="grade-score" label="原始成绩" value={filters.gradeValue} min={grade.min} max={grade.max} step={grade.step} output={gradeOutput} onChange={(gradeValue) => onChange({ ...filters, gradeValue })}/>
          <p className="equivalent-grade">{gradeEquivalents(filters.gradeScale, filters.gradeValue)}</p>
          <p className="conversion-note">换算按分段参考带估算，不替代院校针对毕业院校、专业和评分体系的官方审核。</p>
        </section>

        <section className="filter-section language-filter">
          <div className="filter-title"><h3>语言成绩</h3></div>
          <div className="segmented language-tabs" aria-label="语言考试类型">
            {(Object.keys(languageScales) as LanguageTest[]).map((test) => <button type="button" key={test} aria-pressed={filters.languageTest === test} onClick={() => changeLanguage(test)}>{languageScales[test].label}</button>)}
          </div>
          <RangeControl id="language-score" label={`${language.label} 总分`} value={filters.languageScore} min={language.min} max={language.max} step={language.step} output={filters.noLanguageScore ? "暂未取得" : String(filters.languageScore)} disabled={filters.noLanguageScore} onChange={(languageScore) => onChange({ ...filters, languageScore })}/>
          <div className="language-sections" aria-label="语言单项成绩">
            {(Object.keys(sectionLabels) as Array<keyof typeof sectionLabels>).map((section) => <label key={section}><span>{sectionLabels[section]}</span><input disabled={filters.noLanguageScore} type="number" min={language.min} max={language.max} step={language.step} value={filters.languageSections[section]} onChange={(event) => onChange({ ...filters, languageSections: { ...filters.languageSections, [section]: Math.max(language.min, Math.min(language.max, Number(event.target.value))) } })}/></label>)}
          </div>
          <label className="soft-checkbox"><input type="checkbox" checked={filters.noLanguageScore} onChange={(event) => onChange({ ...filters, noLanguageScore: event.target.checked })}/><span aria-hidden="true"/> 暂未取得语言成绩</label>
        </section>

        <section className="filter-section range-pair-section">
          <div className="filter-title"><h3>完整学制预算</h3></div>
          <DualRangeControl id="budget" label="预算区间" min={5} max={150} step={1} low={filters.budgetMinWan} high={filters.budgetMaxWan} format={(value) => `${value} 万`} onChange={(budgetMinWan, budgetMaxWan) => onChange({ ...filters, budgetMinWan, budgetMaxWan })}/>
        </section>

        <section className="filter-section range-pair-section qs-filter">
          <div className="filter-title"><h3>QS 世界大学排名</h3></div>
          <DualRangeControl id="qs" label="排名区间" min={1} max={1400} step={1} low={filters.qsMin} high={filters.qsMax} format={(value) => `QS ${value}`} onChange={(qsMin, qsMax) => onChange({ ...filters, qsMin, qsMax })}/>
          <label className="soft-checkbox"><input type="checkbox" checked={filters.includeUnranked} onChange={(event) => onChange({ ...filters, includeUnranked: event.target.checked })}/><span aria-hidden="true"/> 保留 QS 未独立列名项目</label>
        </section>

        <div className="filter-footer"><button className="button-secondary" type="button" onClick={() => onChange(defaultFilters)}>重置</button><button className="button-primary" type="button" onClick={onViewResults}>查看匹配项目 <span aria-hidden="true">↓</span></button></div>
      </div>
    </section>
  );
}
