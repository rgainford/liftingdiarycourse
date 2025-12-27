"use client"

import { useState } from "react"
import { DatePicker } from "@/components/ui/date-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"

// Mock workout data for UI demonstration
const mockWorkouts = [
  {
    id: 1,
    name: "Morning Strength Training",
    exercises: [
      { name: "Bench Press", sets: 3, reps: 10, weight: 185 },
      { name: "Squats", sets: 4, reps: 8, weight: 225 },
      { name: "Deadlifts", sets: 3, reps: 6, weight: 275 },
    ],
    duration: "45 minutes",
    notes: "Great session, felt strong on all lifts",
  },
  {
    id: 2,
    name: "Evening Cardio",
    exercises: [
      { name: "Treadmill Run", sets: 1, reps: 1, weight: 0 },
      { name: "Jump Rope", sets: 3, reps: 100, weight: 0 },
    ],
    duration: "30 minutes",
    notes: "Good cardio burn",
  },
]

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

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
        <div className="flex items-center gap-4">
          <DatePicker date={selectedDate} onDateChange={setSelectedDate} />
          {selectedDate && (
            <p className="text-sm text-muted-foreground">
              Viewing workouts for {format(selectedDate, "do MMM yyyy")}
            </p>
          )}
        </div>

        {/* Workouts List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Workouts {selectedDate ? `on ${format(selectedDate, "do MMM yyyy")}` : ""}
          </h2>

          {mockWorkouts.length > 0 ? (
            <div className="grid gap-4">
              {mockWorkouts.map((workout) => (
                <Card key={workout.id}>
                  <CardHeader>
                    <CardTitle>{workout.name}</CardTitle>
                    <CardDescription>Duration: {workout.duration}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Exercise List */}
                    <div className="space-y-3">
                      {workout.exercises.map((exercise, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{exercise.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {exercise.sets} sets × {exercise.reps} reps
                              {exercise.weight > 0 && ` @ ${exercise.weight} lbs`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Notes Section */}
                    {workout.notes && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium mb-1">Notes:</p>
                        <p className="text-sm text-muted-foreground">{workout.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
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
  )
}
