import type { FilterState, GradeScale, MatchSignal, Program, ProgramMatch } from "@/lib/types";

const gradeBands: Record<GradeScale, Array<[number, number]>> = {
  percentage: [[50, .5], [60, .6], [70, .68], [75, .74], [80, .8], [85, .86], [90, .92], [95, .97], [100, 1]],
  gpa4: [[2, .6], [2.5, .7], [3, .8], [3.3, .85], [3.5, .9], [3.7, .94], [4, 1]],
  gpa5: [[2.5, .6], [3, .68], [3.5, .75], [4, .8], [4.5, .9], [5, 1]],
  uk_honours: [[1, .58], [2, .68], [3, .8], [4, .9]],
};

export function normalizeGrade(scale: GradeScale, value: number) {
  const bands = gradeBands[scale];
  if (value <= bands[0][0]) return bands[0][1];
  for (let index = 1; index < bands.length; index += 1) {
    const [rightInput, rightOutput] = bands[index];
    const [leftInput, leftOutput] = bands[index - 1];
    if (value <= rightInput) {
      const ratio = (value - leftInput) / (rightInput - leftInput);
      return Number((leftOutput + ratio * (rightOutput - leftOutput)).toFixed(4));
    }
  }
  return bands.at(-1)?.[1] ?? 1;
}

export function gradeEquivalents(scale: GradeScale, value: number) {
  const normalized = normalizeGrade(scale, value);
  const nearest = (target: GradeScale) => gradeBands[target].reduce((best, item) => Math.abs(item[1] - normalized) < Math.abs(best[1] - normalized) ? item : best)[0];
  const honours = nearest("uk_honours");
  const honoursLabels: Record<number, string> = { 1: "Third", 2: "2:2", 3: "2:1", 4: "First" };
  return `约等于百分制 ${nearest("percentage")}、GPA ${nearest("gpa4").toFixed(1)}/4.0、${nearest("gpa5").toFixed(1)}/5.0、英国 ${honoursLabels[honours]}`;
}

function academicSignal(program: Program, filters: FilterState): MatchSignal {
  const requirement = program.minimumAcademicScoreNormalized;
  if (requirement === null) {
    return { state: "unknown", label: "成绩需要人工确认", detail: "官网未给出可可靠统一换算的数值门槛" };
  }
  const gap = normalizeGrade(filters.gradeScale, filters.gradeValue) - requirement;
  if (gap >= 0) return { state: "meets", label: "成绩达到参考门槛", detail: "达到当前结构化最低要求；最终以院校审核为准" };
  if (gap >= -0.05) return { state: "borderline", label: "成绩接近门槛", detail: "与结构化参考门槛差距较小，可作为冲刺项目保留" };
  return { state: "needs", label: "成绩低于参考门槛", detail: "当前换算结果低于结构化参考门槛" };
}

function languageSignal(program: Program, filters: FilterState): MatchSignal {
  if (filters.noLanguageScore) return { state: "borderline", label: "需补语言", detail: "暂未取得语言成绩，项目仍保留供规划" };
  const requirement = program.languageRequirements.find((item) => item.test === filters.languageTest);
  if (!requirement) return { state: "unknown", label: "该考试需查官网", detail: `现有官网数据未结构化 ${filters.languageTest} 要求` };

  const sectionNames = { reading: "阅读", writing: "写作", listening: "听力", speaking: "口语" } as const;
  const failedSections = (Object.keys(sectionNames) as Array<keyof typeof sectionNames>).filter((section) => {
    const required = requirement.sectionMinimums?.[section] ?? requirement.sectionMinimum;
    return required !== null && filters.languageSections[section] < required;
  });
  const totalGap = filters.languageScore - requirement.overall;
  if (totalGap >= 0 && failedSections.length) {
    return { state: "needs", label: `${sectionNames[failedSections[0]]}小分不足`, detail: `总分达到要求，但${failedSections.map((item) => sectionNames[item]).join("、")}未达到官网单项要求` };
  }
  if (totalGap >= 0) return { state: "meets", label: "语言达到要求", detail: `${filters.languageTest} 总分与已结构化小分均达到官网最低要求` };
  const tolerance = filters.languageTest === "IELTS" ? .5 : filters.languageTest === "DET" ? 10 : 5;
  if (totalGap >= -tolerance) return { state: "borderline", label: "语言接近门槛", detail: `总分距离最低要求 ${Math.abs(totalGap)} 分` };
  return { state: "needs", label: "需补语言", detail: `当前总分低于官网最低要求 ${requirement.overall}` };
}

