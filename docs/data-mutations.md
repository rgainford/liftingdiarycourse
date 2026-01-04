# Data Mutations Guidelines

## ⚠️ CRITICAL: Server Actions Only

**ALL data mutations in this application MUST be done via Server Actions.**

### ❌ DO NOT Use:
- Route handlers (`app/api/**/route.ts`) for data mutations
- Client components for direct database mutations
- Client-side mutation libraries
- Direct database calls from components
- Any other mutation patterns

### ✅ ALWAYS Use:
- Server Actions in colocated `actions.ts` files
- Helper functions from the `/data` directory that wrap Drizzle ORM calls
- Zod validation for all server action parameters

## Data Mutation Architecture

### Three-Layer Approach

1. **Server Actions Layer** (`actions.ts` files) - Entry point, validation, authorization
2. **Data Helper Layer** (`/data` directory) - Database operations via Drizzle ORM
3. **Database Layer** (Drizzle ORM) - Type-safe database access

## 1. Server Actions Requirements

### Location and File Naming

Server Actions MUST be defined in files named `actions.ts` that are **colocated** with the components that use them.

**Example structure:**
```
/app
  ├── workouts
  │   ├── actions.ts          # Actions for workout pages
  │   ├── page.tsx            # Uses actions from ./actions.ts
  │   └── [id]
  │       ├── actions.ts      # Actions for workout detail page
  │       └── page.tsx
  └── dashboard
      ├── actions.ts          # Actions for dashboard
      └── page.tsx
```

### Server Action Structure

All server actions MUST follow this pattern:

```typescript
// app/workouts/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createWorkout } from "@/data/workouts";

// 1. Define Zod schema for validation
const createWorkoutSchema = z.object({
  name: z.string().min(1, "Workout name is required").max(100),
  startedAt: z.date().optional(),
});

// 2. Define TypeScript type from schema
type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

// 3. Create server action with typed parameters
export async function createWorkoutAction(input: CreateWorkoutInput) {
  // 4. Validate input using Zod
  const validatedInput = createWorkoutSchema.parse(input);

  // 5. Get authenticated user
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  // 6. Call data helper function
  const workout = await createWorkout({
    userId,
    name: validatedInput.name,
    startedAt: validatedInput.startedAt,
  });

  // 7. Revalidate affected paths
  revalidatePath("/workouts");
  revalidatePath("/dashboard");

  // 8. Return data for client-side redirect
  return { success: true, data: workout };
}
```

### ❌ WRONG: Do NOT Use FormData Type

```typescript
// ❌ WRONG - Do not use FormData as parameter type
export async function createWorkoutAction(formData: FormData) {
  const name = formData.get("name") as string;
  // This is not type-safe!
}
```

### ✅ CORRECT: Use Typed Parameters

```typescript
// ✅ CORRECT - Use typed parameters
type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const validatedInput = createWorkoutSchema.parse(input);
  // Fully type-safe!
}
```

## 2. Zod Validation Requirements

### MUST Validate All Inputs

**EVERY server action MUST validate its parameters using Zod.** This is non-negotiable.

```typescript
// Define schema
const updateWorkoutSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100).optional(),
  completedAt: z.date().optional(),
});

export async function updateWorkoutAction(input: z.infer<typeof updateWorkoutSchema>) {
  // ALWAYS validate first
  const validated = updateWorkoutSchema.parse(input);

  // Rest of action...
}
```

### Common Zod Patterns

```typescript
// String validation
z.string().min(1, "Required").max(100, "Too long")

// Number validation
z.number().int().positive()
z.number().min(0).max(1000)

// Date validation
z.date()
z.date().min(new Date()) // Future dates only

// Optional fields
z.string().optional()
z.number().nullable()

// Enums
z.enum(["pending", "in-progress", "completed"])

// Arrays
z.array(z.number().int().positive()).min(1)

// Nested objects
z.object({
  workout: z.object({
    name: z.string(),
  }),
  exercises: z.array(z.object({
    exerciseId: z.number().int(),
    order: z.number().int(),
  })),
})
```

### Error Handling with Zod

