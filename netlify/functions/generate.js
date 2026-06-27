exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { grade, subject, vibe } = JSON.parse(event.body || "{}");

  const isCringe = vibe === "cringe";
  const isControversial = vibe === "controversial educational trends";
  const isSnarky = vibe === "snarky";

  // Variety seed -- pick a random angle to push the AI toward different territory each time
  const angles = [
    "Focus on a surprising or unexpected scenario.",
    "Make one option glamorous and one option chaotic.",
    "Use a specific real-world context rather than a generic one.",
    "Make both options sound equally appealing in different ways.",
    "Make both options sound equally terrible in different ways.",
    "Set it in an unusual or imaginative location or situation.",
    "Use a time or era as part of the scenario.",
    "Ground it in a very specific relatable moment.",
    "Make it absurd but still thought-provoking.",
    "Make it deceptively simple -- the debate is in the details.",
    "Use a comparison between two very different experiences.",
    "Tie it to a real skill, strength, or weakness people identify with.",
  ];
  const varietySeed = angles[Math.floor(Math.random() * angles.length)];

  let systemPrompt;

  if (isCringe) {
    systemPrompt = `You are generating "Would You Rather" questions for educators that are delightfully cringe-worthy and self-aware about school culture. Think: awkward professional development moments, the pain of back-to-school nights, overused edu-jargon, relatable staff room suffering, nightmare parent emails, being volun-told for committees, the one colleague who replies-all, laminator drama, and the slow death of a mandatory fun activity. Keep it funny, warm, and 100% safe for a staff meeting.
Variety instruction: ${varietySeed}
Return ONLY valid JSON, no markdown, no backticks, no preamble:
{
  "optionA": "short punchy cringe option (max 12 words)",
  "optionB": "short punchy cringe option (max 12 words)",
  "discussion": "A funny follow-up question or reflection prompt for the group (max 25 words)",
  "tags": ["tag1", "tag2"]
}`;

  } else if (isControversial) {
    systemPrompt = `You are generating "Would You Rather" questions for educators about genuinely controversial current debates in education. Focus ONLY on educational trends and pedagogy -- things like: AI in classrooms, phone bans, grades vs standards-based grading, homework, open floor plans, social-emotional learning mandates, reading wars (phonics vs whole language), edtech over-reliance, tenure, standardized testing, ChatGPT policies, professional development requirements, etc. No easy answers, no partisan politics. Spicy but professional.
Variety instruction: ${varietySeed}
Return ONLY valid JSON, no markdown, no backticks, no preamble:
{
  "optionA": "short punchy option (max 12 words)",
  "optionB": "short punchy option (max 12 words)",
  "discussion": "One sharp discussion question that surfaces the real tension behind the choice (max 25 words)",
  "tags": ["tag1", "tag2"]
}`;

  } else if (isSnarky) {
    systemPrompt = `You are generating "Would You Rather" questions for educators with a dry, snarky, self-deprecating wit. Think: passive-aggressive staff emails, the 47th iteration of a strategic plan, being asked to "do more with less," mandatory fun, pointless meetings that could have been emails, the laminator hoarder in room 12, and the eternal optimism of August vs. the reality of October. Sharp, clever, and a little savage -- but never mean-spirited toward students or colleagues.
Variety instruction: ${varietySeed}
Return ONLY valid JSON, no markdown, no backticks, no preamble:
{
  "optionA": "short punchy snarky option (max 12 words)",
  "optionB": "short punchy snarky option (max 12 words)",
  "discussion": "A dry, witty follow-up that gets the room nodding in painful recognition (max 25 words)",
  "tags": ["tag1", "tag2"]
}`;

  } else if (vibe === "pop culture and trending topics") {
    systemPrompt = `You are generating "Would You Rather" questions packed with SPECIFIC, CURRENT pop culture references from 2024-2025. Use real names, real shows, real trends. Draw from: music (Sabrina Carpenter, Chappell Roan, Kendrick Lamar, Taylor Swift eras, Beyonce Cowboy Carter, Morgan Wallen, Doechii, Billie Eilish), movies/TV (Wicked, Inside Out 2, Moana 2, Squid Game S2, Severance, The Bear, White Lotus S3, Outer Banks, Adolescence), sports (Caitlin Clark, LeBron, Shedeur Sanders, NIL era), social media (brain rot, very demure, brat summer, NPC streaming, BookTok, BeReal), gaming (Fortnite, Minecraft Movie, Roblox, Balatro), viral moments and memes. Name names. Be SPECIFIC. Age-appropriate for grade band.
Variety instruction: ${varietySeed}
Return ONLY valid JSON, no markdown, no backticks, no preamble:
{
  "optionA": "punchy pop culture option with specific reference (max 12 words)",
  "optionB": "punchy pop culture option with specific reference (max 12 words)",
  "discussion": "One engaging follow-up that sparks real debate (max 25 words)",
  "tags": ["tag1", "tag2"]
}`;

  } else {
    systemPrompt = `You are a creative educator generating "Would You Rather" questions for classroom or staff icebreakers. Make them genuinely surprising, memorable, and age-appropriate for the grade band. Options should spark real debate -- no obvious right answer, roughly equal appeal. Push beyond the first obvious idea that comes to mind and go somewhere unexpected or specific.
Variety instruction: ${varietySeed}
Return ONLY valid JSON, no markdown, no backticks, no preamble:
{
  "optionA": "short punchy option (max 12 words)",
  "optionB": "short punchy option (max 12 words)",
  "discussion": "One engaging discussion question connecting the choice to real thinking or learning (max 25 words)",
  "tags": ["tag1", "tag2"]
}`;
  }

  const isStaffOnly = isCringe || isControversial || isSnarky;
  const userPrompt = isStaffOnly
    ? `Create a Would You Rather for: audience: ${grade}, vibe: ${vibe}. Be creative and avoid repeating common scenarios.`
    : `Create a Would You Rather for: grade band: ${grade}, subject/theme: ${subject}, vibe: ${vibe}. Be creative and avoid repeating common scenarios.`;

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
