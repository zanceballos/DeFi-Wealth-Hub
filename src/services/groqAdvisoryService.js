/**
 * groqAdvisoryService.js
 *
 * Sends the user's financial payload to the Groq chat-completions endpoint
 * and returns a structured advisory response.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL   = 'llama-3.3-70b-versatile'

// ─── System prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior certified financial planner and fintech data analyst.
You specialise in personal wealth management across both traditional finance (TradFi)
and decentralised finance (DeFi). You are based in Singapore and understand SGD-denominated
portfolios, CPF, MAS regulations, and local fintech platforms.

When given a user's financial data you MUST return a SINGLE JSON object with this exact schema:

{
  "headline":    "<string — one-line advisory headline, max 15 words>",
  "summary":     "<string — 2-3 sentence executive summary of the user's financial health>",
  "risk_level":  "<string — one of: low, moderate, elevated, high, critical>",
  "insights": [
    {
      "title":       "<string>",
      "description": "<string — 2-3 sentences>",
      "category":    "<string — one of: liquidity, diversification, risk, growth, savings, digital_health>",
      "severity":    "<string — one of: positive, neutral, warning, critical>"
    }
  ],
  "actions": [
    {
      "label":    "<string — short imperative action>",
      "detail":   "<string — 1-2 sentences explaining the action>",
      "priority": "<string — one of: high, medium, low>"
    }
  ],
  "education": [
    {
      "topic":   "<string — short topic title>",
      "content": "<string — 2-4 sentences of educational guidance>"
    }
  ]
}

Guidelines:
- Return ONLY the JSON object. No markdown, no code fences, no commentary.
- Provide exactly 3-5 insights, 2-4 actions, and 2-3 education items.
- Reference specific numbers from the user's data when possible.
- Keep language professional yet accessible. Avoid jargon when possible.
- If the data shows very little information, still provide general best-practice
  guidance and note what data is missing.`

// ─── Fallback when the API call fails or returns garbage ────────────────────

export function fallbackAdvisory() {
  return {
    headline:   'Unable to generate advisory right now',
    summary:    'We could not reach the advisory engine. Please check your connection and try again.',
    risk_level: 'moderate',
    insights: [
      {
        title:       'Advisory Unavailable',
        description: 'The AI advisory engine is temporarily unavailable. Your data is safe and you can retry at any time.',
        category:    'growth',
        severity:    'neutral',
      },
    ],
    actions: [
      {
        label:    'Try again later',
        detail:   'Click the refresh button to re-request your advisory.',
        priority: 'medium',
      },
    ],
    education: [
      {
        topic:   'Stay Diversified',
        content: 'A well-diversified portfolio across asset classes can help manage risk. Consider spreading investments across cash, bonds, equities and digital assets.',
      },
    ],
  }
}

// ─── Main service function ──────────────────────────────────────────────────

/**
 * Call Groq with the user's financial snapshot and return parsed advisory JSON.
 *
 * @param {object} payload - output of `buildAdvisoryPayload()`
 * @returns {Promise<object>} advisory object matching the schema above
 */
export async function fetchAdvisory(payload) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  if (!apiKey) {
    console.warn('[groqAdvisoryService] VITE_GROQ_API_KEY is not set — returning fallback.')
    return fallbackAdvisory()
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Here is my financial data:\n\n${JSON.stringify(payload, null, 2)}\n\nPlease analyse and return the advisory JSON.`,
          },
        ],
      }),
    })

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '')
      console.error(`[groqAdvisoryService] API error ${res.status}: ${errorBody}`)
      return fallbackAdvisory()
    }

    const data = await res.json()
    const raw  = data?.choices?.[0]?.message?.content ?? ''

    // Parse — first try raw, then strip possible markdown fences
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      const cleaned = raw
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim()
      parsed = JSON.parse(cleaned)
    }

    // Basic shape validation
    if (!parsed.headline || !Array.isArray(parsed.insights)) {
      console.warn('[groqAdvisoryService] Unexpected shape — returning fallback.')
      return fallbackAdvisory()
    }

    return parsed
  } catch (err) {
    console.error('[groqAdvisoryService] Unexpected error:', err)
    return fallbackAdvisory()
  }
}
