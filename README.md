# 留学罗盘 · Study Compass

面向不同背景申请者的通用硕士项目筛选平台。当前目录包含 44 所院校、58 个经济学与商科相关硕士项目；录取要求、语言、学费、学制和截止日期均按专业记录，QS、城市和院校官网属于院校层信息。

## 主要能力

- 可拖动、触控、受限缩放的 Canvas 3D 地球，光点与地区多选双向同步；
- 可搜索国家或地区多选，支持标签单删与一键清空；
- 百分制、4.0 制、5.0 制、英国学位等级的分段标准化与近似等效提示；
- IELTS、TOEFL iBT、PTE Academic、DET 总分及四项小分逐项匹配；
- 完整学制预算与 QS 各使用一条双端范围滑杆；
- URL 查询参数保存条件，可直接复制分享；
- 一行一个项目的纵向结果列表；
- 院校目录页（`/university/{universityId}`）与专业详情页（`/program/{programId}`）两级导航；
- 58 个独立项目详情页；首页先以院校为推荐单位，进入院校页后再选择专业；
- 低语言门槛项目专项扩展：项目级官网或官方手册支持 IELTS 6.0 及以下的项目已单独补充，含 UM、Taylor's、APU 和 UTAS；
- 结构化语言细则、来源相邻展示、申请轮次、预算环形图和官方申请入口；
- 桌面、平板和手机响应式布局，支持键盘、焦点样式和减少动态效果。

## 目录结构

```text
app/
  page.tsx                         通用筛选首页
  program/[programId]/page.tsx    独立项目详情页
  university/[universityId]/page.tsx 院校层信息与专业选择页
components/
  AdmissionsExplorer.tsx          筛选状态与 URL 同步
  FilterPanel.tsx                 成绩、语言、预算、QS 筛选器
  InteractiveGlobe.tsx            自绘 Canvas 3D 地球
  RegionMultiSelect.tsx           可搜索多选与标签管理
  DualRangeControl.tsx            双端预算与 QS 滑杆
  ResultsList.tsx                 结果工具栏与空状态
  ProgramRow.tsx                  横向项目条目与摘要折叠
  RequirementPanels.tsx           结构化入学要求
  BudgetBreakdown.tsx             完整学制预算明细
  BudgetDonut.tsx                 可交互预算环形图
  BackToResults.tsx               保留筛选状态的返回入口
  UniversityPrograms.tsx          院校专业搜索与分类选择
data/programs.json                专业级目录数据（schemaVersion 3）
data/universities.json            院校层稳定信息与QS目录
lib/types.ts                      TypeScript 数据模型
lib/matching.ts                   独立、可测试的匹配与排序逻辑
lib/filter-state.ts               默认条件与 URL 参数序列化
scripts/migrate-legacy-data.mjs   旧 HTML 数据迁移脚本
scripts/export-static-site.mjs    首页、58 个专业详情页及 44 个院校页静态导出
tests/                            数据、匹配、HTML 与浏览器验收
artifacts/                        实际页面截图
```

`content/regions/` 仅作为旧数据迁移的可追溯来源，不再作为网站页面提供。

## 运行

需要 Node.js `>=22.13.0` 和 pnpm。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

构建静态网站：

```bash
pnpm build:static
```

输出目录为 `out/`，包含首页、58 个专业详情页和 44 个院校页。

本机预览静态网站：

```bash
pnpm preview:static
```

也可以直接双击项目上一级目录中的 `打开 Master Project 留学罗盘.lnk`。快捷方式会在后台启动本地预览服务并打开浏览器，无需手动进入终端。

运行全部自动检查：

```bash
pnpm lint
pnpm test
```

## 匹配规则

- 国家或地区与 QS 范围是硬筛选；完整学制预算允许最多 5 万元或上限 10% 的“略高”缓冲；
- 成绩按各体系分段参考带标准化，只有来源文字能可靠提取门槛时才比较；
- 成绩略低时保留并标记为“冲刺”；
- 暂无语言成绩时保留项目并标记“需补语言”；
- 不在不同语言考试之间做机械换算；总分达标但单项不足会明确指出具体小分；
- 缺少排名、预算或要求时显示“信息不完整”或“需要人工确认”，不按 0 或默认符合处理；
- “稳妥 / 匹配 / 冲刺”是规则标签，不代表官方录取概率。

## 截图

- `artifacts/home-desktop.png`
- `artifacts/filter-desktop.png`
- `artifacts/results-desktop.png`
- `artifacts/home-mobile.png`
- `artifacts/filter-mobile.png`
- `artifacts/program-detail-desktop.png`

## 待人工核实

详见 [DATA_REVIEW.md](./DATA_REVIEW.md)。
