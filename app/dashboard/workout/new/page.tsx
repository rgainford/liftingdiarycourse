"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/ui/date-picker";
import { createWorkoutAction } from "./actions";

export default function NewWorkoutPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<Date>(new Date());
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    // Build typed object from form data
    const input = {
      name: formData.get("name") as string,
      startedAt: startedAt,
    };

    try {
      // Call server action with typed input
      const result = await createWorkoutAction(input);

      if (result.success) {
        // Client-side redirect after successful mutation
        router.push("/dashboard");
      } else {
        setError(result.error || "Failed to create workout");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Failed to create workout:", err);
      setError(err instanceof Error ? err.message : "Failed to create workout");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Workout
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Start a new workout session
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Workout Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              maxLength={100}
              placeholder="e.g., Morning Chest & Triceps"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="startedAt"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Workout Date
            </label>
            <DatePicker date={startedAt} onDateChange={(date) => date && setStartedAt(date)} />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Select the date when this workout was started
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isSubmitting ? "Creating..." : "Create Workout"}
            </button>
            <a
              href="/dashboard"
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-md transition-colors text-center focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
