/**
 * groqAdvisoryService.js
 *
 * Sends the user's financial payload to the Groq chat-completions endpoint
 * and returns a structured advisory response.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL   = 'llama-3.3-70b-versatile'

// ─── System prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a friendly personal finance coach helping everyday people understand their money.
You explain things simply — like you're talking to a friend who is not a finance expert.
You are based in Singapore and understand SGD, CPF, and local apps like GrabPay, PayNow, DBS, OCBC, and UOB.

When given a user's financial data you MUST return a SINGLE JSON object with this exact schema:

{
  "headline":    "<string — one friendly, encouraging headline, max 15 words>",
  "summary":     "<string — 2-3 sentences. Use simple words. No jargon. Tell the user how they are doing overall.>",
  "risk_level":  "<string — one of: low, moderate, elevated, high, critical>",
  "insights": [
    {
      "title":       "<string — short, plain English title>",
      "description": "<string — 2-3 sentences. Explain what this means in plain language. Avoid terms like 'liquidity ratio' or 'asset allocation' — instead say 'emergency cash' or 'how your money is spread out'. Use specific numbers from the data where possible.>",
      "category":    "<string — one of: liquidity, diversification, risk, growth, savings, digital_health>",
      "severity":    "<string — one of: positive, neutral, warning, critical>"
    }
  ],
  "actions": [
    {
      "label":    "<string — a simple, clear action anyone can understand e.g. 'Save S$500 more this month'>",
      "detail":   "<string — 1-2 sentences. Tell the user exactly what to do and why it helps them. Keep it simple and friendly.>",
      "priority": "<string — one of: high, medium, low>"
    }
  ],
  "education": [
    {
      "topic":   "<string — a plain English topic title e.g. 'What is an emergency fund?'>",
      "content": "<string — 2-4 sentences. Explain the concept like the user has never heard of it before. Use everyday examples and analogies where helpful.>"
    }
  ]
}

Guidelines:
- Return ONLY the JSON object. No markdown, no code fences, no commentary.
- Provide exactly 3-5 insights, 2-4 actions, and 2-3 education items.
- NEVER use financial jargon without immediately explaining it in brackets e.g. 'diversification (spreading your money across different types of investments)'.
- Write like a supportive coach, not a banker. Be warm, clear, and encouraging.
- Use specific dollar amounts and percentages from the user's data to make insights feel personal.
- If data is limited, give practical general advice and gently let the user know what they could add to get better insights.
- Keep sentences short. Aim for a reading level that a 16-year-old could easily understand.`


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
