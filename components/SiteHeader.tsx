/* eslint-disable @next/next/no-html-link-for-pages -- static export uses full-page navigation */
import { CompassIcon } from "@/components/Icons";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="page-shell header-inner">
        <a className="site-logo" href="/" aria-label="留学罗盘首页">
          <span className="logo-mark"><CompassIcon /></span>
          <span><strong>留学罗盘</strong><small>STUDY COMPASS</small></span>
        </a>
        <nav className="main-nav" aria-label="主导航">
          <a href="/">首页</a>
          <a href="/#filters">国家或地区</a>
          <a href="/#results">院校与专业</a>
        </nav>
      </div>
    </header>
  );
}
