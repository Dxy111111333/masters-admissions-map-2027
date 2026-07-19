import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { evaluateProgram, filterAndSortPrograms, normalizeGrade } from "../lib/matching.ts";

const catalog = JSON.parse(await readFile(new URL("../data/programs.json", import.meta.url), "utf8"));
const sample = catalog.programs.find((program) => program.qsRank !== null && program.totalEstimatedCostCny !== null);

const filters = {
  regions: [],
  gradeScale: "percentage",
  gradeValue: 85,
  languageTest: "IELTS",
  languageScore: 6.5,
  languageSections: { reading: 6, writing: 6, listening: 6, speaking: 6 },
  noLanguageScore: false,
  budgetMinWan: 10,
  budgetMaxWan: 80,
  qsMin: 1,
  qsMax: 1400,
  includeUnranked: true,
  sort: "match",
};

test("normalizes supported grade scales before comparison", () => {
  assert.equal(normalizeGrade("percentage", 85), 0.86);
  assert.ok(Math.abs(normalizeGrade("gpa4", 3.4) - 0.875) < .001);
  assert.equal(normalizeGrade("uk_honours", 3), 0.8);
});

test("keeps missing language scores as a planning signal instead of deleting projects", () => {
  const result = evaluateProgram(sample, { ...filters, noLanguageScore: true });
  assert.ok(result);
  assert.equal(result.language.state, "borderline");
  assert.match(result.language.label, /补语言/);
});

test("uses country, QS and full-program budget as hard filters", () => {
  assert.equal(evaluateProgram(sample, { ...filters, regions: ["不存在的地区"] }), null);
  assert.equal(evaluateProgram(sample, { ...filters, qsMin: 1300, qsMax: 1400 }), null);
  assert.equal(evaluateProgram(sample, { ...filters, budgetMaxWan: 5 }), null);
});

test("retains slightly lower academic scores as a reach project", () => {
  const structured = { ...sample, minimumAcademicScoreNormalized: 0.88 };
  const result = evaluateProgram(structured, filters);
  assert.ok(result);
  assert.equal(result.academic.state, "borderline");
  assert.equal(result.category, "冲刺");
});

test("sorts matches by QS, budget and duration without treating missing values as zero", () => {
  const subset = catalog.programs.slice(0, 8);
  const byQs = filterAndSortPrograms(subset, { ...filters, sort: "qs" });
  const qsValues = byQs.map((item) => item.program.qsRank ?? Number.POSITIVE_INFINITY);
  assert.deepEqual(qsValues, [...qsValues].sort((a, b) => a - b));
  const byBudget = filterAndSortPrograms(subset, { ...filters, sort: "budget" });
  const budgets = byBudget.map((item) => item.program.totalEstimatedCostCny ?? Number.POSITIVE_INFINITY);
  assert.deepEqual(budgets, [...budgets].sort((a, b) => a - b));
});
