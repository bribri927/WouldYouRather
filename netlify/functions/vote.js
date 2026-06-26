const Pusher = require("pusher");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { choice, sessionId } = JSON.parse(event.body || "{}");

  if (!choice || !sessionId || !["A", "B"].includes(choice)) {
    return { statusCode: 400, body: "Invalid vote" };
  }

  const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
  });

  await pusher.trigger(`session-${sessionId}`, "vote", { choice });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true }),
  };
};
