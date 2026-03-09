/**
 * gmailService.js
 *
 * Fully client-side Gmail integration.
 * Uses Google Identity Services for OAuth (implicit token flow),
 * calls Gmail REST API directly via fetch, parses emails in the
 * browser, and writes transactions to Firestore.
 *
 * No Cloud Functions required.
 */

import { db } from '../lib/firebase.js'
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { parseTransactionEmail } from './emailParser.js'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email'
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1'

// ─── In-memory token store ─────────────────────────────────────────────────

let _accessToken = null
let _tokenExpiry = 0
let _tokenClient = null

export function getAccessToken() { return _accessToken }
export function isTokenValid() { return _accessToken && Date.now() < _tokenExpiry }
export function clearToken() { _accessToken = null; _tokenExpiry = 0 }

// ─── Google Identity Services loader ───────────────────────────────────────

let gisLoaded = false

function loadGoogleIdentityServices() {
  return new Promise((resolve, reject) => {
    if (gisLoaded && window.google?.accounts?.oauth2) {
      resolve()
      return
    }
    if (document.getElementById('gis-script')) {
      const existing = document.getElementById('gis-script')
      existing.addEventListener('load', () => { gisLoaded = true; resolve() })
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')))
      return
    }
    const script = document.createElement('script')
    script.id = 'gis-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => { gisLoaded = true; resolve() }
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
}

// ─── OAuth: get access token via popup ─────────────────────────────────────

/**
 * Prompt the user to grant Gmail access. Returns { accessToken, email }.
 * Uses the implicit (token) flow — no server needed.
 */
export async function initiateGmailLink() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('VITE_GOOGLE_CLIENT_ID is not configured. Add it to your .env file.')
  }

  await loadGoogleIdentityServices()

  return new Promise((resolve, reject) => {
    _tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GMAIL_SCOPE,
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error_description || tokenResponse.error))
          return
        }
        _accessToken = tokenResponse.access_token
        _tokenExpiry = Date.now() + (tokenResponse.expires_in ?? 3600) * 1000

        try {
          const email = await fetchGmailEmail()
          resolve({ accessToken: _accessToken, email })
        } catch (err) {
          reject(err)
        }
      },
    })

    _tokenClient.requestAccessToken()
  })
}

/**
 * Silently request a new access token (no popup if user already consented).
 * Falls back to prompting if silent fails.
 */
export async function refreshAccessToken() {
  if (!_tokenClient) {
    await loadGoogleIdentityServices()
    _tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GMAIL_SCOPE,
      callback: () => {},
    })
  }

  return new Promise((resolve, reject) => {
    _tokenClient.callback = (tokenResponse) => {
      if (tokenResponse.error) {
        reject(new Error(tokenResponse.error_description || tokenResponse.error))
        return
      }
      _accessToken = tokenResponse.access_token
      _tokenExpiry = Date.now() + (tokenResponse.expires_in ?? 3600) * 1000
      resolve(_accessToken)
    }
    _tokenClient.requestAccessToken({ prompt: '' })
  })
}

/**
 * Ensure we have a valid access token, refreshing if needed.
 */
async function ensureToken() {
  if (isTokenValid()) return _accessToken
  return refreshAccessToken()
}

/**
 * Revoke the access token and clear it.
 */
export function revokeToken() {
  if (_accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(_accessToken, () => {})
  }
  clearToken()
}

// ─── Gmail API helpers ─────────────────────────────────────────────────────

