# 🚨 DisasterResponse — Smart Resource Allocation Platform

> **Google Solutions Challenge 2026** · AI-powered disaster relief coordination for India

[![Live Demo](https://img.shields.io/badge/Live%20Demo-disaster--response--app--f17ab.web.app-red?style=for-the-badge&logo=firebase)](https://disaster-response-app-f17ab.web.app)
[![Built with Firebase](https://img.shields.io/badge/Built%20with-Firebase-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%20AI-blue?style=for-the-badge&logo=google)](https://ai.google.dev)

---

## 🌍 UN Sustainable Development Goals Addressed

This platform directly contributes to **4 UN SDGs**, solving real coordination failures in India's disaster response ecosystem.

---

### 🎯 SDG 11 — Sustainable Cities and Communities
> *"Make cities and human settlements inclusive, safe, resilient and sustainable"*

**Target 11.5** — Reduce the number of people affected by disasters and substantially decrease direct economic losses relative to GDP caused by disasters.

**How we solve it:**
- Real-time urgency scoring ensures the most critical community needs are addressed first — not the ones reported loudest
- Needs map plots all active disaster zones across India so coordinators see the full picture instantly
- Seasonal forecasting alerts NGOs before monsoon/summer disasters hit, enabling pre-positioning of volunteers
- Every need is tracked from report → task → resolution, creating accountability in relief operations

---

### 🎯 SDG 3 — Good Health and Well-Being
> *"Ensure healthy lives and promote well-being for all at all ages"*

**Target 3.d** — Strengthen the capacity of all countries for early warning, risk reduction and management of national and global health risks.

**How we solve it:**
- Medical category gets the highest urgency weight (15/15) in the scoring algorithm — medical needs always surface to the top
- NLP classifier auto-detects medical emergencies from free-text descriptions (cholera, dengue, vaccination, injury keywords)
- Post-monsoon forecast specifically flags disease outbreak risk (malaria, dengue, leptospirosis) with recommended actions
- Volunteers with Medical and First Aid skills are prioritized in matching for health-related tasks

---

### 🎯 SDG 10 — Reduced Inequalities
> *"Reduce inequality within and among countries"*

**Target 10.2** — Empower and promote the social, economic and political inclusion of all, irrespective of age, sex, disability, race, ethnicity, origin, religion or economic status.

**How we solve it:**
- Platform covers 40+ cities across all Indian states — not limited to urban or well-resourced areas
- Volunteer matching uses proximity scoring so rural and remote communities get volunteers from nearby, not just major cities
- CSV bulk import allows NGOs to report needs for communities without digital access
- Reliability scoring rewards consistent volunteers regardless of background, creating equal opportunity for recognition

---

### 🎯 SDG 17 — Partnerships for the Goals
> *"Strengthen the means of implementation and revitalize the global partnership for sustainable development"*

**Target 17.17** — Encourage and promote effective public, public-private and civil society partnerships.

**How we solve it:**
- Multi-session architecture allows multiple NGO coordinators to work simultaneously on the same platform
- Leaderboard creates healthy competition and recognition among volunteer organizations
- Analytics dashboard provides donor-ready reports: completion rates, volunteer hours, areas covered
- Open platform — any NGO across India can register and start coordinating within minutes, zero infrastructure cost

---

## 📊 SDG Impact Summary

| SDG | Target | Feature |
|-----|--------|---------|
| 🏙️ SDG 11 — Sustainable Cities | 11.5 Disaster resilience | Urgency scoring · Needs map · Seasonal forecast |
| 🏥 SDG 3 — Good Health | 3.d Health risk management | Medical priority scoring · NLP detection · Disease outbreak forecast |
| ⚖️ SDG 10 — Reduced Inequalities | 10.2 Social inclusion | India-wide coverage · Proximity matching · CSV import |
| 🤝 SDG 17 — Partnerships | 17.17 Civil society partnerships | Multi-session · Analytics · Leaderboard |

---

## 🚀 What This Platform Does

When disasters strike in India — floods, earthquakes, droughts — NGOs waste hours coordinating volunteers over WhatsApp and Excel. This platform replaces that chaos with AI.

**Coordinators** report needs → AI scores urgency → AI matches volunteers → one-click assignment → real-time tracking

**Volunteers** receive tasks → accept/decline → track progress → build a verified impact record

---

## ✨ Key Features

### For Coordinators
| Feature | Description |
|---------|-------------|
| 🤖 AI Urgency Scoring | Every need scored 0–100 with full explainable breakdown |
| 🧠 NLP Auto-Classification | Detects disaster category from free-text description |
| 👥 AI Volunteer Matching | Ranks volunteers by skill + proximity + reliability + availability |
| 🗺️ India Needs Map | Leaflet map with color-coded urgency markers across all India |
| 🔮 Seasonal Forecasting | Predicts high-risk categories by season (Monsoon/Summer/Winter) |
| 📊 Analytics Dashboard | Completion rates, category breakdowns, volunteer engagement |
| 🏆 Leaderboard | Top volunteers ranked by tasks and reliability |
| 📂 CSV Bulk Import | Upload multiple needs at once |
| ✅ Mark as Resolved | Close needs when addressed |

### For Volunteers
| Feature | Description |
|---------|-------------|
| 📋 Task Management | Accept/decline tasks with race-condition-safe transactions |
| 🛣️ Route Optimizer | Nearest-neighbor algorithm for optimal multi-task routing |
| 🏆 Impact Dashboard | Tasks done, hours given, communities served, achievement badges |
| 🗺️ Needs Map | See all active needs across India |
| ⭐ Reliability Score | Auto-recalculates on every task completion |

### AI & Intelligence
| Feature | Description |
|---------|-------------|
| 🤖 Gemini AI Chatbot | Context-aware assistant with live Firestore data injection |
| 📈 Urgency Formula | Volume(35) + Severity(30) + Recency(20) + Category(15) |
| 🔍 NLP Classifier | 20+ keywords per category, real-time detection |
| 🧮 Match Algorithm | Haversine distance + skill ratio + reliability + availability |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Database | Firebase Firestore (real-time) |
| Auth | Firebase Authentication |
| Backend | Firebase Cloud Functions (Node.js 20) |
| Notifications | Firebase Cloud Messaging (FCM) |
| AI Chat | Gemini 2.0 Flash Lite |
| Maps | Leaflet.js + OpenStreetMap |
| Hosting | Firebase Hosting |

---

## 🏃 Quick Start

### 1. Clone and install
```bash
git clone https://github.com/srushtiubale05/disaster-response-platform.git
cd disaster-response-platform
cd frontend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in your Firebase config and Gemini API key
```

### 3. Run locally
```bash
npm run dev   # http://localhost:3000
```

### 4. Seed demo data
```bash
cd ../backend/functions
npm install
node seed.js --project your-firebase-project-id
```

### 5. Deploy
```bash
cd ../..
npm run build   # from frontend/
firebase deploy --only hosting,firestore
```

---

## 🧮 Scoring Algorithms

### Urgency Score (0–100)
| Component | Max | Formula |
|-----------|-----|---------|
| Volume | 35 | `min(reportedCount/30, 1) × 35` |
| Severity | 30 | low=0, medium=10, high=22, critical=30 |
| Recency | 20 | `max(0, 20 − daysOld × 2)` |
| Category | 15 | medical=15, shelter=12, food=10, water=8, edu=6, general=3 |

### Volunteer Match Score (0–100)
| Component | Max | Formula |
|-----------|-----|---------|
| Skill match | 50 | `(matched/required) × 50` |
| Proximity | 25 | `max(0, 25 − distKm × 2.5)` |
| Reliability | 15 | `(reliabilityScore/100) × 15` |
| Availability | 10 | 10 if scheduledDay in volunteer.availability |

---

## 👥 User Roles

**Coordinator** — NGO program manager who reports needs, creates tasks, assigns volunteers, monitors progress

**Volunteer** — Field worker who accepts tasks, executes relief operations, builds a verified impact record

---

## 📁 Project Structure

```
disaster-response-web/
├── frontend/               # React + TypeScript app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── coordinator/    # Dashboard, Needs, Tasks, Map, Forecast, Analytics
│   │   │   └── volunteer/      # Tasks, Route, Impact, Profile
│   │   ├── components/         # Shared UI components + Gemini chat
│   │   ├── services/           # Firebase, Firestore, Gemini API
│   │   ├── hooks/              # Real-time data hooks
│   │   └── utils/              # ML engine, formatters, constants
├── backend/
│   └── functions/          # Firebase Cloud Functions
│       ├── index.js        # Triggers: scoring, matching, FCM, reliability
│       ├── scoring.js      # Urgency scoring algorithm
│       ├── matching.js     # Volunteer matching algorithm
│       ├── nlp.js          # NLP category classifier
│       └── seed.js         # Demo data seeder
├── firebase.json
├── firestore.rules
└── firestore.indexes.json
```

---

## 🌐 Live Demo

**URL:** https://disaster-response-app-f17ab.web.app

**Demo accounts** (after running seed script):
- Register as **Coordinator** to manage needs and assign volunteers
- Register as **Volunteer** to accept tasks and track impact

---

*Built for Google Solutions Challenge 2026 · Team from Cummins College of Engineering, Pune*
