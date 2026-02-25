import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    // Only allow POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Parse body safely
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const rawBody = Buffer.concat(buffers).toString();
    const { topic } = JSON.parse(rawBody || "{}");

    if (!topic) {
      return res.status(400).json({ error: "No topic provided" });
    }

    // Call Hugging Face router (stable model)
    const hfResponse = await fetch(
      "https://router.huggingface.co/hf-inference/models/google/flan-t5-large",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `Write a high-converting Twitter thread about ${topic}. Include a strong hook and a CTA at the end.`,
        }),
      }
    );

    // Read response as text first
    const rawText = await hfResponse.text();

    // Try to parse JSON safely
    let hfData;
    try {
      hfData = JSON.parse(rawText);
    } catch (err) {
      return res.status(500).json({
        error: "HF returned non-JSON",
        raw: rawText,
      });
    }

    if (!hfData || !hfData[0]?.generated_text) {
      return res.status(500).json({
        error: "HF bad response format",
        details: hfData,
      });
    }

    const output = hfData[0].generated_text;

    // Save to Supabase
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