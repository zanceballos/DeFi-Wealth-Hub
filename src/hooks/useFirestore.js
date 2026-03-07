import { useState } from 'react'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useFirestore(collectionName) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const colRef = collection(db, collectionName)

  // GET all docs
  async function getAll() {
    setLoading(true)
    try {
      const snapshot = await getDocs(colRef)
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }

  // GET one doc by ID
  async function getOne(id) {
    setLoading(true)
    try {
      const snapshot = await getDoc(doc(db, collectionName, id))
      return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  // ADD a new doc (auto ID)
  async function add(data) {
    setLoading(true)
    try {
      const docRef = await addDoc(colRef, { ...data, createdAt: serverTimestamp() })
      return docRef.id
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // SET a doc with specific ID (overwrites)
  async function set(id, data) {
    setLoading(true)
    try {
      await setDoc(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp() })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // UPDATE specific fields only
  async function update(id, data) {
    setLoading(true)
    try {
      await updateDoc(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp() })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // DELETE a doc
  async function remove(id) {
    setLoading(true)
    try {
      await deleteDoc(doc(db, collectionName, id))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // REALTIME listener — returns unsubscribe fn
  function subscribe(callback, filters = []) {
    let q = colRef
    if (filters.length > 0) {
      q = query(colRef, ...filters)
    }
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      callback(data)
    })
  }

  return { loading, error, getAll, getOne, add, set, update, remove, subscribe }
}
