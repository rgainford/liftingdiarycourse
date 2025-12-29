"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

export function DateNavigation({ initialDate }: { initialDate: Date }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      const params = new URLSearchParams(searchParams);
      params.set("date", format(newDate, "yyyy-MM-dd"));
      router.push(`/dashboard?${params.toString()}`);
      // Force a refresh to ensure the server component re-fetches data
      router.refresh();
    }
  };

  return (
    <div className="flex items-center gap-4">
      <DatePicker date={initialDate} onDateChange={handleDateChange} />
      <p className="text-sm text-muted-foreground">
        Viewing workouts for {format(initialDate, "do MMM yyyy")}
      </p>
    </div>
  );
}
