const SKILLS = [
  "javascript",
  "typescript",
  "react",
  "next.js",
  "node.js",
  "python",
  "java",
  "sql",
  "postgresql",
  "mongodb",
  "supabase",
  "tailwind",
  "html",
  "css",
  "git",
  "github",
  "docker",
  "aws",
  "figma",
  "excel",
  "power bi",
  "machine learning",
  "artificial intelligence",
  "data analysis",
  "communication",
  "leadership",
];

const ACTION_VERBS = [
  "built",
  "created",
  "developed",
  "designed",
  "implemented",
  "improved",
  "managed",
  "led",
  "analysed",
  "analyzed",
  "optimized",
  "launched",
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function has(text: string, value: string) {
  const escapedValue = escapeRegExp(value);
  return new RegExp(
    `(^|[^a-z0-9])${escapedValue}(?=$|[^a-z0-9])`,
    "i",
  ).test(text);
}

function score(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function findSkills(text: string) {
  return SKILLS.filter((skill) => has(text, skill));
}

export function analyseResume(rawText: string) {
  const text = rawText.toLowerCase();
  const skills = findSkills(rawText);

  const hasEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(rawText);
  const hasPhone = /(?:\+91[\s-]?)?[6-9]\d{9}\b/.test(rawText);
  const hasLinkedIn = has(text, "linkedin");
  const hasGitHub = has(text, "github");
  const hasExperience = has(text, "experience") || has(text, "internship");
  const hasEducation = has(text, "education") || has(text, "b.tech") || has(text, "university");
  const hasProjects = has(text, "projects") || has(text, "project");
  const hasSkillsSection = has(text, "skills") || has(text, "technical skills");
  const metrics = rawText.match(/\b\d+[%+x]?\b/g) ?? [];
  const actionVerbs = ACTION_VERBS.filter((verb) => has(text, verb));

  const keywordScore = score((skills.length / 8) * 100);
  const skillScore = score((skills.length / 10) * 100);
  const experienceScore = score(
    (hasExperience ? 45 : 0) +
      Math.min(metrics.length * 8, 30) +
      Math.min(actionVerbs.length * 5, 25),
  );
  const educationScore = score(hasEducation ? 100 : 20);
  const projectScore = score(hasProjects ? 65 + Math.min(metrics.length * 5, 35) : 15);
  const formattingScore = score(
    (hasEmail ? 20 : 0) +
      (hasPhone ? 15 : 0) +
      (hasLinkedIn ? 15 : 0) +
      (hasGitHub ? 10 : 0) +
      (hasSkillsSection ? 20 : 0) +
      (rawText.length > 600 ? 20 : 5),
  );

  const atsScore = score(
    keywordScore * 0.2 +
      skillScore * 0.2 +
      experienceScore * 0.2 +
      educationScore * 0.1 +
      projectScore * 0.15 +
      formattingScore * 0.15,
  );

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  if (hasEmail && hasPhone) strengths.push("Your resume includes key contact information.");
  else {
    weaknesses.push("Contact information is incomplete.");
    suggestions.push("Add a professional email address and an active phone number.");
  }

  if (skills.length >= 5) strengths.push(`You mention ${skills.length} relevant skills.`);
  else {
    weaknesses.push("Too few technical or professional skills were detected.");
    suggestions.push("Add a dedicated Skills section with role-relevant tools and technologies.");
  }

  if (metrics.length >= 2) strengths.push("Your resume includes measurable achievements.");
  else {
    weaknesses.push("Achievements are not sufficiently quantified.");
    suggestions.push("Add numbers, percentages, time saved, users served, or project impact.");
  }

  if (!hasLinkedIn) suggestions.push("Add a LinkedIn profile URL.");
  if (!hasGitHub) suggestions.push("Add a GitHub or portfolio URL for technical roles.");
  if (!hasProjects) suggestions.push("Add a Projects section with technologies and outcomes.");
  if (!hasExperience) suggestions.push("Add internships, freelance work, volunteering, or practical experience.");
  if (!hasEducation) suggestions.push("Add an Education section with degree and institution.");

  return {
    atsScore,
    keywordScore,
    skillScore,
    experienceScore,
    educationScore,
    formattingScore,
    projectScore,
    strengths,
    weaknesses,
    suggestions,
    analysisJson: {
      detectedSkills: skills,
      actionVerbs,
      measurableAchievements: metrics.length,
      detectedSections: {
        experience: hasExperience,
        education: hasEducation,
        projects: hasProjects,
        skills: hasSkillsSection,
      },
    },
  };
}

export function matchResumeToJob(resumeText: string, jobDescription: string) {
  const resumeSkills = findSkills(resumeText);
  const jobSkills = findSkills(jobDescription);

  const matchedSkills = jobSkills.filter((skill) => resumeSkills.includes(skill));
  const missingSkills = jobSkills.filter((skill) => !resumeSkills.includes(skill));

  const matchScore =
    jobSkills.length === 0
      ? 0
      : score((matchedSkills.length / jobSkills.length) * 100);

  const recommendations =
    missingSkills.length > 0
      ? missingSkills.slice(0, 5).map(
          (skill) =>
            `If you have experience with ${skill}, add it to your Skills, Projects, or Experience section.`,
        )
      : ["Your resume contains the major skills detected in this job description."];

  return {
    matchScore,
    matchedSkills,
    missingSkills,
    partialSkills: [],
    recommendations,
  };
}
