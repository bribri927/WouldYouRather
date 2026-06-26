exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { grade, subject, vibe } = JSON.parse(event.body || "{}");

  const isCringe = vibe === "cringe";
  const isControversial = vibe === "controversial educational trends";

  let systemPrompt;

  if (isCringe) {
    systemPrompt = `You are generating "Would You Rather" questions for educators that are delightfully cringe-worthy and self-aware about school culture. Think: awkward professional development moments, the pain of back-to-school nights, overused edu-jargon, and relatable staff room suffering. Keep it funny, warm, and 100% safe for a staff meeting.
Return ONLY valid JSON, no markdown, no backticks, no preamble:
{
  "optionA": "short punchy cringe option (max 12 words)",
  "optionB": "short punchy cringe option (max 12 words)",
  "discussion": "A funny follow-up question or reflection prompt for the group (max 25 words)",
  "tags": ["tag1", "tag2"]
}`;
  } else if (isControversial) {
    systemPrompt = `You are generating "Would You Rather" questions for educators about genuinely controversial current debates in education. Focus ONLY on educational trends and pedagogy -- things like: AI in classrooms, phone bans, grades vs standards-based grading, homework, open floor plans, social-emotional learning mandates, reading wars (phonics vs whole language), edtech over-reliance, tenure, standardized testing, ChatGPT policies, professional development requirements, etc. These should be real debates educators disagree about -- no easy answers, no politics beyond the schoolhouse. Keep it thought-provoking and slightly spicy but professional.
Return ONLY valid JSON, no markdown, no backticks, no preamble:
{
  "optionA": "short punchy option (max 12 words)",
  "optionB": "short punchy option (max 12 words)",
  "discussion": "One sharp discussion question that surfaces the real tension behind the choice (max 25 words)",
  "tags": ["tag1", "tag2"]
}`;
  } else {
    systemPrompt = `You are a creative educator generating "Would You Rather" questions for classroom icebreakers.
Return ONLY valid JSON, no markdown, no backticks, no preamble:
{
  "optionA": "short punchy option (max 12 words)",
  "optionB": "short punchy option (max 12 words)",
  "discussion": "One engaging discussion question that connects the choice to real thinking or learning (max 25 words)",
  "tags": ["tag1", "tag2"]
}
Make options genuinely fun, memorable, and age-appropriate. They should spark debate. Options should be roughly equal in appeal -- no obvious right answer. Tags should be 2-3 short topic labels.`;
  }

  const userPrompt = isControversial || isCringe
    ? `Create a Would You Rather for: grade band: ${grade}, vibe: ${vibe}.`
    : `Create a Would You Rather for: grade band: ${grade}, subject/theme: ${subject}, vibe: ${vibe}.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      })
    });

    const data = await response.json();
    const raw = data.content.map(b => b.text || "").join("");
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
