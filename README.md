# Disaster Response Web App

React + TypeScript + TailwindCSS + Firebase + Node.js Cloud Functions

---

## Quick Start

### 1. Add a Web App in Firebase Console
- Go to console.firebase.google.com → your project
- Add app → Web → register it
- Copy the `appId` (looks like `1:983183392201:web:xxxxxxxx`)
- Paste it into `frontend/.env` as `VITE_FIREBASE_APP_ID`

### 2. Frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

### 3. Backend (Cloud Functions)
```bash
cd backend/functions
npm install

# Deploy functions
firebase deploy --only functions

# Or run locally with emulator
firebase emulators:start
```

### 4. Deploy Firestore indexes + rules
```bash
firebase deploy --only firestore
```

### 5. Seed mock data
```bash
cd backend/functions
node seed.js --project disaster-response-app-f17ab
```

### 6. Deploy frontend
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

---

## Demo Flow

**Coordinator (Tab 1):**
1. Register as Coordinator → login
2. Report Need → Hadapsar, Medical, Critical, 28 reports
3. Cloud Function auto-scores it ~81/100
4. Click "View & Create Task" → fill details → "Create & Find Volunteers"
5. See top 5 AI-matched volunteers with score breakdowns
6. Select top 2 → Assign → FCM notifications sent

**Volunteer (Tab 2 / another browser):**
1. Register as Volunteer → select Medical/First Aid skills
2. See task appear in dashboard in real-time
3. Click task → Accept (transactional, race-condition safe)
4. Coordinator sees status update live
5. Mark In Progress → Mark Completed
6. Reliability score recalculates via Cloud Function

---

## Scoring Algorithms

### Urgency Score (0-100)
| Component | Max | Formula |
|-----------|-----|---------|
| Volume    | 35  | `min(reportedCount/30, 1) × 35` |
| Severity  | 30  | low=0, medium=10, high=22, critical=30 |
| Recency   | 20  | `max(0, 20 - daysOld × 2)` |
| Category  | 15  | medical=15, shelter=12, food=10, water=8, edu=6, general=3 |

### Volunteer Match Score (0-100)
| Component   | Max | Formula |
|-------------|-----|---------|
| Skill match | 50  | `(matched/required) × 50` |
| Proximity   | 25  | `max(0, 25 - distKm × 2.5)` |
| Reliability | 15  | `(reliabilityScore/100) × 15` |
| Availability| 10  | 10 if scheduledDay in volunteer.availability |
