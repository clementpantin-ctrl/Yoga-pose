<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/f48da3ff-d264-4748-b5a9-17acba81bb24

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Add your Gemini API key to `.env.local` at the project root:
   `GEMINI_API_KEY=your_gemini_api_key`
3. Run the app:
   `npm run dev`

The key is read by the server and is never sent to the browser. `.env.local` is excluded from Git. In production, configure `GEMINI_API_KEY` as a server-side environment secret in your hosting provider; do not add it to frontend code or expose it with a `VITE_` prefix.

## Deploy to Vercel

1. Push this project to a GitHub repository and import that repository in Vercel.
2. In the Vercel project settings, add `GEMINI_API_KEY` under **Environment Variables** for Production (and Preview if needed). Use a newly generated key; never commit it to GitHub.
3. Deploy. The Vite build writes the frontend to `public/`, and Vercel serves the Express API from `server.ts`.

The local `.env.local` file is ignored by Git and is only for development. Rotate any Gemini key that has been shared in chat or committed to a repository.
