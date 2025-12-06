import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateText, generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "./firebase";
import { feedbackSchema, interviewer } from "./constants";
import { getRandomInterviewCover } from "./lib/utils";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Vapi Node Server is running");
});

// Generate Questions (Logic from app/api/vapi/generate/route.ts)
app.post("/api/vapi/generate", async (req: Request, res: Response) => {
  try {
    const { type, role, level, techstack, amount, userid } = req.body;
    
    // Log the request for debugging
    console.log("Generating questions for:", { role, level, techstack, type });

    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you! <3
    `,
    });

    const parsedQuestions = JSON.parse(questions);

    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: typeof techstack === 'string' ? techstack.split(",") : techstack,
      questions: parsedQuestions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("interviews").add(interview);

    // Return format compatible with Next.js helper if needed, or just success
    res.status(200).json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Error generating questions:", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Create Feedback (Logic from lib/actions/general.action.ts)
app.post("/api/feedback", async (req: Request, res: Response) => {
  try {
    const { interviewId, userId, transcript, feedbackId } = req.body;
    
    console.log("Generating feedback for interview:", interviewId);

    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false, 
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    res.status(200).json({ success: true, feedbackId: feedbackRef.id });
  } catch (error) {
    console.error("Error saving feedback:", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Vapi Node Server running on port ${port}`);
});
