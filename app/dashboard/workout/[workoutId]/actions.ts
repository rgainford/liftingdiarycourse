"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateWorkout } from "@/data/workouts";

// Define Zod schema for validation
const updateWorkoutSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, "Workout name is required").max(100),
  startedAt: z.date(),
  completedAt: z.date().optional(),
});

// Define TypeScript type from schema
type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;

// Create server action with typed parameters
export async function updateWorkoutAction(input: UpdateWorkoutInput) {
  try {
    // Validate input using Zod
    const validatedInput = updateWorkoutSchema.parse(input);

    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Call data helper function
    const workout = await updateWorkout(validatedInput.id, userId, {
      name: validatedInput.name,
      startedAt: validatedInput.startedAt,
      completedAt: validatedInput.completedAt,
    });

    if (!workout) {
      return { success: false, error: "Workout not found" };
    }

    // Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/workout/${validatedInput.id}`);

    // Return data for client-side redirect
    return { success: true, data: workout };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
      };
    }

    console.error("Failed to update workout:", error);
    return {
      success: false,
      error: "Failed to update workout",
    };
  }
}
