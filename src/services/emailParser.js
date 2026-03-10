/**
 * emailParser.js (client-side)
 *
 * Parses transaction details from common Singapore bank and payment
 * notification emails. Returns a structured object when a transaction
 * is detected, or null if the email is not a transaction alert.
 *
 * Supported: DBS, OCBC, UOB, GrabPay, PayNow, generic fallback.
 */

// ─── Amount regex (matches S$1,234.56 / SGD 1234.56 / $1,234.56) ──────────

const AMOUNT_RE = /(?:S\$|SGD\s*)\s*([\d,]+\.?\d{0,2})/i;
const AMOUNT_FALLBACK_RE = /\$\s*([\d,]+(?:\.\d{1,2})?)/;

// ─── Date patterns ─────────────────────────────────────────────────────────

const DATE_PATTERNS = [
  /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,
  /(\d{4})-(\d{2})-(\d{2})/,
  /(\d{2})[/-](\d{2})[/-](\d{4})/,
];

const MONTH_MAP = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

const TIME_RE = /(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)/i;

// ─── Category inference ────────────────────────────────────────────────────

const CATEGORY_KEYWORDS = {
  Transport: [
    "grab",
    "gojek",
    "taxi",
    "comfortdelgro",
    "bus",
    "mrt",
    "ez-link",
    "transit",
  ],
  Food: [
    "foodpanda",
    "deliveroo",
    "mcdonald",
    "starbucks",
    "kfc",
    "subway",
    "restaurant",
    "cafe",
    "coffee",
    "food",
  ],
  Groceries: [
    "ntuc",
    "fairprice",
    "cold storage",
    "sheng siong",
    "giant",
    "market",
  ],
  Shopping: [
    "shopee",
    "lazada",
    "amazon",
    "qoo10",
    "uniqlo",
    "h&m",
    "zara",
    "courts",
  ],
  Entertainment: [
    "netflix",
    "spotify",
    "disney",
    "cinema",
    "golden village",
    "shaw",
  ],
  Bills: [
    "singtel",
    "starhub",
    "m1",
    "sp group",
    "utility",
    "insurance",
    "telco",
  ],
  Health: [
    "guardian",
    "watsons",
    "clinic",
    "hospital",
    "doctor",
    "pharmacy",
    "medical",
  ],
  Housing: ["rent", "hdb", "condo", "mortgage", "property tax"],
  Investment: [
    "binance",
    "crypto",
    "coinbase",
    "webull",
    "tiger",
    "interactive brokers",
    "moomoo",
    "syfe",
    "stashaway",
    "endowus",
  ],
};

function inferCategory(text) {
  if (!text) return "Unknown";
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "Unknown";
}

// ─── Merchant extraction ───────────────────────────────────────────────────

const KNOWN_MERCHANTS = [
  "Grab",
  "GrabPay",
  "GrabFood",
  "FoodPanda",
  "Deliveroo",
  "NTUC FairPrice",
  "Cold Storage",
  "Sheng Siong",
  "Giant",
  "Shopee",
  "Lazada",
  "Amazon",
  "Qoo10",
  "Netflix",
  "Spotify",
  "Disney+",
  "Apple",
  "Singtel",
  "StarHub",
  "M1",
  "SP Group",
  "Binance",
  "Coinbase",
  "McDonald's",
  "Starbucks",
  "KFC",
  "Subway",
  "Guardian",
  "Watsons",
  "A&W",
];

// ─── Boilerplate truncation (safety net for emails stripped of newlines) ────────────

const BOILERPLATE_RE = [
  /\s+to\s+view\b/i,
  /\s+please\s+(?:call|do\s+not|note|contact)/i,
  /\s+if\s+this\s+was/i,
  /\s+if\s+you\s+did\s+not/i,
  /\s+thank\s+you\s+for/i,
  /\s+yours\s+faithfully/i,
  /\s+this\s+is\s+an\s+auto/i,
  /\s+did\s+not\s+make\s+this/i,
];

