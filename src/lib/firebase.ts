import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getFirebaseConfig } from "./firebase.functions";

let dbPromise: Promise<Database> | null = null;

/** Lazily initialises the Firebase app (browser only) and returns the RTDB instance. */
export function firebaseDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const config = await getFirebaseConfig();
      const app: FirebaseApp = getApps()[0] ?? initializeApp(config);
      return getDatabase(app, config.databaseURL);
    })();
  }
  return dbPromise;
}
