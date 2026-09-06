import catalogJson from "@/data/programs.json";
import universitiesJson from "@/data/universities.json";
import type { Program, ProgramCatalog, University } from "@/lib/types";

const catalog = catalogJson as ProgramCatalog;
const universityCatalog = universitiesJson as { schemaVersion: number; lastMigratedAt: string; universities: University[] };

export const programs: Program[] = catalog.programs;
export const catalogLastUpdated = catalog.lastMigratedAt;
export const universities: University[] = universityCatalog.universities;
export const universityCatalogLastUpdated = universityCatalog.lastMigratedAt;

export const regionPresentation: Record<string, { code: string; nameEn: string; note: string; accent: string; latitude: number; longitude: number }> = {
  中国香港: { code: "HK", nameEn: "Hong Kong", note: "高密度一年制与国际排名选择", accent: "sea", latitude: 22.3193, longitude: 114.1694 },
  中国澳门: { code: "MO", nameEn: "Macao", note: "适合一起核对学制与费用口径", accent: "rose", latitude: 22.1987, longitude: 113.5439 },
  英国: { code: "UK", nameEn: "United Kingdom", note: "一年制项目丰富，选择跨度大", accent: "blue", latitude: 54.5, longitude: -3.4 },
  新西兰: { code: "NZ", nameEn: "New Zealand", note: "生活节奏舒展，学制选择多样", accent: "green", latitude: -41.3, longitude: 174.8 },
  湾区校区: { code: "GBA", nameEn: "Greater Bay Area", note: "国际课程与湾区产业连接", accent: "gold", latitude: 22.9, longitude: 113.4 },
  新加坡: { code: "SG", nameEn: "Singapore", note: "亚洲金融与商业分析项目密集", accent: "rose", latitude: 1.3521, longitude: 103.8198 },
  马来西亚: { code: "MY", nameEn: "Malaysia", note: "成本友好，英联邦商科选择多", accent: "green", latitude: 3.139, longitude: 101.6869 },
  泰国: { code: "TH", nameEn: "Thailand", note: "东盟商业、旅游与发展议题连接", accent: "gold", latitude: 13.7563, longitude: 100.5018 },
};

export function getRegions() {
  const counts = new Map<string, number>();
  for (const program of programs) counts.set(program.region, (counts.get(program.region) ?? 0) + 1);
  return [...counts.entries()].map(([name, count]) => ({
    name,
    count,
    ...(regionPresentation[name] ?? { code: "INTL", nameEn: name, note: "更多项目持续整理中", accent: "sea", latitude: 0, longitude: 0 }),
  }));
}

export function getProgram(programId: string) {
  return programs.find((program) => program.programId === programId) ?? null;
}

export function getUniversity(universityId: string) {
  return universities.find((university) => university.id === universityId) ?? null;
}

export function getProgramsForUniversity(universityId: string) {
  return programs.filter((program) => program.universityId === universityId);
}

export function getUniversityProgramCount(universityId: string) {
  return getProgramsForUniversity(universityId).length;
}
