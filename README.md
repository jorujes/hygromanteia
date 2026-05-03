# Hygromanteia

**Live project:** https://hygromanteia.up.railway.app/

Hygromanteia is a research-oriented web application for working with planetary hours as they appear in the Greek Solomonic magical tradition.

The name comes from the *Hygromanteia*, also known as the *Magical Treatise of Solomon*: a late Byzantine Greek grimoire transmitted through several manuscript witnesses and later associated with the wider Solomonic tradition. Despite the title's literal association with water-divination, the textual tradition is much broader. It gathers material on ritual timing, planetary and daily operations, talismans, divination, conjuration, ritual implements, and other techniques that later became part of European grimoire culture.

This project focuses on one narrow but important layer of that tradition: the tables of planetary hours. A planetary hour is not a fixed sixty-minute clock hour. It is a seasonal division of time: daylight, from local sunrise to local sunset, is divided into twelve parts; night, from sunset to the next sunrise, is divided into another twelve. Each segment is assigned to one of the seven classical planets in the Chaldean sequence. Because sunrise and sunset depend on date and location, the actual length of a planetary hour changes with place and season.

The app turns that system into an inspectable interface. Choose a place and date, calculate the twenty-four planetary hours for that local solar day, see the current ruling planet, and compare the corresponding recommendations preserved in three manuscript witnesses: Harleianus, Monacensis, and Gennadianus.

It is not a devotional app, a horoscope app, or a modern magical instruction manual. It is a tool for reading a historical timing system as data.

## Core Functionality

- Calculates the 12 daytime and 12 nighttime planetary hours from local sunrise and sunset.
- Supports browser geolocation, IP-based fallback, and manual city search.
- Tracks the current hour in the selected location and shows its start/end interval.
- Allows navigation across hours and dates without losing the selected location.
- Displays the ruling planet according to the Chaldean sequence.
- Maps each planetary hour to the corresponding Harleianus, Monacensis, and Gennadianus recommendations.

## Historical Data

The manuscript table lives in `public/data/planetary_hours.json`.

The dataset is arranged around three witnesses used for comparison:

- **Harleianus**: a British Library manuscript witness commonly identified in the modern edition as Harleianus 5596.
- **Monacensis**: a Munich Greek manuscript witness, listed in modern bibliographic references as Monacensis Gr. 70.
- **Gennadianus**: a manuscript witness from the Gennadius Library tradition, listed as Gennadianus 45.

The point of presenting the witnesses side by side is that the tradition is not a single clean table. Entries vary, some operations appear in one witness and not another, and the wording often shows the practical, compiled nature of the material.

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

## Terminology

- **Planetary hours**: a system of unequal hours based on sunrise and sunset rather than mechanical clock time.
- **Classical planets**: the seven visible planetary bodies used in ancient and medieval astrology: Sun, Moon, Mercury, Venus, Mars, Jupiter, and Saturn.
- **Chaldean sequence**: the repeating planetary order used to assign rulers to the hours.
- **Witness**: a manuscript copy or textual branch used as evidence for reconstructing or comparing a tradition.
- **Operation**: a short practical recommendation associated with a day, hour, or planetary ruler in the source material.

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

## References

- Ioannis Marathakis, *The Magical Treatise of Solomon, or Hygromanteia*.
- [WorldCat catalogue record for the Marathakis edition](https://search.worldcat.org/title/963827647)
- [Open British National Bibliography record](https://obnb.uk/p16042616-the-magical-treatise-of-solomon-or-hygromanteia-also-called-the-apotelesmatike-pragmateia-epistle-to-rehoboam-solomonike-being-a-translation-of-mss-harleianus-5596-bononiensis-3632-atheniens)
