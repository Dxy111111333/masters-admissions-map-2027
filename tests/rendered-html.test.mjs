import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../out/", import.meta.url);
const catalog = JSON.parse(await readFile(new URL("../data/programs.json", import.meta.url), "utf8"));
const universities = JSON.parse(await readFile(new URL("../data/universities.json", import.meta.url), "utf8"));

test("exports the generic interactive admissions homepage", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.match(html, /探索适合你的/);
  assert.match(html, /全球院校卫星地图/);
  assert.match(html, /个性化筛选/);
  assert.match(html, /推荐院校/);
  assert.match(html, /搜索院校/);
  assert.doesNotMatch(html, /陈昕洋|CXY88888888|输入访问密码/);
});

test("exports a real detail page for every program", async () => {
  for (const program of catalog.programs) {
    const html = await readFile(new URL(`program/${program.programId}/index.html`, root), "utf8");
    assert.match(html, new RegExp(program.universityNameZh));
    assert.match(html, /入学要求/);
    assert.match(html, /预算明细/);
    assert.match(html, /项目详情导航/);
    assert.doesNotMatch(html, /申请入口待核实|数据可信度|部分信息待核实/);
    assert.doesNotMatch(html, /陈昕洋|CXY88888888/);
  }
});

test("exports a university directory page for every normalized university", async () => {
  for (const university of universities.universities) {
    const html = await readFile(new URL(`university/${university.id}/index.html`, root), "utf8");
    assert.match(html, new RegExp(university.nameZh));
    assert.match(html, /选择你感兴趣的专业/);
    assert.match(html, /PROGRAM CATALOG/);
  }
});