async function gmailFetch(path) {
  const token = await ensureToken()
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gmail API error ${res.status}: ${text}`)
  }
  return res.json()
}

async function fetchGmailEmail() {
  const profile = await gmailFetch('/users/me/profile')
  return profile.emailAddress
}

function decodeBase64Url(str) {
  if (!str) return ''
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  return decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  )
}

function extractBody(payload) {
  if (!payload) return ''
  if (payload.body?.data) return decodeBase64Url(payload.body.data)

  const parts = payload.parts || []
  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return decodeBase64Url(part.body.data)
    }
    if (part.parts) {
      const nested = extractBody(part)
      if (nested) return nested
    }
  }
  for (const part of parts) {
    if (part.mimeType === 'text/html' && part.body?.data) {
      const html = decodeBase64Url(part.body.data)
      return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    }
  }
  return ''
}

function getHeader(headers, name) {
  const hdr = (headers || []).find((h) => h.name.toLowerCase() === name.toLowerCase())
  return hdr ? hdr.value : ''
}

// ─── Sync: fetch + parse + write to Firestore ─────────────────────────────

const GMAIL_QUERY = 'subject:(transaction OR payment OR receipt OR alert OR "card ending" OR debit OR credit OR transfer OR received) newer_than:7d'

/**
 * Sync Gmail transaction emails for a user (client-side).
 *
 * @param {string} uid – Firebase Auth user ID
 * @returns {{ newCount: number }}
 */
export async function syncGmailTransactions(uid) {
  console.log('[GmailSync] Starting sync for uid:', uid)

  // 1. List matching messages
  const listRes = await gmailFetch(`/users/me/messages?q=${encodeURIComponent(GMAIL_QUERY)}&maxResults=20`)
  const messageIds = (listRes.messages || []).map((m) => m.id)
  console.log('[GmailSync] Gmail returned', messageIds.length, 'messages matching query')

  if (messageIds.length === 0) return { newCount: 0 }

  // 2. Check which emails are already processed OR soft-deleted (dedup by emailId)
  const txCol = collection(db, 'users', uid, 'emailTransactions')
  const existingIds = new Set()

  // Firestore 'in' queries max 10 items per query
  try {
    for (let i = 0; i < messageIds.length; i += 10) {
      const batch = messageIds.slice(i, i + 10)
      const q = query(txCol, where('emailId', 'in', batch))
      const snap = await getDocs(q)
      // Include both active and soft-deleted docs so deleted txs don't reappear
      snap.forEach((d) => existingIds.add(d.data().emailId))
    }
  } catch (err) {
    console.error('[GmailSync] ❌ Firestore dedup query failed:', err.message || err)
    console.error('[GmailSync] This is likely a Firestore security rules issue. Skipping dedup and processing all messages.')
    // Continue without dedup — treat all as new
  }

  const newIds = messageIds.filter((id) => !existingIds.has(id))
  console.log('[GmailSync] New (not yet processed):', newIds.length, 'of', messageIds.length)
  if (newIds.length === 0) return { newCount: 0 }

  // 3. Fetch, parse, and write each new message
  let newCount = 0
  for (const msgId of newIds) {
    try {
      const msgData = await gmailFetch(`/users/me/messages/${msgId}?format=full`)
      const payload = msgData.payload || {}
      const headers = payload.headers || []

      const email = {
        id: msgId,
        subject: getHeader(headers, 'Subject'),
        body: extractBody(payload),
        from: getHeader(headers, 'From'),
        date: getHeader(headers, 'Date'),
      }

      console.log('[GmailSync] Processing email:', email.subject, '| from:', email.from)
      console.log('[GmailSync] Body preview:', email.body.slice(0, 200))

      const parsed = parseTransactionEmail(email)
      if (!parsed) {
        console.log('[GmailSync] ⏭ Not a transaction email, skipping:', email.subject)
        continue
      }

      console.log('[GmailSync] ✅ Parsed transaction:', parsed.source, parsed.merchant, parsed.amount)

      await addDoc(txCol, {
        ...parsed,
        // New schema fields
        subject: parsed.emailSubject ?? '',
        from: parsed.emailFrom ?? '',
        receivedAt: parsed.emailDate ? new Date(parsed.emailDate) : serverTimestamp(),
        parsedAt: serverTimestamp(),
        edited: false,
        uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      newCount++
    } catch (err) {
      console.error(`Failed to process Gmail message ${msgId}:`, err)
    }
  }

  console.log('[GmailSync] Sync complete. New transactions:', newCount)
  return { newCount }
}
