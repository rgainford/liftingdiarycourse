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
