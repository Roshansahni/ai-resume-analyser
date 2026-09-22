type ImprovementInput = {
  userId: string;
  resumeId: string;
  analysisId: string;
  suggestions: string[];
  weaknesses: string[];
};

function getSection(text: string) {
  const value = text.toLowerCase();

  if (value.includes("skill") || value.includes("keyword")) {
    return "Skills";
  }

  if (value.includes("experience") || value.includes("achievement")) {
    return "Experience";
  }

  if (value.includes("education")) {
    return "Education";
  }

  if (value.includes("format") || value.includes("heading")) {
    return "Formatting";
  }

  if (value.includes("project")) {
    return "Projects";
  }

  return "Resume improvement";
}

export function createImprovementRows({
  userId,
  resumeId,
  analysisId,
  suggestions,
  weaknesses,
}: ImprovementInput) {
  const uniqueItems = Array.from(
    new Set([...suggestions, ...weaknesses].map((item) => item.trim())),
  )
    .filter(Boolean)
    .slice(0, 8);

  return uniqueItems.map((item) => ({
    user_id: userId,
    resume_id: resumeId,
    analysis_id: analysisId,
    section: getSection(item),
    original_text: "Not yet addressed",
    improved_text: item,
    status: "pending",
  }));
}
