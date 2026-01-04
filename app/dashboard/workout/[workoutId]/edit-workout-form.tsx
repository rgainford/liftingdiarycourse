"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/ui/date-picker";
import { updateWorkoutAction } from "./actions";

type Workout = {
  id: number;
  name: string;
  startedAt: Date | null;
  completedAt: Date | null;
};

export default function EditWorkoutForm({ workout }: { workout: Workout }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<Date>(
    workout.startedAt || new Date()
  );
  const [completedAt, setCompletedAt] = useState<Date | undefined>(
    workout.completedAt || undefined
  );
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    // Build typed object from form data
    const input = {
      id: workout.id,
      name: formData.get("name") as string,
      startedAt: startedAt,
      completedAt: completedAt,
    };

    try {
      // Call server action with typed input
      const result = await updateWorkoutAction(input);

      if (result.success) {
        // Client-side redirect after successful mutation
        router.push("/dashboard");
      } else {
        setError(result.error || "Failed to update workout");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Failed to update workout:", err);
      setError(err instanceof Error ? err.message : "Failed to update workout");
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
    >
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
          defaultValue={workout.name}
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
        <DatePicker
          date={startedAt}
          onDateChange={(date) => date && setStartedAt(date)}
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Select the date when this workout was started
        </p>
      </div>

      <div className="mb-6">
        <label
          htmlFor="completedAt"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Completion Date (Optional)
        </label>
        <DatePicker
          date={completedAt}
          onDateChange={(date) => setCompletedAt(date)}
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Select the date when this workout was completed (leave empty if not
          completed)
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
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
        <a
          href="/dashboard"
          className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-md transition-colors text-center focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
