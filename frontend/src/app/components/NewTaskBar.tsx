"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

type Props = {
  value: string;
  loading: boolean;
  onChange: (v: string) => void;
  onAdd: () => void;
};

export default function NewTaskBar({ value, loading, onChange, onAdd }: Props) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") onAdd();
    },
    [onAdd]
  );

  return (
    <div className="flex gap-2 mb-6">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="输入新任务"
        className={cn(
          "flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm",
          "ring-offset-background placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        onKeyDown={handleKeyDown}
      />
      <button
        onClick={onAdd}
        disabled={loading || !value.trim()}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium",
          "bg-primary text-primary-foreground shadow h-10 px-4 py-2",
          "hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
        )}
      >
        <Plus className="h-4 w-4 mr-1" />
        {loading ? "添加中" : "添加"}
      </button>
    </div>
  );
}