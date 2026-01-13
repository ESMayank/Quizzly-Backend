const generateQuiz = require("./services/gemini.integration")
const redis = require("./services/redis.services");
 async function quizGenerate(req, res){
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
}

module.exports = quizGenerate;