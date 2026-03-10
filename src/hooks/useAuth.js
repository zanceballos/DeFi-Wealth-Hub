import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../lib/firebase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function login(email, password) {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { ok: true };
    } catch (err) {
      setError(err.message);
      return { ok: false, error: err };
    }
  }

  async function register(email, password, name) {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      setUser({ ...auth.currentUser });
      return { ok: true };
    } catch (err) {
      setError(err.message);
      return { ok: false, error: err };
    }
  }

  async function loginWithGoogle() {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return { ok: true };
    } catch (err) {
      setError(err.message);
      return { ok: false, error: err };
    }
  }

  async function resetPassword(email) {
    setError(null);

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      const err = {
        code: "auth/missing-email",
        message: "Please enter your email address.",
      };
      setError(err.message);
      return { ok: false, error: err };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      const err = {
        code: "auth/invalid-email",
        message: "Please enter a valid email address.",
      };
      setError(err.message);
      return { ok: false, error: err };
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return { ok: true };
    } catch (err) {
      setError(err.message);
      return { ok: false, error: err };
    }
  }

  async function logout() {
    sessionStorage.removeItem("dwh_advisory");
    sessionStorage.removeItem("dwh_advisory_payload");
    sessionStorage.removeItem("dwh_advisory_uid");
    await signOut(auth);
  }

  return {
    user,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    resetPassword,
    logout,
  };
}
