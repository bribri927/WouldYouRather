# Would You Rather? — Classroom Icebreaker

An AI-powered Would You Rather generator for classrooms, staff meetings, and conferences. Built for TeacherHive.

## Deploy to Netlify

### 1. Add files to your repo
Drop these files into your repo:
```
index.html
netlify.toml
netlify/functions/generate.js
```

### 2. Set your environment variable
In Netlify: Site Settings > Environment Variables > Add variable:
- Key: `ANTHROPIC_API_KEY`
- Value: your Anthropic API key

### 3. Deploy
Push to your connected repo or drag the folder into Netlify Drop. Done!

## Features
- Grade bands: 6-8, 9-12, Staff/Adult
- Subjects: Any, Math, Science, History, ELA, Tech & AI, Art, PE, School Life
- Vibes: Silly, Thought-provoking, Career, Pop Culture
- Staff-only secret vibes: Cringe and Controversial Ed Trends
- AI-generated discussion prompt with every question
- Big-screen friendly for projection

## Tech
- Vanilla HTML/CSS/JS frontend (no build step)
- Netlify serverless function handles Anthropic API call
- Claude Sonnet powers the generation
