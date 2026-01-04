import "server-only";
import { db } from "@/src/db";
import { workouts } from "@/src/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { startOfDay, endOfDay } from "date-fns";

export async function getWorkoutsByUserIdAndDate(
  userId: string,
  date: Date
) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // Fetch workouts for the user on the selected date
  const userWorkouts = await db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, userId),
      gte(workouts.startedAt, dayStart),
      lt(workouts.startedAt, dayEnd)
    ),
    with: {
      workoutExercises: {
        with: {
          exercise: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.order)],
      },
    },
    orderBy: (workouts, { desc }) => [desc(workouts.createdAt)],
  });

  return userWorkouts;
}

export async function getWorkoutById(workoutId: number, userId: string) {
  // ALWAYS include userId check, even when fetching by ID
  const workout = await db.query.workouts.findFirst({
    where: and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
    with: {
      workoutExercises: {
        with: {
          exercise: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.order)],
      },
    },
  });

  return workout;
}

export async function createWorkout(data: {
  userId: string;
  name: string;
  startedAt: Date;
}) {
  const [workout] = await db
    .insert(workouts)
    .values({
      userId: data.userId,
      name: data.name,
      startedAt: data.startedAt,
    })
    .returning();

  return workout;
}

export async function updateWorkout(
  workoutId: number,
  userId: string,
  data: {
    name?: string;
    startedAt?: Date;
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
