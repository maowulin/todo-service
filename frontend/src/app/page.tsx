"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newText, setNewText] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [now, setNow] = useState(new Date());
  const [showFavorites, setShowFavorites] = useState(true);

  const notifiedRef = useRef<Set<string>>(new Set());

  const [mounted, setMounted] = useState(false);
  const [notifyPermission, setNotifyPermission] = useState<"unsupported" | NotificationPermission>("default");

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setNotifyPermission("unsupported");
      return;
    }
    setNotifyPermission(Notification.permission);
  }, []);

  const requestNotifyPermission = async () => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    try {
      const p = await Notification.requestPermission();
      setNotifyPermission(p);
    } catch {
      console.log("Notification permission request failed");
    }
  };

  const loadTasks = async () => {
    const res = await todoClient.getTasks(new GetTasksRequest());
    setTasks(res.tasks);
  };
  useEffect(() => {
    loadTasks();
  }, []);

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

  const favorites = useMemo(() => tasks.filter((t) => t.favorite), [tasks]);
  const unfinished = useMemo(() => tasks.filter((t) => !t.completed && !t.favorite), [tasks]);
  const finished = useMemo(() => tasks.filter((t) => t.completed && !t.favorite), [tasks]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (notifyPermission !== "granted") return;

    const nowMs = now.getTime();
    for (const t of tasks) {
      if (!t.dueAt || t.completed) continue;
      const dueMs = new Date(t.dueAt).getTime();
      if (Number.isNaN(dueMs)) continue;
      if (dueMs <= nowMs) {
        const key = `${t.id}|${t.dueAt}`;
        if (!notifiedRef.current.has(key)) {
          try {
            const n = new Notification("任务到期", {
              body: `${t.text} - 截止: ${new Date(t.dueAt).toLocaleString("zh-CN")}`,
              requireInteraction: false,
            });
            n.onclick = () => {
              window.focus();
            };
          } catch {
            console.log("Notification error");
          }
          notifiedRef.current.add(key);
        }
      }
    }
  }, [now, tasks, notifyPermission]);

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

      {mounted && notifyPermission !== "granted" && notifyPermission !== "unsupported" && (
        <div className="mb-4 px-3 py-2 rounded-md border bg-yellow-50 text-yellow-800 flex items-center justify-between">
          <span className="text-xs">通知未开启，启用后可在截止时提醒你</span>
          {notifyPermission === "default" ? (
            <button
              className="h-7 px-2 rounded-md border bg-background hover:bg-accent text-xs"
              onClick={requestNotifyPermission}
            >
              启用提醒
            </button>
          ) : (
            <span className="text-xs">浏览器已禁止，请在地址栏站点设置中允许通知</span>
          )}
        </div>
      )}

      <NewTaskBar value={newText} loading={loadingAdd} onChange={setNewText} onAdd={addTask} />

      {favorites.length > 0 && (
        <TaskSection
          title="已收藏"
          tasks={favorites}
          collapsed={!showFavorites}
          onToggleCollapsed={() => setShowFavorites((v) => !v)}
          toLocalInputValue={toLocalInputValue}
          onToggleCompleted={toggleCompleted}
          onToggleFavorite={toggleFavorite}
          onSetDueAt={setDueAt}
          onClearDueAt={clearDueAt}
          onDelete={deleteTask}
        />
      )}

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
