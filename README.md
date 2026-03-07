# 🚀 DeFi Wealth Hub

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_AI-f3f4f6?style=for-the-badge&logoColor=f97316)
![InternVL](https://img.shields.io/badge/InternVL-000000?style=for-the-badge&logoColor=white)

## 👨‍💻 The Team

Designed and developed by students from Nanyang Technological University (NTU):

| Name | Major | GitHub |
| :--- | :--- | :--- |
| **Nicholas** | Computer Science | [@nicolotan](https://github.com/nicolotan) |
| **Izzan** | Computer Science | [@zanceballos](https://github.com/zanceballos) |
| **Kang** | Computer Science | [@lowkangxuan](https://github.com/lowkangxuan) |
| **Li Zhong** | Electrical & Electronic Engineering | [@Shoterz](https://github.com/Shoterz) |
| **Zheng Rong** | Computer Engineering | [@Caspian616](https://github.com/Caspian616) |

---

A privacy-first AI financial cockpit that helps users **upload, parse, understand, and act on their financial data** across banking, crypto, and investments. 

DeFi Wealth Hub turns fragmented statements into a unified dashboard featuring wealth insights, budgeting signals, wellness scoring, AI advisory, and transparent data privacy controls.

---

## 💡 The Problem vs. Our Solution

**The Problem:** Personal finance data is fragmented. Users juggle bank statements, crypto exchange reports, and investment summaries across multiple platforms. Most existing tools force users to hand over sensitive login credentials or focus narrowly on either *just* budgeting or *just* wealth tracking. 

**The DeFi Wealth Hub Approach:**
Instead of forcing direct bank connections, we built a system around **deliberate, user-controlled ingestion**. 
* **Manual uploads** for maximum flexibility and security.
* **Structured, human-in-the-loop parsing** for clarity and accuracy.
* **AI-generated advisory insights** for actionable next steps.
* **Privacy visibility** so you always know exactly what data is stored and how it is used.

---

## ✨ Core Features

### 📊 Unified Multi-Asset Dashboard
Get a consolidated view of your financial life bridging traditional finance and web3.
* **Net Worth & Wellness:** Track your net worth history and overall financial wellness score.
* **Asset Allocation:** Understand your wealth distribution across Cash, Bonds, Stocks, Crypto, Property, and Tokenised assets.
* **Explainable Metrics:** Hover-based breakdowns ensure you always know exactly how your financial metrics are derived.

*(Tip: Add a screenshot of your dashboard here!)* - TO DO A GIF OF DEMO

### 🧠 LLM-Powered AI Advisory
An intelligent layer that converts raw financial data into practical guidance.
* **Personalized Insights:** Risk-aware recommendations grounded in your specific risk profile, income, and expense patterns.
* **Behavioral Analysis:** Spending behavior insights and asset exposure observations.

### 📑 Statement Ingestion & Review
A robust document ingestion workflow that keeps the human in the loop.
* **Flexible Uploads:** Ingest bank, broker, crypto, and expense statements.
* **Smart Parsing:** Extract and structure rows into categorized financial data.
* **Review & Control:** Approve, reject, edit, or skip parsed rows before they impact your analytics.

*(Tip: Add a flowchart or screenshot of your parsing workflow here!)* DO A GIF OF DEMO

### 💰 Budgeting & Wallet Tracking
Turn parsed records into practical signals.
* Track monthly budget and emergency savings progress.
* View category-based spending, inflow vs. outflow, and historical trends.
* Monitor platform-level exposure and risk labels (Core, Stable, Growth, Speculative).

### 🔒 Privacy-First Transparency
Trust is our core feature. Our dedicated Privacy Hub shows users exactly what data they uploaded, which institutions are represented, what was parsed, and what is currently being used for analytics.

---

## 🛠️ Tech Stack

* **Frontend:** React, Vite, Tailwind CSS  
* **Backend & Database:** Firebase Authentication, Cloud Firestore, Firebase Storage  
* **Intelligence Layer:** LLM-powered parsing, structured post-processing, and AI advisory workflows  

---

## 🚀 Getting Started

To run DeFi Wealth Hub locally, follow these steps:

```bash
# Clone the repository
git clone <your-repo-url>

# Navigate into the project directory
cd <your-project>

# Install dependencies
npm install

# Start the development server
npm run dev
