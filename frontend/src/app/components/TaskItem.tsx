"use client";

import { Task } from "@/gen/todo_pb";
import { Star, StarOff, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  task: Task;
  toLocalInputValue: (v: string) => string;
  onToggleCompleted: (task: Task) => void;
  onToggleFavorite: (task: Task) => void;
  onSetDueAt: (task: Task, value: string) => void;
  onClearDueAt: (task: Task) => void;
  onDelete: (id: string) => void;
};

export default function TaskItem({
  task,
  toLocalInputValue,
  onToggleCompleted,
  onToggleFavorite,
  onSetDueAt,
  onClearDueAt,
  onDelete,
}: Props) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggleCompleted(task)}
            className="h-4 w-4 rounded border-muted-foreground/30"
          />
          <button
            onClick={() => onToggleFavorite(task)}
            className={cn(
              "h-8 w-8 inline-flex items-center justify-center rounded-md border hover:bg-accent",
              task.favorite ? "text-yellow-500" : "text-muted-foreground"
            )}
            title={task.favorite ? "取消收藏" : "收藏"}
          >
            {task.favorite ? <Star className="h-4 w-4 fill-yellow-500" /> : <StarOff className="h-4 w-4" />}
          </button>
          <div className="flex-1">
            <p className={cn("text-sm", task.completed && "line-through text-muted-foreground")}>{task.text}</p>
            <p className="text-xs text-muted-foreground">{new Date(task.createdAt).toLocaleString("zh-CN")}</p>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="datetime-local"
                value={toLocalInputValue(task.dueAt)}
                onChange={(e) => onSetDueAt(task, e.target.value)}
                className="text-xs h-8 w-[220px] rounded-md border border-input bg-background px-2"
              />
              {task.dueAt && (
                <button
                  onClick={() => onClearDueAt(task)}
                  className="h-8 px-2 text-xs inline-flex items-center justify-center rounded-md border hover:bg-accent"
                >
                  清除
                </button>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => onDelete(task.id)}
          className="ml-2 h-8 px-3 inline-flex items-center justify-center rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}