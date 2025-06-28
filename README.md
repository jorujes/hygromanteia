# 🌟 Hygromanteia - Planetary Hours

A modern web application to calculate and display planetary hours based on your location, with integration of medieval historical manuscripts.

## ✨ Features

### 🕒 Precise Planetary Hours
- **Astronomical Calculations**: Based on actual sunrise and sunset times
- **Geographic Precision**: Uses your current location or allows entering any city
- **Chaldean Order**: Following classical astrological tradition
- **Real-time Updates**: Timer that updates automatically

### 🌍 Smart Location
- **Automatic Detection**: Browser GPS for precise location
- **Manual Search**: Enter any city in the world
- **Advanced Geocoding**: Integration with geolocation APIs
- **Smart Fallback**: Approximate calculations if APIs fail

### 🗓️ Temporal Navigation
- **Date Selector**: Explore planetary hours for any date
- **Hour Navigation**: Buttons to navigate between the 24 hours
- **Visual Progress**: Current hour progress bar
- **Time Control**: Return to "now" with one click

### 📜 Historical Manuscripts
- **Three Medieval Manuscripts**:
  - Harleianus
  - Monacensis  
  - Gennadianus
- **Contextual Recommendations**: Based on current day and hour
- **Smart Filtering**: Automatically removes empty entries

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.2.4** - React Framework with App Router
- **React 19.1.0** - Main library
- **TypeScript** - Static typing
- **Tailwind CSS** - Utility styling
- **shadcn/ui** - Components based on Radix UI

### Integrated APIs
- **OpenStreetMap Nominatim** - Geocoding
- **BigDataCloud** - Reverse geolocation
- **Sunrise-sunset.org** - Precise astronomical times
- **Navigator.geolocation** - Browser GPS

## 🚀 Deploy

### Railway
This project is optimized for Railway deployment:

1. **Connect the repository** to Railway
2. **Configure variables** (not needed for this project)
3. **Automatic deploy** will run

### Vercel
Also compatible with Vercel:

```bash
npm install -g vercel
vercel --prod
```

## 💻 Local Development

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation
```bash
# Clone the repository
git clone https://github.com/jorujes/hygromanteia.git
cd hygromanteia

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Access `http://localhost:3000` in your browser.

## 🎨 Visual Features

### Responsive Design
- **Mobile-first**: Works perfectly on mobile devices
- **Breakpoints**: Automatic adaptation for tablet and desktop
- **Scalable Typography**: Sizes that adjust to the device

### Intuitive Interface
- **Astrological Symbols**: Unicode for all planets
- **Harmonious Colors**: Neutral and elegant palette
- **Smooth Animations**: CSS transitions for better UX
- **Visual Feedback**: Hover and loading states

## 🔧 Configuration

### Data Structure
Historical manuscripts are in `public/data/planetary_hours.json`:

```json
{
  "Dia": "Sunday",
  "Hora": "1ª",
  "Planeta": "Sol",
  "Harleianus": "Manuscript recommendation...",
  "Monacensis": "Manuscript recommendation...",
  "Gennadianus": "Manuscript recommendation..."
}
```

### Customization
- **Colors**: Modify `tailwind.config.ts`
- **Components**: Customize in `components/ui/`
- **Calculations**: Adjust in `app/page.tsx`

## 📚 Technical Documentation

### Main Components
- **HygromanteiApp**: Main component
- **calculatePlanetaryHours**: Planetary hours calculations
- **searchLocationByName**: City geocoding
- **getPlanetaryHourRecommendations**: Search in manuscripts

### Chaldean Order of Planets
```
Sun → Venus → Mercury → Moon → Saturn → Jupiter → Mars
```

### Days/Planets Mapping
- **Sunday**: Sun ☉
- **Monday**: Moon ☾  
- **Tuesday**: Mars ♂
- **Wednesday**: Mercury ☿
- **Thursday**: Jupiter ♃
- **Friday**: Venus ♀
- **Saturday**: Saturn ♄

## 🌟 Contributing

Contributions are welcome! Please:

1. **Fork** the repository
2. **Create a branch** for your feature
3. **Commit** your changes
4. **Push** to the branch
5. **Open a Pull Request**

## 📄 License

This project is open source. See the `LICENSE` file for details.

## 🙏 Acknowledgments

- **Medieval Manuscripts**: Preserved historical sources
- **Free APIs**: OpenStreetMap, BigDataCloud, Sunrise-sunset
- **Open Source Community**: shadcn/ui, Tailwind CSS, Next.js

---

**Hygromanteia** - *Exploring planetary hours with astronomical precision and ancestral wisdom* ✨🔮 