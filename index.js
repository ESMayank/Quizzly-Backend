process.env.UV_THREADPOOL_SIZE = 16; 
const express = require("express");
const dotenv = require("dotenv")
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");
const Redis = require("ioredis");

const app = express();
app.use(cors());
dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 Redis Connection (use your URL here)
const redis = new Redis(process.env.REDIS_URL);

// Redis Events
redis.on("connect", () => console.log("🔗 Connected to Redis"));
redis.on("error", (err) => console.log("❌ Redis Error:", err));

const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function generateQuiz(topic, count) {
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
  - There should be ${count} questions total.
  - Only one option per question should have "points": 1.
  - Return ONLY valid JSON.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();

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
    const { topic, count } = req.body;

    const cacheKey = `quiz:${topic}:${count}`;

    const cachedQuiz = await redis.get(cacheKey);
    if (cachedQuiz) {
      return res.json({
        source: "redis-cache",
        quiz: JSON.parse(cachedQuiz)
      });
    }

   
    const quizData = await generateQuiz(topic, count);

    
    await redis.set(cacheKey, JSON.stringify(quizData), "EX", 3600);

    res.json({
      source: "AI-generated",
      quiz: quizData
    });

  } catch (err) {
    res.status(500).json({ error: "Server Error", details: err });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
