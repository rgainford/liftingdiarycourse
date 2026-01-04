# Data Fetching Guidelines

## ⚠️ CRITICAL: Server Components Only

**ALL data fetching in this application MUST be done via Server Components.**

### ❌ DO NOT Use:
- Route handlers (`app/api/**/route.ts`) for data fetching
- Client components (`"use client"`) for data fetching
- Client-side fetching libraries (SWR, React Query, etc.)
- Any other data fetching patterns

### ✅ ALWAYS Use:
- Server Components with async/await
- Helper functions from the `/data` directory

## Database Query Requirements

### 1. Use Helper Functions from `/data` Directory

All database queries MUST be abstracted into helper functions located in the `/data` directory. Never query the database directly in your components.

**Example structure:**
```
/data
  ├── workouts.ts
  ├── exercises.ts
  └── user-stats.ts
```

### 2. Use Drizzle ORM - NO RAW SQL

All database queries MUST use Drizzle ORM. **DO NOT USE RAW SQL QUERIES**.

**❌ WRONG:**
```typescript
// DO NOT DO THIS
const result = await db.execute(sql`SELECT * FROM workouts WHERE user_id = ${userId}`);
```

**✅ CORRECT:**
```typescript
// Use Drizzle ORM
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq } from "drizzle-orm";

const result = await db.query.workouts.findMany({
  where: eq(workouts.userId, userId),
});
```

### 3. 🔒 CRITICAL: User Data Isolation

**Every database query MUST enforce user data isolation.** A logged-in user can ONLY access their own data. They MUST NOT be able to access any other user's data.

**ALWAYS:**
- Get the `userId` from `auth()` in server components
- Filter ALL queries by `userId`
- Never trust user input for user identification

## Implementation Pattern

### Step 1: Create Helper Function in `/data` Directory

```typescript
// /data/workouts.ts
import "server-only"; // Ensures this code only runs on the server
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getWorkoutsByUserId(userId: string) {
  // ALWAYS filter by userId for data isolation
  return await db.query.workouts.findMany({
    where: eq(workouts.userId, userId),
    orderBy: (workouts, { desc }) => [desc(workouts.createdAt)],
  });
}

export async function getWorkoutById(workoutId: string, userId: string) {
  // ALWAYS include userId check, even when fetching by ID
  const workout = await db.query.workouts.findFirst({
    where: (workouts, { eq, and }) =>
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId) // Critical: prevent unauthorized access
      ),
  });

  return workout;
}
```

### Step 2: Call Helper Function from Server Component

```typescript
// app/workouts/page.tsx
import { auth } from "@clerk/nextjs/server";
import { getWorkoutsByUserId } from "@/data/workouts";
import { redirect } from "next/navigation";

export default async function WorkoutsPage() {
  // Get authenticated user
  const { userId } = await auth();

  // Redirect if not authenticated
  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch data using helper function
  const workouts = await getWorkoutsByUserId(userId);

  return (
    <div>
      <h1>My Workouts</h1>
      {workouts.map((workout) => (
        <div key={workout.id}>{workout.name}</div>
      ))}
    </div>
  );
}
```

### Step 3: For Dynamic Routes

```typescript
// app/workouts/[id]/page.tsx
import { auth } from "@clerk/nextjs/server";
import { getWorkoutById } from "@/data/workouts";
import { notFound, redirect } from "next/navigation";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;

  // ALWAYS pass userId to ensure data isolation
  const workout = await getWorkoutById(id, userId);

  if (!workout) {
    notFound(); // Returns 404 if not found or unauthorized
  }

  return (
    <div>
      <h1>{workout.name}</h1>
      {/* Rest of component */}
    </div>
  );
}
```

## Security Checklist

Before completing any data fetching implementation, verify:

- [ ] Data is fetched in a Server Component (not route handler or client component)
- [ ] Database query uses a helper function from `/data` directory
- [ ] Helper function uses Drizzle ORM (no raw SQL)
- [ ] Query filters by `userId` from `auth()`
- [ ] `"server-only"` is imported at the top of data helper files
- [ ] Authentication check redirects unauthenticated users
- [ ] No user can access another user's data

## Why Server Components for Data Fetching?

1. **Security**: Credentials and database connections never exposed to client
2. **Performance**: No client-side JavaScript needed for data fetching
3. **SEO**: Content is server-rendered and available to search engines
4. **Simplicity**: No loading states, no client-side cache management
5. **Type Safety**: Full TypeScript support from database to UI

## Common Mistakes to Avoid

### ❌ Mistake 1: Client Component Data Fetching
```typescript
"use client"; // DON'T DO THIS for data fetching

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    fetch("/api/workouts") // Wrong approach
      .then(res => res.json())
      .then(setWorkouts);
  }, []);

  // ...
}
```

### ❌ Mistake 2: Route Handler for Data Fetching
```typescript
// app/api/workouts/route.ts - DON'T CREATE THIS

export async function GET() {
  // Don't use route handlers for data fetching
  const workouts = await db.query.workouts.findMany();
  return Response.json(workouts);
}
```

### ❌ Mistake 3: Missing User Isolation
```typescript
// data/workouts.ts

export async function getWorkouts() {
  // WRONG: No userId filter!
  return await db.query.workouts.findMany();
}
```

### ❌ Mistake 4: Raw SQL Queries
```typescript
// data/workouts.ts

export async function getWorkouts(userId: string) {
  // WRONG: Using raw SQL
  return await db.execute(
    sql`SELECT * FROM workouts WHERE user_id = ${userId}`
  );
}
```

## Summary

Remember the golden rules:

1. **Server Components ONLY** for data fetching
2. **Helper functions in `/data`** for all database queries
3. **Drizzle ORM** for all queries (no raw SQL)
4. **ALWAYS filter by `userId`** for data isolation

Following these patterns ensures security, performance, and maintainability throughout the application.
