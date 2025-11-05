"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getFirebaseApp } from "@/lib/firebase";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";

const LABELS = ["大吉", "中吉", "小吉", "凶"] as const;
const COLORS: Record<(typeof LABELS)[number], string> = {
  大吉: "#22c55e", // green
  中吉: "#3b82f6", // blue
  小吉: "#f59e0b", // amber
  凶:   "#ef4444", // red
};

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function StatsPage() {
  const [start, setStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toDateInputValue(d);
  });
  const [end, setEnd] = useState<string>(() => toDateInputValue(new Date()));

  const [counts, setCounts] = useState<Record<(typeof LABELS)[number], number>>({
    大吉: 0,
    中吉: 0,
    小吉: 0,
    凶: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(
    () => LABELS.reduce((sum, k) => sum + (counts[k] ?? 0), 0),
    [counts]
  );

  const gradient = useMemo(() => {
    if (total === 0) return "conic-gradient(#e5e7eb 0 100%)"; // gray empty
    let acc = 0;
    const segments: string[] = [];
    for (const label of LABELS) {
      const value = counts[label] ?? 0;
      if (value === 0) continue;
      const pct = (value / total) * 100;
      const startDeg = acc;
      const endDeg = acc + pct;
      segments.push(`${COLORS[label]} ${startDeg}% ${endDeg}%`);
      acc = endDeg;
    }
    return `conic-gradient(${segments.join(", ")})`;
  }, [counts, total]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = new Date(`${start}T00:00:00`);
      const endDate = new Date(`${end}T23:59:59.999`);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("日付の形式が不正です");
      }
      if (startDate > endDate) {
        throw new Error("開始日は終了日以前にしてください");
      }

      const app = getFirebaseApp();
      const db = getFirestore(app);
      const q = query(
        collection(db, "results"),
        where("timestamp", ">=", Timestamp.fromDate(startDate)),
        where("timestamp", "<=", Timestamp.fromDate(endDate)),
        orderBy("timestamp", "asc")
      );

      const snap = await getDocs(q);
      const nextCounts: Record<(typeof LABELS)[number], number> = {
        大吉: 0,
        中吉: 0,
        小吉: 0,
        凶: 0,
      };
      for (const doc of snap.docs) {
        const data = doc.data() as { result?: string };
        const r = data.result as (typeof LABELS)[number] | undefined;
        if (r && LABELS.includes(r)) nextCounts[r] += 1;
      }
      setCounts(nextCounts);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "集計に失敗しました";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-zinc-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-6">期間集計（円グラフ）</h1>

        <div className="flex flex-wrap items-end gap-4 mb-8">
          <div>
            <label className="block text-sm mb-1">開始日</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="px-3 py-2 rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">終了日</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="px-3 py-2 rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
            />
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-5 py-2 rounded-md bg-blue-600 disabled:bg-blue-400 text-white font-semibold"
          >
            {loading ? "集計中..." : "集計"}
          </button>
          {error ? (
            <span className="text-red-500 text-sm">{error}</span>
          ) : null}
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Pie chart */}
          <div
            aria-label="円グラフ"
            className="w-64 h-64 rounded-full shadow-inner"
            style={{ background: gradient }}
          />

          {/* Legend */}
          <div className="flex-1 w-full">
            <h2 className="text-xl font-semibold mb-3">内訳（合計 {total} 件）</h2>
            <ul className="space-y-2">
              {LABELS.map((label) => {
                const value = counts[label] ?? 0;
                const pct = total === 0 ? 0 : Math.round((value / total) * 100);
                return (
                  <li key={label} className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-4 py-2">
                    <div className="flex items-center gap-3">
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[label] }} />
                      <span className="font-medium">{label}</span>
                    </div>
                    <div className="text-sm text-zinc-700 dark:text-zinc-300">
                      {value} 件（{pct}%）
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

