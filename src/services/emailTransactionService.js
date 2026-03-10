/**
 * emailTransactionService.js
 *
 * Firestore CRUD for email-sourced transactions.
 * Collection: /users/{uid}/Transactions/{txId}
 *
 * Schema per doc:
 *   subject, from, receivedAt, source, dataSource, amount, merchant,
 *   category, currency, description, parsedAt, edited
 *
 * Transaction statuses: 'pending' | 'approved' | 'rejected'
 */

import { db } from "../lib/firebase.js";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Get the Firestore collection reference for a user's email transactions.
 */
function txCollection(uid) {
  return collection(db, "users", uid, "Transactions");
}

/**
 * Fetch all email transactions for a user, ordered by creation date descending.
 *
 * @param {string} uid
 * @returns {Promise<object[]>}
 */
export async function fetchEmailTransactions(uid) {
  const q = query(txCollection(uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Subscribe to real-time updates for email transactions.
 *
 * @param {string} uid
 * @param {function} callback - receives array of transactions
 * @returns {function} unsubscribe function
 */
export function subscribeEmailTransactions(uid, callback) {
  const q = query(txCollection(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const txs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(txs);
  });
}

/**
 * Approve a pending email transaction.
 *
 * @param {string} uid
 * @param {string} txId
 * @returns {Promise<void>}
 */
export async function approveTransaction(uid, txId) {
  const ref = doc(db, "users", uid, "emailTransactions", txId);
  await updateDoc(ref, {
    status: "approved",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Reject a pending email transaction.
 *
 * @param {string} uid
 * @param {string} txId
 * @returns {Promise<void>}
 */
export async function rejectTransaction(uid, txId) {
  const ref = doc(db, "users", uid, "emailTransactions", txId);
  await updateDoc(ref, {
    status: "rejected",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Edit and approve a transaction (update fields then set status to approved).
 * Sets edited: true to indicate user manually edited this transaction.
 *
 * @param {string} uid
 * @param {string} txId
 * @param {object} updates – partial fields to update (source, merchant, amount, date, time, category)
 * @returns {Promise<void>}
 */
export async function editTransaction(uid, txId, updates) {
  if (!uid || !txId) return;
  const ref = doc(db, "users", uid, "emailTransactions", txId);
  // Only allow safe fields to be updated
  const allowed = [
    "source",
    "merchant",
    "accountRef",
    "amount",
    "date",
    "time",
    "category",
    "currency",
    "description",
  ];
  const safeUpdates = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      safeUpdates[key] = updates[key];
    }
  }
  await updateDoc(ref, {
    ...safeUpdates,
    edited: true,
    status: "approved",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Soft-delete an email transaction (marks as deleted so it won't reappear on sync).
 *
 * @param {string} uid
 * @param {string} txId
 * @returns {Promise<void>}
 */
export async function deleteEmailTransaction(uid, txId) {
  const ref = doc(db, "users", uid, "emailTransactions", txId);
  await updateDoc(ref, {
    deleted: true,
    updatedAt: serverTimestamp(),
  });
}
