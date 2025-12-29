import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getWorkoutsByUserIdAndDate } from "@/data/workouts";
import { DateNavigation } from "./date-navigation";

// Force dynamic rendering to prevent caching and ensure fresh data on date changes
export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const params = await searchParams;
  const selectedDate = params.date ? parseISO(params.date) : new Date();

  const workouts = await getWorkoutsByUserIdAndDate(userId, selectedDate);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your workout history
          </p>
        </div>

        {/* Date Picker Section */}
        <DateNavigation initialDate={selectedDate} />

        {/* Workouts List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Workouts on {format(selectedDate, "do MMM yyyy")}
          </h2>

          {workouts.length > 0 ? (
            <div className="grid gap-4">
              {workouts.map((workout) => {
                const startTime = workout.startedAt
                  ? format(workout.startedAt, "h:mm a")
                  : null;
                const endTime = workout.completedAt
                  ? format(workout.completedAt, "h:mm a")
                  : null;
                const duration =
                  startTime && endTime ? `${startTime} - ${endTime}` : "In progress";

                return (
                  <Card key={workout.id}>
                    <CardHeader>
                      <CardTitle>{workout.name}</CardTitle>
                      <CardDescription>Duration: {duration}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Exercise List */}
                      <div className="space-y-3">
                        {workout.workoutExercises.map((workoutExercise) => {
                          const totalSets = workoutExercise.sets.length;
                          const firstSet = workoutExercise.sets[0];
                          const allSameReps = workoutExercise.sets.every(
                            (set) => set.reps === firstSet?.reps
                          );
                          const allSameWeight = workoutExercise.sets.every(
                            (set) => set.weight === firstSet?.weight
                          );

                          return (
                            <div
                              key={workoutExercise.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                            >
                              <div className="flex-1">
                                <p className="font-medium">
                                  {workoutExercise.exercise.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {totalSets} {totalSets === 1 ? "set" : "sets"}
                                  {allSameReps && firstSet?.reps
                                    ? ` × ${firstSet.reps} reps`
                                    : ""}
                                  {allSameWeight && firstSet?.weight
                                    ? ` @ ${firstSet.weight} lbs`
                                    : ""}
                                </p>
                                {(!allSameReps || !allSameWeight) && (
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {workoutExercise.sets.map((set) => (
                                      <div key={set.id}>
                                        Set {set.setNumber}: {set.reps} reps
                                        {set.weight ? ` @ ${set.weight} lbs` : ""}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No workouts logged for this date
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
