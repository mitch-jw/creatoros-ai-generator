export default async function handler(req, res) {
  try {
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const rawBody = Buffer.concat(buffers).toString();
    const { topic } = JSON.parse(rawBody);

    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: `Generate a Twitter thread about ${topic}.`
        })
      }
    );

    const hfData = await hfResponse.json();

    return res.status(200).json(hfData);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}