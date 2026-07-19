import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "留学罗盘｜院校与专业智能筛选", template: "%s｜留学罗盘" },
  description: "根据成绩、语言、完整学制预算和QS排名偏好，筛选适合规划的留学院校与硕士项目。",
  icons: { icon: "/favicon.svg" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
