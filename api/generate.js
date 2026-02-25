import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // 🔥 Manually parse body
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const rawBody = Buffer.concat(buffers).toString();
    const { topic } = JSON.parse(rawBody);

    if (!topic) {
      return res.status(400).json({ error: "No topic provided" });
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Generate a high-converting Twitter thread about ${topic}. Include hook and CTA.`
          }
        ]
      })
    });

    const aiData = await openaiResponse.json();

    if (!aiData.choices) {
      console.error("OpenAI error:", aiData);
      return res.status(500).json({ error: "OpenAI failed" });
    }

    const output = aiData.choices[0].message.content;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    await supabase.from("generations").insert([
      {
        user_email: "test@creatoros.com",
        topic,
        output
      }
    ]);

    return res.status(200).json({ result: output });

  } catch (error) {
    console.error("Server crash:", error);
    return res.status(500).json({ error: "Server error" });
  }
}