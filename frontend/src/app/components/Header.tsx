"use client";

type Props = { now: Date };

export default function Header({ now }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-semibold tracking-tight">我的一天</h1>
      <div className="text-sm text-muted-foreground" suppressHydrationWarning>
        {now.toLocaleString("zh-CN", { hour12: false })}
      </div>
    </div>
  );
}
