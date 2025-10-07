import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";

const requireEnv = (value: string | undefined, key: string): string => {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

const firebaseConfig: FirebaseOptions = {
  apiKey: requireEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, "NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: requireEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  databaseURL: requireEnv(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL, "NEXT_PUBLIC_FIREBASE_DATABASE_URL"),
  projectId: requireEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, "NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: requireEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requireEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: requireEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, "NEXT_PUBLIC_FIREBASE_APP_ID"),
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? undefined
};

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Database | null = null;

const initializeFirebase = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!firebaseApp) {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getDatabase(firebaseApp);
  }

  return firebaseApp;
};

export const app = (): FirebaseApp => {
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be initialized in the browser');
  }
  if (!firebaseApp) {
    initializeFirebase();
  }
  return firebaseApp!;
};

export const auth = (): Auth => {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth can only be initialized in the browser');
  }
  if (!firebaseAuth) {
    initializeFirebase();
  }
  return firebaseAuth!;
};

export const db = (): Database => {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Database can only be initialized in the browser');
  }
  if (!firebaseDb) {
    initializeFirebase();
  }
  return firebaseDb!;
};

let secondaryApp: FirebaseApp | null = null;

export const getSecondaryAuth = (): Auth => {
  if (typeof window === 'undefined') {
    throw new Error('Secondary auth can only be initialized in the browser');
  }

  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, "secondary");
  }
  return getAuth(secondaryApp);
};

export default app;
