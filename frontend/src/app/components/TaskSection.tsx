"use client";

import { Task } from "@/gen/todo_pb";
import TaskItem from "./TaskItem";

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
            className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
          >
            {collapsed ? "▶" : "▼"}
          </button>
        )}
        <h2 className="font-semibold text-gray-700">
          {title}
          {typeof collapsed !== "undefined" && (
            <span className="ml-2 text-gray-400">{tasks.length}</span>
          )}
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