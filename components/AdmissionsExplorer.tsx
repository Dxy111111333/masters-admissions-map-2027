"use client";
/* eslint-disable @next/next/no-img-element -- the verified local photograph is already compressed and must remain portable in the static export */

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { FilterPanel } from "@/components/FilterPanel";
import { InteractiveGlobe } from "@/components/InteractiveGlobe";
import { ArrowIcon } from "@/components/Icons";
import { ResultsList } from "@/components/ResultsList";
import { defaultFilters, serializeFilterState } from "@/lib/filter-state";
import { filterAndSortPrograms } from "@/lib/matching";
import { getRegions, programs } from "@/lib/programs";
import type { FilterState, SortOption } from "@/lib/types";

export function AdmissionsExplorer({ initialFilters }: { initialFilters: FilterState }) {
  const [filters, setFilters] = useState(initialFilters);
  const deferredFilters = useDeferredValue(filters);
  const regions = useMemo(() => getRegions(), []);
  const matches = useMemo(() => filterAndSortPrograms(programs, deferredFilters), [deferredFilters]);
  const loading = deferredFilters !== filters;
  const filterQuery = serializeFilterState(filters);

  useEffect(() => {
    const hash = window.location.hash;
    window.history.replaceState({ filters: true }, "", `${window.location.pathname}?${serializeFilterState(filters)}${hash}`);
  }, [filters]);

  const toggleRegion = (region: string) => setFilters((current) => ({ ...current, regions: current.regions.includes(region) ? current.regions.filter((item) => item !== region) : [...current.regions, region] }));
  const updateSort = (sort: SortOption) => setFilters((current) => ({ ...current, sort }));
  const scrollResults = () => document.querySelector("#results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollExplore = () => document.querySelector("#filters")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <section className="home-hero-photo">
        <img src="/campus-students.jpg" alt="国际学生在校园中共同阅读和交流" fetchPriority="high"/>
        <div className="hero-photo-overlay"/>
        <div className="page-shell hero-photo-content">
          <p className="section-eyebrow">GLOBAL MASTER&apos;S EXPLORER · 2027</p>
          <h1>探索适合你的<br/>全球留学项目</h1>
          <p>根据成绩、语言、预算和排名偏好，找到更适合申请的院校与专业。</p>
          <button className="hero-cta" type="button" onClick={scrollExplore}>开始探索 <ArrowIcon /></button>
        </div>
        <a className="photo-credit" href="https://www.pexels.com/photo/group-students-talking-in-the-campus-7616700/" target="_blank" rel="noopener noreferrer">Photo: Pexels</a>
        <button className="hero-scroll-cue" type="button" onClick={scrollExplore} aria-label="滚动到筛选区"><span/>SCROLL</button>
      </section>

      <section className="discovery-section page-shell" id="filters" aria-label="全球项目筛选">
        <InteractiveGlobe regions={regions} selected={filters.regions} onToggle={toggleRegion}/>
        <FilterPanel filters={filters} regions={regions} onChange={setFilters} onToggleRegion={toggleRegion} onViewResults={scrollResults}/>
      </section>

      <main className="results-column page-shell">
        <ResultsList matches={matches} sort={filters.sort} loading={loading} filterQuery={filterQuery} onSort={updateSort} onReset={() => setFilters(defaultFilters)}/>
      </main>
    </>
  );
}
