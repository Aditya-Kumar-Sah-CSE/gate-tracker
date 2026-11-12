# GATE TRACK 90: Architecture & Technical Project Analysis
**Target:** GATE CSE 2027 Preparation Companion  
**Platform:** Android (Offline-First React Native + Expo + Expo Router + SQLite)  
**Philosophy:** STUDY → REVISE → PRACTICE → ANALYSE → IMPROVE  

---

## 1. Executive Summary & Objective

GATE TRACK 90 is an uncompromising, distraction-free, zero-bloat personal mobile operating system for serious GATE CSE aspirants. It eliminates ambiguity from the 90-day preparation cycle through strict accountability, measurable data, automated spaced repetition (R1 to R5), comprehensive PYQ error taxonomy, and dynamic roadmap adaptability.

The app operates 100% locally on Android without internet connectivity, external accounts, authentication servers, cloud telemetry, or paid services. All states, metrics, timestamps, and mistake logs are persisted in a normalized SQLite database.

---

## 2. Technical Stack Specification

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | React Native (Expo SDK 52/53) | Android-first native runtime |
| **Language** | TypeScript (Strict mode) | Type safety, verifiable domain contracts |
| **Routing** | Expo Router (v4 / File-based) | Deep linking, declarative tabs, typed navigation |
| **Persistence** | `expo-sqlite` (next-gen SQLite API) | Normalized relational storage, indexes, migrations |
| **State Store** | `zustand` | Lightweight reactive UI state, active timer management |
| **Animations** | `react-native-reanimated` | 60fps progress arcs, modal sheets, haptic feedback |
| **Vector Graphics** | `react-native-svg` | Precision circular progress rings, weekly distribution charts |
| **Notifications** | `expo-notifications` | Scheduled local daily alarms (morning, revision, evening) |
| **File Export** | `expo-file-system` & `expo-sharing` | Offline JSON database export and backup restore |

---

## 3. Core Architecture & Modules

### 3.1. Onboarding & Dynamic 90-Day Schedule Engine
- **First Launch Wizard:** Collects prep start date, target exam date (e.g. Feb 2027), daily study target (hours), daily lecture count, daily PYQ count, weekly buffer preference, and weakest subject priorities.
- **Dynamic Scheduler:** Calculates Day $X \in [1, 90]$ relative to the start date. Computes remaining days to the target GATE CSE exam.
- **Buffer Shifting:** Missed or pending tasks can be shifted forward to designated buffer days or tomorrow with full audit trail retention (no silent deletions).

### 3.2. 90-Day GATE CSE Roadmap Engine
- **12-Week Structured Curriculum:** Pre-loaded with all 11 core GATE CSE subjects plus daily General Aptitude.
- **Curriculum Tree:** Subject $\rightarrow$ Topics $\rightarrow$ Subtopics $\rightarrow$ PW Lecture Units $\rightarrow$ PYQ banks.
- **Customizability:** Users can reorder subject sequences, append custom subtopics, customize lecture counts, and flag weak topics.

### 3.3. Linear / Apple Health Inspired Dashboard
- **Header:** Day $X/90$, Live countdown to GATE 2027, today's Gregorian date.
- **Ring Indicators:** Overall syllabus completion %, Today's target completion %, Study hours logged today.
- **Today's Targets:** Direct action cards for PW Lectures, Revisions Due, PYQ Practice, PYQ Mistake Analysis, and General Aptitude.
- **Streaks & Charts:** Authentic streak counter (no fake gamification) and 7-day study distribution.

### 3.4. Daily Study Planner & Execution Engine
- Four distinct task categories:
  1. **PW Lectures:** Subject, Topic, Lecture #, Title, Duration, PW URL (clickable via linking), status, actual duration.
  2. **Revision:** Spaced intervals R1–R5, scheduled date, elapsed revision counter.
  3. **PYQ Practice:** Target vs Attempted, Correct, Incorrect, Unattempted.
  4. **PYQ Analysis:** Mistake classification, root cause documentation, resolution flag.
- Integrated Study Session Timer: Start, Pause, Resume, Stop with SQLite session persistence and background safety.

### 3.5. Smart Spaced Repetition (Revision R1–R5)
- Automated trigger: Whenever a topic is marked as mastered/completed, schedules:
  - $R_1$: $+1$ day
  - $R_2$: $+3$ days
  - $R_3$: $+7$ days
  - $R_4$: $+15$ days
  - $R_5$: $+30$ days
- Three smart triage bins: **Due Today**, **Upcoming**, **Overdue**.
- Full history preservation: Can reschedule or skip with reason; historical reviews are permanently logged in `revision_history`.

### 3.6. Scientific PYQ Performance & Error Taxonomy
- Question-level telemetry: GATE Year, Subject, Topic, Question #, Marks (1 or 2), Difficulty (Easy / Medium / Hard), Accuracy (Correct / Incorrect), Elapsed seconds.
- **5-Point Mistake Classification:**
  1. *Conceptual mistake*
  2. *Calculation mistake*
  3. *Silly mistake*
  4. *Question misunderstood*
  5. *Time management issue*
- **Weak Topic Detection Algorithm:**
  - $\text{Accuracy} < 50\%$: **Critical** (Red status)
  - $50\% \le \text{Accuracy} \le 70\%$: **Needs Improvement** (Amber status)
  - $\text{Accuracy} > 70\%$: **Improving** (Green status)
- Highlights the Top 5 Critical Topics on Dashboard and PYQ screen for targeted remediation.

### 3.7. Offline Backup, Restore & Data Portability
- Single-tap full JSON export of all relational tables.
- Strict schema validation and schema version checks during import.
- Confirmation modal before database overwrite.
- Graceful handling of corrupted or truncated JSON backup payloads.

---

## 4. UI/UX Design System Guidelines

- **Palette:** Dark OLED Background (`#090A0F`), Surface Card (`#13161F`), Border Accent (`#1E2333`), Primary Cyan (`#38BDF8`), Success Emerald (`#10B981`), Warning Amber (`#F59E0B`), Danger Rose (`#F43F5E`), Text Primary (`#F8FAFC`), Text Muted (`#94A3B8`).
- **Typography:** System Sans-Serif with Tabular Numerals for countdowns, timers, and accuracy metrics.
- **Haptics & Micro-interactions:** Smooth visual transitions, progress arcs using SVG paths, clean modal sheets for task logging.

