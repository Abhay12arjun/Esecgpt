/**
 * aiService.js
 *
 * Frontend service to interact with AI via backend proxy.
 * - Streams responses via /api/v1/stream
 * - Full response via /api/v1/chat
 * - Never exposes OpenAI API key to the browser
 */

const API_BASE = import.meta.env.VITE_AI_PROXY_URL || "http://localhost:4000";

/**
 * generateTitle
 * Sends a single user message to backend to generate a chat title
 * @param {string} message
 * @returns {Promise<string|null>}
 */
export async function generateTitle(message) {
  try {
    const res = await fetch(`${API_BASE}/api/generate-title`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      console.error("Backend error:", await res.text());
      return null;
    }

    const data = await res.json();
    return data.title || null;
  } catch (err) {
    console.error("Title generation error:", err);
    return null;
  }
}

/**
 * generateResponse
 * Sends messages to backend and returns full response text (non-streaming)
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} systemPrompt
 * @param {number} temperature
 * @returns {Promise<string>}
 */
export async function generateResponse(messages = [], systemPrompt = "You are a helpful assistant.", temperature = 0.7) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, systemPrompt, temperature }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`AI proxy returned ${res.status}: ${txt}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    console.error("generateResponse error:", err);
    return `Error: ${err.message}`;
  }
}

/**
 * streamResponse
 * Streams AI tokens from backend SSE endpoint
 *
 * @param {Object} options
 * @param {Array<{role: string, content: string}>} options.messages
 * @param {string} options.systemPrompt
 * @param {number} options.temperature
 * @param {function(string):void} options.onToken - called for each token
 * @param {function():void} options.onDone - called when streaming ends
 * @param {function(Error):void} options.onError - called on error
 */
export async function streamResponse({
  messages = [],
  systemPrompt = "You are a helpful assistant.",
  temperature = 0.7,
  onToken = () => {},
  onDone = () => {},
  onError = () => {},
}) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, systemPrompt, temperature }),
    });

    if (!res.ok) {
      const txt = await res.text();
      onError(new Error(`AI proxy returned ${res.status}: ${txt}`));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep last incomplete line

      for (let raw of lines) {
        raw = raw.trim();
        if (!raw) continue;

        if (raw.startsWith("data:")) {
          const payload = raw.slice(5).trim();

          if (payload === "[DONE]") {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) {
              onError(new Error(parsed.error));
            } else if (parsed.choices) {
              parsed.choices.forEach((ch) => {
                if (ch.delta?.content) onToken(ch.delta.content);
                else if (ch.text) onToken(ch.text);
              });
            } else if (parsed.delta?.content) {
              onToken(parsed.delta.content);
            } else {
              onToken(JSON.stringify(parsed));
            }
          } catch {
            // raw string fallback
            onToken(payload);
          }
        } else {
          if (raw === "[DONE]") {
            onDone();
            return;
          } else {
            onToken(raw);
          }
        }
      }
    }

    // flush remaining buffer
    if (buffer.trim() && buffer.trim() !== "[DONE]") {
      try {
        const parsed = JSON.parse(buffer.trim());
        if (parsed.error) onError(new Error(parsed.error));
        else onToken(parsed);
      } catch {
        onToken(buffer.trim());
      }
    }

    onDone();
  } catch (err) {
    onError(err);
  }
}
