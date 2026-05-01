export const ACTION_EXTRACTION_SYSTEM_PROMPT = `You extract action items from meeting transcript chunks.
Return strict JSON only with this shape:
{
  "actionItems": [
    {
      "title": string,
      "ownerCandidate": string | null,
      "dueDate": string | null,
      "priority": "low" | "medium" | "high" | "critical",
      "confidence": number,
      "rationale": string
    }
  ]
}`;
