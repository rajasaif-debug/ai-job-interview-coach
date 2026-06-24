# AI-Powered Job Interview Coach

An intelligent full-stack application that helps students and professionals practice job interviews. The system simulates real interview scenarios, analyzes uploaded CVs (PDFs), processes speech input, and evaluates answers using Google's Gemini AI to provide actionable feedback like a real HR recruiter.

## 🚀 Features

- **CV Analysis (PDF Upload):** Upload your resume in PDF format. The system extracts your background to tailor the interview questions specifically to your experience.
- **Dynamic Question Generation:** Uses Gemini AI to generate 3 highly relevant, challenging interview questions based on your target job role and CV.
- **Speech-to-Text Integration:** Uses the browser's native Web Speech API to let you answer questions naturally using your microphone, transcribing your speech in real-time.
- **AI Answer Evaluation:** Analyzes your transcribed answer against the question and your CV to provide a score (0-100), identify strengths, pinpoint weaknesses, and offer an ideal answer structure.
- **Detailed Feedback Dashboard:** Review your overall readiness score and in-depth feedback for each question once the interview is complete.

## 💻 Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide React (Icons)
- **Backend:** Node.js, Express
- **AI Integration:** `@google/genai` (Gemini 2.5 Flash)
- **File Processing:** `multer` (Upload handling), `pdf-parse` (PDF text extraction)
- **Build Tool:** Vite, esbuild

## 🛠️ Prerequisites

- Node.js (v18 or higher)
