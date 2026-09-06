import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = path.join(projectRoot, "content", "regions");
const outputDirectory = path.join(projectRoot, "data");
const outputPath = path.join(outputDirectory, "programs.json");
const additionalProgramsPath = path.join(projectRoot, "content", "additional-programs.json");
const curatedExpansionPath = path.join(projectRoot, "content", "program-expansion.json");

const regionMeta = {
  香港: { country: "中国", region: "中国香港", code: "hk", currency: "HKD" },
  澳门: { country: "中国", region: "中国澳门", code: "mo", currency: "MOP" },
  英国: { country: "英国", region: "英国", code: "uk", currency: "GBP" },
  新西兰: { country: "新西兰", region: "新西兰", code: "nz", currency: "NZD" },
  湾区校区: { country: "中国", region: "湾区校区", code: "gba", currency: "CNY" },
};

// Only links confirmed on an official university domain are shown as application entry points.
const officialApplicationLinks = {
  "香港浸会大学": "https://iss.hkbu.edu.hk/amsappl_pg/welcome.jsf",
  "香港城市大学": "https://www.cityu.edu.hk/pg/taught-postgraduate-programmes/apply-now",
  "香港中文大学": "https://www.gradsch.cuhk.edu.hk/OnlineApp/login_email.aspx",
  "香港科技大学": "https://fytgs.hkust.edu.hk/apply",
  "香港理工大学": "https://www.polyu.edu.hk/study/pg/taught-postgraduate/online-application-tpg",
  "香港大学": "https://sweb.hku.hk/tola/servlet/CreateUserScreen/loginForm",
  "澳门大学": "https://isw.um.edu.mo/naweb_grs/",
  "澳门科技大学": "https://oas.must.edu.mo/admission/index_SGS_en.htm",
  "约克大学": "https://www.york.ac.uk/study/postgraduate-taught/apply/",
  "贝尔法斯特女王大学": "https://www.qub.ac.uk/Study/postgraduate/masters-degrees/applying/",
  "谢菲尔德大学": "https://sheffield.ac.uk/postgraduate/taught/apply/applying",
  "利兹大学": "https://www.leeds.ac.uk/masters-applying/doc/apply-masters-courses",
  "诺丁汉大学": "https://www.nottingham.ac.uk/pgstudy/how-to-apply/apply-online.aspx",
  "伯明翰大学": "https://www.birmingham.ac.uk/study/postgraduate/taught/apply",
  "格拉斯哥大学": "https://www.gla.ac.uk/postgraduate/how-to-apply-for-a-postgraduate-taught-degree/applying-for-a-programme/",
  "怀卡托大学": "https://www.waikato.ac.nz/study/apply/international/",
  "坎特伯雷大学": "https://www.canterbury.ac.nz/study/getting-started/admission-and-enrolment",
  "奥塔哥大学": "https://www.otago.ac.nz/study/qualifications/apply-for-a-programme",
  "林肯大学": "https://www.lincoln.ac.nz/study/apply-and-enrol/",
  "梅西大学": "https://www.massey.ac.nz/study/admission-and-enrolment/",
  "奥克兰理工大学": "https://www.aut.ac.nz/apply",
  "奥克兰大学": "https://www.auckland.ac.nz/en/study/applications-and-admissions/apply-now.html",
  "香港中文大学（深圳）": "https://pgapply.cuhk.edu.cn/",
};

function extractJsonArray(html) {
  const marker = "const DATA = ";
  const start = html.indexOf(marker);
  if (start < 0) throw new Error("Legacy page does not contain a DATA array");

  const arrayStart = html.indexOf("[", start + marker.length);
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = arrayStart; index < html.length; index += 1) {
    const character = html[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "[") depth += 1;
    else if (character === "]") {
      depth -= 1;
      if (depth === 0) return JSON.parse(html.slice(arrayStart, index + 1));
    }
  }
  throw new Error("Could not find the end of the legacy DATA array");
}

