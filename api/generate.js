import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const rawBody = Buffer.concat(buffers).toString();
    const { topic } = JSON.parse(rawBody);

    if (!topic) {
      return res.status(400).json({ error: "No topic provided" });
    }

    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: `Generate a high-converting Twitter thread about ${topic}. Include hook and CTA.`,
          parameters: {
            max_new_tokens: 400
          }
        })
      }
    );

    const hfData = await hfResponse.json();

    if (!hfData || !hfData[0]?.generated_text) {
      console.error(hfData);
      return res.status(500).json({ error: "HF failed" });
    }

    const output = hfData[0].generated_text;

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
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
}