"use client";

import { useState, useEffect, useCallback } from "react";
import { todoClient } from "@/lib/todo-client";
import {
  Task,
  GetTasksRequest,
  AddTaskRequest,
  DeleteTaskRequest,
  UpdateTaskRequest,
} from "@/gen/todo_pb";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState<Date>(new Date());
  const [showCompleted, setShowCompleted] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const response = await todoClient.getTasks(new GetTasksRequest());
      setTasks(response.tasks);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const addTask = async () => {
    if (!newTaskText.trim()) return;

    setLoading(true);
    try {
      await todoClient.addTask(new AddTaskRequest({ text: newTaskText }));
      setNewTaskText("");
      await loadTasks();
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await todoClient.deleteTask(new DeleteTaskRequest({ id }));
      await loadTasks();
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const toggleCompleted = async (task: Task) => {
    try {
      await todoClient.updateTask(
        new UpdateTaskRequest({ id: task.id, completed: !task.completed })
      );
      await loadTasks();
    } catch (error) {
      console.error("Failed to toggle completed:", error);
    }
  };

  const toggleFavorite = async (task: Task) => {
    try {
      await todoClient.updateTask(
        new UpdateTaskRequest({ id: task.id, favorite: !task.favorite })
      );
      await loadTasks();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const toLocalInputValue = (rfc3339: string): string => {
    if (!rfc3339) return "";
    const d = new Date(rfc3339);
    const pad = (n: number) => String(n).padStart(2, "0");
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${y}-${m}-${day}T${hh}:${mm}`;
  };

  const fromLocalInputValue = (value: string): string => {
    if (!value) return "";
    const d = new Date(value);
    return d.toISOString();
  };

  const setDueAt = async (task: Task, value: string) => {
    try {
      const dueAt = value ? fromLocalInputValue(value) : "";
      await todoClient.updateTask(new UpdateTaskRequest({ id: task.id, dueAt }));
      await loadTasks();
    } catch (error) {
      console.error("Failed to set due date:", error);
    }
  };

  const clearDueAt = async (task: Task) => {
    try {
      await todoClient.updateTask(new UpdateTaskRequest({ id: task.id, dueAt: "" }));
      await loadTasks();
    } catch (error) {
      console.error("Failed to clear due date:", error);
    }
  };

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">待办事项</h1>
          <div className="text-sm text-gray-500" suppressHydrationWarning>{now.toLocaleString("zh-CN", { hour12: false })}</div>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="输入新任务..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <button
            onClick={addTask}
            disabled={loading || !newTaskText.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
         >
            {loading ? "添加中..." : "添加"}
          </button>
        </div>

        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center">暂无任务</p>
          ) : (
            <>
              {activeTasks.length === 0 ? (
                <p className="text-gray-500 text-center">暂无未完成任务</p>
              ) : (
                activeTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleCompleted(task)}
                        className="h-4 w-4"
                      />
                      <button
                        onClick={() => toggleFavorite(task)}
                        className={`text-xl ${task.favorite ? "text-yellow-400" : "text-gray-300"}`}
                        title={task.favorite ? "取消收藏" : "收藏"}
                      >
                        ★
                      </button>
                      <div className="flex-1">
                        <p className={`text-gray-800 ${task.completed ? "line-through" : ""}`}>{task.text}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(task.createdAt).toLocaleString("zh-CN")}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="datetime-local"
                            value={toLocalInputValue(task.dueAt)}
                            onChange={(e) => setDueAt(task, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          />
                          {task.dueAt && (
                            <button
                              onClick={() => clearDueAt(task)}
                              className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                            >
                              清除
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="ml-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                    >
                      删除
                    </button>
                  </div>
                ))
              )}

              {completedTasks.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowCompleted((v) => !v)}
                    className="mb-2 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                    aria-expanded={showCompleted}
                  >
                    <span className="inline-block w-5 text-center">{showCompleted ? "▾" : "▸"}</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">已完成 {completedTasks.length}</span>
                  </button>

                  {showCompleted && (
                    <div className="space-y-2">
                      {completedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleCompleted(task)}
                              className="h-4 w-4"
                            />
                            <button
                              onClick={() => toggleFavorite(task)}
                              className={`text-xl ${task.favorite ? "text-yellow-400" : "text-gray-300"}`}
                              title={task.favorite ? "取消收藏" : "收藏"}
                            >
                              ★
                            </button>
                            <div className="flex-1">
                              <p className={`text-gray-800 ${task.completed ? "line-through" : ""}`}>{task.text}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(task.createdAt).toLocaleString("zh-CN")}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="datetime-local"
                                  value={toLocalInputValue(task.dueAt)}
                                  onChange={(e) => setDueAt(task, e.target.value)}
                                  className="text-xs border border-gray-300 rounded px-2 py-1"
                                />
                                {task.dueAt && (
                                  <button
                                    onClick={() => clearDueAt(task)}
                                    className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                                  >
                                    清除
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="ml-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                          >
                            删除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={loadTasks}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            刷新列表
          </button>
        </div>
      </div>
    </div>
  );
}
