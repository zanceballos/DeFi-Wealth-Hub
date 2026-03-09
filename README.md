# 🚀 DeFi Wealth Hub

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_7-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Firebase](https://img.shields.io/badge/Firebase_12-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_AI-f3f4f6?style=for-the-badge&logoColor=f97316)
![InternVL](https://img.shields.io/badge/InternVL-000000?style=for-the-badge&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22b5bf?style=for-the-badge&logoColor=white)

> **A privacy-first AI financial cockpit** — upload statements or sync Gmail to parse, track, and act on your finances without sharing bank credentials.

## 💡 What It Does

DeFi Wealth Hub unifies banking, crypto, and investment data into one dashboard through **two zero-credential ingestion channels**:

| Channel | How It Works |
|---------|-------------|
| **📄 Manual Upload + InternVL AI** | Upload PDF/CSV bank statements → InternVL vision model extracts transactions → human review overlay for accuracy |
| **📧 Gmail Sync + Auto-Parse** | OAuth-connect Gmail → auto-detect transaction alert emails (DBS, OCBC, UOB, GrabPay, etc.) → deduplicated and categorised |

Both channels feed a unified Firestore-backed dashboard with net-worth tracking, asset allocation charts, AI-powered financial advisory (Groq / Llama 3.3 70B), smart budgeting, live crypto prices via yfinance, and a privacy hub for full data control.

## 🛠 Tech Stack

React 19 · Vite 7 · Firebase 12 (Auth + Firestore + Storage + Hosting) · Tailwind CSS 4 · Groq AI · InternVL · yfinance · Recharts

## 👨‍💻 Team

Nicholas · Izzan · Kang · Li Zhong · Zheng Rong — NTU

## 📚 Documentation

- **Live Docs:** [defi-wealth-hub.web.app/docs](https://defi-wealth-hub.web.app/docs)
- **Full Reference:** [docs/full-documentation.md](docs/full-documentation.md)
