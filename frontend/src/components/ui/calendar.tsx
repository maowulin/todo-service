"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "relative flex items-center justify-center py-2",
        caption_label: "sr-only",
        caption_dropdowns: "flex items-center gap-2",
        dropdown: "inline-flex h-8 items-center rounded-full border bg-background px-3 text-sm shadow-sm focus:outline-none",
        dropdown_month: "min-w-[72px]",
        dropdown_year: "min-w-[84px]",
        nav: "absolute inset-x-0 top-2 flex items-center justify-between px-2",
        nav_button: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-7 w-7 !bg-transparent !p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
        ),
        table: "w-full border-collapse space-y-1",
        head_row: "grid grid-cols-7",
        head_cell: "text-muted-foreground text-center font-normal text-[0.8rem]",
        row: "grid grid-cols-7 mt-2",
        cell:
          "text-center text-sm p-0 relative flex items-center justify-center [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100 mx-auto"),
        day_selected: "bg-muted text-foreground hover:bg-muted",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
