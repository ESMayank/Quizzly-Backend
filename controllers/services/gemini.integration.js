const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const apiKey = process.env.API_KEY || process.env.GOOGLE_API_KEY || null;

let genAI = null;
let model = null;
try {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
} catch (e) {
  // If the SDK isn't configured or API key missing, we'll fall back later.
  console.warn("@google/generative-ai not initialized:", e && e.message);
}

const DEFAULT_COUNT = 10;

async function generateQuiz(topic = "General Knowledge", count = DEFAULT_COUNT) {
  count = Number(count) || DEFAULT_COUNT;

  // If the model is available, try to call Gemini
  if (model) {
    try {
      const prompt = `Generate a JSON array of ${count} multiple choice questions about "${topic}". Return ONLY valid JSON (no markdown). Each question must follow this structure:\n[ { \"id\": 1, \"text\": \"Question text\", \"options\": [ { \"id\": \"a\", \"text\": \"opt\", \"points\": 0 }, ... ] } ]`;

      const result = await model.generateContent(prompt);
      const text = await result.response.text();

      // strip ```json fences if present
      const clean = String(text).replace(/```json/i, "").replace(/```/g, "").trim();

      try {
        const parsed = JSON.parse(clean);
        return parsed;
      } catch (parseErr) {
        console.error("Failed to parse Gemini response:", parseErr && parseErr.message);
        console.log("Raw Gemini response:", clean);
        throw new Error("Failed to parse Gemini response as JSON");
      }
    } catch (err) {
      console.error("Gemini model call failed:", err && err.message);
      // fall through to fallback
    }
  }

  // Fallback: return a simple generated quiz locally when Gemini isn't available
  const fallback = [];
  for (let i = 1; i <= count; i++) {
    fallback.push({
      id: i,
      text: `Sample question ${i} about ${topic}`,
      options: [
        { id: "a", text: "Option A", points: 0 },
        { id: "b", text: "Option B", points: 0 },
        { id: "c", text: "Option C", points: 0 },
        { id: "d", text: "Option D", points: 1 }
      ]
    });
  }
  return fallback;
}

module.exports = generateQuiz;