function budgetSignal(program: Program, filters: FilterState): MatchSignal {
  if (program.totalEstimatedCostCny === null) return { state: "unknown", label: "预算信息不完整", detail: "完整学制费用数据暂缺" };
  const totalWan = program.totalEstimatedCostCny / 10_000;
  if (totalWan >= filters.budgetMinWan && totalWan <= filters.budgetMaxWan) {
    return { state: "meets", label: "预算区间重合", detail: `预计完整学制成本约 ${Math.round(totalWan)} 万元` };
  }
  if (totalWan < filters.budgetMinWan) return { state: "meets", label: "低于预算区间", detail: `预计完整学制成本约 ${Math.round(totalWan)} 万元` };
  const buffer = Math.max(5, filters.budgetMaxWan * .1);
  if (totalWan <= filters.budgetMaxWan + buffer) return { state: "borderline", label: "预算略高", detail: `预计比上限高约 ${Math.ceil(totalWan - filters.budgetMaxWan)} 万元` };
  return { state: "needs", label: "明显超出预算", detail: `预计比上限高约 ${Math.ceil(totalWan - filters.budgetMaxWan)} 万元` };
}

function qsSignal(program: Program): MatchSignal {
  if (program.qsRank === null) return { state: "unknown", label: "QS 未独立列名", detail: "该校区或项目未在当前榜单独立列名" };
  return { state: "meets", label: `QS 世界第 ${program.qsRankLabel ?? program.qsRank}`, detail: `${program.qsYear} QS 世界大学排名` };
}

export function evaluateProgram(program: Program, filters: FilterState): ProgramMatch | null {
  if (filters.regions.length && !filters.regions.includes(program.region)) return null;
  if (program.qsRank === null) {
    if (!filters.includeUnranked) return null;
  } else if (program.qsRank < filters.qsMin || program.qsRank > filters.qsMax) return null;

  const budget = budgetSignal(program, filters);
  if (budget.state === "needs") return null;
  const academic = academicSignal(program, filters);
  const language = languageSignal(program, filters);
  const qs = qsSignal(program);
  let score = 70;
  if (academic.state === "meets") score += 12;
  if (academic.state === "borderline") score -= 7;
  if (academic.state === "needs") score -= 18;
  if (language.state === "meets") score += 10;
  if (language.state === "borderline") score -= 4;
  if (language.state === "needs") score -= 12;
  if (budget.state === "meets") score += 8;
  if (budget.state === "borderline") score -= 4;
  if (budget.state === "unknown") score -= 4;
  if (qs.state === "unknown") score -= 3;

  const category = academic.state === "needs" || academic.state === "borderline" || language.state === "needs"
    ? "冲刺"
    : academic.state === "meets" && language.state === "meets" && budget.state === "meets" ? "稳妥" : "匹配";
  return { program, academic, language, budget, qs, category, matchScore: Math.max(0, Math.min(100, score)) };
}

export function filterAndSortPrograms(programs: Program[], filters: FilterState) {
  const matches = programs.map((program) => evaluateProgram(program, filters)).filter((item): item is ProgramMatch => item !== null);
  return matches.sort((left, right) => {
    if (filters.sort === "qs") return (left.program.qsRank ?? Number.POSITIVE_INFINITY) - (right.program.qsRank ?? Number.POSITIVE_INFINITY);
    if (filters.sort === "budget") return (left.program.totalEstimatedCostCny ?? Number.POSITIVE_INFINITY) - (right.program.totalEstimatedCostCny ?? Number.POSITIVE_INFINITY);
    if (filters.sort === "duration") return (left.program.durationMonths ?? Number.POSITIVE_INFINITY) - (right.program.durationMonths ?? Number.POSITIVE_INFINITY);
    return right.matchScore - left.matchScore || (left.program.qsRank ?? Number.POSITIVE_INFINITY) - (right.program.qsRank ?? Number.POSITIVE_INFINITY);
  });
}
