import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// Generate Chat Title (short, like ChatGPT)
router.post("/generate-title", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required for title generation" });
    }

    const prompt = `
      Generate a very short chat title (max 5-6 words) summarizing this message:
      "${message}"
      Respond with ONLY the title text.
    `;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Your job is to create ultra-short chat titles." },
          { role: "user", content: prompt }
        ],
        max_tokens: 15
      })
    });

    const data = await openaiResponse.json();

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: "Invalid response from OpenAI" });
    }

    res.json({ title: data.choices[0].message.content.trim() });

  } catch (error) {
    console.error("Title generation error:", error);
    res.status(500).json({ error: "Failed to generate title" });
  }
});

export default router;
