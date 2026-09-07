import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const catalog = JSON.parse(await readFile(new URL("../data/programs.json", import.meta.url), "utf8"));

test("normalizes every legacy program into a unique extensible record", () => {
  assert.ok(catalog.programs.length >= 58);
  assert.equal(new Set(catalog.programs.map((program) => program.programId)).size, catalog.programs.length);
  assert.equal(catalog.schemaVersion, 3);
  assert.ok(new Set(catalog.programs.map((program) => program.region)).size >= 5);
  for (const program of catalog.programs) {
    assert.ok(program.universityId);
    assert.ok(program.programId);
    assert.ok(program.universityNameZh);
    assert.ok(program.programNameEn);
    assert.equal(program.qsYear, 2027);
    assert.ok(Array.isArray(program.languageRequirements));
    assert.ok(Array.isArray(program.costBreakdown));
    assert.ok(Array.isArray(program.dataSource));
    assert.equal(typeof program.universityId, "string");
    assert.ok(program.subjectCategory);
    assert.ok(program.academicRequirements);
    assert.ok(program.backgroundRequirements);
    assert.ok(program.applicationLinks);
    assert.ok(program.admissionCycle || program.academicYear === null);
    assert.ok(program.sourceLastChecked);
    assert.doesNotMatch(program.durationLabel ?? "", /排除/);
  }
  const cuhkPrograms = catalog.programs.filter((program) => program.universityId === "uni-7sder8");
  assert.ok(cuhkPrograms.length >= 6);
  assert.ok(cuhkPrograms.some((program) => program.programNameEn.includes("Business Analytics")));
  assert.ok(cuhkPrograms.every((program) => program.officialApplicationUrl?.includes("cuhk.edu.hk")));
  const lowLanguagePrograms = catalog.programs.filter((program) => (
    program.languageRequirementScope === "program"
    && program.languageRequirements.some((requirement) => requirement.test === "IELTS" && requirement.overall <= 6)
  ));
  assert.ok(lowLanguagePrograms.length >= 14);
  assert.ok(lowLanguagePrograms.some((program) => program.programId === "my-um-master-management"));
  assert.ok(lowLanguagePrograms.some((program) => program.languageRequirements.some((requirement) => requirement.test === "IELTS" && requirement.overall === 6 && requirement.sectionMinimum === 6)));
});

test("does not preserve personal scoring fields and only emits official application links", () => {
  const serialized = JSON.stringify(catalog);
  assert.doesNotMatch(serialized, /"(?:score|priority|positioning|budgetGap)":/);
  assert.doesNotMatch(serialized, /陈昕洋|CXY88888888/);
  assert.doesNotMatch(serialized, /40万元的一年制口径|因学制规则排除/);
  const officialApplications = catalog.programs.filter((program) => program.officialApplicationUrl);
  assert.ok(officialApplications.length >= 15);
  assert.ok(officialApplications.every((program) => /^https:\/\//.test(program.officialApplicationUrl)));
  assert.ok(catalog.programs.every((program) => Array.isArray(program.applicationDeadlines)));
  assert.ok(catalog.programs.every((program) => program.languageRequirements.every((requirement) => requirement.sectionMinimums)));
});
