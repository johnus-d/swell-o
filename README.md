# Swell-o — Joint & Flare Tracker

> **Swell-o** is a frictionless arthritis and joint swelling diary and flare tracker Progressive Web App (PWA), designed primarily for mobile (iPhone first-and-foremost) and responsive across all screen sizes.

---

## Table of Contents

- [Overview](#overview)
- [Brand Identity & Visual Assets](#brand-identity--visual-assets)
- [Key Features](#key-features)
  - [1. Frictionless Entry & Editing (`➕ Track`)](#1-frictionless-entry--editing--track)
  - [2. Collapsed Flare Diary (`📋 Diary`)](#2-collapsed-flare-diary--diary)
  - [3. Flare Trends & Insights (`📈 Insights`)](#3-flare-trends--insights--insights)
  - [4. Import & Export (`💾 Export` / `📥 Import`)](#4-import--export--export---import)
  - [5. PWA & Mobile First Experience](#5-pwa--mobile-first-experience)
- [Data Format](#data-format)
- [Severity Scale & Color Spectrum](#severity-scale--color-spectrum)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Server](#development-server)
  - [Production Build & Preview](#production-build--preview)
  - [Verification Tests](#verification-tests)
- [iPhone Installation (Add to Home Screen)](#iphone-installation-add-to-home-screen)
- [License](#license)

---

## Brand Identity & Visual Assets

Swell-o incorporates dedicated visual assets designed to create a serene, clinical-grade diary feel:

- **App Logo (`/app-logo.png`, `/apple-touch-icon.png`)**:
  - Sourced from the high-resolution joint-flame emblem (`Gemini_Generated_Image_oqonmjoqonmjoqon.jpeg`).
  - Represents the intersection of bone anatomy and inflammatory flare waves with luminous cyan, sky blue, and violet gradients.
- **Splash Screen (`/splash-screen.jpg`)**:
  - Utilizes the dark glowing version (`Gemini_Generated_Image_3stuna3stuna3stu.jpeg`) for a smooth launch experience that gently fades into the app interface.
- **Homescreen Banner (`/homescreen-banner.jpg`)**:
  - Utilizes the ambient desk and journal scene (`Gemini_Generated_Image_fecyqsfecyqsfecy.jpeg`) displayed at the top of the tracker with cyan/indigo vignette overlays.
- **Color Palette**:
  - **Background**: Deep Midnight Navy (`#070c18`).
  - **Surface & Cards**: Rich Navy Slate (`#0c1322` with `#0e182e` borders).
  - **Primary Highlights**: Electric Cyan (`#22d3ee`) & Sky Blue (`#38bdf8`).
  - **Secondary Accents**: Luminous Indigo & Violet (`#818cf8`, `#a78bfa`).
  - **Severity Spectrum**: Calibrated medical gradient from Green (0) to Yellow (2) to Red (8) to Black (10).

---

## Overview

Managing arthritis and chronic joint swelling requires capturing updates quickly at the moment of discomfort without friction. Swell-o reduces the interactions needed to record how swollen individual joints are, collapses daily updates into coherent records, visualizes flare timelines, and ensures zero data lock-in with full CSV and Excel export/import capabilities.

---

## Key Features

### 1. Frictionless Entry & Editing (`➕ Track`)
- **Sensible Defaults**: Defaults date to today and pre-selects the user's most frequently logged joint.
- **7-Day Horizontal Strip**: Quick 1-tap selection from 6-days ago (left) to today (right), with 3-letter weekday abbreviation and day of month.
- **Full Month Calendar Modal**: Standard calendar navigation showing entry indicator dots for any historical day.
- **Severity Indicator Dots**: Color-coded across dates based on the maximum severity joint logged on that day:
  - `0` (Green) $\rightarrow$ `2` (Yellow) $\rightarrow$ `8` (Red) $\rightarrow$ `10` (Black).
- **Smart Joint Picker**:
  - Pre-selected with the most commonly entered joint.
  - Dropdown options dynamically sorted from most-to-least commonly entered, then by average severity.
  - Pre-filled options: *Knee, Ankle, Foot, Toe, Hip, Shoulder, Elbow, Wrist, Hand, Finger, Jaw*.
  - *"Other"* option exposes an inline text input to enter any custom joint name.
- **Severity Slider (0–10)**:
  - Not pre-selected (required to prevent accidental saves).
  - Short labels on ticks: `0` (ok), `2` (ache), `4` (mild), `6` (med), `8` (severe), `10` (total).
  - Tappable tick buttons for instant 1-tap rating on touch screens.
  - Full descriptions dynamically displayed below slider (including slash-joined ratings like *Mild / Moderate swelling*).
- **Side Toggles**:
  - Toggle buttons for **Left** and **Right** (both, one, or neither can be selected).
- **Multi-Joint Logging ("Add joint")**:
  - Log multiple joints for the same day with joint/severity/side pickers sharing the same date and notes.
  - Form order stays stable while editing; upon save, joints are automatically sorted by descending severity (stable sort).
- **Daily Notes**:
  - Freeform notes text area (single shared note per date).
- **Edit Existing Entries & Unsaved Changes Guard**:
  - Selecting any prior date with an existing entry loads it into the editor.
  - If the form contains unsaved changes (excluding default state), switching dates prompts a **Discard Confirmation Dialog**.
  - Includes a safe **Delete Day Entry** option with confirmation.

### 2. Collapsed Flare Diary (`📋 Diary`)
- Entries on the same date are collapsed into a single record.
- Joints are sorted by descending severity (stable sort, entry order preserved on ties).
- Visual color badges, joint chips with side labels (`L`, `R`, `Both`), severity numbers, and daily notes snippets.
- Interactive search and joint filtering.
- Tap any card to open and edit that date.

### 3. Flare Trends & Insights (`📈 Insights`)
- **Zoomable Timeline**:
  - Default zoom: **1 Month** (`1m`).
  - Available ranges: `7d` (7 days), `1m` (1 month), `3m` (3 months), `6m` (6 months), `1y` (1 year), and `all` (all time).
- **Plot Metrics**:
  - **Max Severity** (default)
  - **Joint Count**
  - **Severity Sum**
- **Series Breakdown**:
  - **All Joints** (aggregate timeline)
  - **By Joint** (filter individual joint or compare top joints)
  - **By Side** (Left vs Right vs Both)
- **Smoothed Timeline**:
  - Bezier spline interpolation with touch-friendly scrubbing tooltips.
- **Summary Cards**:
  - Peak flare severity and description
  - Average severity across period
  - Flare days count (severity $\ge 4$)
  - Top affected joint

### 4. Import & Export (`💾 Export` / `📥 Import`)
- **Zero Data Lock-in**:
  - All data is stored locally on device via `localStorage`.
- **Export Options**:
  - Export and download as universal **CSV**.
  - Export and download as formatted **Excel (`.xlsx`)** workbook.
  - One-tap **"Copy CSV to Clipboard"** for easy pasting on mobile.
  - Schema preview table showing current records.
- **Import Options**:
  - Drag-and-drop or file picker for `.csv`, `.xlsx`, and `.xls`.
  - Fallback text area to paste raw CSV data.
  - File preview with validation error reporting before committing.
  - Choice between **"Merge with existing data"** or **"Replace all data"**.
- **Backup Reminder**:
  - Reminds users to export regularly if un-exported entries accumulate or if it has been $> 7$ days since the last export.

### 5. PWA & Mobile First Experience
- Target iPhone first-and-foremost, with full support for Android, tablets, and desktop.
- Touch targets $\ge 44\text{px}$ adhering to Apple Human Interface Guidelines.
- Safe-area insets (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`) for modern iPhone notches and home indicators.
- Web app manifest (`standalone` display mode, portrait orientation, high-res app icons).
- Service worker offline caching via Workbox and `vite-plugin-pwa`.
- Subtle haptic feedback (`navigator.vibrate`) on slider adjustments, tabs, and saves.

---

## Data Format

Swell-o exports and imports records using the following schema:

| Date | Joint | Side | Severity | Severity description | Notes |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `2026-10-19` | Knee | right | 4 | Mild swelling | Knee seems to be on the way up. Elbow also hurts but less. |
| `2026-10-19` | Elbow | left | 2 | Ache | |

- **Date**: ISO formatted date string (`YYYY-MM-DD`).
- **Joint**: Name of the joint (e.g. `Knee`, `Wrist`, or custom name).
- **Side**: `left`, `right`, `both`, or empty/none.
- **Severity**: Numeric rating on a scale from `0` to `10`.
- **Severity description**: Full text description of the swelling/pain level.
- **Notes**: Optional freeform text field (attached to primary joint entry for that date).

---

## Severity Scale & Color Spectrum

| Severity | Short Tick Label | Full Description | Indicator Color Anchor |
| :---: | :---: | :--- | :--- |
| **0** | `ok` | Ok | Green (`#22c55e`) |
| **1** | — | Ok / Ache | *Interpolated Green-Yellow* |
| **2** | `ache` | Ache | Yellow (`#eab308`) |
| **3** | — | Ache / Mild swelling | *Interpolated Yellow-Orange* |
| **4** | `mild` | Mild swelling | Orange (`#f97316`) |
| **5** | — | Mild / Moderate swelling | *Interpolated Orange-Red* |
| **6** | `med` | Moderate swelling | Coral Red (`#ef4444`) |
| **7** | — | Moderate / Severe swelling | *Interpolated Red* |
| **8** | `severe` | Severe swelling | Deep Red (`#dc2626`) |
| **9** | — | Severe swelling / Total loss of function | *Interpolated Red-Black* |
| **10** | `total` | Total loss of function | Black (`#18181b`) |

---

## Getting Started

### Prerequisites
- Node.js $\ge 18$ (Tested on Node v25.1.0)
- npm $\ge 9$

### Installation

Clone the repository and install dependencies:
```bash
cd /Users/john/dev/personal-projects/swell-o
npm install
```

### Development Server

Start the local development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser or mobile browser on the same Wi-Fi network.

### Production Build & Preview

Build the production PWA bundle:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

### Verification Tests

Run the standalone verification test suite:
```bash
node scripts/verify-logic.ts
```

---

## iPhone Installation (Add to Home Screen)

To install Swell-o as a native-feeling standalone PWA on an iPhone:

1. Open Safari on your iPhone and navigate to the Swell-o URL.
2. Tap the **Share** button (box with an upward arrow) in the Safari toolbar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Confirm the name **Swell-o** and tap **Add** in the top right.
5. The Swell-o icon will appear on your Home Screen. Tapping it opens the app in fullscreen standalone mode with offline support.

---

## License

ISC License.
