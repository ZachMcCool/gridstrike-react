const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Store in .env on server only
});

app.use(cors());
app.use(express.json());

// AI Generation endpoint
app.post("/api/ai/generate", async (req, res) => {
  try {
    const { prompt, useAssistant } = req.body;

    if (useAssistant) {
      // Assistant logic here
      const assistant = await openai.beta.assistants.create({
        name: "GridStrike Card Generator",
        instructions: "Expert GridStrike card creator...",
        model: "gpt-4o",
      });

      // ... rest of assistant logic
    } else {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      res.json({
        success: true,
        content: completion.choices[0].message.content,
      });
    }
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ success: false, error: "AI generation failed" });
  }
});

app.listen(PORT, () => {
  console.log(`AI Service running on port ${PORT}`);
});
