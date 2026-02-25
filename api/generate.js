export default async function handler(req, res) {
  const { topic } = req.body;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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

  const data = await response.json();
  res.status(200).json({ result: data.choices[0].message.content });
}