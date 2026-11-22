import assert from "node:assert/strict";
import test from "node:test";

import { createImprovementRows } from "../src/lib/analysis/improvements";
import { analyseResume, matchResumeToJob } from "../src/lib/analysis/resume-engine";

const completeResume = `
  Avery Candidate
  avery@example.com | +91 9876543210
  LinkedIn: linkedin.com/in/avery | GitHub: github.com/avery

  Skills: TypeScript, JavaScript, React, Next.js, Node.js, SQL, PostgreSQL, Supabase, Git, HTML, CSS

  Experience
  Developed and optimized a React dashboard used by 250 users, improving page-load time by 40%.
  Built secure APIs and led a migration that reduced support tickets by 20%.

  Projects
  Created a resume analyser using TypeScript, Next.js, and Supabase.

  Education
  B.Tech, Example University
`;

test("analyses a complete resume into bounded, actionable ATS results", () => {
  const result = analyseResume(completeResume);

  assert.ok(result.atsScore >= 0 && result.atsScore <= 100);
  assert.ok(result.keywordScore >= 0 && result.keywordScore <= 100);
  assert.ok(result.analysisJson.detectedSkills.includes("typescript"));
  assert.equal(result.analysisJson.detectedSections.experience, true);
  assert.equal(result.analysisJson.detectedSections.education, true);
  assert.equal(result.analysisJson.detectedSections.projects, true);
  assert.equal(result.analysisJson.detectedSections.skills, true);
  assert.ok(result.strengths.length > 0);
});

test("matches only skills already present in the resume and identifies gaps", () => {
  const job = "React, TypeScript, Node.js, Python, Docker, PostgreSQL";
  const result = matchResumeToJob(completeResume, job);

  assert.equal(result.matchScore, 67);
  assert.deepEqual(result.matchedSkills, ["typescript", "react", "node.js", "postgresql"]);
  assert.deepEqual(result.missingSkills, ["python", "docker"]);
  assert.match(result.recommendations[0], /python/i);
});

test("creates a deduplicated, user-scoped improvement checklist", () => {
  const rows = createImprovementRows({
    userId: "user-1",
    resumeId: "resume-1",
    analysisId: "analysis-1",
    suggestions: [
      "Add a dedicated Skills section with role-relevant tools and technologies.",
      "Add a dedicated Skills section with role-relevant tools and technologies.",
      "Add a Projects section with technologies and outcomes.",
    ],
    weaknesses: ["Achievements are not sufficiently quantified."],
  });

  assert.equal(rows.length, 3);
  assert.ok(rows.every((row) => row.user_id === "user-1"));
  assert.ok(rows.every((row) => row.resume_id === "resume-1"));
  assert.ok(rows.every((row) => row.analysis_id === "analysis-1"));
  assert.ok(rows.every((row) => row.status === "pending"));
  assert.deepEqual(rows.map((row) => row.section), ["Skills", "Projects", "Experience"]);
});