function truncateAtBoilerplate(text) {
  if (!text) return text;
  let idx = text.length;
  for (const re of BOILERPLATE_RE) {
    const m = text.search(re);
    if (m !== -1 && m < idx) idx = m;
  }
  return text.slice(0, idx).trim();
}

// ─── Account / card reference extraction ─────────────────────────────────

function extractAccountRef(text) {
  if (!text) return "";

  // DBS PayLah: "From: PayLah! Wallet (Mobile ending 6292)"
  const payLahWallet = text.match(
    /From:\s+PayLah!\s+Wallet\s*\(Mobile\s+ending\s+(\w+)\)/i,
  );
  if (payLahWallet) return `PayLah! Wallet ending ${payLahWallet[1]}`;

  // "credit card ending 5180" / "card ending 5180"
  const cardEnding = text.match(/(?:credit\s+)?card\s+ending\s+(\w{4,6})/i);
  if (cardEnding) return `Card ending ${cardEnding[1]}`;

  // OCBC: "your card (-5964)"
  const cardParen = text.match(/card\s*\(-?(\w{4,6})\)/i);
  if (cardParen) return `Card ending ${cardParen[1]}`;

  // "account ending XXXX" / "account no. ending XXXX"
  const accountEnding = text.match(
    /account\s+(?:no\.?\s+)?ending\s+(\w{4,6})/i,
  );
  if (accountEnding) return `Account ending ${accountEnding[1]}`;

  // "account number / account no. XXXXXXXX" — grab last 4 digits
  const accountNumber = text.match(
    /account\s+(?:number|no\.?)\s+[X\d]*(\d{4})(?!\d)/i,
  );
  if (accountNumber) return `Account ending ${accountNumber[1]}`;

  return "";
}

