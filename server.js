// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 5000;
const SN_API_KEY = process.env.SN_API_KEY;
const SN_MODEL = process.env.SN_MODEL || 'Meta-Llama-3.3-70B-Instruct';
const SN_ENDPOINT = 'https://api.sambanova.ai/v1/chat/completions';

if (!SN_API_KEY) {
  console.error('Missing SN_API_KEY in .env');
  process.exit(1);
}

app.post('/api/questions', async (req, res) => {
  const { subject } = req.body;
  if (!subject) return res.status(400).json({ error: 'Subject is required' });

  const prompt = `Generate 10 multiple-choice questions for MHT-CET 12th Science in ${subject}.
Each question must be returned as JSON with fields:
"text": string,
"options": [
  {"text": string, "isCorrect": true/false, "explanation": string}
].
Return ONLY a valid JSON array.`;

  try {
    const response = await fetch(SN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: SN_MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful exam question generator.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('SambaNova error:', errText);
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    let reply = data?.choices?.[0]?.message?.content || "";

    // Cleanup
    reply = reply.replace(/```json/g, "").replace(/```/g, "").trim();
    const startIndex = reply.indexOf("[");
    const endIndex = reply.lastIndexOf("]");
    if (startIndex !== -1 && endIndex !== -1) {
      reply = reply.substring(startIndex, endIndex + 1);
    }

    let questions;
    try {
      questions = JSON.parse(reply);
      res.json({ questions });
    } catch (e) {
      console.error("Parse error:", e, "Cleaned reply:", reply);
      return res.status(200).json({ error: "Failed to parse questions JSON", raw: reply });
    }
  } catch (error) {
    console.error('Server error calling SambaNova API:', error);
    res.status(500).json({ error: 'Server error calling SambaNova API.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
