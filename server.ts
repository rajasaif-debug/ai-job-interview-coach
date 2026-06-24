import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
// @ts-expect-error pdf-parse types issue
import pdfParse from "pdf-parse";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini Client
// We use lazy initialization to fail fast on first use if key is missing.
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Ensure error handling for async routes
const asyncHandler = (fn: express.RequestHandler) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// API Routes
app.post("/api/parse-cv", upload.single("cv"), asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  const data = await pdfParse(req.file.buffer);
  res.json({ text: data.text });
}));

app.post("/api/generate-questions", asyncHandler(async (req, res) => {
  const { cvText, jobRole } = req.body;
  
  if (!cvText) {
    res.status(400).json({ error: "cvText is required" });
    return;
  }

  const ai = getAI();
  
  const prompt = `
You are an expert HR Interviewer and Recruiter.
Based on the following CV/Resume and the target job role, generate exactly 3 highly relevant and challenging interview questions.
The questions should test their experience, technical skills (if applicable), and situational judgment.

Target Job Role: ${jobRole || "General Position"}

CV/Resume Content:
${cvText}

Return a strict JSON array of strings, where each string is an interview question. Do not include markdown formatting like \`\`\`json. Just the JSON array.
Example: ["Question 1?", "Question 2?", "Question 3?"]
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.7,
      responseMimeType: "application/json",
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate questions");
  }

  const questions = JSON.parse(response.text);
  res.json({ questions });
}));

app.post("/api/evaluate-answer", asyncHandler(async (req, res) => {
  const { question, answer, cvText, jobRole } = req.body;

  if (!question || !answer) {
    res.status(400).json({ error: "question and answer are required" });
    return;
  }

  const ai = getAI();

  const prompt = `
You are an expert HR Interviewer and Recruiter evaluating a candidate's answer.

Job Role: ${jobRole || "General Position"}
Candidate's CV:
${cvText || "Not provided"}

Interview Question asked: "${question}"
Candidate's Answer (Speech-to-Text Transcript): "${answer}"

Analyze the candidate's answer based on the following criteria:
1. Relevance to the question.
2. Alignment with their stated experience in the CV.
3. Clarity and structure of the answer.
4. Identification of filler words or hesitation (if apparent in the transcript).

Provide a structured evaluation in JSON format exactly matching this schema (do not use markdown formatting like \`\`\`json):
{
  "score": number (0-100),
  "strengths": [array of strings],
  "weaknesses": [array of strings],
  "feedback": "string, a paragraph of constructive feedback",
  "idealAnswer": "string, a brief example of what a perfect answer would sound like"
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.3,
      responseMimeType: "application/json",
    }
  });

  if (!response.text) {
    throw new Error("Failed to evaluate answer");
  }

  const evaluation = JSON.parse(response.text);
  res.json(evaluation);
}));

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("API Error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
