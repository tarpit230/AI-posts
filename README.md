# AI Posts

AI Posts is a Next.js App Router app for generating, editing, scoring, and tracking social media post drafts.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in `MONGODB_URI` plus any AI provider keys you want to use.
3. Start MongoDB Atlas or another MongoDB instance.
4. Run the app with `npm run dev`.

## Included Providers

- OpenAI
- Gemini
- Anthropic
- Groq
- OpenRouter
- Hugging Face
- Ollama

Only providers with a configured API key or base URL are shown in the UI.

## Key Routes

- `/dashboard`
- `/posts`
- `/posts/[id]`
- `/settings`

## Notes

- Drafts are stored in MongoDB via Mongoose.
- The app does not perform automatic posting to social platforms.
- If no provider is configured, generation endpoints fall back to local heuristic text so the UI still works.