```typescript
export async function updateWorkoutAction(input: z.infer<typeof updateWorkoutSchema>) {
  try {
    const validated = updateWorkoutSchema.parse(input);
    // Continue with validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return validation errors to client
      return {
        success: false,
        errors: error.flatten().fieldErrors,
      };
    }
    throw error;
  }
}
```

## 3. Data Helper Functions in `/data` Directory

### MUST Use Helper Functions

All database mutations MUST be abstracted into helper functions in the `/data` directory. Never mutate the database directly in server actions.

**Example structure:**
```
/data
  ├── workouts.ts
  ├── exercises.ts
  └── sets.ts
```

### Helper Function Pattern

```typescript
// data/workouts.ts
import "server-only";
import { db } from "@/src/db";
import { workouts } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

// Create
export async function createWorkout(data: {
  userId: string;
  name: string;
  startedAt?: Date;
}) {
  const [workout] = await db
    .insert(workouts)
    .values({
      userId: data.userId,
      name: data.name,
      startedAt: data.startedAt ?? new Date(),
    })
    .returning();

  return workout;
}

// Update
export async function updateWorkout(
  workoutId: number,
  userId: string,
  data: {
    name?: string;
    completedAt?: Date;
  }
) {
  // ALWAYS include userId check for security
  const [updated] = await db
    .update(workouts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning();

  return updated;
}

// Delete
export async function deleteWorkout(workoutId: number, userId: string) {
  // ALWAYS include userId check for security
  const [deleted] = await db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning();

  return deleted;
}
```

## 4. Drizzle ORM Requirements

### MUST Use Drizzle ORM - NO RAW SQL

All database mutations MUST use Drizzle ORM. **DO NOT USE RAW SQL**.

### ❌ WRONG: Raw SQL

```typescript
// ❌ DO NOT DO THIS
const result = await db.execute(
  sql`INSERT INTO workouts (user_id, name) VALUES (${userId}, ${name})`
);
```

### ✅ CORRECT: Drizzle ORM

```typescript
// ✅ CORRECT
const [workout] = await db
  .insert(workouts)
  .values({ userId, name })
  .returning();
```

### Common Drizzle Mutation Patterns

#### Insert

```typescript
// Insert single row
const [workout] = await db
  .insert(workouts)
  .values({ userId, name })
  .returning();

// Insert multiple rows
const newSets = await db
  .insert(sets)
  .values([
    { workoutExerciseId: 1, setNumber: 1, weight: "135", reps: 10 },
    { workoutExerciseId: 1, setNumber: 2, weight: "135", reps: 8 },
  ])
  .returning();
```

#### Update

```typescript
// Update with conditions
const [updated] = await db
  .update(workouts)
  .set({ name: "New Name", updatedAt: new Date() })
  .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
  .returning();
```

#### Delete

```typescript
// Delete with conditions
const [deleted] = await db
  .delete(workouts)
  .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
  .returning();
```

## 5. 🔒 CRITICAL: User Data Isolation

**Every database mutation MUST enforce user data isolation.** A logged-in user can ONLY mutate their own data.

### ALWAYS:
- Get the `userId` from `auth()` in server actions
- Pass `userId` to data helper functions
- Include `userId` in WHERE clauses for updates/deletes
- Never trust user input for user identification

### ❌ WRONG: Missing User Isolation

```typescript
// ❌ WRONG - No userId check!
export async function deleteWorkout(workoutId: number, userId: string) {
  await db.delete(workouts).where(eq(workouts.id, workoutId));
}
```

### ✅ CORRECT: Proper User Isolation

```typescript
// ✅ CORRECT - Always check userId
export async function deleteWorkout(workoutId: number, userId: string) {
  await db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
}
```

## 6. Complete Implementation Example

### Step 1: Create Data Helper Function

