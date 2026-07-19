const regions = [
  { name: "香港", kicker: "Harbour Ledger", count: 6, qs: 5, color: "#006D77", note: "一年制经济学项目与QS优势集中" },
  { name: "澳门", kicker: "Duration Audit", count: 3, qs: 0, color: "#7A3E65", note: "项目以2年制为主，单独保留核查" },
  { name: "英国", kicker: "One-Year Atlas", count: 8, qs: 8, color: "#183A61", note: "一年制选择最丰富，重点看预算" },
  { name: "新西兰", kicker: "Southern Portfolio", count: 7, qs: 2, color: "#1D6A50", note: "1年与1.5年路径并存" },
  { name: "湾区校区", kicker: "Greater Bay Ledger", count: 4, qs: 0, color: "#8C3D2E", note: "港中深与港城大（东莞）项目" },
];

export default function Home() {
  return (
    <main>
      <header className="topbar shell">
        <div className="brand">ADMISSIONS DOSSIER</div>
        <span className="edition">PUBLIC REFERENCE · 2027</span>
      </header>

      <section className="hero shell">
        <p className="eyebrow">2027 MASTER&apos;S ADMISSIONS · LIVE EDITION</p>
        <h1>硕士项目<br /><em>决策图谱</em></h1>
        <div className="hero-foot">
          <p>项目、QS、成本、语言细则与官网证据集中浏览。</p>
          <div className="stats" aria-label="网站数据概览">
            <span><strong>28</strong> 个项目</span>
            <span><strong>5</strong> 个地区</span>
            <span><strong>15</strong> 个QS前200</span>
          </div>
        </div>
      </section>

      <section className="regions shell" aria-label="地区入口">
        {regions.map((region, index) => (
          <a
            className="region-card"
            href={`/region/${region.name}.html`}
            key={region.name}
            style={{ "--region": region.color, "--delay": `${index * 70}ms` } as React.CSSProperties}
          >
            <span className="number">0{index + 1}</span>
            <div>
              <small>{region.kicker} · QS WORLD 2027</small>
              <h2>{region.name}</h2>
              <p>{region.note}</p>
              <div className="region-meta">{region.count} 个项目 · QS前200 {region.qs} 个</div>
            </div>
            <strong className="enter">进入页面 ↗</strong>
          </a>
        ))}
      </section>

      <footer className="shell footer">
        <span>数据更新：2026-07-18</span>
        <span>正式申请请以大学官网及最终Offer为准</span>
      </footer>
    </main>
  );
}
