# SIGNAL IT — Healthcare & IT Intelligence Feed

A self-hosted, AI-powered news dashboard that curates the latest from 23 IT and Healthcare IT sources into a single feed.

## Features

- **AI-powered curation** — Uses Claude + web search to find and summarize the latest stories
- **23 pre-loaded sources** — General IT, cloud, security, AI/ML, and Healthcare IT
- **Healthcare IT category** — Dedicated filter for HIPAA, EHR, clinical AI, and health tech news
- **Source management** — Toggle sources on/off or add your own
- **Persistent storage** — Articles and preferences saved in your browser's localStorage
- **Card & compact views** — Switch between rich cards or a dense list
- **Category filtering** — Healthcare IT, Security, Cloud, AI/ML, General IT

## Quick Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "Add New → Project" and import your repo
4. Vercel auto-detects Vite — just click **Deploy**
5. Once live, click the ⚙ gear icon and enter your Anthropic API key

## Quick Deploy to Netlify

1. Push this folder to a GitHub repository
2. Go to [netlify.com](https://netlify.com) and sign in
3. Click "Add new site → Import an existing project"
4. Select your repo. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy site**

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## API Key Setup

This app calls the Anthropic API directly from the browser to power the news feed. You'll need an API key:

1. Go to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Create a new key
3. In the dashboard, click the ⚙ gear icon and paste your key
4. The key is stored in your browser's localStorage — it never leaves your machine

**Note:** Each feed refresh uses Claude with web search, which costs a small amount per call. A daily refresh would be very inexpensive.

## Project Structure

```
signal-it-dashboard/
├── index.html              # Entry point
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies & scripts
├── src/
│   ├── main.jsx            # React mount + storage polyfill
│   └── ITNewsDashboard.jsx # Main dashboard component
└── README.md
```
