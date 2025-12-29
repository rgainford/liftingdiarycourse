# Authentication Standards

## Overview

This application uses **Clerk** for authentication and user management. Clerk provides a complete authentication solution with built-in UI components, session management, and security features.

## Core Principles

1. **Always use Clerk's built-in components and hooks** - Never implement custom authentication logic
2. **Server-side authentication** - Protect API routes and server components using Clerk's server utilities
3. **Environment variables** - All Clerk configuration must use environment variables
4. **Middleware protection** - Use Clerk middleware to protect routes at the application level

## Installation & Setup

### Required Dependencies

```bash
npm install @clerk/nextjs
```

### Environment Variables

Authentication requires the following environment variables in `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Important:**
- Get these keys from the [Clerk Dashboard](https://dashboard.clerk.com)
- Never commit `.env.local` to version control
- Use `NEXT_PUBLIC_` prefix only for the publishable key

## Middleware Configuration

All authentication routing and protection is handled in `middleware.ts`:

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

**Key Points:**
- Use `clerkMiddleware()` for App Router applications
- The matcher ensures middleware runs on all relevant routes
- Middleware automatically handles authentication state

## Client-Side Components

### Layout Integration

Wrap your application with `ClerkProvider` in the root layout:

```typescript
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### UI Components

Clerk provides pre-built components for common authentication UI:

#### Sign In/Sign Up Buttons

```typescript
import { SignInButton, SignUpButton } from "@clerk/nextjs";

export function Header() {
  return (
    <header>
      <SignInButton mode="modal">
        <button>Sign In</button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button>Sign Up</button>
      </SignUpButton>
    </header>
  );
}
```

#### User Button (Profile Management)

```typescript
import { UserButton } from "@clerk/nextjs";

export function Header() {
  return (
    <header>
      <UserButton />
    </header>
  );
}
```

#### Conditional Rendering

```typescript
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";

export function Header() {
  return (
    <header>
      <SignedOut>
        <SignInButton mode="modal">
          <button>Sign In</button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}
```

## Server-Side Authentication

### Server Components

Use the `auth()` helper to access authentication data in Server Components:

```typescript
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in to access this page</div>;
  }

  // Fetch user-specific data using userId
  const userData = await fetchUserData(userId);

  return <div>Welcome, {userData.name}!</div>;
}
```

### API Routes (Route Handlers)

Protect API routes using the `auth()` helper:

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Handle authenticated request
  const data = await fetchUserData(userId);
  return NextResponse.json(data);
}
```

### Server Actions

Protect Server Actions the same way:

```typescript
"use server";

import { auth } from "@clerk/nextjs/server";

export async function createWorkout(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Process the authenticated action
  // ...
}
```

## Advanced Authentication Patterns

### Getting Full User Object

When you need more than just the userId:

```typescript
import { currentUser } from "@clerk/nextjs/server";

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <h1>{user.firstName} {user.lastName}</h1>
      <p>{user.emailAddresses[0].emailAddress}</p>
    </div>
  );
}
```

### Client-Side Hooks

For client components that need authentication state:

```typescript
"use client";

import { useUser, useAuth } from "@clerk/nextjs";

export function UserProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { userId } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Please sign in</div>;
  }

  return <div>Hello, {user.firstName}!</div>;
}
```

### Route Protection in Middleware

To protect specific routes:

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/workouts(.*)',
  '/profile(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

## Best Practices

### DO ✅

- **Always check `userId`** before performing authenticated operations
- **Use `auth()` in Server Components and API routes** for authentication checks
- **Use Clerk's pre-built components** (`<SignInButton>`, `<UserButton>`, etc.) for UI
- **Wrap your app with `<ClerkProvider>`** in the root layout
- **Use middleware** for route-level protection
- **Store Clerk keys in environment variables** never hardcode them
- **Handle loading states** when using client-side hooks (`isLoaded`)
- **Use `protect()` in middleware** for protected routes

### DON'T ❌

- **Don't implement custom authentication logic** - use Clerk's provided methods
- **Don't store authentication tokens manually** - Clerk handles this automatically
- **Don't use cookies directly** - Clerk manages session cookies
- **Don't commit `.env.local`** to version control
- **Don't skip authentication checks** in server-side code
- **Don't use `useUser()` or `useAuth()` in Server Components** - use `auth()` instead
- **Don't mix authentication libraries** - stick to Clerk throughout the application

## Common Patterns

### Protected Page Component

```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <div>Protected content</div>;
}
```

### Conditional UI in Client Component

```typescript
"use client";

import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";

export function Navigation() {
  return (
    <nav>
      <SignedOut>
        <SignInButton mode="modal">
          <button>Sign In</button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </nav>
  );
}
```

### Authenticated API Request

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();

  // Process authenticated request with userId
  const result = await createResource(userId, body);

  return NextResponse.json(result);
}
```

## Security Considerations

1. **Always validate `userId` is present** before performing operations
2. **Use server-side authentication** for sensitive operations
3. **Never trust client-side authentication state** for security decisions
4. **Implement proper error handling** for authentication failures
5. **Use HTTPS in production** (Clerk requires HTTPS for webhooks)
6. **Keep Clerk SDK up to date** for security patches
7. **Use environment-specific keys** (test keys for development, production keys for production)

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Next.js SDK Reference](https://clerk.com/docs/references/nextjs/overview)

## Support

For authentication issues:
1. Check the [Clerk Dashboard](https://dashboard.clerk.com) for configuration
2. Review the [Clerk Docs](https://clerk.com/docs)
3. Check Clerk's [GitHub Discussions](https://github.com/clerk/javascript/discussions)
