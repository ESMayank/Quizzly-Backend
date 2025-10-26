const express = require("express");
const dotenv = require("dotenv")
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");
const app = express();
app.use(cors());
dotenv.config();
app.use(express.json())
app.use(express.urlencoded({extended:true}));
const apiKey = process.env.API_KEY; // Replace with your real one
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function generateQuiz(topic,count) {
 const prompt = `
  Generate a JSON array of ${count} multiple choice questions about "${topic}".
  Follow this exact structure for each question:

  {
    "id": 1,
    "text": "Which language runs in a web browser?",
    "options": [
      { "id": "a", "text": "Java", "points": 0 },
      { "id": "b", "text": "C", "points": 0 },
      { "id": "c", "text": "Python", "points": 0 },
      { "id": "d", "text": "JavaScript", "points": 1 }
    ]
  }

  - There should be **${count} questions total**.
  - Only **one option per question** should have "points": 1.
  - Return **only valid JSON** (no markdown, no explanations).
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();

  // 🧹 Clean up any non-JSON text (sometimes Gemini adds ```json ... ```)
  const clean = response
    .replace(/```json/i, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch (err) {
    console.error("❌ JSON parse error:", err);
    console.log("Raw response:", clean);
    return { error: "Failed to parse JSON", raw: clean };
  }
}

app.post("/quiz", async (req, res) => {
  try {
    // ✅ Await the async function result
    const {topic,count} = req.body;
    const data = await generateQuiz(topic,count);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong", details: err });
  }
});

app.listen(3000, () => {
  console.log("✅ Server is listening on http://localhost:3000");
});
