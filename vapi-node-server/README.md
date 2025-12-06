# Vapi Node Server

A standalone Node.js server for Vapi integration, powered by Google Gemini.

## Setup

1.  Navigate to this directory: `cd vapi-node-server`
2.  Install dependencies: `npm install` (already done)
3.  Create a `.env` file based on the required variables below.

## Environment Variables

Create a file named `.env` in this directory with the following content:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# API Key for Google Generative AI (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key

# Optional: Server Port (default 4000)
PORT=4000
```

## Running the Server

-   **Development:** `npm run dev`
-   **Production:** `npm start` (make sure to run `npm run build` first)

## Endpoints

-   `POST /api/vapi/generate`: Generate interview questions.
-   `POST /api/feedback`: Analyze interview transcript and generate feedback.
-   `GET /`: Health check.
