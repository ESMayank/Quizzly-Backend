process.env.UV_THREADPOOL_SIZE = 16; 
const express = require("express");
const dotenv = require("dotenv")
const cors = require("cors");
const quizRoutes = require('./routes/quiz.routes');

const app = express();
app.use(cors());
dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/quiz",quizRoutes);




app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
