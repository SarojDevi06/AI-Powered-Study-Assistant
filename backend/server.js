
import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get backend folder path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend/.env
dotenv.config({
    path: path.join(__dirname, ".env")
});

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// Middleware
app.use(express.json({ limit: "100kb" }));

// Connect frontend public folder
app.use(
    express.static(path.join(__dirname, "..", "public"))
);

// Prompts for all five features
const prompts = {
    notes: (input) => `
        Create easy-to-understand study notes about: ${input}

        Include:
        1. Introduction
        2. Important concepts
        3. Key points
        4. Examples
        5. Short conclusion

        Use simple student-friendly language.
    `,

    summary: (input) => `
    You are an expert academic summarizer.

    Summarize the following study material in simple,
    easy-to-understand English.

    Instructions:
    1. Read the complete text carefully.
    2. Keep all important definitions and concepts.
    3. Preserve important headings.
    4. Convert long paragraphs into short bullet points.
    5. Remove repeated and unnecessary information.
    6. Keep examples that help students understand.
    7. Do not miss important facts or formulas.
    8. Make the summary shorter than the original.
    9. Do not generate new information.

    Study Material:
    ${input}
`,

    mcq: (input) => `
        Generate exactly 5 multiple-choice questions
        about: ${input}

        Each question must have:
        - Four options (A, B, C, D)
        - One correct answer
        - A short explanation

        Clearly mention the correct answer.
        Keep questions educational and accurate.
    `,

    chat: (input) => `
        You are an AI Study Assistant and academic tutor.

        Answer the student's question:
        ${input}

        Explain in simple language with examples
        wherever useful. Be clear and helpful.
    `,

    tips: (input) => `
        Generate 8 practical study tips for the subject:
        ${input}

        Include revision techniques, time management,
        practice methods and memory improvement tips.
        Explain each tip briefly.
    `
};

// Generate AI response
app.post("/api/generate", async (req, res) => {
    try {
        const { type, input } = req.body;

        const allowedTypes = [
            "notes",
            "summary",
            "mcq",
            "chat",
            "tips"
        ];

        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                error: "Invalid feature selected."
            });
        }

        if (typeof input !== "string" || !input.trim()) {
            return res.status(400).json({
                error: "Please enter some text or a topic."
            });
        }

        if (input.length > 12000) {
            return res.status(400).json({
                error: "Input is too long. Please use less than 12000 characters."
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                error: "Gemini API key is missing. Check your backend .env file."
            });
        }

        // Call Gemini API
        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-flash-latest",
            contents: prompts[type](input),
            config: {
                systemInstruction:
                    "You are a helpful educational AI assistant. " +
                    "Give accurate, simple and student-friendly answers.",
                maxOutputTokens: 2000
            }
        });

        const result = response.text;

        if (!result) {
            throw new Error("Gemini returned an empty response.");
        }

        return res.json({
            success: true,
            result: result
        });

    } catch (error) {
        console.error("Gemini Error:", error);

        return res.status(500).json({
            error: "Unable to generate a response. Check your Gemini API key, model access and usage limits."
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(
        `AI Study Assistant running at http://localhost:${PORT}`
    );
});
