# WorkFlow AI Hub (35)

Build a complete, functional, modern and responsive AI-powered workplace productivity platform called WorkFlow AI.

The app must be one integrated dashboard with three core AI features designed to help employees save time and manage workplace tasks:

1. Smart Email Generator

Create professional workplace emails from user input.

Inputs:

Email purpose

Recipient/context

Key points

Additional instructions

Tone: Formal, Friendly or Persuasive

AI output:

Professional subject line

Well-structured email matching the selected tone

Include Generate, Copy, Edit, Regenerate and Clear buttons, plus loading and error states.

2. Meeting Notes Summariser

Allow users to paste long meeting notes.

AI must extract and display:

Concise summary

Key decisions

Action items

Responsible person (only if mentioned)

Deadlines (only if mentioned)

Include Summarise, Copy, Regenerate and Clear buttons.

The AI must never invent information that is not contained in the notes.

3. AI Task Planner & Scheduler

Allow users to add multiple tasks with:

Task name

Priority: High, Medium or Low

Deadline

Estimated duration

Optional notes

Allow users to generate a Daily or Weekly Schedule.

AI should prioritise tasks based on urgency, deadline, priority and duration, while avoiding overlapping tasks.

Display the generated schedule clearly with date/day, time, task, priority and duration.

DASHBOARD & NAVIGATION

Create a professional SaaS-style dashboard with:

Dashboard/Home

Smart Email

Meeting Summariser

Task Planner

Recent Activity

Settings

Dashboard should include a welcome message, short description, feature cards, quick actions, recent activity and productivity overview.

DESIGN

Use a clean, professional workplace design with:

Responsive desktop/tablet/mobile layout

Sidebar navigation

Top header

Modern cards, buttons and forms

Appropriate icons

Good spacing and typography

Accessible contrast

Smooth interactions

Loading, empty, success and error states

Keep the three features visually consistent as one product.

RESPONSIBLE AI

AI must:

Use information supplied by the user

Never fabricate facts, people, decisions or deadlines

Clearly indicate missing information

Encourage users to review AI-generated content before using it

Display: “AI-generated content should be reviewed before use.”

TECHNICAL REQUIREMENTS

Build a real functional web application, not a static mockup. Use reusable components, proper validation and secure backend/server-side handling for AI/API credentials. Never expose API keys in frontend code.

Ensure all navigation, buttons and core AI workflows function correctly.

The final application must be polished enough to demonstrate to an employer, lecturer or evaluator and clearly demonstrate practical AI implementation, prompt engineering, workplace problem solving, responsible AI and modern UI/UX.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://swift-work-genius.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3ae0d728-fb89-4b2a-86a5-6272aa504caa).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
