"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value?: string;
  onChange: (local: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
};

type Parts = { y: number; m: number; d: number; hh: number; mm: number; ss: number };

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toLocalParts(iso?: string): Parts | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return {
    y: d.getFullYear(),
    m: d.getMonth() + 1,
    d: d.getDate(),
    hh: d.getHours(),
    mm: d.getMinutes(),
    ss: d.getSeconds(),
  };
}

function partsToLocalString(p: Parts): string {
  return `${p.y}-${pad2(p.m)}-${pad2(p.d)}T${pad2(p.hh)}:${pad2(p.mm)}:${pad2(p.ss)}`;
}

function getDaysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

function getFirstWeekday(y: number, m: number): number {
  return new Date(y, m - 1, 1).getDay();
}

function todayParts(): Parts {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), hh: d.getHours(), mm: d.getMinutes(), ss: d.getSeconds() };
}

export function DatePicker({ value, onChange, placeholder = "选择时间", id, className, disabled }: DatePickerProps) {
  const initial = toLocalParts(value) ?? todayParts();
  const [open, setOpen] = React.useState<boolean>(false);
  const [view, setView] = React.useState<{ y: number; m: number }>({ y: initial.y, m: initial.m });
  const [picked, setPicked] = React.useState<Parts>(initial);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const p = toLocalParts(value);
    if (p) {
      setPicked(p);
      setView({ y: p.y, m: p.m });
    }
  }, [value]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const days: Array<number | null> = React.useMemo(() => {
    const first = getFirstWeekday(view.y, view.m);
    const total = getDaysInMonth(view.y, view.m);
    const arr: Array<number | null> = [];
    for (let i = 0; i < first; i++) arr.push(null);
    for (let d = 1; d <= total; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [view]);

  const hour12 = React.useMemo(() => {
    const h = picked.hh % 12;
    return h === 0 ? 12 : h;
  }, [picked.hh]);
  const isPM = React.useMemo(() => picked.hh >= 12, [picked.hh]);

  const formatDisplay = (p: Parts): string => {
    const h12 = p.hh % 12 === 0 ? 12 : p.hh % 12;
    const period = p.hh >= 12 ? "下午" : "上午";
    return `${p.y}年${p.m}月${p.d}日 ${period} ${pad2(h12)}:${pad2(p.mm)}`;
  };

  const displayText = value ? (() => {
    const p = toLocalParts(value);
    if (!p) return placeholder;
    return formatDisplay(p);
  })() : placeholder;

  const confirm = () => {
    const normalized: Parts = { ...picked, ss: 0 };
    onChange(partsToLocalString(normalized));
    setOpen(false);
  };

  const clear = () => {
    onChange("");
    setOpen(false);
  };

  const jumpMonth = (delta: number) => {
    let y = view.y;
    let m = view.m + delta;
    while (m <= 0) { m += 12; y -= 1; }
    while (m > 12) { m -= 12; y += 1; }
    setView({ y, m });
  };

  const setToday = () => {
    const t = todayParts();
    setView({ y: t.y, m: t.m });
    setPicked(t);
  };

  const setHourBy12 = (h12: number) => {
    const newH = isPM ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
    setPicked((p) => ({ ...p, hh: newH }));
  };

  const setPeriod = (pm: boolean) => {
    const h = picked.hh % 12 === 0 ? 12 : picked.hh % 12;
    const newH = pm ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
    setPicked((p) => ({ ...p, hh: newH }));
  };

  return (
    <div ref={wrapperRef} className={cn("relative inline-block", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "h-8 min-w-[220px] rounded-md border border-input bg-background px-2 text-sm",
          "inline-flex items-center justify-between gap-2",
          "ring-offset-background placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none"
        )}
        title="选择时间"
      >
        <span className={cn(!value && "text-muted-foreground")}>{displayText}</span>
        <svg className="h-4 w-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[540px] rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden">
          <div className="flex">
            <div className="w-[300px] border-r">
              <div className="p-3 border-b flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-sm font-medium">
                  <span>{view.y}年{pad2(view.m)}月</span>
                  <svg className="h-4 w-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
                <div className="inline-flex items-center gap-1">
                  <button className="px-2 py-1 rounded hover:bg-accent" onClick={() => jumpMonth(-1)} aria-label="上一月">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button className="px-2 py-1 rounded hover:bg-accent" onClick={() => jumpMonth(1)} aria-label="下一月">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-0 px-3 pt-2 text-xs text-muted-foreground">
                {['日','一','二','三','四','五','六'].map((w) => (
                  <div key={w} className="text-center py-1">{w}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0 px-3 pb-2">
                {days.map((d, i) => {
                  const isSel = d !== null && picked.y === view.y && picked.m === view.m && picked.d === d;
                  return (
                    <button
                      key={i}
                      disabled={d === null}
                      onClick={() => d !== null && setPicked((p) => ({ ...p, y: view.y, m: view.m, d }))}
                      className={cn(
                        "h-8 m-0.5 rounded text-sm text-center",
                        d === null && "opacity-30 cursor-default",
                        isSel ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      )}
                    >
                      {d ?? ""}
                    </button>
                  );
                })}
              </div>

              <div className="px-3 pb-3 flex items-center justify-between text-xs">
                <button className="text-muted-foreground hover:underline" onClick={clear}>清空</button>
                <button className="text-muted-foreground hover:underline" onClick={setToday}>今天</button>
              </div>
            </div>

            <div className="w-[240px]">
              <div className="p-3 border-b flex items-center justify-end gap-1">
                <button
                  onClick={() => setPeriod(false)}
                  className={cn(
                    "h-7 px-2 rounded text-xs",
                    !isPM ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                >
                  上午
                </button>
                <button
                  onClick={() => setPeriod(true)}
                  className={cn(
                    "h-7 px-2 rounded text-xs",
                    isPM ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                >
                  下午
                </button>
              </div>

              <div className="p-3 grid grid-cols-2 gap-2">
                {[
                  { max: 12 as const, key: "hh12" as const },
                  { max: 59 as const, key: "mm" as const },
                ].map((col) => (
                  <div key={col.key} className="border rounded h-40 overflow-y-auto">
                    <div className="p-1 flex flex-col gap-1">
                      {col.key === "hh12"
                        ? Array.from({ length: 12 }, (_, n) => n + 1).map((n) => {
                            const active = hour12 === n;
                            return (
                              <button
                                key={n}
                                onClick={() => setHourBy12(n)}
                                className={cn(
                                  "h-7 rounded text-xs w-full text-center",
                                  active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                                )}
                              >
                                {pad2(n)}
                              </button>
                            );
                          })
                        : Array.from({ length: col.max + 1 }, (_, n) => n).map((n) => {
                            const active = picked.mm === n;
                            return (
                              <button
                                key={n}
                                onClick={() => setPicked((p) => ({ ...p, mm: n }))}
                                className={cn(
                                  "h-7 rounded text-xs w-full text-center",
                                  active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                                )}
                              >
                                {pad2(n)}
                              </button>
                            );
                          })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t p-2 flex items-center justify-end">
            <button className="px-3 h-8 rounded bg-primary text-primary-foreground hover:bg-primary/90" onClick={confirm}>确定</button>
          </div>
        </div>
      )}
    </div>
  );
}
