# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16.1.1 application called "liftingdiarycourse" built with TypeScript, React 19, and Tailwind CSS 4. The project uses the Next.js App Router architecture and Clerk for authentication.

## Development Commands

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build production application
- `npm start` - Run production build
- `npm run lint` - Run ESLint

## Architecture

### Next.js App Router

The project uses Next.js App Router with the following structure:

- `app/layout.tsx` - Root layout component that wraps all pages
- `app/page.tsx` - Home page component
- `app/globals.css` - Global styles with Tailwind CSS

### Styling

- **Tailwind CSS 4**: Configured with PostCSS
- **CSS Variables**: Theme colors defined in `globals.css` with dark mode support via `prefers-color-scheme`
- **Fonts**: Uses Geist Sans and Geist Mono via `next/font/google`, exposed as CSS variables `--font-geist-sans` and `--font-geist-mono`

### TypeScript Configuration

- Path alias `@/*` maps to the root directory for imports
- Strict mode enabled
- Target: ES2017
- Module resolution: bundler

## Authentication with Clerk

The application uses Clerk for authentication with the App Router integration:

- **Middleware**: `middleware.ts` uses `clerkMiddleware()` from `@clerk/nextjs/server`
- **Provider**: `<ClerkProvider>` wraps the entire app in `app/layout.tsx`
- **Components**: Uses `<SignInButton>`, `<SignUpButton>`, `<UserButton>`, `<SignedIn>`, and `<SignedOut>` in the layout header
- **Environment Variables**: Clerk keys are stored in `.env.local` (not tracked in git)
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Get from Clerk Dashboard
  - `CLERK_SECRET_KEY` - Get from Clerk Dashboard

### Server-side Authentication

When you need to access authentication data on the server:

```typescript
import { auth } from "@clerk/nextjs/server";

export default async function MyServerComponent() {
  const { userId } = await auth();
  // Use userId for server-side operations
}
```

## Key Technical Details

- The root layout (app/layout.tsx) applies font variables and antialiasing globally
- Dark mode is handled via CSS media queries and custom properties
- Next.js Image component is used for optimized image loading
- Authentication header is displayed at the top of all pages with sign in/up buttons or user profile
