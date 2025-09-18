"use client";

import { useState, useEffect, useCallback } from "react";
import { todoClient } from "@/lib/todo-client";
import {
  Task,
  GetTasksRequest,
  AddTaskRequest,
  DeleteTaskRequest,
} from "@/gen/todo_pb";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">待办事项</h1>

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
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex-1">
                  <p className="text-gray-800">{task.text}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(task.createdAt).toLocaleString("zh-CN")}
                  </p>
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
