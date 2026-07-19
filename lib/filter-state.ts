import type { FilterState, GradeScale, LanguageTest, SortOption } from "@/lib/types";

export const gradeScales: Record<GradeScale, { label: string; min: number; max: number; step: number; defaultValue: number }> = {
  percentage: { label: "百分制", min: 50, max: 100, step: 1, defaultValue: 85 },
  gpa4: { label: "4.0 制", min: 2, max: 4, step: 0.1, defaultValue: 3.4 },
  gpa5: { label: "5.0 制", min: 2.5, max: 5, step: 0.1, defaultValue: 4.25 },
  uk_honours: { label: "英国学位等级", min: 1, max: 4, step: 1, defaultValue: 3 },
};

export const ukHonoursLabels: Record<number, string> = { 1: "Third", 2: "2:2", 3: "2:1", 4: "First" };

export const languageScales: Record<LanguageTest, { label: string; min: number; max: number; step: number; defaultValue: number; sectionDefault: number }> = {
  IELTS: { label: "IELTS", min: 0, max: 9, step: 0.5, defaultValue: 6.5, sectionDefault: 6 },
  TOEFL: { label: "TOEFL iBT", min: 0, max: 120, step: 1, defaultValue: 80, sectionDefault: 20 },
  PTE: { label: "PTE Academic", min: 10, max: 90, step: 1, defaultValue: 60, sectionDefault: 55 },
  DET: { label: "Duolingo", min: 10, max: 160, step: 5, defaultValue: 120, sectionDefault: 100 },
};

export const defaultFilters: FilterState = {
  regions: [],
  gradeScale: "percentage",
  gradeValue: 85,
  languageTest: "IELTS",
  languageScore: 6.5,
  languageSections: { reading: 6, writing: 6, listening: 6, speaking: 6 },
  noLanguageScore: false,
  budgetMinWan: 10,
  budgetMaxWan: 60,
  qsMin: 1,
  qsMax: 1200,
  includeUnranked: true,
  sort: "match",
};

type SearchInput = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function boundedNumber(value: string | undefined, fallback: number, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

export function parseFilterState(input: SearchInput): FilterState {
  const gradeScaleValue = first(input.gscale);
  const gradeScale: GradeScale = gradeScaleValue === "gpa4" || gradeScaleValue === "gpa5" || gradeScaleValue === "uk_honours" ? gradeScaleValue : "percentage";
  const languageValue = first(input.lang);
  const languageTest: LanguageTest = languageValue === "TOEFL" || languageValue === "PTE" || languageValue === "DET" ? languageValue : "IELTS";
  const sortValue = first(input.sort);
  const sort: SortOption = sortValue === "qs" || sortValue === "budget" || sortValue === "duration" ? sortValue : "match";
  const grade = gradeScales[gradeScale];
  const language = languageScales[languageTest];
  const qsA = boundedNumber(first(input.qsmin), defaultFilters.qsMin, 1, 1400);
  const qsB = boundedNumber(first(input.qsmax), defaultFilters.qsMax, 1, 1400);
  const budgetA = boundedNumber(first(input.budgetmin), defaultFilters.budgetMinWan, 5, 150);
  const budgetLegacy = first(input.budget);
  const budgetB = boundedNumber(first(input.budgetmax) ?? budgetLegacy, defaultFilters.budgetMaxWan, 5, 150);

  return {
    regions: (first(input.regions) ?? "").split(",").map((value) => value.trim()).filter(Boolean),
    gradeScale,
    gradeValue: boundedNumber(first(input.grade), grade.defaultValue, grade.min, grade.max),
    languageTest,
    languageScore: boundedNumber(first(input.score), language.defaultValue, language.min, language.max),
    languageSections: {
      reading: boundedNumber(first(input.lr), language.sectionDefault, language.min, language.max),
      writing: boundedNumber(first(input.lw), language.sectionDefault, language.min, language.max),
      listening: boundedNumber(first(input.ll), language.sectionDefault, language.min, language.max),
      speaking: boundedNumber(first(input.ls), language.sectionDefault, language.min, language.max),
    },
    noLanguageScore: first(input.nolang) === "1",
    budgetMinWan: Math.min(budgetA, budgetB),
    budgetMaxWan: Math.max(budgetA, budgetB),
    qsMin: Math.min(qsA, qsB),
    qsMax: Math.max(qsA, qsB),
    includeUnranked: first(input.unranked) !== "0",
    sort,
  };
}

export function serializeFilterState(filters: FilterState) {
  const params = new URLSearchParams();
  if (filters.regions.length) params.set("regions", filters.regions.join(","));
  params.set("gscale", filters.gradeScale);
  params.set("grade", String(filters.gradeValue));
  params.set("lang", filters.languageTest);
  params.set("score", String(filters.languageScore));
  params.set("lr", String(filters.languageSections.reading));
  params.set("lw", String(filters.languageSections.writing));
  params.set("ll", String(filters.languageSections.listening));
  params.set("ls", String(filters.languageSections.speaking));
  if (filters.noLanguageScore) params.set("nolang", "1");
  params.set("budgetmin", String(filters.budgetMinWan));
  params.set("budgetmax", String(filters.budgetMaxWan));
  params.set("qsmin", String(filters.qsMin));
  params.set("qsmax", String(filters.qsMax));
  if (!filters.includeUnranked) params.set("unranked", "0");
  params.set("sort", filters.sort);
  return params.toString();
}
