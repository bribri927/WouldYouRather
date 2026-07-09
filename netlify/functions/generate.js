// netlify/functions/generate.js
// Would You Rather generator with school-safe guardrails, a regex backstop,
// optional topic focus, and anti-repeat via an exclude list.

// --- Banned-content backstop -------------------------------------------------
// If a generated dilemma trips this, we throw it out and regenerate.
// Word-boundary matching so we don't false-positive on things like "skill".
const BANNED = [
  "die","dies","died","dying","death","dead","kill","killed","killing",
  "suicide","self-harm","self harm","hurt yourself","harm yourself",
  "overdose","cut yourself","hang yourself",
  "gun","shoot","shooting","stab","weapon","bomb","murder","violence","violent",
  "abuse","abused","assault","molest",
  "cancer","terminal","dementia","coma","overdose",
  "drunk","alcohol","vape","vaping","weed","drugs","high on",
  "sexy","sexual","nude","naked","hookup",
  "fat","ugly","anorexia","starve","starving",
  "hate crime","racist","suicidal"
];
const BANNED_RE = new RegExp(
  "\\b(" + BANNED.map(w => w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|") + ")\\b",
  "i"
);

function isUnsafe(q) {
  const blob = `${q.optionA} ${q.optionB} ${q.discussion || ""}`;
  return BANNED_RE.test(blob);
}

// --- Prompt builder ----------------------------------------------------------
function buildPrompt({ grade, subject, vibe, topic, exclude }) {
  const focusLine = topic && topic.trim()
    ? `Where it fits naturally, theme the dilemma around "${topic.trim()}", but keep it accessible and don't require prior knowledge of it.`
    : "";

  const excludeLine = (exclude && exclude.length)
    ? `Do NOT repeat or closely resemble any of these already-used dilemmas:\n- ${exclude.slice(-20).join("\n- ")}\nMake this one clearly different in topic and structure.`
    : "";

  // A random angle nudges the model off its single highest-probability answer.
  const angles = ["superpowers","time travel","food","animals","technology",
    "school life","seasons","space","sports","music","art","the future",
    "everyday choices","hypothetical trade-offs","curiosity and wonder"];
  const angle = angles[Math.floor(Math.random() * angles.length)];

  return `You generate one "Would You Rather" dilemma shown to K-12 STUDENTS on a classroom screen.

AUDIENCE: Grade band ${grade || "K-12"}${subject ? `, subject focus: ${subject}` : ""}.
TONE: ${vibe || "fun and engaging"}.
${focusLine}

HARD SAFETY RULES. Never generate a dilemma that involves, references, or implies any of the following, even as a joke, hypothetical, or "thought-provoking" angle:
- death, dying, when or how someone dies, or "the date of your death"
- suicide, self-harm, or harming oneself
- violence, weapons, injury, or harm to others
- serious illness, medical trauma, or disability framed negatively
- abuse, neglect, or unsafe home/family situations
- drugs, alcohol, vaping, or other substances
- romantic or sexual content
- body image, weight, appearance judgments, or eating
- family money problems or poverty
- targeting anyone's race, religion, gender, or orientation
- anything a teacher would be uncomfortable projecting on a screen

"Thought-provoking" means intellectually interesting and imaginative (ethical trade-offs, curiosity, what-ifs), NOT dark, morbid, or emotionally heavy. If an idea touches anything above, discard it and pick a lighter angle.

For variety this round, lean toward the angle of: ${angle}.

${excludeLine}

Return ONLY valid JSON, no markdown, no backticks, in exactly this shape:
{"optionA":"Would you rather ...","optionB":"or ...","discussion":"one short discussion prompt for the class"}`;
}

// --- Anthropic call ----------------------------------------------------------
async function generateOnce(input) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      temperature: 1.0,
      messages: [{ role: "user", content: buildPrompt(input) }],
    }),
  });

  const data = await res.json();
  let text = (data.content && data.content[0] && data.content[0].text) || "";
  text = text.replace(/```json|```/g, "").trim();

  const parsed = JSON.parse(text);
  if (!parsed.optionA || !parsed.optionB) throw new Error("bad_shape");
  return parsed;
}

// --- Handler -----------------------------------------------------------------
exports.handler = async (event) => {
  try {
    const input = JSON.parse(event.body || "{}");

    // Try up to 3 times to get a safe, well-formed question.
    let q = null;
    for (let i = 0; i < 3; i++) {
      try {
        const candidate = await generateOnce(input);
        if (!isUnsafe(candidate)) { q = candidate; break; }
      } catch (e) {
        // parse or shape error, just retry
      }
    }

    // Safe fallback if all attempts failed or kept tripping the filter.
    if (!q) {
      q = {
        optionA: "Would you rather be able to fly",
        optionB: "or be able to turn invisible",
        discussion: "What is the first thing you would do with your power?"
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(q),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: e.message }),
    };
  }
};
