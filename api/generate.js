import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { topic } = req.body;

  const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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

  const data = await aiResponse.json();
  const output = data.choices[0].message.content;

  await supabase.from("generations").insert([
    {
      user_email: "test@creatoros.com",
      topic,
      output
    }
  ]);

  res.status(200).json({ result: output });
}