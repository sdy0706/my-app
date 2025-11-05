import { NextResponse } from 'next/server';

const results = ['大吉', '中吉', '小吉', '凶'] as const;

export function GET() {
  const index = Math.floor(Math.random() * results.length);
  const result = results[index];
  return NextResponse.json({ result });
}


