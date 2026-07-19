import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../out/", import.meta.url);
const forbidden = /输入访问密码|退出访问|site_password/iu;

test("exports an anonymous public homepage", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.match(html, /2027硕士项目决策图谱/);
  assert.match(html, /28[<\s]/);
  assert.match(html, /noindex/);
  assert.doesNotMatch(html, forbidden);
});

test("exports every region and preserves official language evidence", async () => {
  for (const name of ["香港", "澳门", "英国", "新西兰", "湾区校区"]) {
    const html = await readFile(new URL(`region/${name}.html`, root), "utf8");
    assert.match(html, /官网/);
    assert.match(html, /noindex/);
    assert.match(html, /href="\.\.\/index\.html"/);
    assert.doesNotMatch(html, forbidden);
  }
});
