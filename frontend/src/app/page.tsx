"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Task,
  GetTasksRequest,
  AddTaskRequest,
  DeleteTaskRequest,
  UpdateTaskRequest,
} from "@/gen/todo_pb";
import { todoClient } from "@/lib/todo-client";
import Header from "./components/Header";
import NewTaskBar from "./components/NewTaskBar";
import TaskSection from "./components/TaskSection";

export default function HomePage() {
  // 状态
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newText, setNewText] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [now, setNow] = useState(new Date());

  // 当前时间刷新（仅客户端）
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  // 初始加载
  const loadTasks = async () => {
    const res = await todoClient.getTasks(new GetTasksRequest());
    setTasks(res.tasks);
  };
  useEffect(() => {
    loadTasks();
  }, []);

  // 本地工具
  const toLocalInputValue = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const tzoffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzoffset).toISOString().slice(0, 16);
    return localISOTime;
  };
  const fromLocalInputValue = (value: string) => {
    if (!value) return "";
    const d = new Date(value);
    return d.toISOString();
  };

  // 计算属性
  const unfinished = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const finished = useMemo(() => tasks.filter((t) => t.completed), [tasks]);

  // 交互方法
  const refresh = loadTasks;

  const addTask = async () => {
    if (!newText.trim()) return;
    setLoadingAdd(true);
    try {
      await todoClient.addTask(new AddTaskRequest({ text: newText }));
      setNewText("");
      await refresh();
    } finally {
      setLoadingAdd(false);
    }
  };

  const updateTask = async (patch: { id: string; completed?: boolean; favorite?: boolean; dueAt?: string }) => {
    const req = new UpdateTaskRequest({
      id: patch.id,
      ...(typeof patch.completed !== "undefined" ? { completed: patch.completed } : {}),
      ...(typeof patch.favorite !== "undefined" ? { favorite: patch.favorite } : {}),
      ...(typeof patch.dueAt !== "undefined" ? { dueAt: patch.dueAt } : {}),
    });
    await todoClient.updateTask(req);
    await refresh();
  };

  const toggleCompleted = async (task: Task) => {
    await updateTask({ id: task.id, completed: !task.completed });
  };

  const toggleFavorite = async (task: Task) => {
    await updateTask({ id: task.id, favorite: !task.favorite });
  };

  const setDueAt = async (task: Task, value: string) => {
    const dueAt = value ? fromLocalInputValue(value) : "";
    await updateTask({ id: task.id, dueAt });
  };

  const clearDueAt = async (task: Task) => {
    await updateTask({ id: task.id, dueAt: "" });
  };

  const deleteTask = async (id: string) => {
    await todoClient.deleteTask(new DeleteTaskRequest({ id }));
    await refresh();
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <Header now={now} />

      <NewTaskBar value={newText} loading={loadingAdd} onChange={setNewText} onAdd={addTask} />

      <TaskSection
        title="未完成"
        tasks={unfinished}
        toLocalInputValue={toLocalInputValue}
        onToggleCompleted={toggleCompleted}
        onToggleFavorite={toggleFavorite}
        onSetDueAt={setDueAt}
        onClearDueAt={clearDueAt}
        onDelete={deleteTask}
      />

      <TaskSection
        title={`已完成`}
        tasks={finished}
        collapsed={!showCompleted}
        onToggleCollapsed={() => setShowCompleted((v) => !v)}
        toLocalInputValue={toLocalInputValue}
        onToggleCompleted={toggleCompleted}
        onToggleFavorite={toggleFavorite}
        onSetDueAt={setDueAt}
        onClearDueAt={clearDueAt}
        onDelete={deleteTask}
      />
    </main>
  );
}
