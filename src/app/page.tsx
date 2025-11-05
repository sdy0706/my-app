"use client";

import { useEffect, useState } from "react";
import { getFirebaseApp } from "@/lib/firebase";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit as limitFn,
  getDocs,
  Timestamp,
} from "firebase/firestore";

type HistoryItem = {
  id: string;
  result: string;
  timestamp: Date;
};

export default function Home() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const fetchHistory = async () => {
    try {
      const app = getFirebaseApp();
      const db = getFirestore(app);
      const q = query(
        collection(db, "results"),
        orderBy("timestamp", "desc"),
        limitFn(5)
      );
      const snap = await getDocs(q);
      const items: HistoryItem[] = snap.docs.map((d) => {
        const data = d.data() as { result?: string; timestamp?: Timestamp };
        return {
          id: d.id,
          result: data.result ?? "",
          timestamp: (data.timestamp ?? Timestamp.now()).toDate(),
        };
      });
      setHistory(items);
    } catch (e) {
      // 取得失敗時はコンソールにだけ出力（UIは黙っておく）
      // eslint-disable-next-line no-console
      console.error("Failed to load history:", e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFortune = async () => {
    try {
      setLoading(true);
      setResult(null);
      const res = await fetch("/api/omikuji", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        throw new Error(err.message || err.error || "Failed to fetch");
      }
      const data: { result: string } = await res.json();
      setResult(data.result);
      // 成功後に履歴を再取得
      fetchHistory();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "エラーが発生しました";
      setResult(`エラー: ${msg}`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black font-sans">
      <div className="flex flex-col items-center justify-center bg-white dark:bg-zinc-900 rounded-xl shadow-lg px-12 py-16">
        <h1 className="text-4xl font-bold mb-8 text-black dark:text-zinc-50">AIおみくじ</h1>
        <button
          onClick={handleFortune}
          disabled={loading}
          aria-busy={loading}
          className="px-8 py-3 bg-blue-600 disabled:bg-blue-400 text-white rounded-full text-xl font-semibold shadow hover:bg-blue-700 transition-colors"
        >
          {loading ? "占い中..." : "占うぜ"}
        </button>
        <div className="mt-8 min-h-[2rem]">
          {loading ? (
            <p className="text-zinc-600 dark:text-zinc-300">結果を取得しています...</p>
          ) : result ? (
            <p className="text-3xl font-bold text-black dark:text-zinc-50">{result}</p>
          ) : null}
        </div>

        {/* 履歴表示 */}
        <div className="mt-10 w-full">
          <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-3">最近の結果（最新5件）</h2>
          {history.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-300">まだ履歴がありません。</p>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between text-black dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 rounded-md px-4 py-2">
                  <span className="font-medium">{h.result}</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {h.timestamp.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
