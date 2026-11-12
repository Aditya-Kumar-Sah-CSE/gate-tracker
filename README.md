# GATE TRACK 90 🎯
### A Minimal, Premium Android Study Planner for GATE CSE 2027
**Dedicated Companion for Physics Wallah: Parakram GATE 2027 Batch B - (Hinglish) - Computer Science**

---

## 1. Overview & Objective

**GATE TRACK 90** is a distraction-free, 100% offline-first Android mobile application engineered for rigorous, measurable GATE CSE preparation. Built on the core methodology:

$$\text{STUDY} \longrightarrow \text{REVISE} \longrightarrow \text{PRACTICE} \longrightarrow \text{ANALYSE} \longrightarrow \text{IMPROVE}$$

The app eliminates ambiguity through real SQLite persistence, zero fake analytics, automated spaced repetition (R1 to R5), 5-category error taxonomy, and dedicated Physics Wallah course tracking.

---

## 2. Physics Wallah Batch Structure (Parakram 2027 Batch B)

The application comes pre-configured with the actual course distribution:

| Subject | Confirmed PW Lectures | Confirmed PW DPP | Status |
| :--- | :---: | :---: | :---: |
| **General Aptitude (GA)** | **18** | **19** | **Confirmed** |
| **Theory of Computation (TOC)** | **29** | **5** | **Confirmed** |
| **C Programming** | **22** | **11** | **Confirmed** |
| **Discrete Mathematics** | **48** | **6** | **Confirmed** |
| **Data Structures & Algorithms** | 30 | Unset | *Estimated* |
| **DBMS** | 30 | Unset | *Estimated* |
| **Operating Systems** | 30 | Unset | *Estimated* |
| **Computer Networks** | 30 | Unset | *Estimated* |
| **Digital Logic** | 30 | Unset | *Estimated* |
| **Computer Organization & Architecture** | 30 | Unset | *Estimated* |
| **Compiler Design** | 30 | Unset | *Estimated* |
| **Engineering Mathematics** | 30 | Unset | *Estimated* |
| **Linear Algebra** | 30 | Unset | *Estimated* |
| **Probability & Statistics** | 30 | Unset | *Estimated* |
| **Calculus & Optimization** | 30 | Unset | *Estimated* |
| **Basics of Computer Systems** | 30 | Unset | *Estimated* |
| **Fundamental of C Language** | 30 | Unset | *Estimated* |

> [!NOTE]
> **PW API Notice:** Physics Wallah does not provide an open public API for third-party client apps. Enrolled batch content requires private credentials and tokens governed by PW terms of service. **GATE TRACK 90** respects your privacy and platform policies by operating completely offline—pre-configured with confirmed counts, 1-click web launcher, and instant manual result logging.

---

## 3. Daily Fixed Targets

1. **PW Lectures:** 5 lectures daily
2. **PW DPP:** 2–3 practice sheets daily
3. **GATE PYQs:** 20 questions daily
4. **Spaced Revision:** 60 minutes daily
5. **Focused Study Time:** 8 hours daily

All targets can be adjusted anytime via **Settings**.

---

## 4. Key Functional Modules

### 4.1. Dashboard (`app/(tabs)/index.tsx`)
- Day $X/90$ and Live countdown to GATE CSE 2027.
- **5 Separate Real Progress Indicators:**
  - PW Lecture Completion (`completed / total` with Confirmed vs Estimated breakdown)
  - DPP Completion (`completed / 41 confirmed`)
  - PYQ Practice (`today attempted / 20` and genuine accuracy)
  - Revision Adherence (`completed / due today`)
  - Total Study Hours (`today logged / 8h`)
- Top 5 Critical Weak Topics ($\text{Accuracy} < 50\%$).
- 7-Day Study Hours Distribution SVG Bar Chart.
- Integrated Study Session Timer.

### 4.2. 12-Week Roadmap (`app/(tabs)/roadmap.tsx`)
- Comprehensive syllabus tree with topics, subtopics, and PW lectures.
- Visual distinction: `CONFIRMED` vs `ESTIMATED` badges.
- In-place editor for updating actual lecture and DPP counts as new content drops.
- Custom topic and subtopic creation.

### 4.3. Daily Study Planner (`app/(tabs)/planner.tsx`)
- Date Navigator with historical audit trail.
- Automatically distributes the next 5 lectures, DPPs, and 20 PYQs.
- **Shift Incomplete Tasks:** Moves pending items forward without overwriting history.
- Direct PW URL launcher.

### 4.4. GATE PYQ Tracker & Error Taxonomy (`app/(tabs)/pyq.tsx`)
- Log question attempts: Year, Subject, Topic, Question #, Marks (1 or 2), Difficulty, Correct/Incorrect, Time Taken.
- **5-Point Mistake Classification:**
  1. *Conceptual mistake*
  2. *Calculation mistake*
  3. *Silly mistake*
  4. *Question misunderstood*
  5. *Time management issue*
- Weak Topic Detection ($<50\%$ Critical, $50\text{--}70\%$ Needs Improvement, $>70\%$ Improving).
- Interactive mistake resolution checklist.

### 4.5. Progress Analytics (`app/(tabs)/analytics.tsx`)
- Filters: 7 Days, 30 Days, 90 Days.
- Real SQLite records: Daily study hours, accuracy by difficulty, mistake distribution breakdown, subject mastery matrix.

### 4.6. Offline Backup & Restore
- Full JSON export of relational database to Android storage or native Share sheet.
- Validates backup integrity and confirms before atomic restore.

---

## 5. Technology Stack

- **Framework:** React Native (Expo SDK 58)
- **Language:** TypeScript (Strict mode, 0 errors)
- **Navigation:** Expo Router (File-based tabs and modals)
- **Database:** `expo-sqlite` (Normalized tables, indexes, transactions, migrations)
- **State Management:** `zustand`
- **Charts & Vectors:** `react-native-svg`
- **Notifications:** `expo-notifications` (Local morning, revision, and evening alarms)

---

## 6. How to Run & Build APK

### 6.1. Running Locally (Development)
```bash
# 1. Start the Expo development server
npm start

# 2. Run on Android device or emulator
npm run android
```

### 6.2. Building Standalone Android APK (EAS Build)
```bash
# 1. Install EAS CLI globally if not already installed
npm install -g eas-cli

# 2. Log in to your Expo account
eas login

# 3. Configure and trigger the standalone APK build
eas build --platform android --profile preview
```
Once the build completes on EAS cloud, download the `.apk` file directly to your Android device and install!

### 6.3. Building Locally with Android SDK
```bash
# Generate native Android project
npx expo run:android --variant release
```
The output APK will be generated at:
`android/app/build/outputs/apk/release/app-release.apk`