function stableHash(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function numberOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sanitizePlanningNote(value) {
  if (!value) return null;
  return value
    .replace("，但本页不把两年项目塞入40万元的一年制口径。", "。完整学制总费用仍待核实。")
    .replace("；因学制规则排除。", "；完整学制费用待核实。")
    .replace("总成本在40万元内，但标准学制为2年。", "标准学制为2年。")
    .trim();
}

function officialOrigin(url) {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function parseLanguageRequirements(language) {
  const summary = language?.summary ?? "";
  const details = language?.detail ?? "";
  const fullText = `${summary} ${details}`;
  const requirements = [];
  const sectionMinimums = (defaultMinimum = null) => {
    const patterns = {
      reading: /(?:阅读|Reading)\s*(?:不低于|至少|minimum|of)?\s*(\d+(?:\.\d+)?)/i,
      writing: /(?:写作|Writing)\s*(?:不低于|至少|minimum|of)?\s*(\d+(?:\.\d+)?)/i,
      listening: /(?:听力|Listening)\s*(?:不低于|至少|minimum|of)?\s*(\d+(?:\.\d+)?)/i,
      speaking: /(?:口语|Speaking)\s*(?:不低于|至少|minimum|of)?\s*(\d+(?:\.\d+)?)/i,
    };
    return Object.fromEntries(Object.entries(patterns).map(([key, pattern]) => [key, Number(fullText.match(pattern)?.[1]) || defaultMinimum]));
  };

  const ielts = fullText.match(/IELTS(?:\s+Academic)?\s*(\d(?:\.\d)?)/i);
  if (ielts) {
    const section = fullText.match(/(?:各项|单项)\s*(\d(?:\.\d)?)/);
    requirements.push({
      test: "IELTS",
      overall: Number(ielts[1]),
      sectionMinimum: section ? Number(section[1]) : null,
      sectionMinimums: sectionMinimums(section ? Number(section[1]) : null),
      raw: summary,
    });
  }

  const oldScale = fullText.match(/旧制\s*(\d{2,3})/);
  const toefl = fullText.match(/TOEFL(?:\s+iBT)?(?:\s+旧制)?\s*(\d{2,3})/i);
  const toeflScore = oldScale?.[1] ?? toefl?.[1];
  if (toeflScore) {
    requirements.push({ test: "TOEFL", overall: Number(toeflScore), sectionMinimum: null, sectionMinimums: sectionMinimums(), raw: summary });
  }

  const pte = fullText.match(/PTE(?:\s+Academic)?\s*(\d{2})/i);
  if (pte) {
    requirements.push({ test: "PTE", overall: Number(pte[1]), sectionMinimum: null, sectionMinimums: sectionMinimums(), raw: summary });
  }
  const det = fullText.match(/(?:Duolingo|DET)\s*(\d{2,3})/i);
  if (det) requirements.push({ test: "DET", overall: Number(det[1]), sectionMinimum: null, sectionMinimums: sectionMinimums(), raw: summary });
  return requirements;
}

function parseAcademicRequirement(rawText) {
  const text = rawText ?? "";
  let normalized = null;
  let label = null;
  if (/(?:2:1|upper second|二等一)/i.test(text)) { normalized = .8; label = "英国二等一荣誉学位"; }
  else if (/(?:2:2|lower second|二等二)/i.test(text)) { normalized = .68; label = "英国二等二荣誉学位"; }
  else if (/(?:second[- ]class|二等荣誉)/i.test(text)) { normalized = .68; label = "英国二等荣誉学位（未细分等级）"; }
  else if (/(?:average\s+B|B\s+average|平均.{0,3}B)/i.test(text)) { normalized = .75; label = "平均成绩 B（一般参考）"; }
  return {
    normalized,
    sourceType: normalized === null ? "manual_review" : "general_reference",
    sourceLabel: label,
    equivalents: normalized === null ? {} : normalized >= .8
      ? { percentage: "约 80–85+", gpa4: "约 3.0–3.3+/4.0", gpa5: "约 4.0+/5.0", uk_honours: "2:1" }
      : { percentage: "约 70–75+", gpa4: "约 2.5–3.0+/4.0", gpa5: "约 3.0–3.5+/5.0", uk_honours: "2:2" },
  };
}

function parseDeadlines(value, url, intake) {
  if (!value) return [];
  return value.split(/[；;]/).map((part, index) => ({
    roundName: value.includes("轮") ? `申请轮次 ${index + 1}` : index === 0 ? "主要申请截止" : `补充截止 ${index + 1}`,
    deadlineDate: part.trim().replace(/2027待公布/g, "2027 申请日期尚未公布"),
    applicantType: /国际|overseas|international/i.test(part) ? "国际申请者" : "全部申请者",
    intake: intake ?? null,
    deadlineType: /滚动|rolling/i.test(part) ? "滚动录取" : "日期截止",
    officialUrl: url ?? null,
  }));
}

function emptyCostBreakdown(currency = "") {
  return [
    ["tuition", "学费"],
    ["accommodation", "住宿或租房"],
    ["living", "生活费"],
    ["insurance", "医疗保险"],
    ["visa", "签证及申请费用"],
    ["transport", "当地交通"],
    ["other", "其他费用"],
  ].map(([key, label]) => ({ key, label, amountCny: null, amountOriginal: null, currency, period: "完整学制", source: "官方页面尚未给出可结构化金额", type: key === "tuition" ? "fixed" : "estimated" }));
}

function normalizeCuratedProgram(raw) {
  const officialProgramUrl = raw.officialProgramUrl ?? null;
  const officialRequirementUrl = raw.officialRequirementUrl ?? officialProgramUrl;
  const languageRequirements = Array.isArray(raw.languageRequirements) ? raw.languageRequirements : [];
  const workExperience = raw.workExperienceRequirement ?? null;
  const academicOriginal = raw.academicRequirement ?? null;
  const academicScope = raw.admissionRequirementScope ?? "program";
  return {
    universityId: raw.universityId,
    programId: raw.programId,
    universityNameZh: raw.universityNameZh,
    universityNameEn: raw.universityNameEn ?? null,
    universityShortName: raw.universityShortName ?? null,
    programNameZh: raw.programNameZh ?? null,
    programNameEn: raw.programNameEn,
    programShortName: raw.programShortName ?? null,
    subjectArea: raw.subjectArea ?? null,
    subjectCategory: raw.subjectCategory ?? raw.subjectArea ?? null,
    country: raw.country,
    region: raw.region,
    city: raw.city ?? null,
    degreeType: raw.degreeType ?? null,
    studyMode: raw.studyMode ?? null,
    durationMonths: numberOrNull(raw.durationMonths),
    durationLabel: raw.durationLabel ?? null,
    durationText: raw.durationText ?? raw.durationLabel ?? null,
    intake: raw.intake ?? null,
    intakeMonth: raw.intakeMonth ?? null,
    academicYear: raw.academicYear ?? "2027 Entry",
    admissionCycle: raw.admissionCycle ?? "2027 Entry",
    credits: raw.credits ?? null,
    courseStructure: raw.courseStructure ?? null,
    completionRequirement: raw.completionRequirement ?? null,
    qsRank: numberOrNull(raw.qsRank),
    qsRankLabel: raw.qsRankLabel ?? null,
    qsYear: numberOrNull(raw.qsYear) ?? 2027,
    qsIndependent: raw.qsIndependent !== false,
    academicRequirement: academicOriginal,
    academicRequirementOriginal: academicOriginal,
    academicScale: raw.academicScale ?? "official_text",
    minimumGpa: numberOrNull(raw.minimumGpa),
    minimumGrade: numberOrNull(raw.minimumGrade),
    minimumPercentage: numberOrNull(raw.minimumPercentage),
    qualificationLevel: raw.qualificationLevel ?? null,
    minimumAcademicScoreNormalized: numberOrNull(raw.minimumAcademicScoreNormalized),
    gradeRequirementSourceType: raw.minimumAcademicScoreNormalized === undefined ? "manual_review" : "official",
    gradeRequirementSourceLabel: raw.gradeRequirementSourceLabel ?? null,
    gradeRequirementSourceUrl: raw.gradeRequirementSourceUrl ?? officialRequirementUrl,
    equivalentGradeRequirements: raw.equivalentGradeRequirements ?? {},
    backgroundRequirement: raw.backgroundRequirement ?? null,
    prerequisiteCourses: raw.prerequisiteCourses ?? null,
    mathematicsRequirement: raw.mathematicsRequirement ?? null,
    workExperienceRequirement: workExperience,
    applicationMaterials: raw.applicationMaterials ?? null,
    recommendationRequirement: raw.recommendationRequirement ?? null,
    personalStatementRequirement: raw.personalStatementRequirement ?? null,
    portfolioRequirement: raw.portfolioRequirement ?? null,
    academicRequirements: { original: academicOriginal, scale: raw.academicScale ?? "official_text", minimumGrade: numberOrNull(raw.minimumGrade), minimumGpa: numberOrNull(raw.minimumGpa), minimumPercentage: numberOrNull(raw.minimumPercentage), qualificationLevel: raw.qualificationLevel ?? null, normalizedScore: numberOrNull(raw.minimumAcademicScoreNormalized) },
    backgroundRequirements: { original: raw.backgroundRequirement ?? null, prerequisiteCourses: raw.prerequisiteCourses ?? null, mathematicsRequirement: raw.mathematicsRequirement ?? null },
    workExperienceRequirements: { original: workExperience, required: workExperience ? !/无强制|不要求|not required/i.test(workExperience) : null, minimumYears: null, fields: null, mbaOnly: /MBA|EMBA/i.test(raw.programNameEn) },
    greGmatRequirements: { required: null, recommended: null, greMinimum: null, gmatMinimum: null, waiver: null },
    documentRequirements: { personalStatement: raw.personalStatementRequirement ?? null, statementOfPurpose: null, cv: null, references: raw.recommendationRequirement ?? null, transcript: null, degreeCertificate: null, writingSample: null, portfolio: raw.portfolioRequirement ?? null, researchProposal: null },
    admissionRequirementScope: academicScope,
    languageRequirementScope: raw.languageRequirementScope ?? "manual_review",
    tuitionAmount: numberOrNull(raw.tuition),
    tuitionAcademicYear: raw.tuitionAcademicYear ?? "2027 Entry",
    tuitionUrl: raw.officialFeeUrl ?? officialProgramUrl,
    applicationLinks: { program: officialProgramUrl, admission: officialRequirementUrl, language: raw.officialLanguageRequirementUrl ?? officialRequirementUrl, academic: raw.officialAcademicRequirementUrl ?? officialRequirementUrl, tuition: raw.officialFeeUrl ?? officialProgramUrl, deadline: raw.officialDeadlineUrl ?? officialRequirementUrl, application: raw.officialApplicationUrl ?? null },
    languageRequirements,
    languageRequirementRaw: raw.languageRequirementRaw ?? null,
    languageRequirementDetails: raw.languageRequirementDetails ?? null,
    languagePolicyFacts: raw.languagePolicyFacts ?? [],
    tuition: numberOrNull(raw.tuition),
    tuitionCny: numberOrNull(raw.tuitionCny),
    tuitionCurrency: raw.tuitionCurrency ?? "",
    tuitionPeriod: raw.tuitionPeriod ?? "完整学制",
    livingCost: numberOrNull(raw.livingCost),
    accommodationCost: numberOrNull(raw.accommodationCost),
    insuranceCost: numberOrNull(raw.insuranceCost),
    visaAndApplicationCost: numberOrNull(raw.visaAndApplicationCost),
    transportCost: numberOrNull(raw.transportCost),
    otherCost: numberOrNull(raw.otherCost),
    totalEstimatedCost: numberOrNull(raw.totalEstimatedCost),
    totalEstimatedCostCny: numberOrNull(raw.totalEstimatedCostCny),
    exchangeRate: numberOrNull(raw.exchangeRate),
    exchangeRateDate: raw.exchangeRateDate ?? null,
    exchangeRateNote: raw.exchangeRateNote ?? null,
    costBreakdown: raw.costBreakdown ?? emptyCostBreakdown(raw.tuitionCurrency ?? ""),
    costNotes: raw.costNotes ?? "费用未在项目页面结构化，申请前请打开官方费用入口核对。",
    scholarshipStatus: raw.scholarshipStatus ?? null,
    applicationDeadline: raw.applicationDeadline ?? "2027日期尚未公布",
    applicationDeadlines: raw.applicationDeadlines ?? [{ roundName: "主要申请截止", deadlineDate: "2027 申请日期尚未公布", applicantType: "国际申请者", intake: raw.intake ?? "2027 Entry", deadlineType: "待公布", officialUrl: raw.officialDeadlineUrl ?? officialRequirementUrl }],
    officialUniversityUrl: raw.officialUniversityUrl ?? officialProgramUrl,
    officialProgramUrl,
    officialRequirementUrl,
    officialAcademicRequirementUrl: raw.officialAcademicRequirementUrl ?? officialRequirementUrl,
    officialLanguageRequirementUrl: raw.officialLanguageRequirementUrl ?? officialRequirementUrl,
    officialWorkExperienceUrl: raw.officialWorkExperienceUrl ?? officialRequirementUrl,
    officialDocumentRequirementUrl: raw.officialDocumentRequirementUrl ?? officialRequirementUrl,
    officialDeadlineUrl: raw.officialDeadlineUrl ?? officialRequirementUrl,
    officialFeeUrl: raw.officialFeeUrl ?? officialProgramUrl,
    officialApplicationUrl: raw.officialApplicationUrl ?? null,
    officialScholarshipUrl: raw.officialScholarshipUrl ?? null,
    qsUrl: raw.qsUrl ?? null,
    dataSource: unique(raw.dataSource ?? [officialProgramUrl, officialRequirementUrl]),
    lastUpdated: "2026-09-06",
    sourceLastChecked: "2026-09-06",
    verificationStatus: "needs_review",
    verificationNotes: raw.verificationNotes ?? "需在申请前复核招生周期、费用与项目级录取细则。",
  };
}

function enrichProgram(program) {
  const academicOriginal = program.academicRequirementOriginal ?? program.academicRequirement ?? null;
  const workExperience = program.workExperienceRequirement ?? null;
  const programUrl = program.officialProgramUrl ?? null;
  const admissionUrl = program.officialRequirementUrl ?? programUrl;
  const intakeYear = String(program.intake ?? "").match(/20\d{2}/)?.[0] ?? null;
  return {
    ...program,
    subjectCategory: program.subjectCategory ?? program.subjectArea ?? null,
    durationText: program.durationText ?? program.durationLabel ?? null,
    intakeMonth: program.intakeMonth ?? null,
    academicYear: program.academicYear ?? (intakeYear ? `${intakeYear} Entry` : null),
    admissionCycle: program.admissionCycle ?? (intakeYear ? `${intakeYear} Entry` : null),
    academicRequirementOriginal: academicOriginal,
    minimumGrade: program.minimumGrade ?? null,
    minimumPercentage: program.minimumPercentage ?? null,
    qualificationLevel: program.qualificationLevel ?? null,
    mathematicsRequirement: program.mathematicsRequirement ?? program.prerequisiteCourses ?? null,
    academicRequirements: program.academicRequirements ?? { original: academicOriginal, scale: program.academicScale ?? null, minimumGrade: program.minimumGrade ?? null, minimumGpa: program.minimumGpa ?? null, minimumPercentage: program.minimumPercentage ?? null, qualificationLevel: program.qualificationLevel ?? null, normalizedScore: program.minimumAcademicScoreNormalized ?? null },
    backgroundRequirements: program.backgroundRequirements ?? { original: program.backgroundRequirement ?? null, prerequisiteCourses: program.prerequisiteCourses ?? null, mathematicsRequirement: program.mathematicsRequirement ?? program.prerequisiteCourses ?? null },
    workExperienceRequirements: program.workExperienceRequirements ?? { original: workExperience, required: workExperience ? !/无强制|不要求|not required/i.test(workExperience) : null, minimumYears: null, fields: null, mbaOnly: /MBA|EMBA/i.test(program.programNameEn) },
    greGmatRequirements: program.greGmatRequirements ?? { required: null, recommended: null, greMinimum: null, gmatMinimum: null, waiver: null },
    documentRequirements: program.documentRequirements ?? { personalStatement: program.personalStatementRequirement ?? null, statementOfPurpose: null, cv: null, references: program.recommendationRequirement ?? null, transcript: null, degreeCertificate: null, writingSample: null, portfolio: program.portfolioRequirement ?? null, researchProposal: null },
    admissionRequirementScope: program.admissionRequirementScope ?? "program",
    languageRequirementScope: program.languageRequirementScope ?? (program.lastUpdated === "2026-09-06" || /通用|统一|学校整体|研究生院统一|国际研究生英语语言要求|university[- ]wide|general university/i.test(program.languageRequirementDetails ?? "") ? "institutional_reference" : "program"),
    tuitionAmount: program.tuitionAmount ?? program.tuition ?? null,
    tuitionAcademicYear: program.tuitionAcademicYear ?? program.academicYear ?? null,
    tuitionUrl: program.tuitionUrl ?? program.officialFeeUrl ?? programUrl,
    applicationLinks: program.applicationLinks ?? { program: programUrl, admission: admissionUrl, language: program.officialLanguageRequirementUrl ?? admissionUrl, academic: program.officialAcademicRequirementUrl ?? admissionUrl, tuition: program.officialFeeUrl ?? programUrl, deadline: program.officialDeadlineUrl ?? admissionUrl, application: program.officialApplicationUrl ?? null },
    sourceLastChecked: program.sourceLastChecked ?? program.lastUpdated ?? "unknown",
  };
}

function costItem(key, label, amountCny, amountOriginal, currency, source, type = "estimated") {
  return {
    key,
    label,
    amountCny: numberOrNull(amountCny),
    amountOriginal: numberOrNull(amountOriginal),
    currency,
    period: "完整学制",
    source,
    type,
  };
}

function normalizeProgram(raw, sourceRegion) {
  const meta = regionMeta[sourceRegion];
  const currency = raw.currency ?? meta.currency;
  const source = sanitizePlanningNote(raw.notes) || "沿用现有项目费用估算口径";
  const totalOriginal = numberOrNull(raw.totalOriginal);
  const totalCny = numberOrNull(raw.totalRmb);
  const exchangeRate = totalOriginal && totalCny ? Number((totalCny / totalOriginal).toFixed(5)) : currency === "CNY" ? 1 : null;
  const qsRank = Number.isFinite(raw.qsValue) && raw.qsValue < 9000 ? raw.qsValue : null;
  const programId = `${meta.code}-${stableHash(`${raw.id}-${raw.program}`)}`;
  const academic = parseAcademicRequirement(raw.bachelor);
  const requirementUrl = raw.programUrl ?? null;

  return {
    universityId: `uni-${stableHash(raw.university)}`,
    programId,
    universityNameZh: raw.university,
    universityNameEn: null,
    universityShortName: raw.short ?? null,
    programNameZh: null,
    programNameEn: raw.program,
    programShortName: raw.programShort ?? null,
    subjectArea: raw.category ?? null,
    country: meta.country,
    region: meta.region,
    city: raw.city ?? null,
    degreeType: raw.degree ?? null,
    studyMode: raw.mode ?? null,
    durationMonths: numberOrNull(raw.months),
    durationLabel: raw.duration?.replace("（排除）", "") ?? null,
    intake: raw.intake ?? null,
    credits: raw.credits ?? null,
    courseStructure: raw.structure ?? null,
    completionRequirement: unique([raw.capstone, raw.completion]).join("；") || null,
    qsRank,
    qsRankLabel: raw.qsRank ?? null,
    qsYear: 2027,
    qsIndependent: raw.qsIndependent !== false,
    academicRequirement: raw.bachelor ?? null,
    academicScale: "official_text",
    minimumGpa: null,
    minimumAcademicScoreNormalized: academic.normalized,
    gradeRequirementSourceType: academic.sourceType,
    gradeRequirementSourceLabel: academic.sourceLabel,
    gradeRequirementSourceUrl: academic.normalized === null ? null : requirementUrl,
    equivalentGradeRequirements: academic.equivalents,
    backgroundRequirement: raw.bachelor ?? null,
    prerequisiteCourses: null,
    workExperienceRequirement: null,
    applicationMaterials: null,
    recommendationRequirement: null,
    personalStatementRequirement: null,
    portfolioRequirement: null,
    languageRequirements: parseLanguageRequirements(raw.language),
    languageRequirementRaw: raw.language?.summary ?? raw.ielts ?? null,
    languageRequirementDetails: raw.language?.detail ?? null,
    languagePolicyFacts: (raw.language?.facts ?? []).map(([label, value, tone]) => ({ label, value, tone })),
    tuition: numberOrNull(raw.tuitionOriginal),
    tuitionCny: numberOrNull(raw.tuitionRmb),
    tuitionCurrency: currency,
    tuitionPeriod: "完整学制",
    livingCost: numberOrNull(raw.foodRmb),
    accommodationCost: numberOrNull(raw.accommodationRmb),
    insuranceCost: null,
    visaAndApplicationCost: numberOrNull(raw.visaRmb),
    transportCost: numberOrNull(raw.commuteRmb),
    otherCost: [raw.dailyRmb, raw.materialsRmb, raw.travelRmb].filter(Number.isFinite).reduce((sum, value) => sum + value, 0),
    totalEstimatedCost: totalOriginal,
    totalEstimatedCostCny: totalCny,
    exchangeRate,
    exchangeRateDate: null,
    exchangeRateNote: "沿用原项目人民币估算；原始汇率基准日期未单独记录，需人工核实",
    costBreakdown: [
      costItem("tuition", "学费", raw.tuitionRmb, raw.tuitionOriginal, currency, source, "fixed"),
      costItem("accommodation", "住宿或租房", raw.accommodationRmb, raw.accommodationOriginal, currency, source),
      costItem("living", "生活费", [raw.foodRmb, raw.dailyRmb].filter(Number.isFinite).reduce((sum, value) => sum + value, 0) || null, [raw.foodOriginal, raw.dailyOriginal].filter(Number.isFinite).reduce((sum, value) => sum + value, 0) || null, currency, source),
      costItem("insurance", "医疗保险", null, null, currency, "现有数据未单独记录"),
      costItem("visa", "签证及申请费用", raw.visaRmb, raw.visaOriginal, currency, source),
      costItem("transport", "当地交通", raw.commuteRmb, raw.commuteOriginal, currency, source),
      costItem("other", "其他费用", [raw.materialsRmb, raw.travelRmb].filter(Number.isFinite).reduce((sum, value) => sum + value, 0) || null, [raw.materialsOriginal, raw.travelOriginal].filter(Number.isFinite).reduce((sum, value) => sum + value, 0) || null, currency, source),
    ],
    costNotes: sanitizePlanningNote(raw.notes),
    scholarshipStatus: raw.scholarshipStatus ?? null,
    applicationDeadline: raw.deadline ?? null,
    applicationDeadlines: parseDeadlines(raw.deadline, requirementUrl, raw.intake),
    officialUniversityUrl: officialOrigin(raw.programUrl),
    officialProgramUrl: raw.programUrl ?? null,
    officialRequirementUrl: raw.language?.url ?? raw.programUrl ?? null,
    officialAcademicRequirementUrl: requirementUrl,
    officialLanguageRequirementUrl: raw.language?.url ?? requirementUrl,
    officialWorkExperienceUrl: requirementUrl,
    officialDocumentRequirementUrl: requirementUrl,
    officialDeadlineUrl: requirementUrl,
    officialFeeUrl: requirementUrl,
    officialApplicationUrl: officialApplicationLinks[raw.university] ?? null,
    officialScholarshipUrl: raw.scholarshipUrl || null,
    qsUrl: raw.qsUrl ?? null,
    dataSource: unique([raw.programUrl, raw.language?.url, raw.scholarshipUrl, raw.qsUrl, officialApplicationLinks[raw.university]]),
    lastUpdated: "2026-07-18",
    verificationStatus: /待|需/.test(raw.review ?? "") ? "needs_review" : "verified",
    verificationNotes: raw.review ?? null,
  };
}

const programs = [];
for (const sourceRegion of Object.keys(regionMeta)) {
  const html = await readFile(path.join(sourceDirectory, `${sourceRegion}.html`), "utf8");
  for (const rawProgram of extractJsonArray(html)) programs.push(normalizeProgram(rawProgram, sourceRegion));
}

try {
  const additionalCatalog = JSON.parse(await readFile(additionalProgramsPath, "utf8"));
  if (Array.isArray(additionalCatalog.programs)) programs.push(...additionalCatalog.programs);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

try {
  const curatedCatalog = JSON.parse(await readFile(curatedExpansionPath, "utf8"));
  if (Array.isArray(curatedCatalog.programs)) programs.push(...curatedCatalog.programs.map(normalizeCuratedProgram));
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const enrichedPrograms = programs.map(enrichProgram);

const coordinateByUniversityId = {
  "uni-nus": [103.7764, 1.2966],
  "uni-ntu": [103.6831, 1.3483],
  "uni-smu": [103.8499, 1.2966],
  "uni-um": [101.662, 3.1201],
  "uni-upm": [101.704, 3.012],
  "uni-ukm": [101.78, 2.922],
  "uni-usm": [100.305, 5.356],
  "uni-utm": [103.736, 1.559],
  "uni-taylors": [101.616, 3.065],
  "uni-suss": [103.849, 1.334],
  "uni-jcu-singapore": [103.850, 1.326],
  "uni-chula": [100.533, 13.738],
  "uni-thammasat": [100.493, 13.756],
  "uni-mahidol": [100.325, 13.794],
  "uni-muic": [100.325, 13.794],
};

const universityTypeById = {
  "uni-upm": "公立研究型大学",
  "uni-ukm": "公立研究型大学",
  "uni-usm": "公立研究型大学",
  "uni-utm": "公立研究型大学",
  "uni-taylors": "私立大学",
  "uni-suss": "公立大学（应用型）",
  "uni-jcu-singapore": "海外大学新加坡校区",
  "uni-mahidol": "公立研究型大学",
  "uni-muic": "大学学院 / 学位授予：Mahidol University",
};

const universities = [...new Map(enrichedPrograms.map((program) => [program.universityId, program])).values()].map((program) => {
  const sameUniversity = enrichedPrograms.filter((item) => item.universityId === program.universityId);
  const rankSource = sameUniversity.find((item) => item.qsRank !== null) ?? program;
  const coords = coordinateByUniversityId[program.universityId] ?? null;
  return {
    id: program.universityId,
    nameZh: program.universityNameZh,
    nameEn: program.universityNameEn ?? null,
    shortName: program.universityShortName ?? null,
    country: program.country,
    region: program.region,
    city: program.city ?? null,
    universityType: universityTypeById[program.universityId] ?? null,
    qsRank: rankSource.qsRank ?? null,
    qsRankLabel: rankSource.qsRankLabel ?? null,
    qsYear: rankSource.qsYear ?? null,
    universityUrl: program.officialUniversityUrl ?? null,
    qsUrl: rankSource.qsUrl ?? null,
    latitude: coords?.[1] ?? null,
    longitude: coords?.[0] ?? null,
  };
});

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify({ schemaVersion: 3, lastMigratedAt: "2026-09-06", programs: enrichedPrograms }, null, 2)}\n`,
  "utf8",
);
await writeFile(
  path.join(outputDirectory, "universities.json"),
  `${JSON.stringify({ schemaVersion: 1, lastMigratedAt: "2026-09-06", universities }, null, 2)}\n`,
  "utf8",
);

console.log(`Migrated ${enrichedPrograms.length} programs and ${universities.length} universities`);
