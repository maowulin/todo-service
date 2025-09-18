"use client";

type Props = { now: Date };

export default function Header({ now }: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold">待办事项</h1>
      <div className="text-sm text-gray-500" suppressHydrationWarning>
        {now.toLocaleString("zh-CN", { hour12: false })}
      </div>
    </div>
  );
}