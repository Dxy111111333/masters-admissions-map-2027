import { AdmissionsExplorer } from "@/components/AdmissionsExplorer";
import { SiteHeader } from "@/components/SiteHeader";
import { parseFilterState } from "@/lib/filter-state";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const filters = parseFilterState(await searchParams);
  return (
    <>
      <SiteHeader/>
      <AdmissionsExplorer initialFilters={filters}/>
      <footer className="site-footer">
        <div className="page-shell"><div><strong>留学罗盘 · STUDY COMPASS</strong><p>把公开信息整理成更容易理解的申请选择。</p></div><p>数据仅供规划参考 · 正式申请请以大学官网为准</p></div>
      </footer>
    </>
  );
}