function extractMerchant(text) {
  if (!text) return "";
  const lower = text.toLowerCase();
  for (const m of KNOWN_MERCHANTS) {
    if (lower.includes(m.toLowerCase())) return m;
  }
  const atMatch = text.match(
    /(?:at|to|from|merchant[:\s]*)\s+([A-Z][A-Za-z0-9\s&'./-]{2,30})/,
  );
  if (atMatch) return atMatch[1].trim();
  return "";
}

// ─── Recipient extraction ──────────────────────────────────────────────────

/**
 * Extract the counterparty from the email body.
 * For debits: who we paid ("To" / "at" / "payment to")
 * For credits: who paid us ("From")
 */
function extractCounterparty(text, direction) {
  if (!text) return "";

  if (direction === "credit") {
    // "From: LOW KANG XUAN"  or  "From: PayLah! Wallet (Mobile ending ...)"
    const fromMatch = text.match(/From:\s+(.+?)(?:\n|$)/i);
    if (fromMatch) return truncateAtBoilerplate(fromMatch[1].trim());

    // "received ... from <name>"
    const receivedFrom = text.match(
      /received\s+.+?\s+from\s+([A-Za-z][A-Za-z0-9\s'./-]{1,50}?)(?:\s+on|\s+via|\.|,|\n|$)/i,
    );
    if (receivedFrom) return truncateAtBoilerplate(receivedFrom[1].trim());

    return "";
  }

  // ── Debit patterns ─────────────────────────────────────────────────

  // MariBank: "payment to A&W - JURONG POINT on your credit card ending 5180"
  const mariBankPayment = text.match(
    /payment\s+to\s+(.+?)\s+on\s+your\s+(?:credit\s+)?card/i,
  );
  if (mariBankPayment) return mariBankPayment[1].trim();

  // MariBank: "PayNow transfer to LONG BRIDGE SECURITIES PL(TRUST) (UEN ending 825D)"
  const payNowTransfer = text.match(
    /PayNow\s+transfer\s+to\s+(.+?)\s*(?:\(UEN|\(Mobile|\(NRIC|\.|\n|$)/i,
  );
  if (payNowTransfer) return payNowTransfer[1].trim();

  // OCBC: "to your card (-5964) at BUS/MRT SINGAPORE SG"
  const ocbcAtMatch = text.match(
    /to\s+your\s+card\s*\([^)]*\)\s+at\s+(.+?)(?:\.|\n|$)/i,
  );
  if (ocbcAtMatch) return ocbcAtMatch[1].trim();

  // DBS PayLah: "To: ka (Mobile ending 4733)"  — skip if it says "Your DBS" (that's us)
  const toLabelMatch = text.match(/To:\s+(.+?)(?:\n|$)/i);
  if (
    toLabelMatch &&
    !/your\s+dbs|your\s+posb|your\s+account/i.test(toLabelMatch[1])
  ) {
    return truncateAtBoilerplate(toLabelMatch[1].trim());
  }

  // "transferred/paid/sent S$X.XX to <name>" — optional amount between verb and "to"
  const transferMatch = text.match(
    /(?:transferred|paid|sent)\s+(?:(?:S\$|SGD\s*)[\d,.]+\s+)?to\s+([A-Za-z][A-Za-z0-9\s'.&/-]{1,60}?)(?=\s+(?:to\s+view|please|if\s+this|thank|on\s+your|on\s+\d|via\s)|\s*[.,\n\r])/i,
  );
  if (transferMatch) return truncateAtBoilerplate(transferMatch[1].trim());

  // "payment to <name>" (generic fallback)
  const paymentMatch = text.match(
    /payment\s+to\s+(.+?)(?:\s+on|\s+at|\s+via|\.|,|\n|$)/i,
  );
  if (paymentMatch) return truncateAtBoilerplate(paymentMatch[1].trim());

  // OCBC fallback: "charged...at MERCHANT"
  const chargedAtMatch = text.match(
    /charged\s+.+?\s+at\s+([A-Z][A-Z0-9\s/&'.,-]{2,50}?)(?:\.|\n|$)/i,
  );
  if (chargedAtMatch) return truncateAtBoilerplate(chargedAtMatch[1].trim());

  return "";
}

function extractDate(text) {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    if (/jan|feb|mar/i.test(match[2] || "")) {
      const day = match[1].padStart(2, "0");
      const mon = MONTH_MAP[match[2].toLowerCase().slice(0, 3)];
      return `${match[3]}-${mon}-${day}`;
    }
    if (match[1] && match[1].length === 4) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return "";
}

function extractTime(text) {
  const match = text.match(TIME_RE);
  return match ? match[1].trim() : "";
}

function extractAmount(text) {
  const match = text.match(AMOUNT_RE) || text.match(AMOUNT_FALLBACK_RE);
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ""));
}

// ─── Bank-specific detectors ───────────────────────────────────────────────

const BANK_PATTERNS = [
  {
    bank: "DBS",
    subjectRes: [
      /dbs.*transaction/i,
      /dbs.*alert/i,
      /dbs.*card/i,
      /dbs.*paylah/i,
      /posb.*transaction/i,
      /posb.*alert/i,
      /transaction\s+alert/i,
      /digibank\s+alert/i,
      /received\s+a\s+transfer/i,
    ],
    bodyRes: [
      /dbs\s+(?:visa|mastercard|card)/i,
      /paylah/i,
      /paylah!\s+(?:wallet|scan)/i,
      /dbs\s*bank/i,
      /dbs\/\s*posb/i,
    ],
  },
  {
    bank: "OCBC",
    subjectRes: [
      /ocbc.*transaction/i,
      /ocbc.*alert/i,
      /ocbc.*card/i,
      /card\s+transaction\s+alert/i,
    ],
    bodyRes: [/ocbc\s+(?:visa|mastercard|card|debit|myown)/i, /ocbc\s+app/i],
  },
  {
    bank: "UOB",
    subjectRes: [/uob.*transaction/i, /uob.*alert/i, /uob.*card/i],
    bodyRes: [/uob\s+(?:visa|mastercard|card)/i],
  },
  {
    bank: "MariBank",
    subjectRes: [
      /maribank/i,
      /your\s+payment\s+is\s+successful/i,
      /outgoing\s+paynow/i,
    ],
    bodyRes: [/maribank/i, /maribank\s+app/i],
  },
  {
    bank: "GrabPay",
    subjectRes: [/grab.*pay/i, /grab.*receipt/i, /grabfood/i],
    bodyRes: [/grabpay/i, /grab\s+payment/i],
  },
  {
    bank: "PayNow",
    subjectRes: [/paynow/i],
    bodyRes: [/paynow\s+transfer/i, /paynow\s+payment/i],
  },
];

function detectBank(subject, body, from) {
  for (const bp of BANK_PATTERNS) {
    if (bp.subjectRes.some((re) => re.test(subject))) return bp.bank;
    if (bp.bodyRes.some((re) => re.test(`${subject} ${body}`))) return bp.bank;
  }
  // Fallback: detect bank from sender email address
  return inferSourceFromSender(from) !== "Email"
    ? inferSourceFromSender(from)
    : null;
}

function detectDirection(subject, body) {
  const text = `${subject} ${body}`.toLowerCase();
  if (
    /(?:received|credited|refund|cashback|deposit|transfer(?:red)?\s+(?:to\s+you|in))/i.test(
      text,
    )
  ) {
    return "credit";
  }
  return "debit";
}

function isTransactionEmail(subject, body) {
  const text = `${subject} ${body}`.toLowerCase();
  const txKeywords = [
    "transaction",
    "payment",
    "purchase",
    "spent",
    "charged",
    "debited",
    "credited",
    "transfer",
    "receipt",
    "alert",
    "card ending",
    "card transaction",
    "received",
  ];
  const hasKeyword = txKeywords.some((kw) => text.includes(kw));
  const amount = extractAmount(`${subject} ${body}`);
  if (!hasKeyword)
    console.log("[EmailParser] ❌ No tx keyword found in:", subject);
  else if (amount === null)
    console.log(
      "[EmailParser] ❌ No amount found in:",
      subject,
      "| body snippet:",
      body.slice(0, 300),
    );
  return hasKeyword && amount !== null;
}

function inferSourceFromSender(from) {
  const lower = (from || "").toLowerCase();
  if (
    lower.includes("dbs") ||
    lower.includes("posb") ||
    lower.includes("paylah")
  )
    return "DBS";
  if (lower.includes("ocbc")) return "OCBC";
  if (lower.includes("uob")) return "UOB";
  if (lower.includes("maribank")) return "MariBank";
  if (lower.includes("grab")) return "GrabPay";
  if (lower.includes("apple")) return "Apple";
  if (lower.includes("citibank") || lower.includes("citi")) return "Citibank";
  if (lower.includes("hsbc")) return "HSBC";
  if (lower.includes("sc.com") || lower.includes("standardchartered"))
    return "Standard Chartered";
  return "Email";
}

function formatEmailDate(dateStr) {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function formatEmailTime(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-SG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

// ─── Main parser ───────────────────────────────────────────────────────────

/**
 * Parse a transaction email and return structured data.
 *
 * @param {{ id: string, subject: string, body: string, from: string, date: string }} email
 * @returns {object|null} Parsed transaction or null if not a tx email
 */
export function parseTransactionEmail(email) {
  const {
    id: emailId,
    subject = "",
    body = "",
    from = "",
    date: emailDate = "",
  } = email;
  const fullText = `${subject}\n${body}`;

  if (!isTransactionEmail(subject, body)) return null;

  const amount = extractAmount(fullText);
  if (amount === null || amount <= 0) return null;

  const bank = detectBank(subject, body, from);
  const direction = detectDirection(subject, body);
  const counterparty = extractCounterparty(body, direction);
  const merchant = extractMerchant(fullText);
  const category = inferCategory(counterparty || merchant || fullText);
  const date = extractDate(fullText) || formatEmailDate(emailDate);
  const time = extractTime(fullText) || formatEmailTime(emailDate);

  const accountRef = extractAccountRef(body);

  return {
    emailId,
    emailSubject: subject,
    emailFrom: from,
    emailDate,
    source: counterparty || merchant || "Unknown",
    merchant: bank || inferSourceFromSender(from),
    accountRef,
    dataSource: "gmail",
    amount: direction === "debit" ? -Math.abs(amount) : Math.abs(amount),
    date,
    time,
    category,
    currency: "SGD",
    description: subject,
    status: "pending",
  };
}
