exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { grade, subject, vibe } = JSON.parse(event.body || "{}");

  const isCringe = vibe === "cringe";
  const isControversial = vibe === "controversial educational trends";
  const isSnarky = vibe === "snarky";

  let systemPrompt;

  if (isCringe) {
    systemPrompt = `You are generating "Would You Rather" questions for educators that are delightfully cringe-worthy and self-aware about school culture. Think: awkward professional development moments, the pain of back-to-school nights, overused edu-jargon, relatable staff room suffering, nightmare parent emails, and the indignity of being volun-told for committees. Keep it funny, warm, and 100% safe for a staff meeting.
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

  } else if (isSnarky) {
    systemPrompt = `You are generating "Would You Rather" questions for educators with a dry, snarky, self-deprecating wit. These are for adults who have seen it all and can laugh at the absurdity of school life. Think: passive-aggressive staff emails, the 47th iteration of a strategic plan, being asked to "do more with less," mandatory fun, pointless meetings that could have been emails, the laminator hoarder in room 12, and the eternal optimism of August vs. the reality of October. Sharp, clever, and a little savage -- but never mean-spirited toward students or colleagues.
Return ONLY valid JSON, no markdown, no backticks, no preamble:
{
  "optionA": "short punchy snarky option (max 12 words)",
  "optionB": "short punchy snarky option (max 12 words)",
  "discussion": "A dry, witty follow-up that gets the room nodding in painful recognition (max 25 words)",
  "tags": ["tag1", "tag2"]
}`;

  } else if (vibe === "pop culture and trending topics") {
    systemPrompt = `You are generating "Would You Rather" questions packed with SPECIFIC, CURRENT pop culture references. Use real names, real shows, real trends from 2024-2025. Draw from: current music (Sabrina Carpenter, Chappell Roan, Kendrick Lamar, Taylor Swift eras, Beyonce Cowboy Carter, Morgan Wallen), movies/TV (Wicked, Inside Out 2, Moana 2, Squid Game season 2, Severance, The Bear, White Lotus season 3, Outer Banks), sports (Caitlin Clark, LeBron, Shedeur Sanders, NIL era), social media trends (brain rot, demure, brat summer, NPC streaming, BookTok), gaming (Fortnite, Minecraft Movie, Roblox), viral moments, and memes. Make options feel like they were written by someone who is genuinely online. Age-appropriate for the grade band specified -- keep it clean but keep it REAL and SPECIFIC. No vague references. Name names.
Return ONLY valid JSON, no markdown, no backticks, no preamble:
{
  "optionA": "short punchy pop culture option with specific reference (max 12 words)",
  "optionB": "short punchy pop culture option with specific reference (max 12 words)",
  "discussion": "One engaging follow-up that sparks real debate (max 25 words)",
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

  const isStaffOnly = isCringe || isControversial || isSnarky;
  const userPrompt = isStaffOnly
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
