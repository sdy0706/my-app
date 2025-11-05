import { NextResponse } from 'next/server';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseApp } from '@/lib/firebase';

const results = ['大吉', '中吉', '小吉', '凶'] as const;

export function GET() {
  const index = Math.floor(Math.random() * results.length);
  const result = results[index];
  return NextResponse.json({ result });
}

export async function POST() {
  const index = Math.floor(Math.random() * results.length);
  const result = results[index];

  try {
    const app = getFirebaseApp();
    const db = getFirestore(app);

    await addDoc(collection(db, 'results'), {
      result,
      timestamp: Timestamp.now(),
    });
    return NextResponse.json({ result });
  } catch (error) {
    // Log full error on server for debugging
    // eslint-disable-next-line no-console
    console.error('Firestore write error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to write to Firestore', message }, { status: 500 });
  }
}

