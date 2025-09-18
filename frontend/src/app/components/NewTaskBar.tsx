"use client";

import { useCallback } from "react";

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
        placeholder="输入新任务..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        onKeyDown={handleKeyDown}
      />
      <button
        onClick={onAdd}
        disabled={loading || !value.trim()}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "添加中..." : "添加"}
      </button>
    </div>
  );
}