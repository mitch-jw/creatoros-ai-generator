const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const rawBody = Buffer.concat(buffers).toString();
    const { topic } = JSON.parse(rawBody || "{}");

    if (!topic) {
      return res.status(400).json({ error: "No topic provided" });
    }

    // 🔥 Generate optimized prompt instead of calling AI
    const output = `
COPY THIS INTO CHATGPT:

Generate a high-converting Twitter thread about "${topic}".

Requirements:
- Strong curiosity-based hook
- 6-8 short engaging tweets
- Clear structure (problem → insight → solution)
- Actionable advice
- Strong CTA at the end encouraging newsletter signups
- Confident creator tone
- No fluff

Format:

Hook:
Tweet 1:
Tweet 2:
...
CTA:
`;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    await supabase.from("generations").insert([
      {
        user_email: "test@creatoros.com",
        topic,
        output,
      },
    ]);

    return res.status(200).json({ result: output });

  } catch (error) {
    console.error("Server crash:", error);
    return res.status(500).json({ error: "Server error" });
  }
}

// Safe count check bc it crashed :((
let count = 0;

try {
  const { count: dbCount, error } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Count error:", error);
  } else {
    count = dbCount || 0;
  }
} catch (err) {
  console.error("Count crash:", err);
}

if (count >= 5) {
  return res.status(403).json({
    error: "Free limit reached. Upgrade to Pro for unlimited prompts."
  });
}