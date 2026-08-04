import { createServerFn } from "@tanstack/react-start";

/**
 * Firebase web config. The API key is a publishable client key, but it is kept
 * in a project secret so it can be rotated without a code change.
 */
export const getFirebaseConfig = createServerFn({ method: "GET" }).handler(async () => ({
  apiKey: process.env["GOOGLE_API_KEY"] ?? "",
  authDomain: "pos-1-be57e.firebaseapp.com",
  databaseURL: "https://pos-1-be57e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pos-1-be57e",
  storageBucket: "pos-1-be57e.firebasestorage.app",
  messagingSenderId: "1018061612219",
  appId: "1:1018061612219:web:web_app_placeholder",
}));
