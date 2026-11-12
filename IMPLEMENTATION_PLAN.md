# GATE TRACK 90: Master Implementation Plan

## Overview
This document outlines the systematic, phased implementation strategy for the **GATE TRACK 90** Android application. Every step adheres to offline-first principles, zero mock data, resilient SQLite persistence, and a modern, high-contrast minimal productivity aesthetic.

---

## Phase Breakdown

### Phase 1: Project Initialization & Dependency Configuration
- Initialize Expo SDK app with TypeScript and Expo Router.
- Install verified production dependencies:
  - `expo-sqlite`
  - `zustand`
  - `react-native-reanimated`
  - `react-native-svg`
  - `expo-notifications`
  - `expo-file-system`
  - `expo-sharing`
  - `expo-haptics`
  - `lucide-react-native` or `@expo/vector-icons`
- Configure `app.json` for Android package, splash screen, icons, permissions, and build settings for EAS.
- Establish clean directory hierarchy:
  - `app/` (Expo Router routes and tabs)
  - `src/db/` (SQLite initialization, schema, migrations, seed data)
  - `src/stores/` (Zustand state slices: settings, timer, tasks, pyq)
  - `src/services/` (Notification scheduler, backup export/import, spaced repetition math)
  - `src/components/` (Design system atoms, SVG charts, progress rings, modal sheets)
  - `src/types/` (Domain TypeScript contracts)
  - `src/constants/` (Theme tokens, syllabus defaults, mistake categories)

---

### Phase 2: SQLite Schema, Migrations & Complete GATE CSE Syllabus Seed
- Implement `src/db/schema.ts` defining normalized tables:
  1. `app_settings`
  2. `subjects`
  3. `topics`
  4. `lectures`
  5. `daily_goals`
  6. `daily_tasks`
  7. `revision_schedules`
  8. `revision_history`
  9. `pyq_attempts`
  10. `mistake_logs`
  11. `study_sessions`
  12. `daily_progress`
- Implement versioned database migrations in `src/db/migrations.ts`.
- Pre-populate complete default GATE CSE 2027 curriculum:
  - Week 1: Data Structures
  - Week 2: Engineering Mathematics
  - Week 3: DBMS
  - Week 4: Operating Systems
  - Week 5: Computer Networks
  - Week 6: Theory of Computation
  - Week 7: Discrete Mathematics
  - Week 8: Algorithms
  - Week 9: Computer Organization and Architecture
  - Week 10: Compiler Design
  - Week 11: Mixed Subject Practice & Weak Topic Remediation
  - Week 12: Full Revision & Mock Tests
  - Daily: General Aptitude (Verbal, Quantitative, Analytical, Spatial)
- Provide transaction safety and foreign key constraints enforcement (`PRAGMA foreign_keys = ON;`).

---

### Phase 3: Domain State & Business Logic Layer
- **Settings Store (`src/stores/settingsStore.ts`):** Onboarding state, study targets, weak subject preferences, dark/light theme, notification preferences.
- **Timer Store (`src/stores/timerStore.ts`):** Real-time study stopwatch/countdown, elapsed study tracking, background resumption without timer drift, persistence to SQLite on stop.
- **Planner Store (`src/stores/plannerStore.ts`):** Selected date, active tasks, completion toggles, task rescheduling/shifting engine.
- **Revision Store (`src/stores/revisionStore.ts`):** R1–R5 automation triggered upon lecture/topic mastery, triage calculations (Due Today, Upcoming, Overdue).
- **PYQ Store (`src/stores/pyqStore.ts`):** Attempt logs, real-time accuracy formulas, weak topic detection ($<50\%$ critical, $50\text{--}70\%$ needs improvement, $>70\%$ improving).

---

### Phase 4: Premium Minimal Design System & Reusable Components
- Deep OLED dark mode (`#0B0D13`) & crisp light mode (`#F8FAFC`).
- Custom SVG Circular Progress Rings with animated stroke offsets.
- Custom SVG 7-Day / 30-Day Bar Charts & Accuracy Sparklines.
- Metric Cards, Status Badges, Segmented Controls, and Sheet Modals.
- Empty states with clear call-to-actions.

---

### Phase 5: Onboarding & First-Launch Experience
- Multi-step or sleek unified wizard:
  1. Target Dates (Start date, Target Exam date).
  2. Daily Targets (Study hours, lectures, PYQs, revisions, aptitude).
  3. Focus & Weak Subject priorities.
