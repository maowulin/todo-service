"use client";

import { Task } from "@/gen/todo_pb";
import TaskItem from "./TaskItem";
import { ChevronDown, ChevronRight } from "lucide-react";

type Props = {
  title: string;
  tasks: Task[];
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  toLocalInputValue: (v: string) => string;
  onToggleCompleted: (task: Task) => void;
  onToggleFavorite: (task: Task) => void;
  onSetDueAt: (task: Task, value: string) => void;
  onClearDueAt: (task: Task) => void;
  onDelete: (id: string) => void;
};

export default function TaskSection({
  title,
  tasks,
  collapsed,
  onToggleCollapsed,
  toLocalInputValue,
  onToggleCompleted,
  onToggleFavorite,
  onSetDueAt,
  onClearDueAt,
  onDelete,
}: Props) {
  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        {typeof collapsed !== "undefined" && (
          <button
            onClick={onToggleCollapsed}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-accent"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
        <h2 className="text-sm font-medium text-muted-foreground">
          {title}
          <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded bg-secondary px-1 text-xs text-secondary-foreground">
            {tasks.length}
          </span>
        </h2>
      </div>
      {!collapsed && (
        <div className="space-y-3">
          {tasks.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              toLocalInputValue={toLocalInputValue}
              onToggleCompleted={onToggleCompleted}
              onToggleFavorite={onToggleFavorite}
              onSetDueAt={onSetDueAt}
              onClearDueAt={onClearDueAt}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}