const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  try {
    // Allow only POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ---- SAFE BODY PARSING ----
    let topic;

    try {
      if (req.body && typeof req.body === "object") {
        topic = req.body.topic;
      } else {
        // Fallback if body is raw string
        const buffers = [];
        for await (const chunk of req) {
          buffers.push(chunk);
        }
        const rawBody = Buffer.concat(buffers).toString();
        const parsed = JSON.parse(rawBody || "{}");
        topic = parsed.topic;
      }
    } catch (parseError) {
      console.error("Body parse error:", parseError);
      return res.status(400).json({ error: "Invalid request body" });
    }

    if (!topic) {
      return res.status(400).json({ error: "No topic provided" });
    }

    // ---- INIT SUPABASE ----
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // ---- GENERATE PROMPT (NO EXTERNAL AI) ----
    const output = `COPY THIS INTO CHATGPT:

Generate a high-converting Twitter thread about "${topic}".

Requirements:
- Strong curiosity hook
- 6-8 short tweets
- Clear structure (problem → insight → solution)
- Actionable advice
- Strong CTA at the end
- Confident creator tone
`;

    // ---- SAVE TO DATABASE SAFELY ----
    try {
      const { error } = await supabase.from("generations").insert([
        {
          user_email: "test@creatoros.com",
          topic,
          output,
        },
      ]);

      if (error) {
        console.error("Supabase insert error:", error);
      }
    } catch (dbError) {
      console.error("Database crash:", dbError);
    }

    return res.status(200).json({ result: output });

  } catch (error) {
    console.error("SERVER CRASH:", error);
    return res.status(500).json({ error: "Server error" });
  }
};