```typescript
// data/workouts.ts
import "server-only";
import { db } from "@/src/db";
import { workouts, workoutExercises, sets } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

export async function createWorkoutWithExercises(data: {
  userId: string;
  name: string;
  exercises: Array<{
    exerciseId: number;
    order: number;
    sets: Array<{
      setNumber: number;
      weight: string;
      reps: number;
    }>;
  }>;
}) {
  // Use transaction for complex mutations
  return await db.transaction(async (tx) => {
    // 1. Create workout
    const [workout] = await tx
      .insert(workouts)
      .values({
        userId: data.userId,
        name: data.name,
        startedAt: new Date(),
      })
      .returning();

    // 2. Create workout exercises
    for (const exercise of data.exercises) {
      const [workoutExercise] = await tx
        .insert(workoutExercises)
        .values({
          workoutId: workout.id,
          exerciseId: exercise.exerciseId,
          order: exercise.order,
        })
        .returning();

      // 3. Create sets
      if (exercise.sets.length > 0) {
        await tx.insert(sets).values(
          exercise.sets.map((set) => ({
            workoutExerciseId: workoutExercise.id,
            setNumber: set.setNumber,
            weight: set.weight,
            reps: set.reps,
          }))
        );
      }
    }

    return workout;
  });
}
```

### Step 2: Create Server Action with Validation

```typescript
// app/workouts/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createWorkoutWithExercises } from "@/data/workouts";

// Zod schema
const createWorkoutWithExercisesSchema = z.object({
  name: z.string().min(1, "Workout name is required").max(100),
  exercises: z
    .array(
      z.object({
        exerciseId: z.number().int().positive(),
        order: z.number().int().positive(),
        sets: z.array(
          z.object({
            setNumber: z.number().int().positive(),
            weight: z.string().regex(/^\d+(\.\d+)?$/, "Invalid weight format"),
            reps: z.number().int().positive().max(1000),
          })
        ),
      })
    )
    .min(1, "At least one exercise is required"),
});

type CreateWorkoutWithExercisesInput = z.infer<
  typeof createWorkoutWithExercisesSchema
>;

export async function createWorkoutWithExercisesAction(
  input: CreateWorkoutWithExercisesInput
) {
  // 1. Validate input
  const validated = createWorkoutWithExercisesSchema.parse(input);

  // 2. Get authenticated user
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  // 3. Call data helper
  const workout = await createWorkoutWithExercises({
    userId,
    name: validated.name,
    exercises: validated.exercises,
  });

  // 4. Revalidate
  revalidatePath("/workouts");
  revalidatePath("/dashboard");

  // 5. Return data for client-side redirect
  return { success: true, data: workout };
}
```

### Step 3: Call Server Action from Client Component

```typescript
// app/workouts/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkoutWithExercisesAction } from "../actions";

export default function NewWorkoutPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    // Build typed object from form data
    const input = {
      name: formData.get("name") as string,
      exercises: [
        {
          exerciseId: Number(formData.get("exerciseId")),
          order: 1,
          sets: [
            {
              setNumber: 1,
              weight: formData.get("weight") as string,
              reps: Number(formData.get("reps")),
            },
          ],
        },
      ],
    };

    try {
      // Call server action with typed input
      const result = await createWorkoutWithExercisesAction(input);

      if (result.success) {
        // Client-side redirect after successful mutation
        router.push(`/workouts/${result.data.id}`);
      } else {
        console.error("Failed to create workout:", result.error);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Failed to create workout:", error);
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <input name="exerciseId" type="number" required />
      <input name="weight" required />
      <input name="reps" type="number" required />
      <button type="submit" disabled={isSubmitting}>
        Create Workout
      </button>
    </form>
  );
}
```

## 7. Revalidation and Redirects

### Revalidation

After mutations, ALWAYS revalidate affected paths to ensure UI stays in sync:

```typescript
import { revalidatePath } from "next/cache";

// Revalidate specific paths
revalidatePath("/workouts");
revalidatePath("/dashboard");

// Revalidate all pages under a path
revalidatePath("/workouts", "layout");
```

### Redirects

**IMPORTANT: DO NOT use `redirect()` in server actions. Always handle redirects client-side.**

### ❌ WRONG: Server-Side Redirect

```typescript
// ❌ WRONG - Do not use redirect() in server actions
import { redirect } from "next/navigation";

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const workout = await createWorkout({ ...input, userId });
  revalidatePath("/workouts");
  redirect(`/workouts/${workout.id}`); // DON'T DO THIS
}
```

### ✅ CORRECT: Client-Side Redirect

Server action should return data:

```typescript
// ✅ CORRECT - Return data from server action
export async function createWorkoutAction(input: CreateWorkoutInput) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const workout = await createWorkout({ ...input, userId });
  revalidatePath("/workouts");

  // Return the created workout data
  return { success: true, data: workout };
}
```

