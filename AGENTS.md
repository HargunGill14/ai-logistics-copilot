# AGENTS.md — AI Logistics Copilot

## What This App Does
AI Logistics Copilot is a SaaS web app for freight brokers and small
freight brokerage firms. It helps brokers price loads automatically,
estimate margins, and generate negotiation emails to shippers and carriers.

## Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes (server-side only)
- **Database + Auth:** Supabase (PostgreSQL, Row Level Security, Supabase Auth)
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Hosting:** Vercel

## Project Structure
```
app/
  (auth)/
    login/page.tsx
    signup/page.tsx
  (dashboard)/
    layout.tsx         ← protected layout with sidebar
    dashboard/page.tsx
    loads/page.tsx
    loads/new/page.tsx
    loads/[id]/page.tsx
    pricing/page.tsx
    negotiate/page.tsx
    notifications/page.tsx
  api/
    pricing/route.ts   ← AI pricing engine (server only)
    negotiate/route.ts ← AI email generation (server only)
components/
  ui/                  ← shadcn components only
  layout/              ← sidebar, topbar, nav
  loads/               ← load-specific components
  pricing/             ← pricing result components
  negotiation/         ← negotiation components
lib/
  supabase/
    client.ts          ← browser client
    server.ts          ← server client
  utils.ts
types/
  index.ts             ← all TypeScript types
```

## Security Rules — ALWAYS FOLLOW THESE
1. **Never expose API keys in the browser.** The ANTHROPIC_API_KEY must
   only ever be used in server-side API routes (app/api/). Never import
   it in any component or client-side file.
2. **Every Supabase table must have Row Level Security (RLS) enabled.**
   Users can only read/write their own organization's data.
3. **Always validate inputs server-side.** Never trust client data.
4. **Never hardcode secrets.** All secrets go in .env.local only.
5. **Always check auth session server-side** before returning any data
   from API routes.
6. **Sanitize all user inputs** before passing to AI or database.

## Database Tables
- `organizations` — company accounts (multi-tenant)
- `profiles` — individual broker user profiles
- `loads` — freight loads with all pricing data
- `negotiations` — negotiation threads per load
- `notifications` — alert feed per user

## TypeScript Rules
- Always define types for all props, API responses, and DB rows
- Use the types defined in types/index.ts
- Never use `any` type
- All async functions must have proper error handling with try/catch

## Component Rules
- Use shadcn/ui components from components/ui/ for all base elements
- Use Tailwind CSS only for styling — no inline styles
- All components must be typed with TypeScript interfaces
- Keep components small and focused — one responsibility each
- Primary color: #1a3a5c (navy blue)
- Use lucide-react for all icons

## API Route Rules
- All AI calls go through /app/api/ routes — never from the client
- Always return proper HTTP status codes
- Always wrap in try/catch and return meaningful error messages
- Rate limit AI endpoints to prevent abuse

## What NOT To Do
- Never use `any` in TypeScript
- Never put secrets in component files
- Never skip RLS on database tables
- Never call the Anthropic API from client-side code
- Never skip input validation
- Never use inline styles — use Tailwind classes