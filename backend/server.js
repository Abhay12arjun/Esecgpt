// backend/server.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import titleRoutes from "./routes/titleRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", titleRoutes);

const OPENAI_KEY = process.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!OPENAI_KEY) {
  console.warn("OPENAI_API_KEY not set. Set it in backend/.env");
}

// --------------------------
// SSE helper function
// --------------------------
function streamSSE(res, data) {
  res.write(`data: ${data}\n\n`);
}

// --------------------------
// Streaming endpoint
// --------------------------
app.post("/api/v1/stream", async (req, res) => {
  try {
    if (!OPENAI_KEY) {
      res.status(500).json({ error: "OpenAI API key not configured." });
      return;
    }

    const { messages = [], systemPrompt = "You are a helpful assistant.", temperature = 0.7 } = req.body;

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const body = {
      model: OPENAI_MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature,
      stream: true,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      streamSSE(res, JSON.stringify({ error: `OpenAI error: ${response.status} ${text}` }));
      streamSSE(res, "[DONE]");
      res.end();
      return;
    }

    // Node.js stream handling
    const reader = response.body;
    reader.on("data", (chunk) => {
      const lines = chunk.toString("utf-8").split("\n");
      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith("data:")) {
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") {
            streamSSE(res, "[DONE]");
            res.end();
            return;
          }
          streamSSE(res, payload);
        }
      }
    });

    reader.on("end", () => {
      streamSSE(res, "[DONE]");
      res.end();
    });

    reader.on("error", (err) => {
      console.error("Stream error:", err);
      try {
        streamSSE(res, JSON.stringify({ error: err.message }));
        streamSSE(res, "[DONE]");
        res.end();
      } catch (e) {
        console.error("Failed to send SSE error", e);
      }
    });
  } catch (err) {
    console.error("Stream endpoint error:", err);
    try {
      streamSSE(res, JSON.stringify({ error: err.message || "Stream failed" }));
      streamSSE(res, "[DONE]");
      res.end();
    } catch (e) {
      console.error("Failed to send SSE error", e);
    }
  }
});

// --------------------------
// Health check
// --------------------------
app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
