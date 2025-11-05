import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';

// Only import modular services that are safe in both server/client contexts on demand
// Avoid importing browser-only modules (like analytics) at module load time.

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? ''
	// measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
} as const;

function assertConfigValid(config: typeof firebaseConfig): void {
	const missingKeys: string[] = [];
	for (const [key, value] of Object.entries(config)) {
		if (!value) missingKeys.push(key);
	}
	if (missingKeys.length > 0) {
		// Throwing here surfaces misconfiguration early in dev/build
		throw new Error(`Missing Firebase env variables: ${missingKeys.join(', ')}`);
	}
}

let appInstance: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
	if (appInstance) return appInstance;
	assertConfigValid(firebaseConfig);
	appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
	return appInstance;
}

export type { FirebaseApp };