Client component handles redirect:

```typescript
// ✅ CORRECT - Client handles redirect
"use client";

import { useRouter } from "next/navigation";
import { createWorkoutAction } from "./actions";

export default function NewWorkoutPage() {
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = await createWorkoutAction(input);

    if (result.success) {
      // Client-side redirect after successful mutation
      router.push(`/workouts/${result.data.id}`);
    }
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## 8. Error Handling

### Proper Error Handling Pattern

```typescript
export async function createWorkoutAction(input: CreateWorkoutInput) {
  try {
    // Validate
    const validated = createWorkoutSchema.parse(input);

    // Authenticate
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Mutate
    const workout = await createWorkout({
      userId,
      name: validated.name,
    });

    // Revalidate
    revalidatePath("/workouts");

    return { success: true, data: workout };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
      };
    }

    console.error("Failed to create workout:", error);
    return {
      success: false,
      error: "Failed to create workout",
    };
  }
}
```

## 9. Transactions

Use Drizzle transactions for complex mutations that involve multiple tables:

```typescript
import { db } from "@/src/db";

export async function deleteWorkoutAndRelated(
  workoutId: number,
  userId: string
) {
  return await db.transaction(async (tx) => {
    // Verify ownership
    const workout = await tx.query.workouts.findFirst({
      where: and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
    });

    if (!workout) {
      throw new Error("Workout not found");
    }

    // Delete cascade will handle related records
    await tx.delete(workouts).where(eq(workouts.id, workoutId));

    return { success: true };
  });
}
```

## Security Checklist

Before completing any data mutation implementation, verify:

- [ ] Mutation uses a server action in a colocated `actions.ts` file
- [ ] Server action parameters are typed (NOT FormData)
- [ ] Server action validates input using Zod
- [ ] Server action gets `userId` from `auth()` and checks authorization
- [ ] Data helper function exists in `/data` directory with `"server-only"` import
- [ ] Data helper uses Drizzle ORM (no raw SQL)
- [ ] Data helper includes `userId` in WHERE clauses for updates/deletes
- [ ] Appropriate paths are revalidated after mutation
- [ ] Server action returns data (does NOT use `redirect()`)
- [ ] Client component handles redirect using `useRouter()`
- [ ] Errors are properly handled and returned to client
- [ ] No user can mutate another user's data

## Common Mistakes to Avoid

### ❌ Mistake 1: Using FormData Type

```typescript
// ❌ WRONG
export async function createWorkoutAction(formData: FormData) {
  const name = formData.get("name") as string; // Not type-safe!
}
```

### ❌ Mistake 2: No Zod Validation

```typescript
// ❌ WRONG - No validation!
export async function createWorkoutAction(input: { name: string }) {
  const workout = await createWorkout(input); // Dangerous!
}
```

### ❌ Mistake 3: Direct Database Access in Actions

```typescript
// ❌ WRONG - Direct DB access in action
export async function createWorkoutAction(input: CreateWorkoutInput) {
  const [workout] = await db.insert(workouts).values(input).returning();
}
```

### ❌ Mistake 4: Missing User Isolation

```typescript
// ❌ WRONG - No userId check!
export async function updateWorkout(workoutId: number, name: string) {
  await db.update(workouts).set({ name }).where(eq(workouts.id, workoutId));
}
```

### ❌ Mistake 5: Using redirect() in Server Actions

```typescript
// ❌ WRONG - Using redirect() in server action
import { redirect } from "next/navigation";

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const workout = await createWorkout({ ...input, userId });
  redirect("/dashboard"); // DON'T DO THIS
}
```

## Summary

Remember the golden rules for data mutations:

1. **Server Actions in `actions.ts`** - Colocated with components
2. **Typed Parameters** - No FormData types
3. **Zod Validation** - ALWAYS validate all inputs
4. **Data Helpers in `/data`** - Wrap all database operations
5. **Drizzle ORM** - No raw SQL
6. **User Isolation** - ALWAYS filter by `userId`
7. **Revalidation** - Keep UI in sync with mutations
8. **Client-Side Redirects** - NEVER use `redirect()` in server actions; handle redirects client-side

Following these patterns ensures security, type safety, and maintainability throughout the application.