- Generates the dynamic 90-day calendar and populates initial goal states.
- Seamless transition to Dashboard with zero page reload.

---

### Phase 6: Dashboard Screen (`app/(tabs)/index.tsx`)
- Top Header: App title, Today's Date, Day $X/90$, Live countdown badge.
- Overall Syllabus % and Today's Target % Progress Rings.
- Today's Targets Summary Cards: Lectures, Revisions, PYQs, Mistake Analysis, Aptitude.
- 7-Day Study Time Bar Chart.
- Top Weak Topics Widget (Actionable remediation).
- Upcoming Revisions Preview.
- Floating Study Timer trigger.

---

### Phase 7: 90-Day Roadmap Screen (`app/(tabs)/roadmap.tsx`)
- 12-Week Interactive Accordion with week-by-week subject progression.
- Subject Detail View: Topics, Subtopics, PW Lecture counts, Completion status, Revision indicators, PYQ accuracy.
- Custom topic creator & lecture count adjuster.
- Subject re-ordering capability.

---

### Phase 8: Daily Study Planner Screen (`app/(tabs)/planner.tsx`)
- Date Navigator (Past, Today, Future).
- 4 Functional Tabbed / Grouped Sections:
  1. **PW Lectures:** Add/Edit/Complete lectures, duration tracker, optional PW URL launcher.
  2. **Revision:** R1–R5 entries due for the date.
  3. **PYQ Practice:** Rapid session counter (Target vs Attempted, Correct, Incorrect).
  4. **PYQ Analysis:** Mistake taxonomy logger and resolver.
- "Shift Incomplete Tasks" utility: Moves uncompleted tasks forward to tomorrow or buffer day with audit logging.

---

### Phase 9: Smart Revision Tracker Modal/Screen
- Spaced Repetition Manager:
  - R1 (+1d), R2 (+3d), R3 (+7d), R4 (+15d), R5 (+30d).
- Filter Tabs: Due Today, Upcoming (Next 7/14 days), Overdue.
- Actions: Mark Revised, Reschedule to Date, Skip with Reason.
- Revision History modal showing review logs.

---

### Phase 10: PYQ Performance & Error Taxonomy Screen (`app/(tabs)/pyq.tsx`)
- Log individual or bulk question attempts: GATE Year, Subject, Topic, Question #, Marks, Difficulty, Result, Time Spent, Mistake Category.
- Filter and search attempts by Subject, Year, Difficulty, and Mistake Type.
- Weak Topic Detection dashboard with configurable threshold tags.
- Detailed Mistake Resolution log.

---

### Phase 11: Progress Analytics Screen (`app/(tabs)/analytics.tsx`)
- Time Range Filters: 7 Days, 30 Days, 90 Days.
- Analytics charts derived from raw SQLite records:
  - Daily Study Hours distribution.
  - Weekly Syllabus Completion trend.
  - Subject-wise Coverage & Mastery.
  - Accuracy by Difficulty and Year.
  - Mistake Category Pie/Bar breakdown.
- Preparation Health Scorecard.

---

### Phase 12: Integrated Study Timer
- Modal / Collapsible floating study companion.
- Subject & Task binding.
- Pause / Resume / Stop controls.
- Background persistence preventing loss on process termination.
- Auto-logs completed duration into `study_sessions` and `daily_progress`.

---

### Phase 13: Local Notifications & Reminders
- Daily Morning Study Reminder (e.g., 07:00 AM).
- Revision Due Alert (e.g., 02:00 PM).
- Daily Target Check (e.g., 06:00 PM).
- Evening Progress & Log Review (e.g., 10:00 PM).
- Configurable notification preferences in Settings.

---

### Phase 14: Settings & Data Backup / Restore
- Comprehensive settings interface:
  - Edit 90-day targets, exam date, daily goals.
  - Re-assign weak subject priorities.
  - Toggle light/dark theme.
  - Configure notification schedules.
- Backup & Restore:
  - **Export to JSON:** Generates sanitized JSON file and triggers native Android share sheet.
  - **Import from JSON:** Parses, verifies schema version and key structural invariants, prompts user confirmation, and performs atomic restore within a SQLite transaction.
  - Graceful rejection of corrupt or invalid JSON files.

---

### Phase 15: Rigorous Verification & Polish
- TypeScript strict compiler check (`npx tsc --noEmit`).
- Verify SQLite database migrations, data persistence across app restarts, date boundary transitions, and error boundary handling.
- Documentation: `README.md` with complete architecture guide and step-by-step EAS Build APK instructions.

