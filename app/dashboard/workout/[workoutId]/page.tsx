import { auth } from "@clerk/nextjs/server";
import { getWorkoutById } from "@/data/workouts";
import { notFound, redirect } from "next/navigation";
import EditWorkoutForm from "./edit-workout-form";

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { workoutId } = await params;
  const workoutIdNum = parseInt(workoutId, 10);

  if (isNaN(workoutIdNum)) {
    notFound();
  }

  // ALWAYS pass userId to ensure data isolation
  const workout = await getWorkoutById(workoutIdNum, userId);

  if (!workout) {
    notFound(); // Returns 404 if not found or unauthorized
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Edit Workout
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update your workout details
          </p>
        </div>

        <EditWorkoutForm workout={workout} />
      </div>
    </div>
  );
}
