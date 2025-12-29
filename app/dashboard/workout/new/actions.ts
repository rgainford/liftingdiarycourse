"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createWorkout } from "@/data/workouts";

// Define Zod schema for validation
const createWorkoutSchema = z.object({
  name: z.string().min(1, "Workout name is required").max(100, "Workout name must be less than 100 characters"),
  startedAt: z.date().optional(),
});

// Define TypeScript type from schema
type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

// Create server action with typed parameters
export async function createWorkoutAction(input: CreateWorkoutInput) {
  // Validate input using Zod
  const validatedInput = createWorkoutSchema.parse(input);

  // Get authenticated user
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  // Call data helper function
  const workout = await createWorkout({
    userId,
    name: validatedInput.name,
    startedAt: validatedInput.startedAt,
  });

  // Revalidate affected paths
  revalidatePath("/dashboard");

  // Return data for client-side redirect
  return { success: true, data: workout };
}
