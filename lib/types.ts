export const LANGUAGE_TESTS = ["IELTS", "TOEFL", "PTE", "DET"] as const;
export type LanguageTest = (typeof LANGUAGE_TESTS)[number];
export type GradeScale = "percentage" | "gpa4" | "gpa5" | "uk_honours";
export type SortOption = "match" | "qs" | "budget" | "duration";
export type VerificationStatus = "verified" | "needs_review";
export type RequirementScope = "program" | "institutional_reference" | "manual_review";

export interface LanguageRequirement {
  test: LanguageTest;
  overall: number;
  sectionMinimum: number | null;
  sectionMinimums: {
    reading: number | null;
    writing: number | null;
    listening: number | null;
    speaking: number | null;
  };
  raw: string;
}

export interface ApplicationDeadline {
  roundName: string;
  deadlineDate: string;
  applicantType: string;
  intake: string | null;
  deadlineType: string;
  officialUrl: string | null;
}

export interface AcademicRequirements {
  original: string | null;
  scale: string | null;
  minimumGrade: number | null;
  minimumGpa: number | null;
  minimumPercentage: number | null;
  qualificationLevel: string | null;
  normalizedScore: number | null;
}

export interface BackgroundRequirements {
  original: string | null;
  prerequisiteCourses: string | null;
  mathematicsRequirement: string | null;
}

export interface WorkExperienceRequirements {
  original: string | null;
  required: boolean | null;
  minimumYears: number | null;
  fields: string | null;
  mbaOnly: boolean;
}

export interface GreGmatRequirements {
  required: boolean | null;
  recommended: boolean | null;
  greMinimum: number | null;
  gmatMinimum: number | null;
  waiver: string | null;
}

export interface DocumentRequirements {
  personalStatement: string | null;
  statementOfPurpose: string | null;
  cv: string | null;
  references: string | null;
  transcript: string | null;
  degreeCertificate: string | null;
  writingSample: string | null;
  portfolio: string | null;
  researchProposal: string | null;
}

export interface ProgramApplicationLinks {
  program: string | null;
  admission: string | null;
  language: string | null;
  academic: string | null;
  tuition: string | null;
  deadline: string | null;
  application: string | null;
}

export interface University {
  id: string;
  nameZh: string;
  nameEn: string | null;
  shortName: string | null;
  country: string;
  region: string;
  city: string | null;
  universityType: string | null;
  qsRank: number | null;
  qsRankLabel: string | null;
  qsYear: number | null;
  universityUrl: string | null;
  qsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface LanguagePolicyFact {
  label: string;
  value: string;
  tone: "good" | "bad" | "pending" | string;
}

export interface CostItem {
  key: string;
  label: string;
  amountCny: number | null;
  amountOriginal: number | null;
  currency: string;
  period: string;
  source: string;
  type: "fixed" | "estimated";
}

export interface Program {
  universityId: string;
  programId: string;
  universityNameZh: string;
  universityNameEn: string | null;
  universityShortName: string | null;
  programNameZh: string | null;
  programNameEn: string;
  programShortName: string | null;
  subjectArea: string | null;
  subjectCategory: string | null;
  country: string;
  region: string;
  city: string | null;
  degreeType: string | null;
  studyMode: string | null;
  durationMonths: number | null;
  durationLabel: string | null;
  durationText: string | null;
  intake: string | null;
  intakeMonth: string | null;
  academicYear: string | null;
  admissionCycle: string | null;
  credits: string | null;
  courseStructure: string | null;
  completionRequirement: string | null;
  qsRank: number | null;
  qsRankLabel: string | null;
  qsYear: number;
  qsIndependent: boolean;
  academicRequirement: string | null;
  academicRequirementOriginal: string | null;
  academicScale: string;
  minimumGpa: number | null;
  minimumGrade: number | null;
  minimumPercentage: number | null;
  qualificationLevel: string | null;
  minimumAcademicScoreNormalized: number | null;
  gradeRequirementSourceType: "official" | "national_guidance" | "general_reference" | "manual_review";
  gradeRequirementSourceLabel: string | null;
  gradeRequirementSourceUrl: string | null;
  equivalentGradeRequirements: Partial<Record<GradeScale, string>>;
  backgroundRequirement: string | null;
  prerequisiteCourses: string | null;
  mathematicsRequirement: string | null;
  workExperienceRequirement: string | null;
  applicationMaterials: string | null;
  recommendationRequirement: string | null;
  personalStatementRequirement: string | null;
  portfolioRequirement: string | null;
  academicRequirements: AcademicRequirements;
  backgroundRequirements: BackgroundRequirements;
  workExperienceRequirements: WorkExperienceRequirements;
  greGmatRequirements: GreGmatRequirements;
  documentRequirements: DocumentRequirements;
  admissionRequirementScope: RequirementScope;
  languageRequirementScope: RequirementScope;
  tuitionAmount: number | null;
  tuitionAcademicYear: string | null;
  tuitionUrl: string | null;
  applicationLinks: ProgramApplicationLinks;
  languageRequirements: LanguageRequirement[];
  languageRequirementRaw: string | null;
  languageRequirementDetails: string | null;
  languagePolicyFacts: LanguagePolicyFact[];
  tuition: number | null;
  tuitionCny: number | null;
  tuitionCurrency: string;
  tuitionPeriod: string;
  livingCost: number | null;
  accommodationCost: number | null;
  insuranceCost: number | null;
  visaAndApplicationCost: number | null;
  transportCost: number | null;
  otherCost: number | null;
  totalEstimatedCost: number | null;
  totalEstimatedCostCny: number | null;
  exchangeRate: number | null;
  exchangeRateDate: string | null;
  exchangeRateNote: string | null;
  costBreakdown: CostItem[];
  costNotes: string | null;
  scholarshipStatus: string | null;
  applicationDeadline: string | null;
  applicationDeadlines: ApplicationDeadline[];
  officialUniversityUrl: string | null;
  officialProgramUrl: string | null;
  officialRequirementUrl: string | null;
  officialAcademicRequirementUrl: string | null;
  officialLanguageRequirementUrl: string | null;
  officialWorkExperienceUrl: string | null;
  officialDocumentRequirementUrl: string | null;
  officialDeadlineUrl: string | null;
  officialFeeUrl: string | null;
  officialApplicationUrl: string | null;
  officialScholarshipUrl: string | null;
  qsUrl: string | null;
  dataSource: string[];
  lastUpdated: string;
  sourceLastChecked: string;
  verificationStatus: VerificationStatus;
  verificationNotes: string | null;
}

export interface ProgramCatalog {
  schemaVersion: number;
  lastMigratedAt: string;
  programs: Program[];
}

export interface FilterState {
  regions: string[];
  gradeScale: GradeScale;
  gradeValue: number;
  languageTest: LanguageTest;
  languageScore: number;
  languageSections: {
    reading: number;
    writing: number;
    listening: number;
    speaking: number;
  };
  noLanguageScore: boolean;
  budgetMinWan: number;
  budgetMaxWan: number;
  qsMin: number;
  qsMax: number;
  includeUnranked: boolean;
  sort: SortOption;
}

export type SignalState = "meets" | "borderline" | "needs" | "unknown";

export interface MatchSignal {
  state: SignalState;
  label: string;
  detail: string;
}

export interface ProgramMatch {
  program: Program;
  academic: MatchSignal;
  language: MatchSignal;
  budget: MatchSignal;
  qs: MatchSignal;
  category: "稳妥" | "匹配" | "冲刺";
  matchScore: number;
}
