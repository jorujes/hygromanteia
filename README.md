# Hygromanteia

**Live project:** https://hygromanteia.up.railway.app/

Hygromanteia is a web application for calculating planetary hours and reading them against manuscript-derived recommendations from the Hygromanteia tradition.

The project combines astronomical timing, location-aware timezone handling, and a structured table of operations from three manuscript witnesses: Harleianus, Monacensis, and Gennadianus. The goal is to turn a historically dense reference system into a usable instrument: choose a place and date, inspect the current planetary hour, move through the full day, and compare the relevant manuscript entries.

## Core Functionality

- Calculates the 12 daytime and 12 nighttime planetary hours from local sunrise and sunset.
- Supports browser geolocation, IP-based fallback, and manual city search.
- Tracks the current hour in the selected location and shows its start/end interval.
- Allows navigation across hours and dates without losing the selected location.
- Displays the ruling planet according to the Chaldean sequence.
- Maps each planetary hour to the corresponding Harleianus, Monacensis, and Gennadianus recommendations.

## Historical Data

The manuscript table lives in `public/data/planetary_hours.json`.

Each row links a day, hour number, ruling planet, and available recommendation text from the three witnesses:

```json
{
  "Dia": "Sunday",
  "Hora": "2ª",
  "Planeta": "Venus",
  "Harleianus": "Begin praying",
  "Monacensis": "It is good for getting the love of lords, great men and rulers",
  "Gennadianus": "Useful for the love of a lord"
}
```

Missing entries are preserved explicitly instead of being silently inferred, so gaps between the manuscript witnesses remain visible in the interface and in the source data.

## Technical Overview

- Next.js with the App Router
- React and TypeScript
- Tailwind CSS and shadcn/ui components
- Luxon and `tz-lookup` for timezone-aware time handling
- Public geocoding and sunrise/sunset APIs for location and solar calculations
- Static JSON data for manuscript recommendations

## Local Development

Requirements:

- Node.js 18+
- pnpm

```bash
git clone https://github.com/jorujes/hygromanteia.git
cd hygromanteia
pnpm install
pnpm dev
```

The development server runs at `http://localhost:3000`.

## Deployment

The production deployment is currently hosted on Railway:

https://hygromanteia.up.railway.app/

The repository includes `railway.json` and can also run on standard Next.js hosting targets.

## Notes

Hygromanteia is intended as a research-oriented interface for exploring planetary-hour material. It presents historical recommendations as source data, not as modern advice or instruction.
