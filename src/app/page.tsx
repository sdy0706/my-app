"use client";

import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFortune = async () => {
    try {
      setLoading(true);
      setResult(null);
      const res = await fetch("/api/omikuji", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data: { result: string } = await res.json();
      setResult(data.result);
    } catch (e) {
      setResult("エラーが発生しました");
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
          {loading ? "占い中..." : "占う"}
        </button>
        <div className="mt-8 min-h-[2rem]">
          {loading ? (
            <p className="text-zinc-600 dark:text-zinc-300">結果を取得しています...</p>
          ) : result ? (
            <p className="text-3xl font-bold text-black dark:text-zinc-50">{result}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
