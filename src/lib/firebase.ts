// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  getAuth,
  browserPopupRedirectResolver,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar app una sola vez (compatible con HMR de Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * Auth — inicialización universal:
 *
 * - Servidor (SSR/Node.js): inMemoryPersistence — IndexedDB no existe en Node.
 * - Navegador / Capacitor WebView: IndexedDB → localStorage como fallback.
 *   IndexedDB sobrevive a recargas del WebView y es el mecanismo correcto
 *   tanto en Capacitor como en browsers de escritorio/móvil.
 *
 * Si la app ya fue inicializada (HMR en dev), getAuth() reutiliza la instancia.
 */
const auth = (() => {
  if (typeof window === "undefined") {
    // SSR: persistencia en memoria (seguro para Node.js)
    try {
      return initializeAuth(app, { persistence: inMemoryPersistence });
    } catch {
      return getAuth(app);
    }
  }
  try {
    // Browser / Capacitor: IndexedDB primero, localStorage como fallback
    return initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    // HMR: la instancia ya existe, reutilizarla
    return getAuth(app);
  }
})();

/**
 * Firestore — caché persistente universal:
 *
 * - Servidor: memoryLocalCache (sin IndexedDB disponible).
 * - Browser / Capacitor: persistentLocalCache con soporte multi-pestaña.
 *   Reemplaza el deprecado enableMultiTabIndexedDbPersistence.
 */
const db = (() => {
  if (typeof window === "undefined") {
    try {
      return initializeFirestore(app, { localCache: memoryLocalCache() });
    } catch {
      // Ya inicializado en SSR
      const { getFirestore } = require("firebase/firestore");
      return getFirestore(app);
    }
  }
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // HMR: reutilizar instancia existente
    const { getFirestore } = require("firebase/firestore");
    return getFirestore(app);
  }
})();

export const storage = getStorage(app);
export { app, auth, db };
