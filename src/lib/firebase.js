// ─────────────────────────────────────────────
//  CONFIGURA AQUÍ TUS DATOS DE FIREBASE
//  Ve a: https://console.firebase.google.com
//  Proyecto → Configuración → Tus apps → Web
// ─────────────────────────────────────────────
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

const app = initializeApp(firebaseConfig)

export const db   = getFirestore(app)
export const auth = getAuth(app)

// Login con email y contraseña
export function loginAdmin(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

// Cerrar sesión
export function logoutAdmin() {
  return signOut(auth)
}

// Escuchar cambios de sesión (para persistencia entre recargas)
export function escucharSesion(callback) {
  return onAuthStateChanged(auth, callback)
}
