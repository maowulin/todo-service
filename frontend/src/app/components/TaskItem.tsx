"use client";

import { Task } from "@/gen/todo_pb";

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
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
      <div className="flex items-center gap-3 flex-1">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggleCompleted(task)}
          className="h-4 w-4"
        />
        <button
          onClick={() => onToggleFavorite(task)}
          className={`text-xl ${task.favorite ? "text-yellow-400" : "text-gray-300"}`}
          title={task.favorite ? "取消收藏" : "收藏"}
        >
          ★
        </button>
        <div className="flex-1">
          <p className={`text-gray-800 ${task.completed ? "line-through" : ""}`}>{task.text}</p>
          <p className="text-xs text-gray-500">{new Date(task.createdAt).toLocaleString("zh-CN")}</p>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="datetime-local"
              value={toLocalInputValue(task.dueAt)}
              onChange={(e) => onSetDueAt(task, e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            />
            {task.dueAt && (
              <button
                onClick={() => onClearDueAt(task)}
                className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
              >
                清除
              </button>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="ml-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
      >
        删除
      </button>
    </div>
  );
}